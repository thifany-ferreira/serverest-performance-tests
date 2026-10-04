# Testes de performance · ServeRest

[![Testes de performance](https://github.com/thifany-ferreira/serverest-performance-tests/actions/workflows/performance.yml/badge.svg)](https://github.com/thifany-ferreira/serverest-performance-tests/actions/workflows/performance.yml)
![k6](https://img.shields.io/badge/k6-7D64FF?logo=k6&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green)](LICENSE)

> 🇺🇸 *Performance test suite with k6 for the [ServeRest](https://serverest.dev) REST API: smoke, load and stress tests modeled on real user journeys, with SLO-based thresholds that fail the CI pipeline, per-route and per-journey metrics, and an HTML report for every run.*

Testes de performance com **k6** para a API da loja virtual [ServeRest](https://serverest.dev). Eles respondem perguntas que um teste funcional não responde: **a API aguenta o pico de acessos? Quão rápido ela responde sob carga? Onde ela começa a degradar?**

**Autora:** Thifany Ferreira · [LinkedIn](https://www.linkedin.com/in/thifanyferreira) · [Portfólio interativo](https://thifany-ferreira.github.io/apresentacao)

## Os três testes

| Teste | Objetivo | Perfil | Quando roda |
|---|---|---|---|
| **Smoke** (`tests/smoke.js`) | Confirmar que os scripts e a API funcionam, sem carga | 1 usuário virtual por 20 s | A cada envio de código |
| **Carga** (`tests/load.js`) | Validar o tráfego normal de pico contra as metas | 3 perfis em paralelo por ~2 min | A cada envio de código |
| **Estresse** (`tests/stress.js`) | Descobrir o limite da API e se ela se recupera | Navegação subindo em degraus até 200 visitas/s | Sob demanda |

## Jornadas de usuário

Em vez de martelar uma rota só, cada teste simula **pessoas usando a loja**:

| Jornada | O que faz | Ritmo no teste de carga |
|---|---|---|
| **Navegação** | Lista os produtos e abre um deles | 20 visitas por segundo (taxa de chegada fixa) |
| **Compra completa** | Cadastra cliente → login → carrinho → conclui a compra → remove o cliente | Até 10 clientes ao mesmo tempo |
| **Administração** | Cadastra e remove produtos com token de administrador | 1 administrador |

A navegação usa **taxa de chegada** (`ramping-arrival-rate`): novas visitas continuam chegando mesmo que a API fique lenta, como acontece no mundo real. Com número fixo de usuários, uma API lenta "esconderia" o problema, porque cada usuário esperaria mais e faria menos requisições.

## Metas (SLOs)

As metas viram `thresholds` do k6. Se qualquer uma for violada, o k6 termina com erro e **o pipeline fica vermelho**.

| Métrica | Meta |
|---|---|
| Tempo de resposta geral | p95 < 500 ms e p99 < 1000 ms |
| Tempo de resposta por rota | p95 < 500 ms em cada uma das 6 rotas |
| Navegação (teste de carga) | p95 < 300 ms |
| Jornada de compra completa | p95 < 2 s |
| Erros HTTP | menos de 1% |
| Verificações (checks) | mais de 99% aprovadas |

> **p95 < 500 ms** quer dizer que 95% das requisições responderam em menos de meio segundo. Média esconde problemas: se 5% dos clientes esperam 10 segundos, a média ainda pode parecer boa.

## Exemplo de resultado

Execução do teste de carga contra uma instância local (cada execução no GitHub Actions publica o seu resumo):

| Métrica | Valor |
|---|---|
| Requisições | 7.285 (68,8 req/s) |
| Tempo de resposta (mediana · p95 · p99) | 8 ms · 41 ms · 73 ms |
| Taxa de erro | 0,00% |
| Compra completa (p95) | 202 ms |

No teste de estresse, a API local chegou a **213 req/s** com p95 de 42 ms e nenhum erro. A rota mais lenta sob carga foi `POST /carrinhos` (p95 de 88 ms), o que faz sentido: ela valida o estoque e grava o carrinho.

## Como rodar

Requer o [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) e o Node.js (para subir o ServeRest local).

```bash
npx serverest@latest --nodoc          # em um terminal: sobe a API em http://localhost:3000
k6 run tests/smoke.js                 # em outro terminal
k6 run tests/load.js
k6 run tests/stress.js
```

Para gerar também o relatório HTML com gráficos:

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/carga-relatorio.html k6 run tests/load.js
```

| Variável | Uso | Padrão |
|---|---|---|
| `BASE_URL` | Endereço da API | `http://localhost:3000` |
| `SLO_P95_MS` | Meta de p95 em ms | `500` |
| `SLO_P99_MS` | Meta de p99 em ms | `1000` |

> ⚠️ Os testes apontam para uma instância **local** de propósito. Rodar carga contra o `serverest.dev` público prejudicaria um serviço gratuito usado por milhares de estudantes.

## Relatórios

Cada execução gera, na pasta `reports/`:

- `*-summary.md`: resumo com metas, tempos por rota e por jornada (é o que aparece no painel do GitHub Actions)
- `*-summary.json`: todas as métricas, para comparar execuções
- `*-relatorio.html`: painel do k6 com gráficos de tempo de resposta, taxa de requisições e usuários ao longo do teste

No CI, os relatórios ficam disponíveis como artefato da execução.

## Decisões de projeto

- **Massa preparada no `setup()`**: os produtos e o administrador são criados antes da carga começar, então o tempo de preparação não contamina as métricas. Tudo é removido no `teardown()`.
- **Rotas agrupadas por nome**: `/produtos/abc123` e `/produtos/xyz789` contam como a mesma rota (`GET /produtos/{id}`). Sem isso, cada id viraria uma métrica separada.
- **Dados únicos por iteração**: e-mails e nomes de produto nunca se repetem, porque a API recusa duplicados e isso geraria erros falsos.
- **Checks + thresholds**: os checks confirmam que cada resposta está **certa** (status e conteúdo), e os thresholds confirmam que está **rápida**. Uma API rápida que responde erro não passa.

## Estrutura

```
lib/
  config.js       # BASE_URL e metas (SLOs)
  api.js          # uma função por rota, com checks e nome da rota
  data.js         # massa de dados única
  fixtures.js     # setup e teardown da massa
  flows.js        # jornadas: navegação, compra e administração
  thresholds.js   # metas compartilhadas pelos testes
  summary.js      # resumo em Markdown e JSON
tests/
  smoke.js · load.js · stress.js
.github/workflows/performance.yml
```

## Licença

[MIT](LICENSE) © Thifany Ferreira
