# Pente Fino - Sistema Completo de Gestão de Inventário Têxtil

## Visão Geral

**Pente Fino** é uma aplicação web de gerenciamento de inventário têxtil desenvolvida com **React 18**, **TypeScript** e **Supabase** (PostgreSQL). É projetada para operar em ambientes de chão de fábrica, com suporte a PWA, impressão de etiquetas via browser/n8n, mode offline para conferências, e painéis operacionais em tempo real.

---

## 📁 Estrutura de Arquivos

### Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `/package.json` | Dependências, scripts, configuração do projeto |
| `/vite.config.ts` | Build optimization, manual chunks, PWA |
| `/tsconfig.json` | TypeScript configuration |
| `/tsconfig.app.json` | TS config para build |
| `/tsconfig.node.json` | TS config para Vite |

### Source Code

```
src/
├── App.tsx                          # Rotas principais e layout
├── main.tsx                         # Entry point
├── index.css                        # Estilos globais
├── components/
│   ├── auth/                        # HOCs de autenticação
│   │   ├── RequireRole.tsx
│   │   ├── RequireModule.tsx
│   │   ├── RoleHomeRedirect.tsx
│   │   └── PageAccessOutlet.tsx
│   ├── admin/                       # Layout admin, n8n monitor
│   ├── agent/                       # Chat widget AI
│   ├── compras/                     # Layout compras
│   ├── expedicao/                   # Layout expedição
│   ├── estoque/                     # Layout estoque
│   ├── layout/                      # Layouts principais
│   └── ui/                          # Componentes Radix/shadcn
├── hooks/
│   ├── use-auth.tsx                 # Autenticação (Supabase)
│   ├── useAIVision.ts               # Visão computacional
│   ├── useDashboard.ts              # Dashboard queries
│   ├── useEtiquetas.ts              # Gerenciamento etiquetas
│   ├── use-presence.ts              # Presença em tempo real
│   └── ...                          # 40+ hooks
├── lib/                             # Utilidades
│   ├── app-utils.ts
│   ├── offline-queue.ts             # Fila offline IndexedDB
│   ├── registry.ts                  # Registro de módulos
│   └── validations.ts
├── pages/
│   ├── LoginPage.tsx                # Login (LCP)
│   ├── DashboardPage.tsx            # Dashboard operacional
│   ├── SelecionarModuloPage.tsx     # Seleção de módulo
│   ├── ConferenciaHubPage.tsx       # Hub de conferência
│   ├── MinhaAtividadePage.tsx       # Atividade do usuário
│   ├── N8nMonitorPage.tsx           # Monitor n8n
│   └── ...                          # 40+ páginas
├── services/
│   ├── api.ts                       # API service layer
│   ├── authGuard.ts                 # Guards autenticação
│   ├── exportService.ts             # Exportação XLSX/PDF
│   ├── printService.ts              # Serviço de impressão (2000+ linhas)
│   ├── syncService.ts               # Sincronização n8n/Auge
│   └── webhookService.ts            # Webhooks n8n
├── store/
│   └── useAppStore.ts               # Zustand + persist (37KB)
└── types/
    └── index.ts                     # Tipos TypeScript
```

---

## 🏗️ Stack Tecnológica

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18 | UI framework |
| TypeScript | 5.x | Tipagem estática |
| Vite | 6.x | Build tool |
| TanStack Query | 5.x | Server state |
| Zustand | 4.x | Client state + persist |
| React Router | 6.x | Routing |
| Tailwind CSS | 3.x | Utility-first CSS |
| Radix UI | 1.x | Componentes base |
| shadcn/ui | latest | Componentes UI |
| Framer Motion | 11.x | Animações |
| Recharts | 2.x | Gráficos dashboard |
| Lucide React | latest | Ícones |
| Sonner | latest | Toast notifications |
| react-hook-form | 7.x | Formulários |
| Zod | 3.x | Validação schema |
| html-to-image | latest | Renderização etiquetas |
| xlsx | latest | Exportação Excel |
| date-fns | 3.x | Manipulação datas |

### Backend & Infra

| Tecnologia | Uso |
|------------|-----|
| Supabase | PostgreSQL + Auth + Storage + Functions + RLS |
| PostgreSQL | Banco de dados relacional |
| n8n | Workflows automation (webhooks) |
| Railway | Hosting backend |

### DevOps & Ferramentas

| Ferramenta | Uso |
|------------|-----|
| VitePWA | Service worker PWA |
| lovable-tagger | Tagging components |
| Playwright | E2E tests |
| Vitest | Unit tests |
| ESLint | Linting |

---

## 🗺️ Rotas e Páginas

### Estrutura de Rotas

```
/
├── /login                        (LoginPage - LCP)
├── /forgot-password
├── /verify-otp
└── /reset-password

/selecionar-modulo              (SelecionarModuloPage)

=== MÓDULO ESTOQUE (/estoque/*) ===
/                                       → Redirects para /estoque/operacao
/estoque/
├── /operacao                       (OperacaoHomePage)
├── /dashboard                      (DashboardPage - supervisor+)
├── /conferencia                    (ConferenciaHubPage)
├── /tecido                         (TecidoPage)
├── /madeira                        (MadeiraPage)
├── /motor                           (MotorControlePage)
├── /componentes                    (ComponentesPage)
├── /mapa                           (EstoquePage)
├── /saida                          (SaidaPage)
├── /reservas                       (ReservasPage)
├── /historico                       (HistoricoPage)
├── /minha-atividade                (MinhaAtividadePage)
├── /configuracoes                  (SettingsPage)
├── /cadastros                      (CadastrosPage)
├── /clientes                        (ClientesPage)
├── /auditoria                       (AuditoriaPage - admin)
├── /auditoria-legado                (AuditoriaPage - require:view:auditoria)
├── /entradas                        (EntradasPage)
├── /acabamentos                    (AcabamentosPage - supervisor+)
├── /transferencias                  (TransferenciasPage)
├── /equipes                         (EquipesPage - supervisor+)
└── /etiquetas                       (Redirect → /expedicao/etiquetas)

=== MÓDULO EXPEDIÇÃO (/expedicao/*) ===
/expedicao/
├── /operacao                       (ExpedicaoOperacaoHomePage)
├── /recebimento                    (ExpedicaoRecebimentoPage)
├── /painel                         (ExpedicaoPainelPage)
├── /conferencia                    (ExpedicaoConferenciaPage)
├── /romaneio                       (ExpedicaoRomaneioPage)
├── /carrinhos                       (ExpedicaoCarrinhosPage)
├── /dashboard                       (ExpedicaoDashboardOperacionalPage)
├── /logistica                       (ExpedicaoDashboardLogisticoPage)
├── /historico                       (ExpedicaoHistoricoPage)
├── /relatorios                      (ExpedicaoRelatoriosPage)
├── /etiquetas                       (ExpedicaoEtiquetasPage)
├── /etiquetas/:id/imprimir          (ImprimirEtiquetaPage)
├── /etiquetas/:id/editar           (Redirect)
├── /etiquetas/historico             (HistoricoEtiquetasPage)
├── /double-check                    (ExpedicaoDoubleCheckPage)
├── /equipes                         (EquipesPage)
└── /configuracoes                   (SettingsPage)

=== MÓDULO COMPRAS (/compras/*) ===
/compras/
├── /acompanhamentos                 (ComprasAcompanhamentosHubPage)
├── /acompanhamentos/:modulo        (ComprasAcompanhamentosPage)
├── /acompanhamentos/starcolor      (ComprasAcompanhamentosPage - legado)
├── /analise-compra                  (ComprasAnaliseCompraPage)
├── /analise-compra/historico        (Redirect)
├── /esboco                         (ComprasEsbocoNfPage)
└── /configuracoes                   (SettingsPage)

=== ADMIN (/admin/*) ===
/admin
├── /n8n                            (N8nMonitorPage)
├── /har-transferencias             (HarTransferenciasPage)
├── /depositos                      (DepositosAdminPage - admin)
├── /automacoes                     (AutomacoesPage - admin)
└── /auge-sync-status               (AugeSyncStatusPage - admin)
```

### Páginas Especiais

| Página | Descrição | Features |
|--------|-----------|----------|
| `/login` | Login | LCP, form validation, MFA OTP |
| `/conferencia` | Conferência de estoque | Mode offline, scanner, grid, resumo |
| `/dashboard` | Dashboard operacional | Gráficos, status, metas |
| `/compras/acompanhamentos` | Acompanhamento de compras | Starcolor integration |
| `/compras/analise-compra` | Análise de compra | Curva ABC, ROI, histórico |
| `/expedicao/operacao` | Home expedição | Quick actions, status por módulo |
| `/expedicao/painel` | Painel operacional | Cards, counters, grid |
| `/expedicao/recebimento` | Recebimento | Entrada de notas fiscais |
| `/expedicao/conferencia` | Conferência expedição | Recebimento com conferência |
| `/expedicao/etiquetas` | Etiquetas | Histórico, impressão, config |
| `/auditoria` | Auditoria | Logs, rastreabilidade |
| `/admin/n8n` | Monitor n8n | Webhooks, status, logs |

---

## 🗃️ Banco de Dados - Supabase PostgreSQL

### Tables Principais (~50+)

#### Tabelas de Usuários e Config

| Tabela | Chave | Descrição |
|--------|-------|-----------|
| `users` | `id` | Usuários Supabase Auth |
| `profiles` | `id` | Dados adicionais do perfil |
| `app_settings` | `id` | Configurações do app |
| `label_settings` | `id` | Configurações de etiquetas |
| `webhook_logs` | `id` | Logs de webhooks n8n |
| `release_registry` | `id` | Registro de releases |
| `feature_flags` | `id` | Feature flags |

#### Tabelas de Cadastro

| Tabela | Chave | Descrição |
|--------|-------|-----------|
| `itens` | `id` | Itens/cadastro de produtos |
| `fornecedores` | `id` | Fornecedores |
| `clientes` | `id` | Clientes |
| `depositos` | `id` | Depósitos/armazéns |
| `setores` | `id` | Setores |
| `equipes` | `id` | Equipes |
| `usuarios` | `id` | Usuários do sistema |

#### Tabelas de Inventário

| Tabela | Chave | Descrição |
|--------|-------|-----------|
| `movimentacoes` | `id` | Movimentações de estoque |
| `saldos` | `id` | Saldos por item/depósito |
| `entradas` | `id` | Entradas de notas fiscais |
| `saidas` | `id` | Saídas/pedidos |
| `reservas` | `id` | Reservas de estoque |
| `transferencias` | `id` | Transferências entre depósitos |
| `conferencias` | `id` | Conferências de estoque |
| `conferencia_itens` | `id` | Itens conferidos |

#### Tabelas de Compras

| Tabela | Chave | Descrição |
|--------|-------|-----------|
| `compras` | `id` | Pedidos de compra |
| `compras_itens` | `id` | Itens do pedido |
| `nf_entradas` | `id` | Notas fiscais de entrada |
| `nf_entradas_itens` | `id` | Itens da NF |

#### Tabelas de Expedição

| Tabela | Chave | Descrição |
|--------|-------|-----------|
| `expedicoes` | `id` | Expedições |
| `expedicoes_itens` | `id` | Itens expedidos |
| `notas_fiscais` | `id` | Notas fiscais de saída |
| `carrinhos` | `id` | Carrinhos de expedição |
| `romaneios` | `id` | Romaneios |
| `recebimentos` | `id` | Recebimentos |

#### Tabelas de Produção

| Tabela | Chave | Descrição |
|--------|-------|-----------|
| `cortinas` | `id` | Produção de cortinas |
| `cortinas_itens` | `id` | Itens de cortina |
| `pvt` | `id` | Pedidos de venda de tecido |
| `coulisses` | `id` | Couisses |
| `madeiras` | `id` | Madeiras |

### Tipos e Enums Customizados

```sql
-- Tipos de item
CREATE TYPE item_type AS ENUM ('TECIDO', 'MADEIRA', 'MOTOR', 'COMPONENTE', 'DIVERSOS', 'CORTINA', 'COULISSE', 'EQUIPAMENTO', 'ACABAMENTO', 'PET', 'PET_FINAL');

-- Estados de movimento
CREATE TYPE movement_status AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'CONFERENCIA', 'CANCELADO');

-- Estados de conferência
CREATE TYPE conference_status AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- Estados de expedição
CREATE TYPE expedition_status AS ENUM ('PENDENTE', 'PREPARANDO', 'PRONTO', 'EXPEDIDO', 'CANCELADO');
```

### Views

| View | Descrição |
|------|-----------|
| `vw_movimentacoes_resumido` | Movimentações resumidas |
| `vw_saldos_atual` | Saldos atuais por item/depósito |
| `vw_itens_com_saldo` | Itens com saldo atual |
| `vw_expedicoes_pendentes` | Expedições pendentes |
| `vw_compras_pendentes` | Compras pendentes |
| `vw_conferencias_pendentes` | Conferências pendentes |

### Functions

| Function | Descrição |
|----------|-----------|
| `fn_conferencia_arquivar` | Arquiva conferência com itens |
| `fn_movimentacao_criar` | Cria movimento com cálculo de saldo |
| `fn_expedicao_criar` | Cria expedição com validações |
| `fn_reserva_criar` | Cria reserva com bloqueio de saldo |
| `fn_item_resolver` | Resolve item para código interno |
| `fn_etiqueta_imprimir_webhook` | Dispara webhook de impressão |
| `fn_auditoria_log` | Log de auditoria |

### RLS Policies

- **Profiles**: `select`, `insert`, `update` por `user_id`
- **Label Settings**: `select`, `upsert` por `user_id`
- **Webhook Logs**: `insert` apenas
- **Conferencias**: `select`, `insert` por `empresa_id`
- **Movimentacoes**: `select`, `insert` por `empresa_id`
- **Saldos**: `select` (via view) por `empresa_id`

---

## 📋 Regras de Negócio

### Modos de Conferência

| Modo | Descrição | Campos ativos |
|------|-----------|---------------|
| `manual` | Conferência manual completa | item, NF, lote, metragem, largura, endereço |
| `coulisse` | Mode coulisso | item, NF, lote, metragem, largura, endereço |
| `diversos` | Diversos | item, NF, lote, metragem, tipo, largura, endereço |
| `etiqueta_pronta` | Etiqueta pronta | item, lote_final, metragem |
| `madeira` | Mode madeira | item, NF, lote, endereço |
| `motor` | Mode motor/controle | item, modelo, NF, série, CX, endereço |

### Regras de Bloqueio de Campos (Locks)

O sistema implementa **row-level locking** para prevenir conflitos:

```
Processo:    lockProcesso/lockedProcesso
NF:          lockNf/lockedNf
Endereço:    lockEndereco/lockedEndereco
Item (PVT):  lockItem/lockedItem
Lote (PVT):  lockLote/lockedLote
Metragem:    lockMetragem/lockedMetragem
Coulisse:    lockCoulisseMetragem
Madeira:     lockMadeira{Processo,Item,Lote,Endereco}
Motor:       lockMotor{Modelo,NF}
Cortina:    lockCortina{Largura,Metragem}
```

### Cálculos Automáticos

- **M²**: `largura × metragem linear`
- **Saldo disponível**: `soma(entradas) - soma(saidas) - soma(reservas) - soma(em_expedicao)`
- **Lote do sistema**: `LOTE-YYYYMMDD-HHMMSS`
- **Status de conferência**: fecha automaticamente após 1h de inatividade

### Validações

- NF de entrada deve ser única no período
- Item + lote + endereço deve ter saldo positivo para saída
- Quantidade de reserva < saldo disponível
- Conferência finalizada não pode ser alterada

---

## 🔧 Componentes e Hooks

### Hooks Principais

| Hook | Linhas | Função |
|------|--------|--------|
| `useAppStore.ts` | 37KB | Zustand global + persist |
| `use-presence.ts` | 10KB | Presença em tempo real (Supabase Realtime) |
| `useAIVision.ts` | 2.5KB | Visão computacional para conferência |
| `useEtiquetas.ts` | 11KB | Gestão de etiquetas offline |
| `useDashboard.ts` | 6KB | Queries do dashboard |
| `use-auth.tsx` | 5.5KB | Autenticação com persistência guest |
| `use-print-queue.ts` | 2.5KB | Fila de impressão |
| `use-reservas.ts` | 2.3KB | Gestão de reservas |

### Componentes UI

```
components/ui/
├── sonner.tsx                    # Toast notifications
├── tooltip.tsx
├── sheet.tsx                     # Side sheets
├── dropdown-menu.tsx
├── dialog.tsx
├── command.tsx                   # Command palette
├── popover.tsx
├── skeleton.tsx                  # Loading skeletons
└── ...                           # 30+ componentes
```

### Zustand Store (`useAppStore.ts` - 37KB)

**State persistido em IndexedDB:**

| State | Tipo | Descrição |
|-------|------|-----------|
| `registros` | `Registro[]` | Registros ativos da conferência |
| `reservas` | `Reserva[]` | Reservas ativas |
| `undoStack` | `UndoEntry[]` | Stack de undo |
| `lastDeletedAt` | `number?` | Timestamp do último delete |
| `formData` | `FormData` | Dados do formulário de entrada |
| `labelSettings` | `LabelSettings` | Configurações de etiqueta |
| `currentMode` | `AppMode` | Modo de conferência atual |

**Métodos principais:**
- `addRegistro`, `deleteRegistro`, `undo` - Gestão de conferência
- `archiveAndClear` - Arquiva conferência com retry offline
- `loadHistory`, `deleteConference` - Histórico
- `addReserva`, `deleteReserva` - Reservas
- `setLabelSettings` - Configurações de etiqueta

---

## 🖨️ Sistema de Impressão

### Arquitetura de Impressão

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser Print  │     │   n8n Webhook    │     │   ZPL Direct     │
│  (PNG via iframe)│     │  (impressora ZPL)│     │  (Zebra EPL)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────┬───────────┘───────────┬───────────┘
                     ▼                       ▼
            ┌─────────────────┐     ┌─────────────────┐
            │  html-to-image  │     │  Template ZPL   │
            │  → PNG/Canvas    │     │  (via n8n)      │
            └────────┬────────┘     └─────────────────┘
                     ▼
            ┌─────────────────┐
            │  Print Dialog   │
            └─────────────────┘
```

### Modos de Impressão

| Modo | Descrição | Configuração |
|------|-----------|---------------|
| `browser` | PDF via iframe oculto | Padrão para etiquetas HTML |
| `webhook` | Webhook n8n para impressora ZPL | Requer `webhookUrl` |
| `zpl-direct` | Template ZPL direto | Requer `zplTemplate` |

### Tipos de Etiquetas

| Tipo | Dimensões (mm) | Campos | Modelo |
|------|----------------|--------|--------|
| Tecido | 100×50 | sku, desc, NF, qtd, RNP, data, QR | Preview HTML |
| Motor/Controle | 60×48 | sku, desc, CX, NF, NT, RNP, QR | Preview HTML |
| Componente | 60×48 | sku, desc, CX, RNP, QR | Preview HTML (usa layout motor) |

### Configurações de Offset de Impressão

```
Tecido:  printOffsetXMm: -5, printOffsetYMm: 0
Motor:   motorPrintOffsetXMm: -5, motorPrintOffsetYMm: 0
Expedição: expedicaoPrintOffsetXMm: 0, expedicaoPrintOffsetYMm: 0
```

Offset negativo move a etiqueta para cima/esquerda para ajustar alinhamento na impressora.

---

## 📡 Integrações

### n8n Workflows

| Webhook | Descrição | Trigger |
|---------|-----------|---------|
| `imprimir-etiqueta` | Imprime etiqueta via impressora ZPL | Any |
| `arquivar-conferencia` | Arquiva conferência no backend | Any |
| `atualizar-saldo` | Atualiza saldo via movimento | Any |
| `sincronizar-auge` | Sincroniza dados com Auge | Any |

### Supabase Realtime

```
Table:  Conferencia + ConferenciaItens
Channel: wss://<project>.supabase.co/realtime/v1
Events:  INSERT, UPDATE, DELETE (row level)
```

Usado para:
- Dashboard operacional em tempo real
- Presença de usuários (use-presence.ts)
- Notificações de status

---

## 🔐 Autenticação e Segurança

### Autenticação

| Método | Descrição |
|--------|-----------|
| Supabase Auth | Email/password + MFA OTP |
| Guest Mode | Armazenamento local (IndexedDB) |
| RBAC | Roles: `admin`, `supervisor`, `operador`, `viewer` |

### RBAC - Permissões

| Permissão | Roles |
|-----------|-------|
| `view:auditoria` | admin, supervisor |
| `delete:conference` | admin |
| `create:movement` | admin, supervisor, operador |
| `update:movement` | admin, supervisor |
| `delete:movement` | admin |
| `create:expedition` | admin, supervisor |
| `update:expedition` | admin, supervisor |

### Feature Flags

```typescript
interface FeatureFlags {
  dashboard_operacional: boolean;
  painel_carrinhos: boolean;
  view_equipes: boolean;
  view_acabamentos: boolean;
  view_auditoria_legado: boolean;
  view_n8n_monitor: boolean;
  view_har_transferencias: boolean;
  view_depositos_admin: boolean;
  view_automacoes: boolean;
  view_auge_sync: boolean;
  view_conferencia_double_check: boolean;
  enable_motor_labels: boolean;
  enable_cortina_labels: boolean;
}
```

---

## 📱 Responsividade

### Layouts

| Rota | Layout | Breakpoints |
|------|--------|-------------|
| Login | Centered | - |
| MainLayout | Sidebar + Content | Desktop: >1024px |
| Module Layouts | Sidebar + Tabs + Content | Desktop: >1024px |
| Mobile | Bottom tab bar | Mobile: <1024px |

### Componentes Mobile

```typescript
// hooks/use-mobile.tsx
isMobile: boolean  // < 1024px
isTablet: boolean  // 1024px - 1280px
orientation: 'portrait' | 'landscape'
```

### Modo Guest

```typescript
// hooks/use-auth.tsx
isGuest: boolean  // true se logado como guest (sem auth)
user: User | null  // usuário supabase ou null
```

---

## ⚡ Performance

### Otimizações de Build

```typescript
// vite.config.ts - Manual Chunks
utils-vendor:     clsx, tailwind-merge, class-variance-authority
charts-vendor:    recharts, d3, victory-vloxon
motion-vendor:    framer-motion
react-vendor:     react-dom, react, @radix-ui, cmdk, vaul, sonner
supabase-vendor:  @supabase/*
xlsx-vendor:      xlsx, exceljs
date-vendor:      date-fns
query-vendor:     @tanstack/react-query
icons-vendor:     lucide-react
```

### lazy Loading

```typescript
// App.tsx
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TecidoPage = lazy(() => import('@/pages/TecidoPage'));
// ... todas as páginas são lazy loaded
```

### Performance Budget

| Métrica | Target |
|---------|--------|
| LCP (Login) | < 2s |
| FCP | < 1.8s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |

---

## 🧪 Testes

### Testes Unitários (Vitest)

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `src/hooks/use-mobile.test.tsx` | 2KB | Testes mobile hook |
| `src/hooks/useAppStore.test.ts` | 2KB | Testes Zustand store |
| `src/hooks/useAppStore.persist.test.ts` | 2KB | Testes persistência |
| `src/hooks/useTagCustomConfigurationSearch.test.ts` | 2KB | Testes busca tags |

### Testes E2E (Playwright)

```
playwright.config.ts
├── tests/auth.spec.ts
├── tests/dashboard.spec.ts
├── tests/conferencia.spec.ts
├── tests/etiquetas.spec.ts
└── ...
```

### Service Worker (VitePWA)

```javascript
// runtimeCaching
{
  name: 'html-nav',
  handler: 'NetworkFirst',
  options: { cacheName: 'html-nav', expiration: { maxEntries: 32 } }
},
{
  name: 'assets',
  handler: 'CacheFirst',
  options: { cacheName: 'assets', expiration: { maxAgeSeconds: 30d } }
}
```

---

## 🔧 Configurações

### Environment Variables

```typescript
// Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

// n8n Webhooks
VITE_N8N_WEBHOOK_URL=https://primary-production-162eb.up.railway.app/webhook

// Feature Flags
VITE_ENABLE_MOTOR_LABELS=true
VITE_ENABLE_CORTINA_LABELS=true
```

### Fontes Self-hosted

```css
@fontsource-variable/geist      /* Geist Variable - display */
@fontsource-variable/geist-mono /* Geist Mono - monospace */
```

---

## 📊 Dashboard Operacional

### Cards do Dashboard

| Card | Fonte de Dados | Descrição |
|------|----------------|-----------|
| Total Itens | `vw_itens_com_saldo` | Total de itens com saldo |
| Total conferido | `conferencias` (status=FINALIZADA) | Itens conferidos hoje |
| Total conferir | `conferencias` (status=ABERTA) | Itens pendentes de conferência |
| Conferências do dia | `conferencias` | Total conferências diárias |
| Card select | - | Seleção rápida de modo |

### Gráficos

| Componente | Descrição |
|------------|-----------|
| `GraficoStatusConferencia` | Status por tipo de item |
| `GraficoTempoConferencia` | Tempo médio de conferência |
| `GraficoProdutividade` | Itens/hora |

### Dados em Tempo Real

```typescript
// hooks/use-presence.ts
const presenceChannel = supabase
  .channel(`presence-${channelName}`)
  .on(
    'broadcast',
    { event: '.*' },
    async ({ payload }) => { ... }
  )
  .subscribe(async (status) => { ... });
```

---

## 🛠️ Ferramentas Internas

### Command Palette

```
Cmd+K → CommandPalette
├── Navigation
│   ├── Estoque → /estoque/mapa
│   ├── Conferência → /estoque/conferencia
│   └── ...
├── Actions
│   ├── Nova compra
│   ├── Nova expedição
│   └── ...
└── System
    ├── Reload app
    └── Settings
```

### Update Available Banner

```typescript
// components/admin/UpdateAvailableBanner
Detecta nova versão via service worker
Notifica usuário para reload
```

### Release Registrar

```typescript
// components/admin/ReleaseRegistrar
Registra releases no Supabase
Armazena em localStorage para notificação
```

---

## 📦 Dependências Principais

### Runtime

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@tanstack/react-query": "^5.59.0",
  "zustand": "^5.0.0",
  "react-router-dom": "^7.1.1",
  "tailwindcss": "^3.4.1",
  "@radix-ui/react-*": "latest",
  "framer-motion": "^11.11.0"
}
```

### Build

```json
{
  "vite": "^6.0.0",
  "vite-plugin-pwa": "^0.21.0",
  "@fontsource-variable/geist": "latest"
}
```

### Dev

```json
{
  "@playwright/test": "^1.48.0",
  "vitest": "^2.1.0",
  "@testing-library/react": "latest"
}
```

---

## 🎨 Design System

### Sistema de Cores

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --popover: 0 0% 100%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}
```

### Tipografia

```css
:root {
  --font-geist-sans: 'Geist Variable', system-ui, sans-serif;
  --font-geist-mono: 'Geist Mono', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

### Sombra e Borda

```css
.card {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
.card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

---

## 🚨 Áreas Críticas

### Dados Offline

```typescript
// lib/offline-queue.ts
interface OfflineQueueItem {
  id: string;
  type: 'archive' | 'reserve' | 'movement';
  payload: Record<string, unknown>;
  attempts: number;        // Máximo: 5 tentativas
  createdAt: number;
}
```

### Locking de Processo

```typescript
// hooks/use-auth.tsx
const refreshUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Session expired');
  setUser(user);
};
```

### Tratamento de Erros

```typescript
// services/printService.ts
try {
  await dispatchPrint(labelSettings, { ... });
} catch (error) {
  console.error('Erro ao imprimir etiqueta:', error);
  toast.error('Falha ao processar etiqueta.');
}
```

---

## 📈 Mapa de Impacto

### Módulos e Dependências

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD                                             │
│  ├── useDashboard.ts ← vw_itens_com_saldo              │
│  └── DashboardPage ← uso de mode supervisor+           │
├─────────────────────────────────────────────────────────┤
│  ESTOQUE                                               │
│  ├── TecidoPage ← itens WHERE type='TECIDO'           │
│  ├── MadeiraPage ← itens WHERE type='MADEIRA'         │
│  ├── MotorControlePage ← itens WHERE type='MOTOR'     │
│  └── ComponentesPage ← itens WHERE type='COMPONENTE'  │
├─────────────────────────────────────────────────────────┤
│  COMPRAS                                               │
│  ├── ComprasAcompanhamentos ← NF + itens              │
│  └── ComprasAnaliseCompra ← análise de ROI/Curva ABC   │
├─────────────────────────────────────────────────────────┤
│  EXPEDIÇÃO                                             │
│  ├── ExpedicaoOperacao ← dashboard de módulos         │
│  ├── ExpedicaoPainel ← cards de status                │
│  └── ExpedicaoEtiquetas ← printService                │
├─────────────────────────────────────────────────────────┤
│  ADMIN                                                 │
│  ├── N8nMonitorPage ← webhook_logs                    │
│  └── DepositosAdmin ← depositos                       │
└─────────────────────────────────────────────────────────┘
```

### Tabelas de Alto Impacto

| Tabela | Dependências | Risco de Mudança |
|--------|--------------|------------------|
| `movimentacoes` | `itens`, `saldos`, `expedicoes`, `nf_entradas` | Alto - afeta todos os módulos |
| `saldos` | `movimentacoes`, `entradas`, `saidas` | Alto - cálculo automático |
| `conferencias` | `conferencia_itens`, `movimentacoes` | Médio - log de auditoria |
| `expedicoes` | `expedicoes_itens`, `movimentacoes` | Médio - expedição |
| `compras` | `compras_itens`, `nf_entradas` | Médio - fluxo de compra |

---

## 📝 Checklist de Documentação

- [x] Estrutura de arquivos completa
- [x] Stack tecnológica identificada
- [x] Arquitetura mapeada
- [x] Todas as páginas e rotas mapeadas
- [x] Banco de dados - engenharia reversa completa
- [x] Regras de negócio extraídas
- [x] Frontend - componentes, hooks, estados
- [ ] Backend e APIs - mapear endpoints e services
- [ ] Documentar n8n workflows
- [ ] Documentar integrations com sistemas externos
- [ ] Criar diagrama de sequência de conferência
- [ ] Criar diagrama de sequência de impressão
- [ ] Documentar estratégia de autenticação
- [ ] Documentar sistema de permissões
- [ ] Criar documentação de migração de dados
- [ ] Documentar plano de disaster recovery

---

## 📄 Referências

| Recurso | Localização |
|---------|-------------|
| Documentação oficial React | https://react.dev |
| Documentação TanStack Query | https://tanstack.com/query/latest |
| Documentação Zustand | https://zustand.deta.sh |
| Documentação Radix UI | https://radix-ui.com |
| Documentação Tailwind CSS | https://tailwindcss.com |
| Supabase Docs | https://supabase.com/docs |
| n8n Docs | https://docs.n8n.io |
| Vite PWA | https://vite-pwa-org.netlify.app |

---

## 📋 Notas Finais

- **Versão**: 4.12.6
- **Data de criação**: 2026-09-14
- **Quantidade de páginas**: 40+
- **Quantidade de hooks**: 40+
- **Quantidade de componentes UI**: 30+
- **Quantidade de tipos TypeScript**: 200+

> **Nota**: Este documento é uma representação completa do sistema Pente Fino baseado em engenharia reversa do código fonte. Pode haver diferenças entre a documentação e o código real em versões futuras.
