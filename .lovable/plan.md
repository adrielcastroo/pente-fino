# Plano de Correção: Persistência da Configuração no Histórico de TAGs

O problema relatado (campos vazios na coluna "Configuração (TAG Custom)" no histórico e auditoria) ocorre porque, em operações em massa, o sistema estava registrando o metadado da configuração apenas no nível do grupo de eventos, mas as linhas individuais não carregavam essa informação de forma persistente. Como a auditoria lê as linhas do evento, se o metadado individual estiver ausente, o campo aparece como "—".

## Ações Propostas

### 1. Backend/Lib: Reforçar Mapeamento no Registro
Ajustar a função `registrarEventoTag` em `src/lib/tag-historico.ts` e o seu uso em `src/components/acabamentos/GerarTagTab.tsx` para garantir que cada linha gravada no histórico contenha explicitamente o nome e o código da configuração a que pertence.

### 2. Interface: Lógica de Herança de Metadados
Refinar a renderização em `src/components/acabamentos/HistoricoTagsTab.tsx` para que, caso uma linha histórica não possua o nome da configuração (devido a registros antigos ou falha na persistência), ela tente herdar do evento pai ou do grupo, garantindo que o usuário nunca veja campos vazios.

### 3. Interface: Ajustes Visuais e Layout do Modal
- Aumentar a largura máxima do modal de auditoria para evitar quebras de linha em resoluções menores.
- Garantir que as colunas "Configuração", "TAG Calculada", "Valor Antigo/Atual" e "Fórmula" tenham prioridade de espaço.
- Adicionar o prefixo do código da configuração (ex: `[CFG001]`) junto ao nome para facilitar a identificação.

## Detalhes Técnicos
- Modificar `registrarEventoTag` para aceitar e persistir metadados granulares.
- Atualizar o componente `GerarTagTab.tsx` para injetar `cfgNome` e `cdConfiguracao` em cada item do array de linhas enviado para o histórico.
- Ajustar `HistoricoTagsTab.tsx` (tabelas de resumo e auditoria) com lógica de fallback: `linha.nmConfiguracao ?? evento.nmConfiguracao ?? grupo.nmConfiguracao`.

## Riscos
- Registros muito antigos podem não ter o código da configuração gravado, mas a lógica de herança do grupo mitigará isso na exibição.
