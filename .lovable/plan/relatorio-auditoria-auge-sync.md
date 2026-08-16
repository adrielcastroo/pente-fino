---
name: Auditoria e Correção Auge-Sync
description: Relatório de auditoria e correção do erro de runtime na Edge Function auge-sync.
type: feature
---

## 📋 Relatório de Auditoria e Correção

### 1. Diagnóstico da Causa Raiz
*   **Erro:** `CPU Time exceeded` e `RUNTIME_ERROR`.
*   **Causa:** Processamento de grandes volumes de HTML (DataTables legados do Auge) sem limites de segurança. A função tentava processar strings de múltiplos megabytes com expressões regulares pesadas, resultando em estouro de tempo de CPU no ambiente Deno Deploy do Supabase.
*   **Sintoma:** Tela em branco ou falha na resposta da função sem logs claros de erro.

### 2. Ações Realizadas

#### A. Reforço no Error Handling
*   Implementado um `try/catch` global no `Deno.serve` que agora captura erros fatais e tenta registrá-los na tabela `auge_sync_runs` com a entidade `fatal_error`.
*   Adicionado `console.error` explícito em pontos críticos (Login, Credenciais, Sync) para facilitar o debug via Supabase Dashboard.
*   A resposta de erro agora inclui o stack trace quando disponível, facilitando a identificação da linha exata da falha em futuras ocorrências.

#### B. Proteção de Performance (Circuit Breaker)
*   **parseTagGridResponse:** Adicionado limite de 2MB para strings de entrada e limite de 2000 iterações no processamento de linhas `<tr>`. Isso previne que HTMLs corrompidos ou gigantes travem a CPU.
*   **syncEntity:** Adicionado monitoramento de duração (`duration_ms`) para cada entidade. Se uma entidade falhar, o erro agora é isolado e registrado sem interromper obrigatoriamente a invocação (melhorando a resiliência).

#### C. Melhoria na Observabilidade
*   Adicionados logs de contexto: `triggeredBy`, `action`, e tempo de execução por fase.

### 3. Validação
*   O código foi auditado para evitar recursão infinita no `selfInvoke`.
*   A função `cleanText` foi revisada e considerada segura (regex simples de espaços).
*   A estrutura de login foi mantida, mas agora conta com logs de falha detalhados.

### 4. Próximos Passos
*   Monitorar a tabela `auge_sync_runs` nos próximos dias.
*   Se o erro `CPU Time exceeded` persistir em entidades específicas (ex: `transferencias`), recomenda-se dividir o processamento dessa entidade em múltiplos chunks (similar ao que é feito com `tecidos`).

---
Relatório gerado em 2026-08-16.
