## Plano: Conferente fix + Scroll + Dashboard gráficos + Tabela editável + Motor/Controle completo

### 1. TopBar — Campo Conferente não ficar "comido"

`**src/components/TopBar.tsx`:**

- Aumentar `min-w` do input conferente de `min-w-0` para `min-w-[100px]` e `w-[80px] sm:w-[110px]` para `w-[100px] sm:w-[140px]`
- Garantir que o container pai não force `flex-shrink` excessivo

### 2. Rolagem vertical para todos os devices

`**src/pages/Index.tsx`:**

- Trocar `overflow-hidden` do container de conteúdo para `overflow-y-auto` garantindo scroll em todas as telas
- Garantir `h-[100dvh]` no container principal e `flex-1 overflow-y-auto` no conteúdo

`**src/components/LeftPanel.tsx`:**

- Verificar que `overflow-y-auto` está aplicado ao container scrollável

### 3. Dashboard — Gráficos dinâmicos com Recharts

`**src/components/DashboardPage.tsx` — reescrever:**

- Substituir `StatCard` com barras de progresso por gráficos Recharts reais (usando `ChartContainer` do chart.tsx existente)
- **Conferentes** → `BarChart` horizontal com cores da paleta primária
- **Categoria** → `PieChart` / donut com cores: Tecido=#2A9D8F, Madeira=#E9C46A, Motor=#E76F51
- **Ferramenta** (antigo Subcategoria) → `BarChart` vertical
- **Tipos de tecido** → `PieChart` com cores distintas
- Renomear títulos dos cards:
  - "Conferentes que mais biparam" → **"Conferentes"**
  - "Categoria mais bipada" → **"Categorias"**
  - "Subcategoria mais usada" → **"Ferramentas"**
  - "Tipos de tecido mais bipados" → **"Tipos de tecidos"**

### 4. Tabela — Edição inline direta

`**src/components/RightPanel.tsx`:**

- Adicionar estado `editingCell: { rowId: string, key: string } | null`
- Ao clicar duplo em uma célula, transformá-la em `<input>` editável
- Ao pressionar Enter ou blur, salvar o valor atualizado diretamente no array `registros` do store
- Adicionar `updateRegistro(id, updates)` ao store para atualizar registros antes de arquivar

`**src/store/useAppStore.ts`:**

- Adicionar método `updateRegistro: (id: string, updates: Partial<Registro>) => void` que atualiza o registro no array atual (não no histórico)

### 5. Motor/Controle — Página completa

`**src/components/MotorControlePage.tsx` (novo):**

**Subtoggle:** Motor | Controle (estilo igual ao Coulisse/IA/Diversos)

**Motor:**

- Toggle "Motor em Caixa" (switch) — quando ativo, mostra campo "Nº da Caixa" (input numérico com prefixo "CX" e badge "CX01")
- Campos: Modelo, Nota Fiscal (NFe), Série (campo de bipagem com placeholder "Bipe o código de barras...")
- Texto: "O leitor envia Enter automaticamente após a bipagem"
- Ao bipar série: extrair apenas a série limpa (remover modelo + letra que acompanha), prevenir duplicatas
- NF não redireciona foco para Série automaticamente
- Botão "Adicionar Motor" (estilo gradiente com base na cor do website)

**Controle:**

- Campos: Modelo (ex: SI 5 PU), Nota Fiscal, Série
- Série bruta: usar apenas dígitos antes da letra "F"
- Badge sequencial automático (#1, #2...)
- Formato final: `{Modelo} NFe {NF} {série limpa}`
- Texto: "Os dígitos antes de 'F' serão extraídos automaticamente"
- Botão "Adicionar Controle" (estilo gradiente de acordo com o website)

**Registro no store:**

- `modoOrigem: 'motor' | 'controle'`
- Campos mapeados: item=Modelo, processo=NFe, lote=Série limpa, loteSistema=formato final, quantidade=caixa num (motor)
- Sem duplicação de séries (validar antes de adicionar)

`**src/lib/registroColumns.ts`:**

- Adicionar layouts `motor` e `controle`: `['item', 'processo', 'lote', 'loteSistema', 'quantidade']`
- Atualizar `normalizeMode` para aceitar `'motor'` e `'controle'`

`**src/store/useAppStore.ts`:**

- Expandir tipo `currentMode` para incluir `'motor' | 'controle'`
- Atualizar `setMode` para aceitar novos modos

`**src/pages/Index.tsx`:**

- Substituir placeholder Motor/Controle por `<MotorControlePage />`
- Ao selecionar aba motor, definir `setMode('motor')`

### 6. Estilo visual Motor/Controle (referência imagens)

- Motor: card com fundo `bg-orange-50`, toggle com cores do website, botão gradiente website
- Controle: card com fundo `bg-blue-50`, botão gradiente do website
- Badge de caixa no canto do card (ex: "CX01")

### Arquivos afetados

- `src/components/TopBar.tsx` — fix conferente width
- `src/pages/Index.tsx` — scroll fix, Motor page integration
- `src/components/DashboardPage.tsx` — gráficos Recharts, renomear cards
- `src/components/RightPanel.tsx` — edição inline de células
- `src/store/useAppStore.ts` — updateRegistro, modos motor/controle
- `src/lib/registroColumns.ts` — layouts motor/controle
- `src/components/MotorControlePage.tsx` — novo, página completa Motor/Controle