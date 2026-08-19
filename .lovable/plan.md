# Plano de Ação: Correção de Duplicação de TAGs Calculadas

Este plano visa corrigir o problema de duplicação de TAGs calculadas no fluxo "Gerar TAG", garantindo a idempotência das operações e a limpeza de registros redundantes no Auge, sem alterar os blocos protegidos "Resumo" e "Manter TAG Customizada".

## 1. Backend (`auge-sync` Edge Function)

Refinar a ação `criar_tag_custom` para garantir que cada par `(cdConfiguracao, dsTagCustomizada)` seja único no Auge.

*   **Deduplicação Atômica:** Antes de qualquer gravação, listar todas as TAGs existentes para a configuração. Se houver registros com o mesmo nome (`dsTagCustomizada`), manter apenas um (o que tiver o ID correspondente ao enviado pelo frontend, ou o primeiro encontrado) e excluir os demais via `idAcao=3`.
*   **Identificador Técnico:** Garantir que o `cdTagCustomizada` seja passado corretamente para o endpoint de gravação do Auge, forçando o uso de `idAcao=2` (alteração) em vez de `idAcao=1` (inclusão) quando o registro já existe.

## 2. Frontend (`GerarTagTab.tsx`)

Ajustar o fluxo de gravação para ser resiliente a duplicatas e garantir a integridade dos dados.

*   **Sincronização Pré-Gravação:** Antes de enviar o lote para gravação, realizar uma consulta `tag_custom_por_config` para capturar os IDs reais do Auge (`cdTagCustomizada`) das linhas que compõem a TAG Customizada. Isso garante que o backend receba os identificadores necessários para realizar a atualização correta.
*   **Fallback de Valor:** Se o usuário deixar o campo de TAG calculada vazio em uma linha existente, o sistema deve enviar o `dsTagTexto` original para preservar o estado anterior no Auge, evitando a deleção do conteúdo técnico.

## 3. Validação e Segurança

*   **Verificação Pós-Gravação:** Adicionar uma chamada de releitura logo após o retorno de sucesso do Auge para confirmar que a configuração resultante não possui duplicatas nominais.
*   **Isolamento:** As alterações serão restritas ao payload de `criar_tag_custom` e ao hook de disparo do botão "Gravar no Auge" na aba "Gerar TAG", mantendo intactos os componentes de visualização de massa e histórico.

---

### Detalhes Técnicos

*   **Arquivo Backend:** `supabase/functions/auge-sync/index.ts` (lógica de deduplicação e roteamento de `idAcao`).
*   **Arquivo Frontend:** `src/components/acabamentos/GerarTagTab.tsx` (fluxo de envio e mapeamento de IDs).
*   **Restrições:** Nenhuma alteração em `ResumoConfiguracoesMassa.tsx` ou na lógica de busca por TAGs obrigatórias.
