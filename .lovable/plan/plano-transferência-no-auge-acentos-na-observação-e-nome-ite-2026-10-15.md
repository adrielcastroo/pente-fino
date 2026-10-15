# Plano: Transferência no Auge — acentos na observação e "Nome Item" vazio

## Diagnóstico (confirmado no código e nas gravações do Auge)

**1. Item sem descrição ("Nome Item" vazio)**
- O app envia o código do item com um asterisco no final: `cdItem[] = "1.1.003.001.1*"` (criarTransferencia e atualizarTransferencia, no auge-sync).
- A gravação real do portal Auge (unilux.auge.app-transferencia.har) envia o código puro: `cdItem[] = 1.1.003.001.1`, sem asterisco.
- O `*` é o curinga da busca de itens do Auge, não do cadastro. O Auge grava a linha com o código literal "X*", que não corresponde a nenhum item — por isso a coluna "Nome Item" fica vazia.
- Risco secundário: se o usuário digitar o código sem escolher na lista, pode ir um código alternativo (ex.: "TC.000.033") em vez do código interno que o Auge usa.

**2. Acentos errados na observação**
- O app envia o texto em UTF-8. O portal Auge é PHP antigo e, ao gravar/exibir, trata o texto como ISO-8859-1 (Latin-1). Resultado: "Transferência" aparece como "TransferÃªncia" ou "?".
- A gravação de referência só tinha "Transf" (sem acento), então a codificação exata precisa ser confirmada com 1 teste real.

## O que será feito

1. **Remover o asterisco** do código em criarTransferencia e atualizarTransferencia, enviando o código exatamente como o portal Auge envia.
2. **Garantir o código interno do item** antes de enviar: se a linha não veio da lista de busca, resolver o código pelo cadastro local (itens/produtos do Auge) e bloquear o envio com mensagem clara se o item não existir.
3. **Codificar a observação no formato que o Auge espera**: montar o corpo do envio com codificação Latin-1 (ç, ã, é, ê etc. preservados), substituindo só caracteres impossíveis em Latin-1 (emoji, aspas curvas) por equivalentes simples.
4. **Teste controlado (somente rascunho, sem efetivar)**: criar 1 rascunho com observação "Transferência ação teste çãé", ler de volta pela consulta de transferências e conferir descrição do item e acentos. Se a versão Latin-1 falhar, alternar para UTF-8 sem asterisco e repetir. O rascunho de teste é excluído em seguida.
5. Aplicar o mesmo ajuste ao fluxo do assistente Fio (transfer-widget), que usa a mesma ação.

## Arquivos

- `supabase/functions/auge-sync/index.ts` — criarTransferencia, atualizarTransferencia, postCtlTransferencia (codificação do corpo).
- `src/components/auge/NovaTransferenciaDialog.tsx` — validação do código interno antes de enviar.

## Riscos

- A codificação Latin-1 precisa ser validada com 1 rascunho real; o plano prevê o teste e o rollback.
- Transferências já criadas com "*" continuam sem nome no Auge; podem ser editadas e reenviadas pela tela.
