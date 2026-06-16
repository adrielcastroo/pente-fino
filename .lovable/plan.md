
## Objetivo

Permitir que cada item em `/cadastros` tenha **vários códigos de fornecedor** (não só um), para que o sistema reconheça o item independentemente de qual fornecedor enviou. Hoje há apenas um campo único `codigo_fornecedor`.

---

## Mudanças

### 1. Banco — array de códigos de fornecedor

Migration em `itens_cadastro`:
- Adicionar `codigos_fornecedor TEXT[]` (lista de códigos originais, ex: `['YM4202', 'RF-MOMBASSA5600']`)
- Adicionar `codigos_fornecedor_normalizado TEXT[]` (mesma lista normalizada para busca)
- **Backfill**: copiar `codigo_fornecedor` atual para o array (1 elemento) em todos os 306 registros
- Criar índice GIN em `codigos_fornecedor_normalizado` para busca rápida com operador `@>` / `&&`
- **Manter** `codigo_fornecedor` e `codigo_fornecedor_normalizado` (singular) por compatibilidade — preenchidos sempre com o **primeiro** elemento do array (via trigger ou no service). Assim código legado e a coluna singular continuam funcionando, e a tabela continua mostrando o "principal".

### 2. Service — `itensCadastroService.ts`

- `ItemCadastro.codigos_fornecedor: string[]` (e normalizado)
- `ItemCadastroInput.codigos_fornecedor: string[]`
- `prepare()`: limpa, normaliza, deduplica e ordena; define o singular como `array[0] || null`
- `findByCodigoFornecedor(bipado)`:
  1. Exato: `.contains('codigos_fornecedor_normalizado', [norm])`
  2. Parcial: busca onde algum elemento do array contém/é contido pelo bipado (fetch + filtro client-side, igual hoje)
  3. Fallback descrição: igual hoje
- `bulkUpsert` (importação): aceita 1+ códigos por linha (ver passo 4)

### 3. UI — `ItemFormDialog.tsx`

Substituir o input único por um **gerenciador de tags**:
- Input + botão "Adicionar" (ou tecla Enter) que empilha o código como chip removível
- Botão "Auto-detectar" continua sugerindo a partir da descrição e adiciona como novo chip se ainda não existir
- Validação: deduplicação automática (normalizado), aviso se o código já existe em outro item
- Continua opcional (lista pode ficar vazia)
- Auditoria: `changedField` = `'codigos_fornecedor'` quando a lista muda

### 4. UI — `/cadastros` (`CadastrosPage.tsx`)

- Coluna "Código fornecedor" passa a mostrar **todos** os chips (com truncamento "+N" se passar de 3)
- Filtros existentes continuam: "com / sem fornecedor" agora olham o array (vazio = sem)
- Busca: estender para procurar em qualquer elemento do array (além de código interno e descrição)
- Contador "X sem fornecedor" usa `array_length = 0`

### 5. Importação — `ImportItensDialog.tsx`

- Aceitar coluna `codigo_fornecedor` com **múltiplos códigos separados por `;` ou `|`** (ex: `YM4202;RF-MOMBASSA`)
- Documentar no texto de ajuda do dialog
- Se a planilha tiver várias linhas com mesmo `codigo_interno`, **mesclar** os fornecedores no upsert (não sobrescrever)

### 6. `printService.ts` — `resolverItem`

Sem mudanças de lógica: já chama `findByCodigoFornecedor`, que passa a varrer o array. Sucesso transparente.

### 7. Tipos — `src/types/index.ts` e `supabase/types.ts`

Atualizados após a migration. Manter campo singular como `string | null` (derivado).

---

## Compatibilidade

- Registros antigos continuam funcionando: o backfill garante que cada item tenha pelo menos 1 elemento no array quando já existia código.
- O campo singular `codigo_fornecedor` continua na tabela (sincronizado com `array[0]`) para qualquer consumidor externo / export antigo.
- Nenhuma mudança em `/reservas`, auditoria, ou template de etiqueta.

## Arquivos afetados

- `supabase/migrations/*` (nova: array + backfill + índice GIN)
- `src/services/itensCadastroService.ts`
- `src/components/cadastros/ItemFormDialog.tsx`
- `src/components/cadastros/ImportItensDialog.tsx`
- `src/pages/CadastrosPage.tsx`
- `src/types/index.ts`
