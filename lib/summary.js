// Gera o resumo do teste em Markdown (para o painel do GitHub Actions e para o terminal)
// e em JSON (para guardar como artefato e comparar execuções).

const fmt = (v) => (v === undefined || v === null ? '-' : `${Math.round(v)} ms`);
const pct = (v) => `${(v * 100).toFixed(2)}%`;

function thresholdRows(metrics) {
  const rows = [];
  Object.entries(metrics).forEach(([nome, m]) => {
    Object.entries(m.thresholds || {}).forEach(([regra, r]) => {
      rows.push(`| ${r.ok ? '✅' : '❌'} | \`${nome}\` | \`${regra}\` |`);
    });
  });
  return rows.sort((a, b) => a.localeCompare(b, 'pt-BR', { ignorePunctuation: true }));
}

function endpointRows(metrics) {
  return Object.entries(metrics)
    .filter(([nome, m]) => nome.startsWith('http_req_duration{name:') && m.values.max > 0)
    .map(([nome, m]) => {
      const rota = nome.slice('http_req_duration{name:'.length, -1);
      const v = m.values;
      return `| \`${rota}\` | ${fmt(v.med)} | ${fmt(v['p(95)'])} | ${fmt(v['p(99)'])} | ${fmt(v.max)} |`;
    })
    .sort();
}

function groupRows(metrics) {
  return Object.entries(metrics)
    // jornadas que não rodaram neste teste aparecem zeradas, então ficam de fora
    .filter(([nome, m]) => nome.startsWith('group_duration{group:::') && m.values.max > 0)
    .map(([nome, m]) => {
      const g = nome.slice('group_duration{group:::'.length, -1);
      return `| ${g} | ${fmt(m.values.med)} | ${fmt(m.values['p(95)'])} |`;
    });
}

export function buildSummary(nomeTeste, data) {
  const m = data.metrics;
  if (!m.http_reqs) {
    const md = `## Teste de ${nomeTeste} · ServeRest\n\n❌ Nenhuma requisição foi feita. A API estava no ar? Confira o BASE_URL.\n`;
    return { stdout: `\n${md}\n`, [`reports/${nomeTeste.toLowerCase()}-summary.md`]: md };
  }
  const dur = m.http_req_duration.values;
  const segundos = data.state.testRunDurationMs / 1000;
  const thresholds = thresholdRows(m);
  const aprovado = thresholds.every((linha) => linha.startsWith('| ✅'));

  const linhas = [
    `## Teste de ${nomeTeste} · ServeRest`,
    '',
    `**Resultado:** ${aprovado ? '✅ dentro das metas (SLOs)' : '❌ alguma meta foi violada'}`,
    '',
    '| Métrica | Valor |',
    '|---|---|',
    `| Duração | ${segundos.toFixed(0)} s |`,
    `| Usuários virtuais (máx.) | ${m.vus_max ? m.vus_max.values.max : '-'} |`,
    `| Requisições | ${m.http_reqs.values.count} (${m.http_reqs.values.rate.toFixed(1)} req/s) |`,
    `| Tempo de resposta (mediana · p95 · p99) | ${fmt(dur.med)} · ${fmt(dur['p(95)'])} · ${fmt(dur['p(99)'])} |`,
    `| Taxa de erro HTTP | ${pct(m.http_req_failed.values.rate)} |`,
    `| Verificações (checks) aprovadas | ${pct(m.checks.values.rate)} |`,
    '',
  ];

  const endpoints = endpointRows(m);
  if (endpoints.length) {
    linhas.push('### Por rota', '', '| Rota | Mediana | p95 | p99 | Máx. |', '|---|---|---|---|---|', ...endpoints, '');
  }
  const grupos = groupRows(m);
  if (grupos.length) {
    linhas.push('### Por jornada', '', '| Jornada | Mediana | p95 |', '|---|---|---|', ...grupos, '');
  }
  linhas.push('### Metas (thresholds)', '', '| | Métrica | Regra |', '|---|---|---|', ...thresholds, '');

  const md = linhas.join('\n');
  const base = `reports/${nomeTeste.toLowerCase()}`;
  return {
    stdout: `\n${md}\n`,
    [`${base}-summary.md`]: md,
    [`${base}-summary.json`]: JSON.stringify(data, null, 2),
  };
}

// Percentis que aparecem no resumo de todas as métricas de tempo.
export const TREND_STATS = ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'];
