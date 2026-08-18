# Plano de Correção e Auditoria: Fluxo de Edição Seguro (Aba Gerar TAG)

## Diagnóstico
A falha exibida na imagem (duplicidade de TAGs no Auge com valores vazios) ocorre devido a uma inconsistência entre o estado local do Pente Fino e o estado real do Auge ERP durante operações de "Editar e relançar". 

1. **Duplicidade**: O app tenta criar novas linhas em vez de atualizar as existentes porque o identificador técnico (`cdTagCustomizada`) se perde ou não é mapeado corretamente após a primeira gravação.
2. **Valores Vazios**: Ocorre quando o app envia uma TAG calculada que não é resolvida corretamente pelo backend (espelho local vs Auge), resultando em fallback para texto livre vazio.

## Restrições Absolutas
- **NÃO ALTERAR** o bloco "RESUMO" (`ResumoConfiguracoesMassa.tsx`).
- **NÃO ALTERAR** o bloco "MANTER TAG CUSTOMIZADA" (lógica de estado persistente).

## Ações Técnicas

### 1. Backend (Edge Function `auge-sync`)
- **Ação `tag_custom_por_config`**: Refinar a normalização dos campos retornados pelo Auge (`fetchListaTagsCustomizadas`) para garantir que `cdTagCustomizada` e `cdTagCalculada` sejam consistentes.
- **Ação `criar_tag_custom`**:
    - Implementar verificação rigorosa: se `cdTagCustomizada` for fornecido, usar obrigatoriamente `idAcao=2` (Alterar).
    - Melhorar a busca de candidatos para TAG Calculada priorizando o `cdTagCalculada` já existente no registro do Auge caso o usuário não tenha alterado o valor.

### 2. Frontend (`GerarTagTab.tsx`)
- **Snapshot de Segurança**: Ao iniciar o "Modo de Edição", capturar um snapshot completo das linhas atuais para permitir cancelamento sem perda de dados.
- **Carga Real do Auge**: A função `iniciarEdicaoSegura` deve realizar um fetch obrigatório ao Auge para obter os IDs reais de cada linha antes de abrir a interface de edição.
- **Bloqueio de Interface**: 
    - Desabilitar a troca de Configuração durante a edição.
    - Desabilitar a adição de novas TAGs configuradas e a exclusão das existentes (somente a TAG calculada é editável neste modo).
- **Tratamento de Vazios**: Se o usuário limpar um campo de TAG calculada, o sistema deve alertar ou preservar o valor técnico anterior em vez de enviar nulo/vazio para o ERP.

## Validação
- Testar o fluxo completo: Gravar -> Editar e Relançar -> Alterar valor -> Gravar novamente.
- Verificar via SQL Tool se o `cdTagCustomizada` permanece o mesmo no Auge após a edição (confirmando o UPDATE em vez de INSERT).
