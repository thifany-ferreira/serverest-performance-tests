import { cadastrarUsuario, excluirUsuario, login, cadastrarProduto, excluirProduto } from './api.js';
import { novoUsuario, novoProduto } from './data.js';

// Prepara a massa ANTES da carga começar (roda uma vez, no setup).
// Assim o tempo de preparação não entra nas métricas do teste.
export function prepararMassa(qtdProdutos = 20) {
  const admin = novoUsuario(true);
  const adminId = cadastrarUsuario(admin);
  const token = login(admin.email, admin.password);
  if (!adminId || !token) {
    throw new Error(`Não foi possível preparar a massa. A API está no ar? Confira o BASE_URL.`);
  }
  const produtos = [];
  for (let i = 0; i < qtdProdutos; i++) {
    const id = cadastrarProduto(token, novoProduto());
    if (id) produtos.push(id);
  }
  return { adminId, token, produtos };
}

// Remove a massa criada no setup (roda uma vez, no teardown).
export function limparMassa({ adminId, token, produtos }) {
  produtos.forEach((id) => excluirProduto(token, id));
  excluirUsuario(adminId);
}
