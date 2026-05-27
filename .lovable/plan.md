
## Objetivo

Replicar o layout visual da imagem de referência nas páginas **/tecido**, **/madeira** e **/motor**, mantendo 100% dos campos, nomes, botões, sub-modos (Manual / Diversos / Etiq. Pronta / IA, Motor/Controle, etc.) e toda a lógica de bipagem, validação, travamento de campos, alocação e exportação atuais. Mudam apenas a aparência, hierarquia visual e disposição dos blocos.

## Referência (imagem)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [Logo] Registro & Bipagem   Registro Diversos Etiq.Pronta IA   🔍 search  [Importar] [+ Novo registro] │
├──────────────┬───────────────────────────────────────────────────────┤
│ Novo registro│  ┌KPI 1┐ ┌KPI 2┐ ┌KPI 3┐ ┌KPI 4┐                    │
│  Limpar      │  │Total│ │ m²  │ │Lotes│ │Últ. │                    │
│  [barcode]   │  └─────┘ └─────┘ └─────┘ └─────┘                    │
│  Item ___    │                                                       │
│  Larg ___    │  🔍 buscar...           [Filtros] [Ordenar]   ⊞ ☰   │
│  M² __ Lote_ │  ┌──────────────────────────────────────────────┐   │
│  M.lin Lote f│  │ # Item Larg M² M.Lin Lote End Pos LF Status… │   │
│  Endereço Pos│  │ 1  ...                                       │   │
│  Dimensões   │  │ ...                                          │   │
│  [Salvar]    │  └──────────────────────────────────────────────┘   │
│  + outro     │  paginação                                            │
│              │  ┌Dicas┐ ┌Status┐ ┌Legenda┐ (rodapé branco suave)    │
└──────────────┴───────────────────────────────────────────────────────┘
```

Características visuais a adotar:
- Fundo geral branco suave (`bg-white`/`bg-card`) com cards de borda fina arredondada (rounded-2xl) e sombras muito leves.
- Header da página com logo + nome do módulo à esquerda, abas de sub-modo centralizadas com sublinhado azul no ativo, busca + ações à direita.
- Coluna esquerda “Novo registro” como card branco com ícone grande de código de barras no topo e link “Limpar” à direita.
- Faixa superior de 4 KPI cards (ícone colorido em quadrado pastel + título + número grande + subtítulo).
- Barra de filtros (busca + Filtros + Ordenar + toggle de visualização).
- Tabela com cabeçalho cinza suave, linhas zebradas leves, badges de status coloridos (Pendente âmbar, Conferido verde, Cancelado vermelho).
- Rodapé com 3 colunas: Dicas rápidas, Status, Legenda.

## Escopo por página

### 1) `/tecido` e `/madeira` (LeftPanel + RightPanel via FormPageLayout)

Reaproveitar a estrutura `FormPageLayout` atual (coluna esquerda = formulário, direita = tabela). Trabalhar apenas em:

- **`src/components/LeftPanel.tsx`** — reestilizar o painel para o visual “Novo registro”:
  - Card branco com cabeçalho “Novo registro” + botão `Limpar` à direita.
  - Ícone grande de barcode no topo + microtexto “Aponte o leitor ou digite o código do item”.
  - Inputs com altura `h-11`, fundo cinza muito claro, borda fina, label em maiúsculas pequenas.
  - Manter EXATAMENTE: mode toggle (Manual / Diversos / Etiq. Pronta / IA), todos os campos (Item, Largura, M², Lote/Batch, M.Linear, Lote Final, Endereço, Pos, Dimensões da peça, Lote sistema), botões “Salvar registro” (primário azul) e “Registrar e adicionar outro” (link), travas (cadeado), AvariaForm/LoteMestreSelector no modo madeira, undo, câmera/IA, tudo intacto. Apenas reorganizar visualmente nos novos cartões.
  - Para `/madeira`: manter os campos extras (lote mestre, avaria, etc.) dentro do mesmo card, abaixo dos campos comuns.

- **`src/components/RightPanel.tsx`** — ajustar o painel direito:
  - Manter os 4 KPI cards do topo (já existem) e adequar o estilo aos cards da imagem (ícone em quadrado pastel colorido, número grande em negrito, label em maiúsculas, subtítulo discreto).
  - Barra logo abaixo com input de busca, botões `Filtros`, `Ordenar: mais recentes`, e à direita o toggle de visualização (linhas/cards).
  - Tabela com cabeçalho cinza claro fixo, badges de status coloridos, coluna “Ações” já reativada (👁 ✏️ 🗑) — apenas reestilizar.
  - Footer com 3 colunas (Dicas / Status / Legenda) — manter conteúdo, ajustar paleta clara da imagem.
  - Conservar toda a lógica de filtragem, edição inline, exclusão e ordenação.

- **`src/components/TopBar.tsx`** — para as rotas `/tecido`, `/madeira` e `/motor`, dar o visual da barra superior da imagem:
  - “Registro & Bipagem” à esquerda com logo, abas no centro espelhando o sub-modo atual (somente leitura/sincronizadas com o estado), e à direita: campo de busca rápido (já existente ou novo, ligado ao filtro da tabela), botão `Importar` (reusar fluxo existente onde aplicável, ocultar onde não há), e o botão primário azul `+ Novo registro` (= ação de focar/limpar o formulário, equivalente ao “Registrar e adicionar outro”).
  - Manter intactos: identificação do conferente, fluxo de Exportar (apenas movê-lo para dropdown do botão “+ Novo registro” ou manter como botão secundário — preservar 100% da lógica de alocação + arquivamento + limpeza + download).

### 2) `/motor` (MotorControlePage — layout próprio, sem RightPanel)

Refatorar `src/pages/MotorControlePage.tsx` para o mesmo gabarito de duas colunas:

- Coluna esquerda: card “Novo registro” reaproveitando os campos atuais (sub-toggle Motores/Controles, Modelo/Marca, NFe, Nº Série, switch “Armazenado em Caixa” + Nº Caixa, travas), botão primário `Adicionar Motor/Controle` e link `Limpar campos`. Mesmo visual da imagem.
- Coluna direita:
  - 4 KPI cards adaptados ao contexto motor/controle: **Total de registros**, **Motores**, **Controles**, **Última atualização**.
  - Barra de busca/filtros e tabela de pré-visualização (já existente após a linha 412) reestilizada no padrão da imagem com colunas relevantes (#, Item/Modelo, NF, Série, Lote Final, CX, Status, Ações).
  - Rodapé com Dicas / Status / Legenda específicos (ex.: explicar S/CX, CXxx, sequencial *N, duplicidade).
- Em mobile: reaproveitar `FormPageLayout` mobile (toggle flutuante) — opção: envolver a página no `FormPageLayout` passando um `RightPanel` específico de motor/controle (componente novo) ou implementar layout responsivo equivalente dentro da própria página.

## Pontos técnicos importantes

- **Tokens semânticos**: introduzir/usar as variáveis já existentes em `index.css` (background, card, primary, muted, etc.). Para o fundo branco suave usar `bg-card`/`bg-background`; para badges de status mapear cores em HSL nos tokens já existentes (success/warning/destructive).
- **Sem alterar lógica**: não tocar em `useAppStore`, `estoqueService`, `registroService`, `etiq-pronta-utils`, `app-utils`, hooks de câmera/IA, validações de bipagem, regex de endereço, geração de Lote Sistema, fluxo de exportação/alocação, travas, undo, presença.
- **Responsividade**: manter o comportamento atual (`FormPageLayout` com toggle mobile, breakpoints `lg:`).
- **Acessibilidade**: preservar `aria-*` já existentes; aumentar contraste dos textos secundários onde o fundo passar a ser branco.

## Arquivos previstos para edição

- `src/components/LeftPanel.tsx` (reestilização — modos manual/diversos/etiq_pronta/ia + madeira)
- `src/components/RightPanel.tsx` (KPI + filtros + tabela + footer no novo visual)
- `src/components/TopBar.tsx` (cabeçalho “Registro & Bipagem” para as 3 rotas; manter Exportar)
- `src/pages/MotorControlePage.tsx` (refatorar para gabarito de 2 colunas, KPIs próprios e tabela estilizada)
- Eventual novo componente `src/components/motor/MotorRightPanel.tsx` para isolar KPIs/tabela/footer de motor/controle e reusar `FormPageLayout`.
- Pequenos ajustes em `src/index.css` / `tailwind.config.ts` se faltarem tokens (ex.: tonalidades pastel para os quadrados de ícone dos KPIs e cores de badges).

## O que NÃO será alterado

- Nenhum nome de campo, label, placeholder funcional, ordem lógica de tab, validação, atalho de teclado, regra de duplicidade, regra HC45/Celular, geração de Lote Sistema, fluxo de Exportar/alocar, integração com Supabase, store Zustand, autenticação ou rotas.
- Páginas fora do escopo: `/dashboard`, `/estoque`, `/historico`, `/reservas`, `/saida`, `/configuracoes` permanecem como estão.

## Critérios de aceite

1. As três páginas exibem o cabeçalho “Registro & Bipagem” com abas, busca e botões da imagem.
2. Coluna esquerda exibe o card “Novo registro” com ícone de barcode e todos os campos atuais preservados.
3. Coluna direita exibe 4 KPI cards no topo, barra de filtros, tabela estilizada (com badges de status) e footer Dicas/Status/Legenda.
4. Bipagem, travas, undo, câmera/IA, exportação e alocação continuam funcionando idênticos ao comportamento atual em cada modo.
5. Responsivo em mobile/tablet/desktop mantendo o toggle flutuante atual.
