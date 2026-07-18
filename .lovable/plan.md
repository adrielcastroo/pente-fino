## Objetivo

Refinar o mapa de tecidos para refletir com precisão onde cada lote está fisicamente no Auge, distinguindo entre estoque disponível (01 - Central), bloqueado (11 - Central Provisório), em trânsito para outros depósitos, e saídas definitivas.

## Regras de negócio

1. **Sync varre apenas depósitos 01 e 11.** Os outros depósitos são consultados só para rastreamento de trânsito.
2. **Depósito 01 → `status='ocupado'`** (disponível).
3. **Depósito 11 → `status='bloqueado'`** (novo status). Se o mesmo lote_sistema aparecer no 01, prevalece 01/ocupado.
4. **Lote some do 01 e 11 mas aparece em outro depósito (ex: 03, 04, 07…)**:
   - NÃO gera saída.
   - Marca a posição no mapa como `status='transferido'` + `deposito_atual` = código do novo depósito.
   - Guarda `m_linear_atual` (quantidade retornada quando/se voltar).
5. **Lote some completamente do Auge** → gera saída em `estoque_saidas` e libera posição.
6. **Lote volta do depósito X para o 01/11** com metragem menor: atualiza `m_linear_atual` e `m2_atual` (m_linear original preservado em `m_linear`). Ficha técnica mostra os dois valores. `lote_sistema` permanece imutável.

## Etapa 1 — Schema (migração)

```sql
ALTER TABLE public.estoque_posicoes
  ADD COLUMN IF NOT EXISTS deposito_atual text,       -- código Auge (01, 03, 11…)
  ADD COLUMN IF NOT EXISTS m_linear_atual numeric,    -- metragem física atual
  ADD COLUMN IF NOT EXISTS m2_atual numeric;

-- Ampliar CHECK do status se existir, ou apenas documentar valores:
-- status ∈ ('livre','ocupado','bloqueado','transferido','saida')
```

Nenhuma nova tabela; reaproveitamos `estoque_posicoes`.

## Etapa 2 — Edge Function `sync_tecidos_map` (rewrite parcial)

Arquivo: `supabase/functions/auge-sync/index.ts`.

1. Para cada produto tecido (paginado, 1000 em 1000 via `.range()` como já está):
   - Chamar `getLote.php` para **depósito 01** e **depósito 11** (2 chamadas por item, batch 20).
   - Parsear `dsDeposito` com regex existente (`TEC\d{1,2}\.[A-Z]\.N\d{1,2}`).
2. Montar mapa `lote_sistema → { dep, m_linear, endereco, ... }` — 01 prevalece sobre 11.
3. Buscar lotes atuais em `estoque_posicoes WHERE estrutura LIKE 'TEC%' AND conferente_entrada='Importado Auge'` (paginado).
4. Diff:
   - **Novo** → INSERT com `status = dep==='01' ? 'ocupado' : 'bloqueado'`, `deposito_atual`, `m_linear_atual = m_linear`.
   - **Existente, mesmo dep** → UPDATE `m_linear_atual`/`m2_atual` se mudou.
   - **Existente, mudou de dep entre 01↔11** → UPDATE status + deposito_atual.
   - **Existente, sumiu do 01 e 11** → chamar `getLote.php` para **todos os depósitos ativos** (lista de `auge_depositos`) procurando o `lote_sistema`. 
     - Achou em outro dep → UPDATE `status='transferido'`, `deposito_atual`, `m_linear_atual`.
     - Não achou em lugar nenhum → INSERT em `estoque_saidas` (motivo `AUGE_SAIDA`) e DELETE da posição.
5. **Retorno em 01/11 a partir de "transferido"**: se um lote que estava com `status='transferido'` reaparece no 01/11 com nova metragem, atualiza status e `m_linear_atual` (menor que o original preservado em `m_linear`).
6. Overflow (célula cheia) continua indo para `tecidos_sem_espaco`.

Otimização: para os "sumidos", varrer só a lista de depósitos ativos (~10) em batch, não todos.

## Etapa 3 — UI

**`src/components/estoque/EstoqueDetailDialog.tsx`** (ou o dialog atual da ficha):
- Novo campo **"Depósito atual"** (badge com código+nome, buscado de `auge_depositos`).
- Se `m_linear_atual !== m_linear`: mostra ambos com label "Original" / "Atual (físico)".
- Badge de status: 
  - `ocupado` verde "Disponível"
  - `bloqueado` âmbar "Bloqueado (Provisório)"
  - `transferido` azul "Em outro depósito"

**`src/components/estoque/MadeiraEstoque.tsx` / mapa 2D**:
- Cor por status: verde/âmbar/azul.

## Etapa 4 — Arquivos afetados

- Migração SQL (colunas novas)
- `supabase/functions/auge-sync/index.ts` — rewrite do `syncTecidosMap`
- `src/components/estoque/EstoqueDetailDialog.tsx` — novos campos
- Grid/mapa: adicionar cor para `bloqueado` e `transferido`
- Tipagem: `src/integrations/supabase/types.ts` (auto)

## Detalhes técnicos

- `m2_atual = m_linear_atual × largura` recalculado no sync.
- `lote_sistema` NUNCA muda depois de criado — é a chave estável.
- Rodada é idempotente. Progresso salvo em `auge_sync_runs.detalhes` (contadores: `dep01`, `dep11`, `transferidos`, `saidas`, `retornos`).
- Estimativa: 3.6k itens × 2 dep = 7.2k chamadas. Batch 20 = ~360 batches. Rodada ~5-8min em background.

## Fora do escopo

- Motor/controle/série continuam sem mapa físico.
- Não vamos criar transferência automática no Auge — só refletir o que já aconteceu lá.

Confirma para eu executar?
