# Plano de Inativação do Assistente FIO

Este plano descreve as etapas para desabilitar completamente o assistente de IA "FIO" e todas as suas funcionalidades conectadas no aplicativo, conforme solicitado, mantendo o código mas impedindo sua execução ou exibição.

## Mudanças Propostas

### UI e Acesso
- **Inativar Widget de Chat:** Comentar o componente `<AgentChatWidget />` no arquivo principal da aplicação (`src/App.tsx`) para remover o assistente flutuante de todas as telas.
- **Remover Gate de Credenciais:** Desabilitar o `<AugeCredentialsGate />` no layout principal (`src/components/MainLayout.tsx`) para cessar a solicitação de credenciais do Auge vinculadas à IA.
- **Esconder Configurações:** Comentar as entradas de menu relacionadas ao Fio (Memória e Tokens LLM) nas páginas de Configurações e Painel Admin.

### Permissões e Backend
- **Desativar Ações de IA:** Comentar as definições de permissões `ai_ask` e `ai_write` no sistema de permissões do Auge para que a funcionalidade não seja mais oferecida aos usuários.

## Detalhes Técnicos
- Nenhuma funcionalidade principal (Estoque, Expedição, Compras) será afetada, pois o Fio opera como uma camada auxiliar de assistência.
- O código permanece no repositório, facilitando uma futura reativação caso necessário.

## Arquivos que serão modificados
- `src/App.tsx`: Comentado `<AgentChatWidget />`.
- `src/components/MainLayout.tsx`: Comentado `<AugeCredentialsGate />`.
- `src/pages/SettingsPage.tsx`: Comentada a opção "Memória do Fio".
- `src/pages/admin/AdminPanelPage.tsx`: Comentada a aba "Tokens LLM".
- `src/lib/auge-permissions.ts`: Comentadas as permissões de IA.
