// CARGA (load): o tráfego "normal de pico" esperado, rodando em paralelo por ~2 minutos.
// Três perfis de usuário ao mesmo tempo, cada um no seu ritmo:
//   - navegação: 20 visitas por segundo (taxa de chegada fixa, como tráfego real)
//   - compra:    até 10 clientes comprando ao mesmo tempo
//   - admin:     1 administrador mexendo no catálogo
import { prepararMassa, limparMassa } from '../lib/fixtures.js';
import { navegar, comprar, administrar } from '../lib/flows.js';
import { thresholdsPadrao } from '../lib/thresholds.js';
import { buildSummary, TREND_STATS } from '../lib/summary.js';

export const options = {
  scenarios: {
    navegacao: {
      executor: 'ramping-arrival-rate',
      exec: 'cenarioNavegacao',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 60,
      stages: [
        { duration: '30s', target: 20 }, // aquecimento
        { duration: '1m', target: 20 }, // pico sustentado
        { duration: '15s', target: 0 }, // desaceleração
      ],
    },
    compra: {
      executor: 'ramping-vus',
      exec: 'cenarioCompra',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '15s', target: 0 },
      ],
    },
    admin: {
      executor: 'constant-vus',
      exec: 'cenarioAdmin',
      vus: 1,
      duration: '1m45s',
    },
  },
  thresholds: thresholdsPadrao({
    'http_req_duration{scenario:navegacao}': ['p(95)<300'],
  }),
  summaryTrendStats: TREND_STATS,
};

export const setup = () => prepararMassa(20);
export const teardown = limparMassa;

export const cenarioNavegacao = navegar;
export const cenarioCompra = comprar;
export const cenarioAdmin = administrar;

export const handleSummary = (data) => buildSummary('Carga', data);
