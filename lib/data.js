// Massa de dados dinâmica: cada usuário e produto tem nome único,
// então as iterações não colidem entre si (a API não aceita e-mail nem produto repetido).

function sufixo() {
  // __VU e __ITER não existem no setup(), por isso o "typeof".
  const vu = typeof __VU !== 'undefined' ? __VU : 0;
  const iter = typeof __ITER !== 'undefined' ? __ITER : 0;
  return `${vu}-${iter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function novoUsuario(administrador = false) {
  const id = sufixo();
  return {
    nome: `Perf QA ${id}`,
    email: `perf.${id}@teste.com`,
    password: 'senha-perf-123',
    administrador: String(administrador),
  };
}

export function novoProduto(quantidade = 100000) {
  return {
    nome: `Produto Perf ${sufixo()}`,
    preco: Math.floor(Math.random() * 990) + 10,
    descricao: 'Produto criado pelo teste de performance',
    quantidade,
  };
}

export function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}
