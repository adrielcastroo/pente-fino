## Endpoints mapeados no HAR

- `POST modInventario/Ajax/getListaAcabamento.php` — lista mestre de acabamentos (cdAcabamento, nmAcabamento, classes/subclasses/combinações 1‑3, tag calculada, etc).
- `POST modInventario/Ajax/getListaItensAcabamento.php` (body `cdAcabamento=NNN`) — itens que pertencem a um acabamento (cdAcabamentoItem, **cdItemAcabamento** = código do item, descrição normal/original/reduzida, 5 kits complementares).
- `POST modInventario/Controle/ctlAcabamentoItem.php` — CRUD (`idAcao=2` = alterar) com todos os campos acima.
- Auxiliares p/ dropdowns: `getClasses.php`, `getSubClasses.php`, `getCombinacoes.php`, `getTags.php`.

Chave da relação com o item do estoque: **`cdItemAcabamento`** bate com `codigo_interno` de `itens_cadastro` (padrão `003.003.183.001.2`).

## Banco (migration)

Duas tabelas novas em `public` (com GRANTs e RLS `authenticated select` / admin write via `is_at_least('gerente')`):

- `auge_acabamentos` — cd_acabamento (PK), nr_acabamento, nm_acabamento, id_cancelado, classes/subclasses/combinações 1..3, ds_tag_calculada, id_herdar_colecao, id_limitar_tamanho, raw jsonb, synced_at.
- `auge_acabamento_itens` — cd_acabamento_item (PK), cd_acabamento (FK), cd_item_acabamento (indexado — usado pra achar acabamentos de um item), cd_linha, ds_item_acabamento, ds_item_acabamento_reduzida, ds_item_acabamento_original, cd_kit_complementar_1..5, nm_kit_complementar_1..5, synced_at.

Índices: `(cd_item_acabamento)` e `(cd_acabamento)`.

## Edge Function `auge-sync` — novas actions

- `sync_acabamentos`: chama `getListaAcabamento.php` → upsert em `auge_acabamentos`. Para cada `cdAcabamento`, chama `getListaItensAcabamento.php` → upsert em `auge_acabamento_itens`. Faz em lote (concorrência ~5) e usa o padrão de state machine já existente pra respeitar o timeout se a lista crescer.
- `update_acabamento_item`: recebe `{ cdAcabamentoItem, cdItemAcabamento, dsItemAcabamento, dsItemAcabamentoReduzida, dsItemAcabamentoOriginal, cdKitComplementar1..5 }`, envia `POST ctlAcabamentoItem.php` com `idAcao=2` + form‑urlencoded, retorna `{ message }` do Auge e re‑sincroniza só aquele acabamento.
- `get_acabamento_form_options`: cacheia `getClasses / getSubClasses / getCombinacoes / getTags` (opcional — só se formos permitir criar acabamento novo; para edição de item os kits vêm do próprio `manterAcabamentoItem.php`).

## UI

1. **Nova página `/estoque/acabamentos`** (ícone na sidebar, abaixo de Entradas):
   - Tabela dos acabamentos (busca, ordenação por coluna, filtros por classe/combinação, badge "Cancelado").
   - Botão "Sincronizar do Auge" chamando `sync_acabamentos`.
   - Ao clicar em um acabamento → `AcabamentoDetailDialog` com a lista dos itens daquele acabamento e, para cada linha, botão **Editar** que abre `AcabamentoItemEditDialog` (formulário com descrição, reduzida, original, 5 kits) → salva via `update_acabamento_item`.

2. **`FichaItemDialog` (aba nova "Acabamentos")**: dado o item aberto, consulta `auge_acabamento_itens` por `cd_item_acabamento = codigo_interno` e mostra cards com nome do acabamento, classe/combinação e um botão "Editar" que reaproveita o mesmo `AcabamentoItemEditDialog`. Assim o usuário responde "em quais acabamentos esse item está" com um clique.

3. **`CadastrosPage`**: coluna/ícone "Acabamentos: N" quando o item pertence a ≥1 acabamento (usa `count` da mesma query).

## Fio (ai-agent)

Em `buildAgentContext` do `supabase/functions/ai-agent/index.ts`:
- Se algum `textToken` bater com `cd_item_acabamento` ou o usuário mencionar "acabamento", buscar `auge_acabamento_itens` + join com `auge_acabamentos` e injetar (limit 20) — nome, classe, combinação, kits.
- Guardrail já cobre: "acabamento" fica dentro dos `DOMAIN_TERMS`.

## Detalhes técnicos

- Autenticação no Auge continua no mesmo padrão do `auge-sync` (cookie de sessão via `AUGE_USERNAME` / `AUGE_PASSWORD` + `AUGE_BASE_URL`).
- Content-Type `application/x-www-form-urlencoded` em todos os POSTs, incluindo o `update`.
- Resposta do `ctlAcabamentoItem.php` é `{"message":"Item alterado com sucesso"}` — tratar mensagens diferentes como erro e devolver pro toast.
- Realtime: habilitar `REPLICA IDENTITY FULL` em `auge_acabamento_itens` e publicar em `supabase_realtime` para a `FichaItemDialog` atualizar sozinha após edição.

## Fora do escopo (para não crescer)

- Criar / cancelar acabamento inteiro (só edição de item por enquanto).
- Editar classes/subclasses/combinações do acabamento em si.
- Kits complementares em CRUD — apenas seleção a partir do que o Auge já devolve.
