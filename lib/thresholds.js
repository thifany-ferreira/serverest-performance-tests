import { SLO } from './config.js';

// Metas de desempenho (SLOs). Se alguma for violada, o k6 termina com erro e o CI fica vermelho.
const ROTAS = [
  'GET /produtos', 'GET /produtos/{id}', 'POST /usuarios', 'POST /login',
  'POST /carrinhos', 'DELETE /carrinhos/concluir-compra',
];

export function thresholdsPadrao(extras = {}) {
  const porRota = {};
  ROTAS.forEach((rota) => {
    porRota[`http_req_duration{name:${rota}}`] = [`p(95)<${SLO.p95}`];
  });
  return {
    http_req_duration: [`p(95)<${SLO.p95}`, `p(99)<${SLO.p99}`],
    http_req_failed: [`rate<${SLO.maxErrorRate}`],
    checks: ['rate>0.99'],
    ...porRota,
    // Tempo da jornada inteira (soma das requisições do fluxo)
    'group_duration{group:::Navegação}': ['p(95)<1000'],
    'group_duration{group:::Compra completa}': ['p(95)<2000'],
    'group_duration{group:::Administração}': ['p(95)<1000'],
    ...extras,
  };
}
