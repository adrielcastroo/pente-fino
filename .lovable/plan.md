

## Plano: Redesenhar navegação com barra de abas estilo navbar

### Conceito
Substituir o sistema atual de abas separadas (tabs mobile + mode toggle no LeftPanel + tabs desktop no RightPanel) por uma **barra de navegação unificada** abaixo do TopBar, no estilo da imagem de referência — links horizontais limpos, sem ícones, com destaque no item ativo.

As abas serão: **Tecido** | **Madeira** | **Motor/Controle** | **Tabela** | **Histórico**

### Mapeamento de funcionalidade (nenhuma será perdida)

- **Tecido** → abre o LeftPanel com os modos Coulisse/IA/Diversos (o toggle Coulisse/IA/Diversos fica **dentro** do LeftPanel como subtoggle)
- **Madeira** → abre o LeftPanel no modo Madeira
- **Motor/Controle** → novo placeholder (futuro), exibe mensagem "Em breve"
- **Tabela** → exibe o RightPanel (tabela de registros)
- **Histórico** → exibe o HistoryPanel

### Mudanças por arquivo

**`src/pages/Index.tsx`:**
- Substituir `activeTab: 'form' | 'table' | 'history'` por `activeTab: 'tecido' | 'madeira' | 'motor' | 'table' | 'history'`
- Renderizar barra de navegação unificada (NavBar) abaixo do TopBar — estilo clean: fundo branco/card, texto uppercase com tracking, item ativo em negrito com underline ou cor primária
- Badge de contagem de registros na aba "Tabela"
- **Mobile/portrait**: barra scrollável horizontal, conteúdo ocupa tela inteira
- **Desktop/landscape**: manter layout side-by-side mas NavBar controla qual painel esquerdo é mostrado; Tabela/Histórico controlam o painel direito
- Quando `activeTab === 'tecido'`: chamar `setMode('manual')` se não for manual/openrouter/diversos; renderizar LeftPanel
- Quando `activeTab === 'madeira'`: chamar `setMode('madeira')`; renderizar LeftPanel
- Quando `activeTab === 'motor'`: renderizar placeholder

**`src/components/LeftPanel.tsx`:**
- Remover o mode toggle de 4 botões (Coulisse/IA/Diversos/Madeira) do topo
- Quando `currentMode` for manual/openrouter/diversos: mostrar subtoggle com apenas 3 opções (Coulisse/IA/Diversos)
- Quando `currentMode === 'madeira'`: não mostrar subtoggle, ir direto para o formulário Madeira
- Toda a lógica de formulário permanece intacta

**`src/components/TopBar.tsx`:**
- Sem mudanças na lógica, apenas garantir que a navbar abaixo se integre visualmente

### Estilo visual (referência imagem)
- Fundo claro (bg-card/bg-background) com borda inferior sutil
- Texto: `text-sm font-medium uppercase tracking-wider`
- Item ativo: `text-foreground font-semibold` com borda inferior 2px na cor primária
- Item inativo: `text-muted-foreground hover:text-foreground`
- Sem ícones nas abas (estilo limpo da referência)
- Espaçamento uniforme entre itens

### Arquivos afetados
- `src/pages/Index.tsx` — nova NavBar unificada, lógica de tabs
- `src/components/LeftPanel.tsx` — remover mode toggle de 4, manter subtoggle de 3 para Tecido

