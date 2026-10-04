import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, JSON_HEADERS } from './config.js';

// Cada requisição recebe uma tag "name" com a rota "genérica" (ex.: /produtos/{id}).
// Sem isso, cada id viraria uma métrica diferente e o relatório ficaria ilegível.
function params(name, token) {
  const headers = token ? { ...JSON_HEADERS, Authorization: token } : JSON_HEADERS;
  return { headers, tags: { name } };
}

function ok(res, status, label) {
  return check(res, { [`${label}: status ${status}`]: (r) => r.status === status });
}

export function cadastrarUsuario(usuario) {
  const res = http.post(`${BASE_URL}/usuarios`, JSON.stringify(usuario), params('POST /usuarios'));
  ok(res, 201, 'cadastrar usuário');
  return res.status === 201 ? res.json('_id') : null;
}

export function excluirUsuario(id) {
  const res = http.del(`${BASE_URL}/usuarios/${id}`, null, params('DELETE /usuarios/{id}'));
  ok(res, 200, 'excluir usuário');
}

export function login(email, password) {
  const res = http.post(`${BASE_URL}/login`, JSON.stringify({ email, password }), params('POST /login'));
  const passou = check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: devolve token': (r) => r.status === 200 && String(r.json('authorization')).startsWith('Bearer '),
  });
  return passou ? res.json('authorization') : null;
}

export function listarProdutos() {
  const res = http.get(`${BASE_URL}/produtos`, params('GET /produtos'));
  check(res, {
    'listar produtos: status 200': (r) => r.status === 200,
    'listar produtos: tem lista': (r) => r.status === 200 && Array.isArray(r.json('produtos')),
  });
  return res.status === 200 ? res.json('produtos') : [];
}

export function buscarProduto(id) {
  const res = http.get(`${BASE_URL}/produtos/${id}`, params('GET /produtos/{id}'));
  ok(res, 200, 'buscar produto');
}

export function cadastrarProduto(token, produto) {
  const res = http.post(`${BASE_URL}/produtos`, JSON.stringify(produto), params('POST /produtos', token));
  ok(res, 201, 'cadastrar produto');
  return res.status === 201 ? res.json('_id') : null;
}

export function excluirProduto(token, id) {
  const res = http.del(`${BASE_URL}/produtos/${id}`, null, params('DELETE /produtos/{id}', token));
  ok(res, 200, 'excluir produto');
}

export function criarCarrinho(token, itens) {
  const res = http.post(`${BASE_URL}/carrinhos`, JSON.stringify({ produtos: itens }), params('POST /carrinhos', token));
  ok(res, 201, 'criar carrinho');
  return res.status === 201;
}

export function concluirCompra(token) {
  const res = http.del(`${BASE_URL}/carrinhos/concluir-compra`, null, params('DELETE /carrinhos/concluir-compra', token));
  ok(res, 200, 'concluir compra');
}
