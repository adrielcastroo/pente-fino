

## Plano: Modo Madeira + Celular com numeração de caixa

### 1. Novo modo "Madeira" no LeftPanel

**`src/components/LeftPanel.tsx`:**
- Adicionar "Madeira" como 4º modo no toggle: `Coulisse | IA | Diversos | Madeira`
- Novo ícone (ex: `Package` do lucide)
- Estado `madeiraTipo`: `'Lâmina' | 'Base' | 'Bandô'` (grid 3 colunas)
- Subcampos por tipo:
  - **Item/Referência** (obrigatório)
  - **Lote/Batch** (opcional)
  - **Quantidade por caixa** (com defaults: Lâmina=100, Base=24, Bandô=24)
- Campo PROC com trava (igual Coulisse)
- Sem campos M², M Linear, Largura, Endereço
- Novo campo `quantidade` no estado do formulário

**`src/store/useAppStore.ts`:**
- Adicionar `quantidade?: number` ao tipo `Registro`
- Atualizar `currentMode` para aceitar `'madeira'`
- Atualizar `archiveAndClear` para salvar `quantidade` e `tipo_tecido` (Lâmina/Base/Bandô)

### 2. Lote Sistema para Madeira — numeração por caixa

**`src/store/useAppStore.ts`:**
- Nova função `generateLoteSistemaCaixa(processo, item, quantidade, existingRegistros)`:
  - Conta quantos registros existentes têm o **mesmo item** (referência idêntica)
  - Calcula `caixaNum = contagem + 1`
  - Formato: `CX${caixaNum.toString().padStart(2,'0')} PROC ${processo}`
  - Ex: `CX01 PROC 28738/25`, `CX02 PROC 28738/25`
  - Cada referência diferente reinicia em CX01

### 3. Celular — HC-45 divide por 3,66

**`src/components/LeftPanel.tsx`:**
- Na lógica de cálculo do `mLinear` para Celular:
  - Se `item.toUpperCase().startsWith('HC-45')` → `mLinear = m2 / 3.66`
  - Caso contrário → `mLinear = m2 / 3.05` (padrão atual)
- Atualizar label: `M² (÷ 3,66 para HC-45 | ÷ 3,05 demais)`
- Atualizar `largura` para Celular: `item.startsWith('HC-45') ? 3.66 : 3.05`

### 4. Celular — Lote Sistema com numeração de caixa

**`src/store/useAppStore.ts` e `src/components/LeftPanel.tsx`:**
- Celular passa a usar `generateLoteSistemaCaixa` em vez de `generateLoteSistema`
- Formato: `CX01 PROC 28738/25 12,4M`
- Mesmo padrão da Madeira: por referência idêntica, incrementa CX##

### 5. Layout de colunas para Madeira

**`src/lib/registroColumns.ts`:**
- Adicionar `'quantidade'` ao `RegistroColumnKey` e `COLUMN_MAP`
- Novo layout `madeira`: `['item', 'processo', 'quantidade', 'lote', 'loteSistema']`
- Atualizar `normalizeMode` para aceitar `'madeira'`

### 6. Migração de banco (se necessário)

- Adicionar coluna `quantidade` (integer, nullable) à tabela `registros`

### Arquivos afetados
- `src/store/useAppStore.ts` — tipo Registro, generateLoteSistemaCaixa, modo madeira
- `src/components/LeftPanel.tsx` — modo Madeira, HC-45 lógica, Celular caixa
- `src/lib/registroColumns.ts` — layout madeira, coluna quantidade
- Migração SQL — coluna quantidade

