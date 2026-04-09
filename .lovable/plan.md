

## Plano: Sidebar + Dashboard Inicial

### Conceito
Transformar a navbar horizontal em uma **sidebar colapsável** usando Shadcn Sidebar. Criar uma nova página **Início** com dashboard de estatísticas. Remover a barra "Conferir Rolo" do LeftPanel e reposicionar o botão "Limpar campos".

### Mudanças por arquivo

#### 1. `src/pages/Index.tsx` → Layout com SidebarProvider
- Envolver tudo com `SidebarProvider`
- Substituir TopBar por `AppSidebar` + `SidebarTrigger` no header
- Adicionar aba `'inicio'` ao tipo `AppTab`
- Header fino com: `SidebarTrigger | [Conferente] [Excel] [Config]`
- Renderizar `DashboardPage` quando `activeTab === 'inicio'`
- Default `activeTab` = `'inicio'`

#### 2. `src/components/AppSidebar.tsx` (novo)
- Usar Shadcn `Sidebar` com `collapsible="icon"`
- Logo "Pente Fino" no topo
- Menu items: Início, Tecido, Madeira, Motor/Controle, Tabela, Histórico
- Ícones: `Home, Layers3, Package, Construction, Table, FolderOpen`
- Badge de contagem na aba Tabela
- Item ativo destacado com cor primária
- Estilo dark navy (topbar-bg) para manter identidade visual

#### 3. `src/components/TopBar.tsx` → Simplificar para header fino
- Remover navegação por abas (agora na sidebar)
- Manter apenas: Conferente + Excel + Config
- `SidebarTrigger` no canto esquerdo

#### 4. `src/components/LeftPanel.tsx` — Remover barra "Conferir Rolo"
- **Excluir** o header com "Conferir Rolo" (linhas 523-537)
- Mover "Limpar campos" para dentro do tip box (linha 566-576), posicionado no **canto extremo direito** do card, na mesma linha que "Lâmina: Item + Lote + Quantidade Enter"
- Manter botão Undo ao lado do "Limpar campos"

#### 5. `src/components/DashboardPage.tsx` (novo) — Página Início
- Título: "Início"
- Consultar `history` (conferências do store) para calcular estatísticas:
  - **Conferente que mais bipou**: agrupar por `conferente`, contar registros, exibir top 3
  - **Categoria mais bipada**: agrupar por `modoOrigem` → mapear para Tecido (manual/openrouter/diversos), Madeira, Motor/Controle
  - **Subcategoria mais usada**: contar por modo específico (Coulisse=manual, IA=openrouter, Diversos=diversos)
  - **Tipos de tecido mais bipados**: agrupar por `tipoTecido` (Rolo, Cortina, PVT, Celular/Plissada)
- Cards com ícones, números grandes e barras de progresso relativas
- Estilo harmonioso com cores primárias/accent do tema

#### 6. `src/index.css` — Ajustes de harmonia
- Sidebar usa variáveis `--navy` existentes
- Cards do dashboard com bordas sutis e sombras leves
- Transições suaves entre páginas

### Arquivos afetados
- `src/pages/Index.tsx` — SidebarProvider, nova aba inicio
- `src/components/AppSidebar.tsx` — novo, sidebar com navegação
- `src/components/TopBar.tsx` — simplificar para header fino
- `src/components/LeftPanel.tsx` — remover header "Conferir Rolo", mover "Limpar campos"
- `src/components/DashboardPage.tsx` — novo, página dashboard
- `src/index.css` — harmonia de cores sidebar

