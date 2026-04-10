## Plano: Estoque 2D + Dashboard estoque + Sidebar auto-close + Tema escuro + Motor/Controle melhorias

Este é um plano extenso dividido em 7 blocos. A implementação será feita em etapas.

---

### 1. Banco de dados — Tabela de estoque

**Migração SQL:**

- Criar tabela `estoque_posicoes` com colunas: `id`, `estrutura` (TEC00-TEC05), `coluna` (A-F), `nivel` (1-9), `posicao` (1-30), `status` (ocupado/reservado/bloqueado/saida/livre), `registro_id` (FK → registros), `item`, `proc`, `m2`, `largura`, `m_linear`, `lote`, `endereco`, `lote_sistema`, `conferente_saida`, `data_registro`, `data_saida`, `created_at`
- RLS público (sem auth, como tabelas existentes)
- Índices em `estrutura`, `status`

### 2. Estoque 2D — Nova página (`src/components/EstoquePage.tsx`)

**Estruturas TEC com config exata:**

```text
TEC00: Colunas A,B — Níveis 1-5 (total: 2×5×30 = 300)
TEC01: Colunas A,B,C,D,E,F — Níveis 1-5 (total: 6×5×30 = 900)
TEC02: Colunas A,B — Níveis 1-4 (total: 2×4×30 = 240)
TEC03: Colunas A,B — Níveis 1-5 (total: 2×5×30 = 300)
TEC04: Colunas A,B,C — Níveis 1-5 (total: 3×5×30 = 450)
TEC05: Colunas A,B,C — Níveis 1-5 (total: 3×5×30 = 450)
```

> Nota: TEC00 e TEC03 mencionam "9 níveis do 1 ao 5" — como isso é contraditório, será usado 5 níveis (1-5) como indicado no range. Se forem 9 níveis, confirme.  
> São 9 Níveis

**Visualização 2D (inspirada na imagem de referência):**

- Cards de resumo no topo: Total de espaços, Ocupado (%), Reservado (%), Bloqueado (%), Saída, Livre (%)
- Seletor de estrutura (TEC00-TEC05) como tabs
- Grid visual: cada coluna × nível = "quadrado" com 30 posições (círculos arredondados)
- Cores: Verde `#10b981` = Ocupado, Vermelho `#ef4444` = Bloqueado, Laranja `#f59e0b` = Reservado, Escuro `#1e2a3f` = Livre
- Label por quadrado: ex. "A·N1 — 15/30"
- Hover sobre posição: preview do tecido (Item, PROC, M Linear)
- Clique: card detalhado (Item/Ref, PROC, M², Largura, M Linear, Lote/Batch, Endereço, Lote Final)
- Botão para destacar status: Bloqueado, Saída, Reservado
- Botão para destacar todos os locais livres
- Lista de rolos registrados com data de registro
- Data de saída + conferente que deu saída + hora
- Busca avançada por item, proc, m², lote

**Importação/Exportação:**

- Botões para importar: TXT, CSV, PDF, XLS, XLSX, ODS
- Reconhecer endereçamento no formato `TEC01.B.N02` e alocar automaticamente
- Exportar nos mesmos formatos
- Após download do arquivo, endereçar tecidos bipados automaticamente

**Restrição:** Não aplicável a PVT, Celular/Plissada, Madeira, Motor/Controle

### 3. Dashboard — Gráficos de estoque

`**src/components/DashboardPage.tsx` — Adicionar:**

- Novos cards com gráficos de estoque por estrutura (BarChart empilhado: ocupado/reservado/bloqueado/livre)
- Gráfico resumo: Total ocupado, bloqueado, reservado, saída, livre (PieChart)
- Conferentes: trocar contagem de "itens bipados" para "NF e PROC distintos"
- Melhorar contraste das cores dos gráficos (cores mais vibrantes/saturadas)
- Gráficos ocupando melhor o espaço da tela (grid 2 colunas, alturas maiores)

### 4. Sidebar — Auto-close + Config no rodapé

`**src/components/AppSidebar.tsx`:**

- Ao clicar em item do menu, fechar sidebar automaticamente (`toggleSidebar()` após `onTabChange`)
- Adicionar aba "Estoque" entre Motor/Controle e Tabela, com ícone `Warehouse`
- Mover botão Config para `SidebarFooter`

`**src/pages/Index.tsx`:**

- Adicionar `activeTab === 'estoque'` → `<EstoquePage />`
- Remover `onOpenConfig` do TopBar, agora gerido pela sidebar

### 5. Tema escuro

`**src/index.css`:**

- Adicionar media query ou classe `.dark` com variáveis:
  - `--background: 220 30% 6%` (baseado em `#0e1420`)
  - `--foreground: 210 20% 90%`
  - `--card: 220 25% 10%`
  - `--border: 220 20% 18%`
  - `--muted: 220 20% 14%`
  - Manter primary teal, ajustar contraste para fontes e cards
- Botão de toggle de tema na sidebar (footer, ao lado do Config)
- Armazenar preferência em `localStorage`

### 6. Motor/Controle — Melhorias

`**src/components/MotorControlePage.tsx`:**

- **Séries idênticas com letra diferente:** Mudar lógica de `cleanMotorSerie` — se a série bruta após remover o modelo termina com uma letra, manter essa letra (ex: `NT725245000197` e `NT725245000197B` — manter a letra final como diferenciador). Verificar duplicata pela série completa incluindo letra.
- **NF não obrigatória:** Remover validação `if (!nf.trim())` — NF passa a ser opcional para motores e controles
- **Controle formato final:** `SI 5 PU NFe 146842 454327D1*1` — usar `*` antes da sequência em vez de `Sequência`

`**src/components/HistoryPanel.tsx`:**

- Reconhecer `modoOrigem === 'motor'` e `'controle'` nos badges e exibir badge "Motor" ou "Controle"
- Nome da pasta = NF (em vez de PROC)
- `getConferenceFolderName`: para motor/controle, usar `NF {nf}`

`**src/components/TopBar.tsx` (exportação):**

- Nome do arquivo XLSX para motor/controle: `Motores NF {nf}.xlsx` (com espaço, sem underline)
- Tabela XLSX específica: Coluna 1 = "CX01 1246344" (caixa + modelo), abaixo as séries

`**src/lib/registroColumns.ts`:**

- Layout motor atualizado para incluir caixa+modelo na mesma coluna

### 7. Arquivos afetados


| Arquivo                                | Ação                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| `src/components/EstoquePage.tsx`       | **Novo** — Página completa Estoque 2D                        |
| `src/components/DashboardPage.tsx`     | Editar — Gráficos estoque, conferente por NF/PROC, contraste |
| `src/components/AppSidebar.tsx`        | Editar — Auto-close, aba Estoque, Config no footer           |
| `src/components/MotorControlePage.tsx` | Editar — Série com letra, NF opcional, formato controle      |
| `src/components/HistoryPanel.tsx`      | Editar — Badges motor/controle, pasta=NF                     |
| `src/components/TopBar.tsx`            | Editar — Nome XLSX motores, remover config                   |
| `src/pages/Index.tsx`                  | Editar — Aba estoque, tema toggle                            |
| `src/store/useAppStore.ts`             | Editar — Funções estoque (CRUD posições)                     |
| `src/lib/registroColumns.ts`           | Editar — Layout motor/controle ajustado                      |
| `src/index.css`                        | Editar — Tema escuro                                         |
| **Migração SQL**                       | **Nova** — Tabela `estoque_posicoes`                         |


### Observação sobre TEC00 e TEC03

O pedido menciona "9 níveis começando do 1 indo até o 5" para TEC00 e TEC03. Como 1-5 são apenas 5 níveis, vou implementar **5 níveis (1-5)**. Se a intenção era 9 níveis (1-9), confirme e ajusto.