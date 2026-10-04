// Configuração central. Tudo que muda por ambiente vem de variável de ambiente (-e NOME=valor).

// Por padrão os testes rodam contra uma instância LOCAL do ServeRest.
// Teste de carga contra o serverest.dev público seria abuso de um serviço gratuito de estudo.
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Metas de desempenho (SLOs) compartilhadas pelos testes.
export const SLO = {
  p95: Number(__ENV.SLO_P95_MS || 500), // 95% das requisições abaixo disso (ms)
  p99: Number(__ENV.SLO_P99_MS || 1000), // 99% das requisições abaixo disso (ms)
  maxErrorRate: 0.01, // no máximo 1% de erros
};
