import { group, sleep } from 'k6';
import {
  cadastrarUsuario, excluirUsuario, login, listarProdutos, buscarProduto,
  cadastrarProduto, excluirProduto, criarCarrinho, concluirCompra,
} from './api.js';
import { novoUsuario, novoProduto, sortear } from './data.js';

// Jornadas de usuário. Cada uma é um "group": o k6 mede o tempo da jornada inteira
// (group_duration), além do tempo de cada requisição.

// Visitante navegando na loja: o fluxo mais comum e o mais pesado em volume.
export function navegar(massa) {
  group('Navegação', () => {
    listarProdutos();
    buscarProduto(sortear(massa.produtos));
  });
}

// Cliente novo do início ao fim: cadastro, login, carrinho e compra.
// O usuário é removido no final para não acumular lixo na API.
export function comprar(massa) {
  group('Compra completa', () => {
    const cliente = novoUsuario(false);
    const id = cadastrarUsuario(cliente);
    if (!id) return;
    const token = login(cliente.email, cliente.password);
    if (token && criarCarrinho(token, [{ idProduto: sortear(massa.produtos), quantidade: 1 }])) {
      concluirCompra(token);
    }
    excluirUsuario(id);
  });
  sleep(1); // tempo de "pensar" entre uma compra e outra
}

// Administrador mantendo o catálogo: cadastra e remove produtos.
export function administrar(massa) {
  group('Administração', () => {
    const id = cadastrarProduto(massa.token, novoProduto());
    if (id) excluirProduto(massa.token, id);
  });
  sleep(2);
}
