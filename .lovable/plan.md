
Objetivo: adicionar travamento para PROC e NF com o mesmo comportamento já existente no Endereço, mantendo a lógica atual por modo e sem alterar regras de obrigatoriedade.

1. Estado global para travamento
- Expandir `src/store/useAppStore.ts` com novos estados:
  - `lockProcesso` / `lockedProcesso`
  - `lockNf` / `lockedNf`
- Criar setters equivalentes aos de endereço.
- Persistir esses valores em memória do app como já acontece com o endereço, para que o formulário reutilize o valor travado entre registros.

2. Aplicar travamento no campo PROC
- Em `src/components/LeftPanel.tsx`, no bloco de PROC (hoje exibido quando `requiresProcesso`), adicionar botão `Travar/Travado` com o mesmo padrão visual do endereço.
- Comportamento:
  - ao travar, salva o valor atual de `processo`
  - ao destravar, libera edição
  - quando travado, o input fica somente leitura e continua preenchido após `resetForm`
- Impacto por modo:
  - aparece apenas em `Coulisse` e `IA`
  - continua obrigatório nesses modos

3. Aplicar travamento no campo NF
- Em `src/components/LeftPanel.tsx`, no bloco de NF do modo `Diversos`, adicionar botão `Travar/Travado` com a mesma UX.
- Comportamento:
  - ao travar, salva o valor atual de `nf`
  - ao destravar, libera edição
  - quando travado, o NF permanece preenchido entre vários lançamentos
- Impacto por modo:
  - aparece apenas em `Diversos`
  - continua obrigatório em todos os tipos de tecido de `Diversos`

4. Sincronização com reset e fluxo de teclado
- Ajustar `resetForm()` para:
  - manter PROC se `lockProcesso` estiver ativo
  - manter NF se `lockNf` estiver ativo
  - continuar mantendo Endereço se `lockEndereco` estiver ativo
- Ajustar navegação por Enter:
  - PROC travado deve pular direto para o próximo campo
  - NF travado deve pular para o próximo campo
- Garantir que os refs atuais (`itemRef`, `nfRef`, etc.) sigam com foco previsível.

5. Preview e validação
- A validação obrigatória não muda:
  - `CONFERENTE` sempre obrigatório
  - `PROC` obrigatório em Coulisse/IA
  - `NF` obrigatório em Diversos
- Se o campo estiver travado mas vazio, a validação continua bloqueando o cadastro.
- O card de cálculo e o `Lote Sistema` continuam usando o valor atual do store, então o PROC travado refletirá automaticamente no resultado.

6. Responsividade e consistência visual
- Reaproveitar exatamente o padrão já usado no Endereço:
  - botão pequeno no cabeçalho do campo
  - ícones `Lock/Unlock`
  - destaque visual no input quando travado
- Isso mantém consistência em smartphone, tablet e desktop sem criar um novo padrão de UI.

Arquivos afetados
- `src/store/useAppStore.ts`
  - adicionar estados e setters para travamento de PROC e NF
- `src/components/LeftPanel.tsx`
  - adicionar botões de travamento
  - sincronizar valores travados
  - ajustar reset e navegação por Enter

Detalhes técnicos
- O jeito mais seguro é seguir o mesmo modelo já existente para endereço, em vez de criar uma abstração nova agora.
- Como `processo` já vive no store e `nf` vive localmente no componente, o plano é:
  - travar PROC usando store + valor travado global
  - travar NF com estado global de trava + valor travado global para reaplicar no formulário
- Não precisa migration nem mudança no backend, porque é comportamento de preenchimento do formulário, não dado persistido extra.

Resultado esperado
- O usuário poderá travar `PROC` em Coulisse/IA para lançar vários registros no mesmo processo.
- O usuário poderá travar `NF` em Diversos para lançar vários registros com a mesma nota fiscal.
- O comportamento será igual ao do Endereço: valor mantido, input protegido e fluxo mais rápido para conferência em sequência.
