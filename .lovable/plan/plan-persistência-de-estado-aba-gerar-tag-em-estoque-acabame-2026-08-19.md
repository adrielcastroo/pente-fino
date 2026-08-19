# Plan: Persistência de Estado - Aba "Gerar TAG" em /estoque/acabamentos

Implementar um mecanismo de persistência robusto para a aba "Gerar TAG" da página `/estoque/acabamentos`. O objetivo é garantir que o estado da tela (valores digitados, configurações, composição da tabela, modo de edição, etc.) sobreviva à navegação entre rotas, recarregamento da página e fechamento do navegador, respeitando as restrições de não alterar a lógica funcional dos blocos "Resumo" e "Manter TAG Customizada".

## User Review Required

> [!IMPORTANT]
> A persistência será baseada no `localStorage`. Se o usuário limpar os dados do navegador, o rascunho será perdido.
> O estado será restaurado automaticamente ao entrar na página.

## Proposta de Implementação

### 1. Centralização do Estado (Zustand)
Criar uma nova store `useGerarTagStore` para gerenciar o estado persistente da aba "Gerar TAG". Isso substituirá os estados locais (`useState`) que precisam sobreviver à desmontagem do componente e facilitará a persistência automática via middleware do Zustand.

### 2. Mapeamento de Estados a Persistir
*   `descricao`: Texto da TAG Custom.
*   `linhas`: Composição da tabela (LinhaTag[]).
*   `customAberta`: Configuração selecionada.
*   `resultado`: Resultado da última operação no Auge.
*   `modoEdicaoRelancamento`: Flag de modo de edição.
*   `snapshotLinhas`: Snapshot para cancelamento de edição.
*   `removidasManualmente`: Conjunto de TAGs removidas pelo usuário (Set).
*   `termoBuscaCfg`: Termo digitado no campo de configuração.

### 3. Integração no Componente `GerarTagTab`
*   Refatorar o componente `GerarTagTab` para ler e escrever na nova store.
*   Garantir que os hooks de busca e efeitos de sincronização continuem funcionando, apenas apontando para a store em vez de estados locais.
*   Implementar a lógica de limpeza controlada (ex: botão "Novo" ou após gravação bem-sucedida, se desejado).

### 4. Preservação de Blocos Protegidos
*   A lógica do `ResumoConfiguracoesMassa` e da busca manual não será alterada.
*   Apenas o *input* (estado) que alimenta esses componentes será movido para a store persistente.

## Detalhes Técnicos

*   **Tecnologia:** Zustand com middleware `persist`.
*   **Storage:** `localStorage`.
*   **Key:** `pente-fino:gerar-tag-state`.
*   **Serialização:** Como o estado contém um `Set` (`removidasManualmente`), será necessário um `storage` customizado no middleware do Zustand para converter `Set` em `Array` no `JSON.stringify` e vice-versa no `JSON.parse`.
*   **Limpeza:** O estado transitório (loading, enviando, etc.) **não** será persistido.

## Arquivos a serem modificados/criados

1.  `src/store/useGerarTagStore.ts` (Novo)
2.  `src/components/acabamentos/GerarTagTab.tsx` (Refatoração para usar a store)
