
Objetivo: adicionar uma terceira aba principal chamada "Diversos", renomear "Manual" para "Coulisse", manter o modo "IA" como está, mostrar campos dinâmicos por tipo de tecido em "Diversos" e permitir edição individual no histórico com marcação de edição e usuário editor.

1. Estrutura de navegação
- Renomear o modo atual "Manual" para "Coulisse" apenas na interface, preservando o comportamento já existente.
- Manter "IA" com o layout exclusivo já definido.
- Adicionar uma terceira aba principal: "Diversos".
- Atualizar os toggles de modo no painel esquerdo para: Coulisse | IA | Diversos.

2. Aba "Diversos"
- Adicionar uma chave/seletor de tipo de tecido visível apenas em "Diversos":
  - Rolo
  - PVT
  - Cortina
  - Celular
- A seleção do tipo controlará quais campos aparecem para o usuário.

3. Campos por tipo em "Diversos"
- Rolo: mesmos campos do fluxo atual de Coulisse
  - Item/Referência
  - M²
  - Lote/Batch
  - Endereço
  - Largura calculada
  - M Linear calculado
  - Travar Endereço
  - Lote Sistema com as regras atuais
- Cortina: igual a Rolo
- Celular: igual a Rolo
- PVT: somente
  - Item/Referência
  - M Linear
  - Lote/Batch
- Em PVT, os campos não usados ficarão ocultos e serão salvos como vazios/zero para não quebrar tabela, histórico e exportação.

4. Regras que serão mantidas
- PROC e Conferente continuam obrigatórios para registrar e exportar.
- Coulisse continua com a lógica atual:
  - largura extraída do item
  - M Linear = M² / largura
  - Lote Sistema = Endereço + PROC + M Linear
  - serial para itens/lotes idênticos
  - travamento de endereço
- IA continua separada, com o layout exclusivo já existente.

5. Histórico com edição individual
- Adicionar ação de editar por tecido dentro de cada conferência no histórico.
- Cada linha poderá ser alterada individualmente.
- Ao salvar:
  - marcar o registro como editado
  - salvar qual conferente atual fez a edição
  - salvar data/hora da última edição
- Mostrar visualmente no histórico:
  - badge/indicador de “Editado”
  - nome do usuário que editou
  - data/hora da edição
- Se já tiver sido editado antes, o indicador permanece ativo.

6. Banco de dados / backend
Será necessário ajustar a estrutura da tabela de registros para suportar os novos comportamentos:
- tipo_tecido
- modo_origem
- was_edited
- edited_by
- edited_at

Também vou atualizar o mapeamento do store para:
- salvar esses campos novos ao arquivar
- carregar esses campos no histórico
- permitir update individual de registros no histórico

7. Interface e responsividade
- Manter a experiência atual de smartphone e tablet.
- Ajustar o painel esquerdo para acomodar:
  - 3 modos principais
  - seletor de tipo em Diversos
  - campos dinâmicos sem poluir a tela
- No tablet e mobile, a edição do histórico deve abrir em formato confortável para toque, preferencialmente modal/folha de edição.

8. Arquivos que serão afetados
- src/store/useAppStore.ts
- src/components/LeftPanel.tsx
- src/components/HistoryPanel.tsx
- src/pages/Index.tsx
- supabase/migrations/...nova migration para ampliar a tabela registros

Detalhes técnicos
- `currentMode` deixará de ser só `manual | openrouter` e passará a contemplar `coulisse | openrouter | diversos` (ou manter a chave interna antiga e trocar apenas o label, se isso for mais seguro para reduzir regressão).
- Em "Diversos", o formulário será guiado por configuração do tipo selecionado, para evitar duplicação de UI.
- A edição do histórico usará update direto no backend, sem criar nova conferência.
- Como já existe banco unificado e políticas públicas ativas, a mudança principal será estrutural e de interface, não de autenticação.

Resultado esperado
- O usuário escolhe Coulisse, IA ou Diversos.
- Em Diversos, escolhe o tipo de tecido e vê apenas os campos daquele tipo.
- O histórico passa a permitir correção fina de cada tecido, com rastreio de quem editou e se o item já foi alterado antes.
