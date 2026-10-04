// ESTRESSE: aumenta a navegação em degraus (20 → 50 → 100 → 200 visitas/s) para descobrir
// até onde a API aguenta dentro das metas e como ela se comporta acima disso.
// É exploratório: o objetivo é achar o limite, então ele roda só sob demanda no CI.
import { prepararMassa, limparMassa } from '../lib/fixtures.js';
import { navegar, comprar } from '../lib/flows.js';
import { thresholdsPadrao } from '../lib/thresholds.js';
import { buildSummary, TREND_STATS } from '../lib/summary.js';

export const options = {
  scenarios: {
    navegacao: {
      executor: 'ramping-arrival-rate',
      exec: 'cenarioNavegacao',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 400,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '20s', target: 0 }, // recuperação: a API volta ao normal?
      ],
    },
    compra: {
      executor: 'constant-vus',
      exec: 'cenarioCompra',
      vus: 5,
      duration: '2m50s',
    },
  },
  thresholds: thresholdsPadrao(),
  summaryTrendStats: TREND_STATS,
};

export const setup = () => prepararMassa(20);
export const teardown = limparMassa;

export const cenarioNavegacao = navegar;
export const cenarioCompra = comprar;

export const handleSummary = (data) => buildSummary('Estresse', data);
