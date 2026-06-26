# Expedição UI Primitives

Componentes compartilhados que mantêm o módulo **Expedição** visualmente consistente com o módulo **Estoque**.

Todos os componentes usam **exclusivamente tokens semânticos** (`primary`, `success`, `warning`, `destructive`, `muted`, `card`, `border`, `foreground`, `muted-foreground`). Cores fixas (`bg-slate-*`, `bg-blue-*`, etc.) estão **proibidas** dentro do módulo.

## Componentes

### `<PageShell>`
Wrapper raiz de toda página de Expedição. Aplica espaçamento, padding mobile-first e `overflow-x-hidden`.

```tsx
<PageShell>
  <PageHeader title="Painel" subtitle="Pickings em andamento" />
  {/* conteúdo */}
</PageShell>
```

### `<PageHeader>`
Cabeçalho padrão: título grande + subtítulo opcional + botão de voltar opcional + slot de ações.

| Prop | Tipo | Descrição |
| ---- | ---- | --------- |
| `title` | `string` | Título principal (h1). |
| `subtitle` | `string?` | Texto auxiliar abaixo do título. |
| `backTo` | `string?` | Rota para o botão de voltar. Se omitido, o botão não é renderizado. |
| `actions` | `ReactNode?` | Botões/ações alinhados à direita. |

### `<StatCard>`
Card de KPI no padrão visual do Estoque (`rounded-[1.5rem]`, `border-2`, `backdrop-blur`).

Variantes de cor: `default | primary | success | warning | destructive | muted`.

```tsx
<StatCard label="Atrasados" value={kpis.atrasados} variant="destructive" />
```

### `<StatusBadge>`
Mapeia `PickingStatus` para um badge colorido consistente em light/dark mode.

```tsx
<StatusBadge status={picking.status} />
```

### `<TabsBar>`
Barra de abas genérica (`bg-card/40 backdrop-blur`), tipada por `value`.

```tsx
<TabsBar
  value={tab}
  onValueChange={setTab}
  items={[
    { value: 'todos', label: 'Todos' },
    { value: 'faturado', label: 'Faturados', icon: CheckCircle2 },
  ]}
/>
```

## Acessibilidade

- `PageHeader` aplica `aria-label="Voltar"` no botão icon-only.
- `StatusBadge` emite `role="status"`.
- `TabsBar` segue `role="tablist"`/`role="tab"` com `aria-selected`.

## Convenção

Sempre que uma página de Expedição precisar de cabeçalho, cards de KPI, barra de abas ou badges de status, use estes primitivos. **Não duplique estilos inline.**
