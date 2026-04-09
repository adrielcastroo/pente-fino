

## Plano: Navbar flutuante + páginas exclusivas + histórico inteligente

### Conceito
Transformar a navbar atual em uma **barra flutuante fixa no topo** integrando logo, abas de navegação, campo conferente e botão Excel em uma única linha. Cada aba (Tecido, Madeira, Motor/Controle, Tabela, Histórico) ocupará a **tela inteira** — sem divisão side-by-side. Tabela vira preview embutido dentro dos formulários. Histórico ganha identificação inteligente por tipo.

### Mudanças por arquivo

#### 1. `src/components/TopBar.tsx` — Navbar flutuante unificada
- **Fundir** TopBar + NavBar em um único header flutuante
- Layout: `Logo | Tecido | Madeira | Motor/Controle | Tabela | Histórico | [Conferente] [Excel] [Config]`
- **Remover**: stat-pill de "Rolos" e "Metragem total" do topo
- Mover campo Conferente para o lado direito, junto ao botão Excel
- Estilo: `sticky top-0 z-50`, fundo escuro (navy) atual, abas como links claros no estilo atual
- Receber `activeTab` e `onTabChange` como props para controlar navegação
- Badge de contagem na aba Tabela

#### 2. `src/pages/Index.tsx` — Páginas exclusivas por aba
- **Remover** layout `grid-cols` side-by-side completamente
- Cada aba ocupa `flex-1 overflow-hidden` sozinha (tela inteira)
- Remover `desktopRightTab` — não há mais divisão esquerda/direita
- Passar `activeTab` e `onTabChange` ao TopBar
- Em landscape tablet/desktop, manter o mesmo layout de tela inteira (sem split)

#### 3. `src/components/LeftPanel.tsx` — Preview de tabela embutido
- Adicionar botão "Preview Tabela" no formulário (abaixo do botão Conferir)
- Ao clicar, abre um mini-painel colapsável/modal com os últimos registros bipados (usando a mesma lógica do RightPanel, mas resumido — últimas 5-10 linhas)
- Manter toda funcionalidade existente do formulário

#### 4. `src/components/HistoryPanel.tsx` — Identificação inteligente por tipo
- **`getModeBadges`**: adicionar reconhecimento de `'madeira'` no `modoOrigem`
- **Contagem contextual** na pasta:
  - Se todos `modoOrigem === 'madeira'` → mostrar "X caixas" em vez de "X rolos"
  - Se todos Celular → "X rolos (Celular)"
  - Se misturado → "X itens"
  - Motor/Controle → "X itens (Motor)"
- Extrair `quantidade` total para madeira (soma das quantidades) e exibir

### Arquivos afetados
- `src/components/TopBar.tsx` — navbar unificada com abas + conferente + excel
- `src/pages/Index.tsx` — remover split, páginas exclusivas
- `src/components/LeftPanel.tsx` — botão preview tabela embutido
- `src/components/HistoryPanel.tsx` — contagem inteligente por tipo (caixas/rolos/itens)

