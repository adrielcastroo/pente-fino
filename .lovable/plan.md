## Plano de Alterações

### 1. Banco de dados — Migration

Adicionar colunas `started_at` e `finished_at` (timestamp with time zone, nullable) na tabela `conferences` para registrar hora de início e fim da conferência automaticamente.

### 2. Diversos — Ajustes de campos por tipo

**Celular:**

- Trocar o campo NF por PROC (com travamento, igual ao Coulisse/IA)
- Usar M Linear direto (entrada direta, sem M²)
- Campos: Item, PROC, M Linear, Lote/Batch, Endereço, Lote Final

**Cortina:**

- Manter NF + adicionar campo Largura (calculada do item, como no Coulisse)
- M² como entrada, M Linear calculado = M² / largura
- Campos: Item, NF, Largura, M², M Linear, Lote/Batch, Endereço, Lote Final

**Rolo:**

- Manter NF + adicionar campo Largura (calculada do item, como no Coulisse)
- M² como entrada, M Linear calculado = M² / largura
- Campos: Item, NF, Largura, M², M Linear, Lote/Batch, Endereço, Lote Final

**PVT:** permanece como está (Item, NF, M Linear, Lote/Batch).

### 3. Endereço — Auto-formatação

Ao digitar no campo endereço, o sistema automaticamente:

- Converte tudo para maiúsculo (já faz)
- Insere um ponto `.` após os primeiros 4 caracteres
- Insere outro ponto `.` após o próximo caractere seguinte ao primeiro ponto
- Exemplo: digitando `TEC01AN03` → exibe `TEC0.1.AN03` → na verdade, o padrão é `TEC01.A.N03`, então: após 5 chars insere ponto, após o char seguinte insere outro ponto
- Lógica: se o usuário digitar `TEC01AN03`, o sistema formata como `TEC01.A.N03`

### 4. Histórico — Nome da pasta por NF

Para conferências do modo "Diversos", o nome exibido na pasta do histórico será o nº da NF (em vez do processo). Manter o comportamento atual para Coulisse/IA.

Mostrar "Item/Referência" dentro da pasta na mesma formatação que a planilha (conforme layout de colunas já definido).

### 5. Histórico — Hora de início e fim

- `started_at`: registrado quando o primeiro registro é adicionado à sessão atual (salvo em localStorage/memória)
- `finished_at`: registrado no momento do arquivamento/exportação
- Exibido no card da conferência no histórico

### 6. Planilha (Excel) — Ajuste de colunas por tipo

Atualizar `registroColumns.ts` para os novos layouts:

- **Rolo**: Item, NF, Largura, M², M Linear, Lote/Batch, Endereço, Lote Final
- **Cortina**: Item, NF, Largura, M², M Linear, Lote/Batch, Endereço, Lote Final
- **Celular**: Item, PROC, M Linear, Lote/Batch, Endereço, Lote Final
- **PVT**: NF, M Linear, Lote/Batch (sem mudança)

### Arquivos afetados

- `supabase/migrations/` — nova migration para `started_at`, `finished_at`
- `src/store/useAppStore.ts` — `sessionStartedAt`, archiveAndClear com timestamps, Conference type
- `src/components/LeftPanel.tsx` — campos dinâmicos para Celular (PROC), Rolo/Cortina (largura+M²), auto-formatação endereço
- `src/components/HistoryPanel.tsx` — nome pasta por NF, exibir horários início/fim
- `src/lib/registroColumns.ts` — novos layouts para Rolo, Cortina, Celular
- `src/components/RightPanel.tsx` / `TopBar.tsx` — se necessário para colunas dinâmicas na sessão

### Detalhes técnicos

- Auto-formatação do endereço: interceptar `onChange`, remover pontos existentes, re-inserir nos pontos corretos (posição 4 e 6 do texto limpo), manter regex de validação existente.
- Celular usa `processo` em vez de `nf`, então `requiresProcesso` e `requiresNF` passam a depender também do `diversosTipo`.
- `started_at` será salvo em memória do store quando `addRegistro` é chamado pela primeira vez numa sessão vazia.

No lote final tanto o campo (NF e PROC), precisam aparecer no lote final com o exato exemplo que vou mostrar: PROC 2555/25 | NF 2985.  
  
PROC e NF precisam aparecer escritos no lote final com espaçamento.  
Seguindo a regra de campos definida anteriormente  
