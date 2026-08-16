---
name: Auditoria Auge-Sync Runtime Error
description: Plano para auditoria e correção do RUNTIME_ERROR na Edge Function auge-sync.
type: feature
---

## Objetivo
Identificar e corrigir a causa raiz do `RUNTIME_ERROR` (has_blank_screen: true) na Edge Function `auge-sync` (supabase/functions/auge-sync/index.ts).

## Diagnóstico
O erro reportado é um `RUNTIME_ERROR` que resulta em "blank screen" no terminal (ou falha catastrófica da função). Dado que o arquivo tem mais de 6500 linhas, as causas mais prováveis são:
1.  **Estouro de Memória/Timeout:** Processamento excessivo de dados (DataTables/Sync completo) em uma única invocação.
2.  **Recursão Infinita:** Auto-invocações (`selfInvoke`) sem critério de parada claro ou erro no payload de continuação.
3.  **Parsing de HTML Malformado:** O sistema usa Regex pesadas para extrair dados de HTML (Auge legados), o que pode falhar com inputs inesperados.
4.  **Conexão/Auth:** Credenciais faltando ou erro no handshake de login com Auge.

## Plano de Ação

### Fase 1: Coleta e Reprodução
1.  **Logs de Execução:** Consultar `auge_sync_runs` para ver o último `triggered_by`, `action` e `detalhes`.
2.  **Simulação via Script:** Criar um script local para invocar a função com payloads específicos (clientes, produtos, transferências) e observar o comportamento.
3.  **Inspeção de Limites:** Verificar `Deno.env` e configurações de timeout da função no Supabase.

### Fase 2: Auditoria de Código
1.  **Revisão do Ponto de Entrada:** Auditar o `Deno.serve` para garantir que erros globais não matem o worker sem resposta.
2.  **Análise de `selfInvoke`:** Verificar `sync_tag_custom_chunk` e outros mecanismos de chunking.
3.  **Sanitização de Regex:** Revisar `parseTagGridResponse` e `discoverTagGridPaths` para evitar ReDoS ou crashes em HTML gigante.

### Fase 3: Correção e Refatoração
1.  **Implementação de Circuit Breaker:** Se uma entidade falhar, não derrubar o sync das outras.
2.  **Otimização de Memória:** Substituir `res.text()` por streams onde possível ou limitar o tamanho dos logs salvos em `detalhes`.
3.  **Melhoria no Error Handling:** Garantir que todo `try/catch` retorne um JSON válido com `ok: false`.

### Fase 4: Validação
1.  **Testes de Integração:** Rodar `test-auge-consultas.ts` e verificar se a função responde.
2.  **Monitoramento:** Acompanhar `auge_sync_runs` em tempo real após a aplicação do fix.

## Relatório Final
Será gerado um documento detalhando a causa raiz e a solução implementada.
