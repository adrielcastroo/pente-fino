# Plano de Correção: Duplicação de TAGs Calculadas

Este plano visa corrigir o problema de duplicação de TAGs no fluxo de "Gerar TAG" (aba `/estoque/acabamentos`), garantindo que o sistema realize uma leitura obrigatória do Auge ERP antes de qualquer operação e utilize identificadores reais (`cdTagCustomizada`) para atualizações, em vez de criar novos registros.

## Regras Absolutas
- **NÃO ALTERAR** o bloco "RESUMO".
- **NÃO ALTERAR** o bloco "MANTER TAG CUSTOMIZADA".
- A correção é isolada no fluxo de inserção/alteração de TAGs calculadas da aba "Gerar TAG".

## Mudanças Técnicas

### 1. Backend (Edge Function `auge-sync`)
- Reforçar a lógica de **Deduplicação Atômica**:
  - Antes de gravar (`idAcao=1` ou `2`), a função verifica se já existem TAGs com o mesmo nome na configuração.
  - Se detectadas duplicatas, mantém apenas o registro sobrevivente (priorizando o ID enviado pelo frontend) e exclui as demais via `idAcao=3`.
  - Garante que a operação seja idempotente.

### 2. Frontend (`GerarTagTab.tsx`)
- **Leitura Real Obrigatória**:
  - A função `iniciarEdicaoSegura` (usada ao clicar em "Editar e relançar") já realiza o fetch via `tag_custom_por_config`. 
  - Vamos garantir que essa leitura mapeie corretamente todos os campos técnicos (`cdTagCustomizada`, `cdTagCalculada`) e armazene um snapshot para validação.
- **Bloqueio de UI no Modo de Edição**:
  - Desativar a troca de Configuração no `ConfiguracaoSelect` e `ResumoConfiguracoesMassa`.
  - Ocultar botões de "Remover TAG" e "Adicionar TAG Configurada" para evitar mudanças estruturais proibidas.
  - Permitir apenas a edição do valor das TAGs calculadas existentes.
- **Fluxo de Confirmação**:
  - Ao gravar, o frontend envia os IDs reais capturados.
  - Após a gravação bem-sucedida, realiza uma nova leitura de segurança para confirmar que não restaram duplicatas e que os valores persistiram.

### 3. Validação
- Verificação do payload enviado para a Edge Function: deve conter `cdTagCustomizada` para cada item se ele já existe.
- Teste de cenário com TAGs duplicadas no Auge: o sistema deve limpar as duplicatas automaticamente na primeira alteração.

## Detalhes de Implementação
- **Componentes**: `GerarTagTab.tsx`, `ResumoConfiguracoesMassa.tsx`.
- **Serviços**: `auge-sync` Edge Function.
- **Tabelas**: Nenhuma alteração de esquema necessária no Supabase.
