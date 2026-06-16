## Objetivo

Na página `/tecido`, módulo **Coulisse** (modo `manual`), o campo **Endereço de Armazenagem** está oculto. Vamos reintroduzi-lo com o mesmo padrão visual e validações dos demais módulos, e ajustar a rolagem vertical da coluna de campos para que tudo permaneça acessível com o novo campo presente.

## Mudanças em `src/components/LeftPanel.tsx`

### 1. Tornar o Endereço obrigatório/visível no Coulisse

Hoje (linha 212):

```ts
const requiresEndereco = !isPVT && !isCelular && currentMode !== 'manual' && currentMode !== 'etiq_pronta';
```

Como `isCoulisse === (currentMode === 'manual')`, o Coulisse foi excluído. Ajuste:

```ts
const requiresEndereco = !isPVT && !isCelular && currentMode !== 'etiq_pronta';
```

Isso reaproveita todo o bloco já existente (linhas 1578–1605), incluindo:
- mesmo label "Endereço de Armazenagem"
- mesmo input com máscara/placeholder `TEC01.A.N03`
- mesmo botão de cadeado (`lockEndereco`)
- mesma validação `ENDERECO_REGEX` no submit (linhas 825–826)
- mesmo lookup automático ao bipar item (linhas 427–466)

Nenhum outro fluxo precisa mudar: o Coulisse já passa pelo mesmo handler de submit, então a checagem `requiresEndereco && !endereco` passará a valer naturalmente.

### 2. Ajustar a rolagem vertical da coluna de campos

O container de scroll é (linha 966):

```tsx
<div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain">
```

Com o campo extra no Coulisse, o último input/botão pode ficar colado no rodapé. Adicionar respiro inferior e garantir que o conteúdo role suavemente:

- Adicionar `pb-28` (ou `pb-24 lg:pb-16`) ao wrapper interno de conteúdo do scroll (logo abaixo do container `overflow-y-auto`), garantindo espaço entre o último campo / botão "Adicionar" e a borda inferior.
- Manter `overscroll-contain` (já presente) para evitar bounce que esconde o último campo no mobile.

Sem alterações em outros módulos: o padding extra é neutro para Tecido/Madeira/Diversos.

## Validação

- `bun run build` deve passar.
- No preview `/tecido` → aba Coulisse:
  - Campo "Endereço de Armazenagem" aparece após Lote, com cadeado e placeholder `TEC01.A.N03`.
  - Submeter sem endereço mostra toast "Preencha o Endereço.".
  - Submeter com formato inválido mostra "Endereço inválido. Use: TEC01.A.N03".
  - Rolagem vertical permite alcançar o botão "Adicionar" sem sobreposição.
- Verificar que Tecido / Madeira / Diversos continuam idênticos.
