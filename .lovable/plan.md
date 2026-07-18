## Objetivo

Espelhar 100% dos lotes de tecido do Auge dentro do Pente Fino (`estoque_posicoes`), usando o endereço embutido no próprio lote, e realocar automaticamente quando abrir espaço. Tecidos que não couberem vão para uma nova aba **"Tecidos sem espaço"** em `/estoque/reservas`.

## Padrão do lote (confirmado no HAR)

Campo `dsDeposito` do endpoint `getLote.php` do Auge:

```
TEC02.B.N04  PROC29863/26 27M-1
└────┬────┘  └─────┬─────┘ └┬┘└┬┘
  endereço    proc/NF       ML sufixo
```

- `TEC02.B.N04` → `estrutura=TEC02`, `coluna=B`, `nivel=4`
- `27M` → `m_linear = 27`
- `-1` → sufixo diferenciador (fica só no `lote_sistema`, some do `m_linear`)
- Área total: `m_linear × largura_nominal` (do `itens_cadastro`)
- Conferente: `Importado Auge`
- Data: campo do Auge se existir, senão `now()`

## Etapa 1 — Edge Function: novo action `sync-tecidos-full`

Arquivo: `supabase/functions/auge-sync/index.ts`

1. Buscar todos os `itens_cadastro` com código Auge e categoria "tecido" (ou pelo prefixo do depósito `TEC*`).
2. Para cada item × depósito TEC, chamar `getLote.php` (reaproveitando `fetchLotesLive`).
3. Parser do `dsDeposito`:
   - Regex `^(TEC\d{2})\.([A-Z])\.N(\d{2})\s+(.*?)\s+(\d+(?:[.,]\d+)?)M(?:-(\d+))?$`
   - Descartar linhas que não casem com o padrão.
4. Buscar largura do `itens_cadastro` (`largura_util` ou `largura`).
5. Truncar/rebuild em lote:
   - `DELETE FROM estoque_posicoes WHERE estrutura LIKE 'TEC%' AND conferente_entrada = 'Importado Auge'`
   - Também apagar tecidos manuais? **Sim** — usuário escolheu "substituir tudo". Filtro: `estrutura LIKE 'TEC%'`.
6. Alocar posições 1..N sequencialmente por célula (`estrutura.coluna.nivel`) respeitando limite de 30.
7. Overflow → tabela nova `tecidos_sem_espaco`.
8. Rodar automaticamente ao final do sync normal (entity=`lotes` já dispara).

## Etapa 2 — Nova tabela `tecidos_sem_espaco`

```sql
CREATE TABLE public.tecidos_sem_espaco (
  id uuid PK default gen_random_uuid(),
  item text NOT NULL,
  endereco_desejado text NOT NULL,   -- TECxx.x.Nxx
  proc text,
  m_linear numeric,
  largura numeric,
  m2 numeric,
  lote text,                          -- ex: "27M-1"
  lote_sistema text NOT NULL,         -- string completa original
  auge_cd_item text,
  auge_cd_deposito text,
  synced_at timestamptz default now()
);
```

GRANT + RLS (authenticated leitura/escrita, service_role tudo).

## Etapa 3 — Realocação automática

Trigger `AFTER DELETE ON estoque_posicoes`:
- Se removeu de célula TECxx.x.Nxx, checa `tecidos_sem_espaco` com `endereco_desejado` correspondente.
- Se houver, insere o mais antigo em `estoque_posicoes` e remove de `tecidos_sem_espaco`.

## Etapa 4 — Frontend

1. **Nova aba em `/estoque/reservas`** — "Tecidos sem espaço"
   - Reaproveita layout do `ReservasTable` (mesmas colunas + endereço desejado).
   - Ao clicar em linha, abre `EstoqueDetailDialog` (mesmo dialog do `/estoque/mapa`).
   - Componente: `src/components/estoque/TecidosSemEspacoTab.tsx`.

2. **Botão de sync manual** em `/admin` (painel Auge) — "Sincronizar tecidos por endereço".

3. **Item 1 do pedido** (série transferida atualiza no app): reforçar chamada a `fetchSeriesLive`/`fetchLotesLive` ao abrir `NovaTransferenciaDialog`, invalidando cache. Já existe — apenas confirmar que `LoteSelectorDialog` sempre re-busca do Auge (sem cache local).

## Arquivos afetados

- `supabase/functions/auge-sync/index.ts` — novo bloco `syncTecidosFull()`
- Migração SQL — `tecidos_sem_espaco` + trigger de realoc
- `src/components/estoque/TecidosSemEspacoTab.tsx` (novo)
- `src/pages/ReservasPage.tsx` — adicionar Tab
- `src/components/auge/AugeAdminPanel.tsx` — botão manual
- `src/components/auge/LoteSelectorDialog.tsx` — forçar refetch (sem cache)

## Detalhes técnicos

- Parser tolerante: espaços múltiplos, vírgula/ponto decimal, `M` maiúsculo.
- `getLote.php` só aceita 1 item por chamada — paralelizar em batches de 8 com backoff.
- Estimativa: ~500 itens tecido × ~10 depósitos = ~5000 chamadas. Split em runs de 100 com progresso salvo em `auge_sync_runs.detalhes`.
- Idempotente: cada rodada reconstrói do zero, então re-executar é seguro.
- Item 1 (transferências afetando série): a série é buscada live toda vez que o dialog abre, então já reflete o Auge. Adicionaremos `staleTime: 0` explícito no fetch.

## Fora do escopo

- Motor/controle (séries) — o pedido é só sobre tecido (padrão TECxx.x.xxx).
- Ajuste de largura do `itens_cadastro` — usa-se o que já existe; itens sem largura ficam com `m2=0` e um badge de alerta na UI.

Confirma para eu executar?