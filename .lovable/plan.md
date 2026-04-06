## Plano: Celular/Plissada — remover endereço e normalizar aspas em todos os campos

### 1. Remover campo Endereço do tipo Celular

`**src/components/LeftPanel.tsx`:**

- Alterar `requiresEndereco` de `!isPVT` para `!isPVT && !isCelular`
- Isso automaticamente oculta o campo endereço, pula validação e grava vazio

`**src/lib/registroColumns.ts`:**

- Remover `'endereco'` do layout `celular`: `['item', 'processo', 'mLinear', 'lote', 'loteSistema']`

### 2. Normalizar aspas simples → hífen em todos os campos de texto

`**src/components/LeftPanel.tsx`:**

- A função `normalizeScannerItem` já existe mas só é aplicada ao campo Item
- Aplicar a mesma normalização (`replace(/[''`]/g, '-')`) nos handlers de onChange dos campos: NF, Lote, Endereço, PROC
- Renomear para algo genérico como `normalizeScannerInput`
- `Da mesma forma que já funciona o campo "item/referência"`

### 3. Renomear "Celular" para "Celular/Plissada"

`**src/components/LeftPanel.tsx`:**

- Atualizar o array de tipos de `'Celular'` para exibir `'Celular/Plissada'` no botão, mantendo o valor interno como `'Celular'`

### Arquivos afetados

- `src/components/LeftPanel.tsx` — lógica de campos, normalização, label
- `src/lib/registroColumns.ts` — layout de colunas do Celular