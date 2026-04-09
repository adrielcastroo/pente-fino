

## Plano: Motor/Controle redesign + Últimos cadastros em todas as páginas + Ícone sidebar

### 1. `src/components/MotorControlePage.tsx` — Redesign completo

**Design alinhado ao padrão do site:**
- Remover cores `orange-50`/`blue-50` dos cards — usar `bg-card border-border` como no LeftPanel
- Subtoggle Motor|Controle com estilo idêntico ao Coulisse/IA/Diversos do LeftPanel (`surface-2-bg`)
- Inputs usando mesma classe do LeftPanel (com labels `text-[10px] uppercase tracking-wider`)
- Botão "Adicionar" usando `bg-primary hover:bg-primary/90` (teal do site) em vez de gradientes laranja/cyan
- Info box usando classe `ai-status-box` existente

**Tabela no card "Últimos cadastrados":**
- Substituir lista simples por tabela com colunas: `Caixa | Modelo | NF | Série | Série Final (sistema)`
- Para Motor: coluna Caixa mostra `CX01` ou `S/CX`
- Para Controle: coluna Caixa mostra `—`, adicionar coluna Sequência

**Lote final (loteSistema) — novo padrão:**
- Motor: `CX{nº} NF {nf} série {série}` (ex: `CX01 NF 146842 série 454327`)
- Controle: `{Modelo} NF {nf} série {série} Sequência {seq}` (ex: `SI 1 PU NF 146842 série 454327D11 Sequência 1`)

**Chave seletora Motor:**
- `false` → mostrar `S/CX` na coluna Caixa
- `true` → mostrar `CX{nº}` na coluna Caixa

**Mapeamento de modelos Controle (auto-substituição):**
- Ao digitar o modelo, substituir automaticamente:
  - `1870405` → `SI 1 PU`, `1870421` → `SI 4 PU`
  - `1811608` → `SI 1 VA`, `1811610` → `SI 4 VA`
  - `SITUO 1 Pure` → `SI 1 PU`, `SITUO 4 Pure` → `SI 4 PU`
  - `Situo 1 Variation Pure` → `SI 1 VA`, `Situo 4 Variation Pure` → `SI 4 VA`
- Aplicar substituição no blur ou ao adicionar

### 2. `src/components/LeftPanel.tsx` — Card "Últimos cadastrados"

- Garantir que o card de preview (mini tabela) já existente esteja visível por padrão (sem necessidade de toggle) ou manter toggle mas com design consistente
- Usar mesmo estilo de tabela do MotorControlePage

### 3. `src/components/AppSidebar.tsx` — Ícone Motor/Controle

- Trocar `Construction` por `Settings2` (engrenagem) do lucide-react para Motor/Controle

### Arquivos afetados
- `src/components/MotorControlePage.tsx` — redesign visual, tabela, lote final, mapeamento modelos
- `src/components/AppSidebar.tsx` — trocar ícone
- `src/components/LeftPanel.tsx` — garantir card últimos cadastrados consistente

