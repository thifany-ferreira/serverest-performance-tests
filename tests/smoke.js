// SMOKE: 1 usuário virtual por 20 segundos.
// Confirma que os scripts funcionam e que a API responde bem sem carga, antes de testes maiores.
import { prepararMassa, limparMassa } from '../lib/fixtures.js';
import { navegar, comprar, administrar } from '../lib/flows.js';
import { thresholdsPadrao } from '../lib/thresholds.js';
import { buildSummary, TREND_STATS } from '../lib/summary.js';

export const options = {
  vus: 1,
  duration: '20s',
  thresholds: thresholdsPadrao({ checks: ['rate==1'] }),
  summaryTrendStats: TREND_STATS,
};

export const setup = () => prepararMassa(5);
export const teardown = limparMassa;

export default function (massa) {
  navegar(massa);
  comprar(massa);
  administrar(massa);
}

export const handleSummary = (data) => buildSummary('Smoke', data);
