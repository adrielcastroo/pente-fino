## Objetivo
Elevar o Fio de "chatbot que às vezes acerta" para um agente confiável, com três capacidades priorizadas: **entender contexto**, **gerar relatórios exportáveis** e **executar ações no app**.

## Diagnóstico atual (`supabase/functions/ai-agent/index.ts`)
- Prompt monolítico que injeta contexto pré-computado (acabamentos, transferências recentes) — o modelo "adivinha" a partir daí em vez de consultar dados sob demanda.
- Sem ferramentas (`tools`) reais: hoje o agente responde texto livre, então qualquer número/tabela sai do palpite do LLM.
- Histórico da conversa é enviado, mas sem resumo/âncora — referências como "esse item" dependem do LLM adivinhar.
- Nenhuma ação de escrita: Fio só lê.

## Arquitetura proposta
Migrar de "prompt com contexto injetado" para **AI SDK tool calling** com Gemini 3.1 Pro (padrão) e OpenAI GPT-5.5 como fallback do admin. Cada ferramenta é código Deno determinístico com SQL parametrizado — o modelo escolhe a tool, o servidor executa, o resultado volta ao modelo para formatação. Isso elimina "invenção" de números.

### Fase 1 — Contexto e follow-ups (prioridade 1)
1. **Memória curta estruturada**: manter no thread os últimos N "focos" (item, acabamento, transferência, período) num JSON `conversation_focus`. Extraído a cada turno via segunda chamada barata ao Gemini Flash Lite.
2. **Resolver referências**: quando o usuário disser "esse item", "no mesmo acabamento", "e em julho?", o servidor injeta o `conversation_focus` no prompt como fatos duros ("Item atual: TC.000.033. Acabamento atual: 198. Período atual: 2026-07."). Se o foco estiver vazio, o Fio **é obrigado** a usar `ask_user` — regra já existe, mas hoje é ignorada por falta de fatos.
3. **Regra dura no prompt**: "Se um número, código, data ou nome não estiver no `conversation_focus` nem foi retornado por uma tool nesta resposta, você não pode escrevê-lo. Chame `ask_user` ou uma tool."

### Fase 2 — Ferramentas determinísticas (base para tudo)
Novas tools registradas no Edge Function (Zod schemas, `execute` no servidor):
- `buscar_item(codigo|descricao)` → row de `itens_cadastro` + saldo Auge.
- `listar_itens_do_acabamento(chave_acabamento)` → junta `auge_acabamento_itens` + `itens_cadastro`.
- `listar_transferencias(filtros: {periodo, deposito_origem, deposito_destino, item, status, limite})`.
- `saldo_item(codigo, {deposito?})` → `auge_produtos_saldo`.
- `kardex_item(codigo, periodo)` → `auge_movimentacoes`.
- `posicao_estoque(item|endereco)` → `estoque_posicoes`.
- `historico_conferencias({periodo, conferente?, item?})`.

Cada tool retorna JSON compacto e é logada em `ai_chat_history` (já existe) para auditoria.

### Fase 3 — Relatórios e exportação
- Tool `gerar_relatorio({tipo, filtros, formato: "tabela"|"csv"|"xlsx"})`.
- Tipos v1: `transferencias`, `saidas`, `entradas`, `saldo_por_deposito`, `movimentacoes_por_item`, `conferencias_por_conferente`.
- Servidor executa SELECT parametrizado, gera arquivo em memória e retorna:
  - Preview (primeiras 20 linhas) para o chat renderizar como tabela Markdown.
  - URL assinada de download (bucket `relatorios-fio`, expira em 1h). Novo bucket + policy nesta fase.
- UI: card de download aparece na resposta quando `download_url` está presente (novo componente `<ReportCard>` em `src/components/agent/`).

### Fase 4 — Ações de escrita com confirmação
Tools com `needsApproval: true` (padrão AI SDK):
- `criar_rascunho_transferencia({origem, destino, itens[]})`.
- `salvar_abreviacao({codigo_auge, sigla})` (já existe backend).
- `marcar_reserva({item, quantidade, endereco})`.

Fluxo: Fio propõe → UI mostra `<ConfirmActionCard>` com resumo + botões "Confirmar" / "Cancelar" → só executa após clique. Sem confirmação, nunca escreve.

## Entregáveis por fase
- **F1**: `supabase/functions/ai-agent/index.ts` (extrair foco, injetar fatos, endurecer regras). ~1 arquivo.
- **F2**: `supabase/functions/ai-agent/tools.ts` (novo) + wiring com AI SDK `streamText({ tools, stopWhen: stepCountIs(50) })`. Refatora index.ts para usar tools em vez de contexto pré-injetado. ~3 arquivos.
- **F3**: migração (bucket `relatorios-fio`) + `tools.ts` estendido + `src/components/agent/ReportCard.tsx` + render no `AgentChatWidget`. ~4 arquivos + 1 migração.
- **F4**: `ConfirmActionCard.tsx` + parsing de `[[CONFIRM_ACTION]]` no widget + tools de escrita. ~3 arquivos.

## Ordem de execução sugerida
F2 primeiro (base determinística) → F1 (contexto usa as tools) → F3 → F4. Sem F2, F1 ainda deixaria o modelo inventar; por isso proponho começar pelas tools mesmo que a prioridade #1 do usuário seja contexto.

## Fora de escopo desta rodada
- Sem RAG/embeddings — as tools SQL cobrem os dados estruturados que o app tem.
- Sem multi-agente/planner — `stepCountIs(50)` do AI SDK já resolve loops de tool.
- Sem streaming de arquivos grandes (>10k linhas) — split por período nessa versão.

## Confirmação
Posso começar por **F2 (tools determinísticas)** — é o alicerce que destrava todas as outras. Ok seguir, ou prefere que eu comece por outra fase?