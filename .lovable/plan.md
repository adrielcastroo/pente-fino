## Objetivo

Garantir que, ao usar o botão **Exportar** nas páginas `/tecido`, `/madeira` e `/motor`, o usuário consiga:
1. Gerar o arquivo Excel da sessão de bipagem atual com confiabilidade.
2. Ver imediatamente o lote exportado em **/historico**, com indicação visual de que veio de uma exportação.

## Diagnóstico atual

O fluxo já existe em `src/components/TopBar.tsx → exportExcel()` e chama `archiveAndClear()` (que salva a conferência no banco) **antes** de baixar o `.xlsx`. Em seguida `loadHistory()` é executado automaticamente. Mas existem 3 pontos que travam a experiência hoje:

- **A.** O botão Exportar fica oculto quando `registros.length === 0`, e o usuário não recebe nenhuma orientação clara em telas onde o badge "Vazio" aparece.
- **B.** Validações de PROCESSO/CONFERENTE retornam cedo **sem** desligar o estado de loading nem informar exatamente o que falta; em algumas combinações (`modoOrigem` misturado) a checagem `requiresProcesso` bloqueia indevidamente sessões de Motor/Controle.
- **C.** Após o arquivamento, `/historico` só recarrega automaticamente se a aba já estiver montada. Quando o usuário troca para `/historico` logo após exportar, depende de `useEffect` montar para chamar `loadHistory()` — ok, mas não há destaque de "recém-exportado".

## Mudanças propostas

### 1. `src/components/TopBar.tsx` — robustez do export
- Manter sempre visível um botão "Exportar" desabilitado com tooltip "Sem itens bipados" quando `registroCount === 0` (em vez do badge "Vazio").
- Refatorar `exportExcel()` para:
  - Validar PROCESSO/CONFERENTE **antes** de abrir o toast de loading.
  - Tratar Motor/Controle independentemente: se qualquer registro tem `modoOrigem === 'motor'|'controle'`, não exigir PROCESSO.
  - Em caso de erro de arquivamento, **não** baixar o Excel (já está assim) e mostrar mensagem clara.
  - Ao concluir, exibir toast com ação **"Ver no histórico"** que faz `navigate('/historico')`.

### 2. `src/store/useAppStore.ts`
- Em `archiveAndClear`, anexar `lastArchivedConferenceId` ao state quando o `apiService.archiveConference` retornar o registro inserido (ajustar `apiService.archiveConference` para devolver o id).
- Esse id é consumido em `/historico` para destacar a conferência recém-exportada (animação de entrada + badge "Exportado agora").

### 3. `src/services/api.ts` / `src/services/conferenceService.ts`
- Garantir que `archiveConference` retorne `{ id }` da conferência criada (hoje provavelmente retorna void).

### 4. `src/components/HistoryPanel.tsx`
- Ler `lastArchivedConferenceId` do store; quando presente:
  - Auto-expandir o folder correspondente.
  - Adicionar badge verde "Exportado agora" por 1 visita.
  - Após render, limpar o id no store.
- Manter o `loadHistory()` em mount (já existe).

### 5. `src/pages/HistoricoPage.tsx`
- Sem mudanças funcionais — apenas garantir que o painel monte normalmente.

## Fora do escopo

- Não mexer no fluxo de `/cadastros` nem nos códigos de fornecedor.
- Não alterar layout do Excel exportado (continua usando `exportConferenceToExcel` / `exportMotorControleToExcel`).
- Não alterar políticas RLS — conferências já são visíveis para todos os usuários autenticados conforme ajuste anterior.

## Arquivos tocados

- `src/components/TopBar.tsx`
- `src/store/useAppStore.ts`
- `src/services/api.ts`
- `src/services/conferenceService.ts`
- `src/components/HistoryPanel.tsx`
