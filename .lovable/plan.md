# Plano de Auditoria e Correção: Minified React Error #310

Este plano visa resolver o erro fatal de renderização `Minified React error #310` (descompasso de Hooks) que está causando telas brancas na página de Acabamentos, garantindo que a busca avançada (padrão SAP B1) e o bloco "Resumo" funcionem de forma estável e performática.

## Problemas Identificados
1.  **Descompasso de Hooks (Error #310):** Hooks estão sendo chamados condicionalmente ou fora do topo do componente, possivelmente devido a retornos antecipados (`early returns`) ou inicializações dinâmicas no corpo do componente.
2.  **Lógica de Busca no Bloco Resumo:** A filtragem AND estrita no bloco "Resumo" está instável, às vezes retornando resultados que não batem 100% com os tokens de busca.
3.  **Redundância de Estado:** Há múltiplas fontes de verdade para o termo de busca e seleção de configurações, o que pode levar a loops de renderização infinitos ou estados inconsistentes.

## Plano de Ação

### 1. Reestruturação do Componente `GerarTagTab`
*   **Isolamento do Bloco Resumo:** Mover a lógica do bloco "Resumo" para um sub-componente dedicado (`ResumoConfiguracoesMassa`). Isso garante que os hooks de busca (`useTagCustomConfigurationSearch`) fiquem isolados e não quebrem a árvore de hooks do componente pai se ele sofrer um early return.
*   **Normalização de Hooks:** Garantir que TODOS os hooks (`useState`, `useEffect`, `useMemo`, `useQuery`) sejam declarados no topo absoluto de `GerarTagTab` e `AcabamentosPage`, removendo qualquer computação de estado baseada em condicionais.

### 2. Estabilização da Busca Avançada (AND Estrito)
*   **Refinamento do Hook Central:** Ajustar o `useTagCustomConfigurationSearch` para garantir que o termo enviado à RPC seja limpo e que o estado de carregamento não cause saltos na renderização.
*   **Validação em Memória (Double Check):** Implementar uma camada de filtragem robusta no cliente após o retorno da RPC para garantir que acentos e caracteres especiais não causem falsos positivos no bloco Resumo.

### 3. Garantia de Performance e UX
*   **Debounce Rigoroso:** Padronizar o debounce em 300ms para todas as entradas de texto.
*   **Skeleton Loaders:** Adicionar estados de carregamento graciosos no bloco Resumo para evitar o "layout shift" que pode confundir o React durante a reconciliação.

## Detalhes Técnicos
*   **RPC Segura:** A função `buscar_auge_tag_custom_configuracoes` no Supabase será a única fonte de verdade para a busca AND.
*   **Regras de Hooks:** Proibir `useTagCustomConfigurationSearch` dentro de IIFEs ou blocos de código dinâmicos (como o atual `termoBusca.trim().length >= 2 && (() => { ... })()`).
*   **Build de Verificação:** Executar `npm run build` e `vitest` para garantir que a produção esteja estável.

## Riscos
*   **Complexidade de Dados:** O banco possui até 80.000 registros; a busca deve ser eficiente para não travar a UI.
*   **Regressão de Funcionalidade:** Ao reestruturar os hooks, devemos garantir que a persistência de rascunho (mecanismo manual atual) não seja perdida.
