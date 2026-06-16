
## Objetivo

Hoje o app valida etiqueta assumindo que o campo "Item" bipado é o **código interno**. O usuário quer o inverso: o operador bipa o **código do fornecedor** (que vem na etiqueta original do fornecedor), e o sistema:

1. Procura esse código na base `/cadastros`
2. Substitui pelo **código interno** na etiqueta gerada
3. Usa a **descrição cadastrada** na etiqueta

Além disso, em `/cadastros`:
- Adicionar filtros (com/sem código fornecedor, ordenação)
- Permitir cadastrar/editar itens **sem código do fornecedor** (campo opcional)

---

## Mudanças

### 1. Banco — tornar `codigo_fornecedor` opcional
Migration:
- `itens_cadastro.codigo_fornecedor` → permitir `NULL` / string vazia
- `codigo_fornecedor_normalizado` → permitir `NULL`
- Manter índice único em `codigo_interno`; adicionar índice (não único) em `codigo_fornecedor_normalizado` para lookup rápido por fornecedor

### 2. Lookup por código de fornecedor
Em `src/services/itensCadastroService.ts`, novo método:
```
findByCodigoFornecedor(codigoBipado): Promise<ItemCadastro | null>
```
Estratégia (em ordem):
1. Match exato pelo `codigo_fornecedor_normalizado` (normalizado via `normalizarCodigo`)
2. Se nada, busca parcial (`ilike`) para tolerar prefixos/sufixos
3. Fallback: olhar dentro da `descricao` cadastrada usando `extractCodigoFornecedor` + `codigoBate`

### 3. Resolução automática no `printService`
Em `src/services/printService.ts`, refatorar `validarItem` → `resolverItem(codigoBipado, fallbackDescricao)`:
- Tenta `findByCodigoInterno(codigoBipado)` (compatibilidade)
- Se não achar, tenta `findByCodigoFornecedor(codigoBipado)`
- Se achar via fornecedor: **substitui** `data.sku` pelo `codigo_interno` cadastrado e usa a `descricao` cadastrada
- Se não achar nada: mantém comportamento atual + toast de aviso
- Aplica em `printTecidoLabel` e `printMotorLabel`

Retorno: `{ codigoInternoFinal, descricaoFinal, matched: boolean, matchedBy: 'interno'|'fornecedor'|null }`.

### 4. `/cadastros` — campo opcional + filtros
**`ItemFormDialog.tsx`**: tornar `codigo_fornecedor` opcional (remover `required`, label "Código fornecedor (opcional)"); aceitar vazio no submit (envia `null`).

**`CadastrosPage.tsx`**: adicionar barra de filtros ao lado da busca:
- Select "Mostrar": Todos / Com fornecedor / **Sem fornecedor**
- Select "Ordenar por": Código interno / Descrição / Atualizado recente
- Badge contador "X sem fornecedor" para visibilidade

Na tabela, quando `codigo_fornecedor` estiver vazio, exibir badge cinza `— sem código —` em vez de badge vazio.

### 5. Tipos
- `ItemCadastro.codigo_fornecedor`: `string | null`
- `ItemCadastroInput.codigo_fornecedor`: `string` (vazio permitido; service converte para `null`)
- `prepare()` no service: se vazio → `null` em ambos os campos normalizados

---

## Fora do escopo
- Não mexer em `/reservas` nem no fluxo de auditoria.
- Não alterar o template visual da etiqueta — apenas os dados que a alimentam.
- Não criar UI de "merge" de duplicatas de fornecedor (se houver dois itens internos com mesmo fornecedor, o primeiro encontrado vence; aviso via toast).

## Arquivos afetados
- `supabase/migrations/*` (nova)
- `src/services/itensCadastroService.ts`
- `src/services/printService.ts`
- `src/components/cadastros/ItemFormDialog.tsx`
- `src/components/cadastros/ImportItensDialog.tsx` (aceitar fornecedor vazio na importação)
- `src/pages/CadastrosPage.tsx`
- `src/lib/codigoFornecedor.ts` (sem mudanças; já cobre extração)
