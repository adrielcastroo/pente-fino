
# Cadastro de Itens + Validação Fornecedor

Nova página `/cadastros` para manter a base de itens (código interno + descrição + código fornecedor), alimentar a geração de etiquetas e validar se o código bipado corresponde ao fornecedor cadastrado.

## 1. Banco de dados

Nova tabela `public.itens_cadastro`:

- `id` (uuid, pk)
- `codigo_interno` (text, unique, not null) — nosso código, ex.: `002.001.002.000.323`
- `descricao` (text, not null) — descrição limpa para a etiqueta
- `codigo_fornecedor` (text, not null, indexado) — código bruto extraído/informado
- `codigo_fornecedor_normalizado` (text, indexado) — versão upper + sem espaços/pontuação, usada para matching
- `created_at`, `updated_at`, `created_by`

RLS: leitura/escrita para `authenticated`. GRANTs + service_role conforme padrão do projeto. Trigger `update_updated_at_column`.

## 2. Página `/cadastros`

Rota nova em `App.tsx` + item na sidebar (`AppSidebar.tsx`) com ícone `Package`.

Layout (padrão visual do projeto — dark navy, glassmorphism, IBM Plex, PT-BR):

- **Header**: título "Cadastro de Itens", botão "Importar planilha", botão "Novo item", busca por código/descrição.
- **Tabela** (shadcn `Table`): Código Interno · Descrição · Código Fornecedor · Atualizado em · Ações (editar / excluir).
- **Dialog de Importação**: aceita `.xlsx`/`.csv` com colunas `codigo_interno`, `descricao_completa` (e opcional `codigo_fornecedor`).
  - Pré-visualização das primeiras 20 linhas mostrando o código fornecedor extraído automaticamente da descrição (com destaque) e a descrição final.
  - Usuário pode editar/sobrescrever o código fornecedor antes de confirmar.
  - Resumo: novos, atualizados (mesmo `codigo_interno`), ignorados (erro).
  - Upsert em lote por `codigo_interno`.
- **Dialog de edição manual**: 3 campos, validação de unicidade.

## 3. Extração do código fornecedor a partir da descrição

Função pura `extractCodigoFornecedor(descricao: string): { codigo: string | null; descricaoLimpa: string }` em `src/lib/codigoFornecedor.ts` + testes.

Heurística em ordem de prioridade (primeiro match vence):

1. Conteúdo entre parênteses cujo miolo seja um código alfanumérico válido — regex `\(([A-Z0-9][A-Z0-9\-\/\.]{2,})\)` (ex.: `(RF-BASIC-BO-03-0)`, `(3001-05-250)`, `(1800492)`).
2. Token alfanumérico com letras + dígitos colados (sem parênteses), ex.: `YM4202`, `RF-MOMBASSA5600` — regex `\b([A-Z]{2,}[A-Z0-9\-]*\d+[A-Z0-9\-]*)\b`.
3. Última sequência numérica longa (≥6 dígitos) ao final da descrição.

Filtros para evitar falsos positivos: ignorar tokens em uma blacklist (`PCT1`, `NF`, `NFE`, `RR`, `M2`, `ML`, unidades, números curtos < 3 chars).
Normalização para matching: `value.toUpperCase().replace(/[^A-Z0-9]/g, '')`.

A `descricaoLimpa` mantém a descrição original (não removemos o código — ele continua visível no texto exibido na etiqueta), apenas isolamos a referência para comparar.

## 4. Validação na geração de etiqueta

Local: `src/services/labelRenderer.ts` (e/ou no fluxo do botão "Gerar etiqueta" em `TecidoPage` e `MotorControlePage`).

Fluxo:

1. Antes de imprimir, buscar o item em `itens_cadastro` por `codigo_interno` do registro.
2. Se encontrado, comparar `codigo_fornecedor_normalizado` cadastrado com o código bipado normalizado (vindo do registro/lote/série).
3. Resultado:
   - **Match**: gera normalmente. Etiqueta usa `codigo_interno` (campo COD) + `descricao` do cadastro (com fornecedor embutido).
   - **Sem match**: dialog de confirmação em PT-BR ("O código bipado `X` não confere com o fornecedor cadastrado `Y` para o item `Z`. Imprimir mesmo assim?") — botões "Cancelar" / "Imprimir assim mesmo". Não bloqueia, apenas avisa, como solicitado.
   - **Item não cadastrado**: toast warning "Item não está na base de cadastros — etiqueta usará dados do registro" + opção rápida "Cadastrar agora" abrindo o dialog pré-preenchido.

Logs de divergência salvos em `operation_logs` para auditoria.

## 5. Detalhes técnicos

- `src/services/itensCadastroService.ts`: `listItens`, `upsertItem`, `bulkUpsert`, `deleteItem`, `findByCodigoInterno`, `findByFornecedor`.
- Hook `useItensCadastro` (React Query) com cache 5 min.
- Reuso de `src/lib/xlsx-utils.ts` para leitura da planilha.
- Atualização do `mem://index.md` adicionando referência a `mem://features/itens-cadastro`.

## Arquivos previstos

- Migration SQL nova
- `src/lib/codigoFornecedor.ts` + `.test.ts`
- `src/services/itensCadastroService.ts`
- `src/hooks/useItensCadastro.ts`
- `src/pages/CadastrosPage.tsx`
- `src/components/cadastros/ItemFormDialog.tsx`
- `src/components/cadastros/ImportItensDialog.tsx`
- `src/components/cadastros/ValidacaoEtiquetaDialog.tsx`
- Edições: `src/App.tsx`, `src/components/AppSidebar.tsx`, `src/services/labelRenderer.ts`, `src/pages/TecidoPage.tsx`, `src/pages/MotorControlePage.tsx`, `mem://index.md`
