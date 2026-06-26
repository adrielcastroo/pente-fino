# Design System — Módulo Expedição (paridade com Estoque)

## Objetivo
Padronizar visual, layout e componentes de todas as páginas em `src/pages/expedicao/*` e `src/components/expedicao/*` para refletir o padrão já estabelecido em `EstoquePage` e demais páginas do módulo Estoque, usando exclusivamente tokens semânticos do design system.

## Auditoria rápida (pontos divergentes encontrados)
- `HistoricoPage.tsx` e `PainelPage.tsx` usam `bg-slate-100/700/300/800` hard-coded nos badges de status — violação da regra de tokens semânticos.
- Páginas de Expedição não compartilham um cabeçalho padrão (título 2xl/3xl semibold + subtítulo `text-xs text-muted-foreground` + botão de voltar `w-9 h-9`) como o Estoque.
- Cards de KPI/stats não seguem o estilo do Estoque (`rounded-[1.5rem] sm:rounded-[2rem] border-2`, `backdrop-blur-xl`, tipografia `tabular-nums tracking-tighter`, label `text-[9px] uppercase tracking-[0.2em]`).
- Barra de abas (quando existe) não usa o padrão `bg-card/40 backdrop-blur rounded-lg p-1 border border-border/30`.
- Espaçamento de página inconsistente (falta `space-y-4 sm:space-y-8 pb-20 p-2 sm:p-0`).
- `ExpedicaoLayout` já está alinhado ao mobile/desktop do Estoque (turno anterior); manter.

## Escopo da entrega (v3.15.0 — minor, melhoria visual sem quebra)

### 1. Tokens & utilitários compartilhados
Criar `src/components/expedicao/ui/`:
- `PageShell.tsx` — wrapper padrão (`max-w-full mx-auto space-y-4 sm:space-y-8 pb-20 p-2 sm:p-0 overflow-x-hidden`).
- `PageHeader.tsx` — título + subtítulo + botão voltar + slot de ações, idêntico ao Estoque.
- `StatCard.tsx` — card de KPI com variantes de cor por tokens semânticos (`primary`, `success`, `warning`, `destructive`, `muted`), respeitando `tablet-portrait:` breakpoints.
- `TabsBar.tsx` — barra de abas no estilo `bg-card/40 backdrop-blur`.
- `StatusBadge.tsx` — mapa centralizado de status (`aguardando`, `em_separacao`, `separado`, `faturado`, `cancelado`) usando tokens (`bg-muted text-muted-foreground`, `bg-primary/10 text-primary`, `bg-success/10 text-success`, `bg-warning/10 text-warning`, `bg-destructive/10 text-destructive`).

### 2. Refatorar páginas para consumir os novos primitivos
- `PainelPage.tsx`, `HistoricoPage.tsx`, `PickingsPage.tsx`, `ConferenciaPage.tsx`, `FaturamentoPage.tsx`, `RomaneioPage.tsx`, `CarrinhosPage.tsx`, `ConfiguracoesPage.tsx`, `RelatoriosPage.tsx`, `DashboardLogisticoPage.tsx`, `DashboardOperacionalPage.tsx`:
  - Trocar wrapper raiz por `<PageShell>`.
  - Trocar cabeçalho manual por `<PageHeader title subtitle backTo actions>`.
  - Substituir badges de status por `<StatusBadge status=… />`.
  - Substituir cards de KPI por `<StatCard variant value label icon trend>`.
  - Remover toda classe `bg-slate-*`, `text-slate-*`, `bg-white`, `text-black` — usar `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`.

### 3. Diálogos
- `NovoPickingDialog.tsx` e `CancelPickingDialog.tsx`: alinhar ao `DialogContent` global já padronizado (sem overrides locais), botões em `variant="default"/"outline"/"destructive"`.

### 4. Acessibilidade
- Todo botão icon-only com `aria-label`.
- `StatusBadge` com `role="status"` quando indicar estado dinâmico (SLA).
- Contraste verificado em dark mode para cada variante.

### 5. Documentação
- `src/components/expedicao/ui/README.md` listando primitivos, props e exemplos de uso.

### 6. Versionamento
- `npm run bump:minor` → v3.15.0.
- Entrada no changelog: "Design system do módulo Expedição alinhado ao Estoque".

## Estrutura de arquivos resultante
```text
src/components/expedicao/
  ui/
    PageShell.tsx
    PageHeader.tsx
    StatCard.tsx
    TabsBar.tsx
    StatusBadge.tsx
    README.md
  ExpedicaoLayout.tsx        (mantido)
  NovoPickingDialog.tsx      (refatorado)
  CancelPickingDialog.tsx    (refatorado)
src/pages/expedicao/*.tsx    (todas refatoradas para usar ui/)
src/lib/changelog.ts         (v3.15.0)
```

## Não-escopo
- Sem alterações em regras de negócio, hooks (`useExpedicaoData`), SLA, RLS, ou rotas.
- Sem novas features funcionais.
- Sem alterações em `MainLayout`, `AppSidebar` ou em páginas fora de `/expedicao/*`.

## Critérios de aceite
- `rg "bg-(slate|gray|white|blue|green|red)-[0-9]" src/pages/expedicao src/components/expedicao` retorna vazio.
- Todas as páginas de Expedição apresentam o mesmo header, espaçamento e estilo de KPI que `EstoquePage`.
- Dark mode validado em todas as páginas.
- Build e typecheck passam.
