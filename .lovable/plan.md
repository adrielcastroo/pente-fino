# Refatoração Estrutural e Arquitetural - Pente Fino v5.0

Este plano visa realizar uma refatoração profunda na base de código do projeto, focando em organização, separação de responsabilidades e padrões consistentes, sem alterar as funcionalidades existentes.

## 1. Organização da Arquitetura e Pastas

### 1.1 Centralização de Services e API
- **Problema:** A lógica de interação com Supabase está espalhada entre componentes, hooks e services.
- **Ação:** Refatorar `src/services/` para usar um padrão de repositório ou cliente centralizado.
- **Arquivos:** `src/services/*.ts`, `src/integrations/supabase/client.ts`.

### 1.2 Estrutura de Domínios em Componentes
- **Problema:** Pastas como `src/components/` contêm subpastas por feature (ex: `acabamentos`), mas a lógica de negócio está misturada com a UI.
- **Ação:** Criar sub-pastas `ui` (componentes burros) e `features` (componentes inteligentes/containers) dentro de cada domínio.
- **Arquivos:** `src/components/acabamentos/`, `src/components/expedicao/`, etc.

## 2. Refatoração de Lógica e Estado

### 2.1 Hooks Customizados de Domínio
- **Problema:** Hooks genéricos e lógicas de sincronização complexas dentro de componentes (ex: `GerarTagTab.tsx`).
- **Ação:** Extrair lógicas de efeitos colaterais e sincronização de dados para hooks específicos (ex: `useGerarTagSync.ts`).
- **Arquivos:** `src/hooks/`, `src/components/acabamentos/GerarTagTab.tsx`.

### 2.2 Padronização de Zod para Validação
- **Problema:** Validações manuais em diversos pontos do sistema.
- **Ação:** Implementar schemas Zod para validação de formulários e payloads de API (especialmente no `auge-sync`).
- **Arquivos:** `src/types/`, `src/lib/nfe-parser.ts`, `src/store/useAppStore.ts`.

## 3. Limpeza e Qualidade de Código

### 3.1 Eliminação de Código Redundante
- **Problema:** Funções utilitárias duplicadas em `src/lib/utils.ts` e `src/lib/app-utils.ts`.
- **Ação:** Unificar formatadores de data, moeda e quantidades.
- **Arquivos:** `src/lib/*.ts`.

### 3.2 Tipagem TypeScript Strict
- **Problema:** Uso de `any` em retornos de query do Supabase e props de componentes legados.
- **Ação:** Substituir `any` por interfaces específicas geradas ou definidas no domínio.

## 4. Otimização de Performance

### 4.1 Memoização e Renderização
- **Problema:** Re-renderizações excessivas em listas grandes (estoque/expedição).
- **Ação:** Aplicar `useMemo`, `useCallback` e `React.memo` estrategicamente em componentes de lista e cards.

## Detalhes Técnicos
- **Stack:** React 18, Zustand, TanStack Query, Shadcn UI.
- **Estratégia:** Refatoração incremental por domínio, começando pelo mais crítico (`estoque/acabamentos`).
- **Risco:** Quebra de contratos de API ou RLS se as queries forem alteradas incorretamente. A validação será feita via build (`tsc`) e testes existentes.

---
*Nota: Este plano segue as diretrizes de não alterar funcionalidades ou comportamento visual.*
