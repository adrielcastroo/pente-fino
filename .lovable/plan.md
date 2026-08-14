# Plano de Melhoria: Composição da TAG Custom

Corrigir e aprimorar o fluxo de composição de TAGs customizadas, garantindo agrupamento global por termo de busca, persistência de remoções manuais e recomendações automáticas inteligentes sem duplicação.

## Alterações Funcionais

### 1. Estado da Composição (GerarTagTab.tsx)
- Implementar `removidasManualmente`: um `Set` de strings contendo os códigos das TAGs removidas pelo usuário.
- Garantir que `linhas` contenha apenas TAGs únicas (deduplicadas por código de TAG configurada).
- Adicionar lógica para que a alteração de uma TAG na composição seja aplicada a TODAS as configurações presentes no Resumo.

### 2. Sincronização e Recomendações (GerarTagTab.tsx)
- O `useEffect` que sincroniza recomendações automáticas a partir das configurações no Resumo deve:
  - Analisar todas as configurações do `configsResumo`.
  - Agrupar as TAGs existentes por código.
  - Para cada código, identificar a TAG calculada mais frequente.
  - Filtrar as TAGs que estão em `removidasManualmente`.
  - Atualizar o estado `linhas` sem sobrescrever edições manuais pendentes (apenas adicionar novas ou atualizar recomendações se não houver edição).

### 3. Remoção Manual
- O botão de remover deve adicionar o código da TAG ao `removidasManualmente` e retirá-la de `linhas`.
- Resetar `removidasManualmente` apenas quando o `termoBusca` mudar significativamente (novo escopo).

### 4. Backend (Edge Function auge-sync)
- Reforçar a lógica de `upsert` na ação de gravação de TAGs customizadas.
- Garantir que, para cada configuração no escopo, a TAG configurada seja atualizada se existir ou criada se não existir, evitando duplicatas.

## Detalhes Técnicos

### GerarTagTab.tsx
- Criar `codigosConfiguracoesAlvo` a partir de `configsResumo` para garantir que o escopo de gravação seja idêntico ao visualizado no Resumo.
- Modificar o `useEffect` de auto-preenchimento para usar `configsResumo` em vez de apenas a seleção individual.

### Edge Function (auge-sync/index.ts)
- Revisar a ação `salvar_tag_customizada` para iterar sobre a lista de códigos de configuração e aplicar as linhas da composição em cada uma, usando o identificador da TAG para `update` ou `insert`.
