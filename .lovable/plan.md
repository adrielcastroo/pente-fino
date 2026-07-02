# Plano — Expedição: TMS Interno + Rastreio + UX

Sem integrações fiscais (adiadas até A1). Divido em 4 turnos independentes.

## Turno 1 — TMS Interno (schema + Cargas)

**Migration:**
- `expedicao_veiculos` (placa, modelo, capacidade_kg, ativo)
- `expedicao_cargas` (numero `CRG-YYMMDD-XXXX`, veiculo_id, motorista, data_coleta, rota, status: `planejada|em_transito|entregue|cancelada`, custo_frete, observacao)
- `expedicao_carga_romaneios` (join carga↔romaneio, N:N)
- `expedicao_comprovantes` (carga_id, recebedor_nome, recebedor_doc, data_hora, foto_url, assinatura_base64)
- Novo bucket storage `expedicao-comprovantes`
- GRANTs + RLS (`has_module('expedicao') AND is_at_least('operador')`) + trigger `updated_at`

**UI nova:** `/expedicao/cargas` — lista + criação (seleciona romaneios abertos/faturados + veículo + motorista + rota). Detalhe: timeline de status, upload de comprovante, cálculo automático custo/peça.

## Turno 2 — Rastreio Físico + Alertas

**Rastreio:**
- Campo `codigo_rastreio` + `transportadora_tipo` (`correios|jadlog|total|outro`) em `expedicao_cargas`
- Edge function `rastreio-consulta` (proxy p/ Seu Rastreio API — pede token via `add_secret` SEURASTREIO_TOKEN)
- Cache em tabela `expedicao_rastreio_eventos` (carga_id, data, status, local, descricao)
- Job manual "Atualizar rastreio" na tela de Carga; badge de status na lista

**Alertas** (`AlertsPanel` no `/expedicao/painel`):
- Romaneios abertos > 24h sem faturamento
- Cargas `em_transito` sem evento de rastreio há > 48h
- Peças `etiquetada` > 72h sem alocação
- Dismissible + persistência em `localStorage`

## Turno 3 — Exportações + Trilha de Auditoria

**Exports (client-side, sem backend):**
- `jspdf` + `jspdf-autotable` → Romaneio PDF (cabeçalho, transportadora, peças, totais, QR code do número)
- `xlsx` (SheetJS) → Relatórios: Peças por período, Romaneios por transportadora, Cargas com custo
- Botão "Exportar" com dropdown (PDF/Excel/CSV) em Romaneios, Cargas e Dashboards

**Auditoria:**
- Componente `<HistoricoPecaTimeline pecaId=...>` lendo `expedicao_pecas_historico` (já existe)
- Modal "Ver histórico" na página de Conferência/Alocação/DoubleCheck
- Preencher `expedicao_pecas_historico` nos pontos que ainda faltam (alocacao, no_romaneio, faturada, cancelada) via triggers ou inserts explícitos

## Turno 4 — Modo Offline (Bipagem)

**Stack:** IndexedDB via `idb` + Service Worker minimal (só fila, sem PWA completo)
- Hook `useOfflineScanQueue()` — persiste bipes em IndexedDB quando `!navigator.onLine`
- Sync automático em `window.addEventListener('online')` + retry exponencial
- Badge "Offline (N pendentes)" no header da Embalagem/Conferência
- Toast de resultado do sync (X sucesso, Y falha)
- Sem alteração de schema

---

## Detalhes técnicos

- Novos tipos TS em `src/types/expedicao.ts` (extração de literais atuais)
- Hooks TanStack Query em `src/hooks/expedicao/useCargas.ts`, `useRastreio.ts`
- Reuso de `PageShell`, `PageHeader`, `StatusBadge`, `KpiCard`
- Sidebar Expedição ganha entrada "Cargas" (após Romaneio)
- Zero mudança em fluxo fiscal — deixa gancho `nfe_chave` já existente

## Fora de escopo (explícito)

- Consulta SEFAZ, DANFE, Distribuição DFe, Manifestação — bloqueado sem A1
- Push notifications, PWA installable
- Impressão ZPL direto (já existe em `/expedicao/etiquetas`)

## Ordem sugerida

Turno 1 primeiro (fundação). Turnos 2-4 podem intercalar. Cada turno é entregável isolado.

Confirma o Turno 1 pra começar?
