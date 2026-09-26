# Romaneio: verificação automática de valor mínimo de frete

## Entendimento
Ao importar a planilha na tela de Romaneio, o Pente Fino deve:
1. Identificar os clientes da planilha.
2. Buscar a regra de frete de cada cliente.
3. Para clientes com valor mínimo, consultar os pedidos no Auge com data de expedição igual à data do romaneio.
4. Somar esses pedidos, dizer se o mínimo foi atingido e escolher a transportadora pela regra.

## Como funciona hoje
- A importação lê a planilha e só escolhe a transportadora pela modalidade (CIF/FOB), sem olhar valor mínimo nem pedidos.
- O romaneio é salvo com a data do dia da importação, e não com a data que está na planilha.
- Existe uma cópia dos pedidos do Auge no banco (atualizada pela sincronização), com valor total, data de entrega prevista e nome do cliente. Ela **não tem o código do cliente**, só o nome.

## O que será feito
1. **Consulta ao vivo no Auge** (nova ação na sincronização existente): recebe a data do romaneio e a lista de clientes, busca os pedidos do Auge filtrados por essa data de expedição e devolve o total por cliente. Se o Auge não responder, usa a cópia local dos pedidos como plano B.
2. **Regra de decisão por cliente** (vale só quando a regra tem valor mínimo):
   - Total >= mínimo → transportadora CIF (frete por nossa conta).
   - Total < mínimo → transportadora FOB (frete por conta do cliente) e o cliente fica marcado como "abaixo do mínimo".
   - Sem valor mínimo → mantém a lógica atual por modalidade.
   - A instrução "Agrupar..." vinda da planilha continua tendo prioridade, como hoje.
3. **Pré-visualização da importação** ganha colunas: Regra, Valor dos pedidos, Mínimo, Situação (Atingido / Abaixo / Sem regra / Sem pedidos) e Transportadora escolhida, antes do botão "Confirmar Importação".
4. **Data do romaneio** passa a ser a data que vem na planilha (a mais frequente); se não houver, usa a data de hoje.
5. Ao salvar, cada linha grava o valor encontrado e a marcação de exceção (campos que já existem nas linhas do romaneio).

## Premissas (confirme ou corrija)
- A "data de expedição" do pedido no Auge é a **data de entrega prevista**.
- A ligação pedido ↔ cliente é feita pelo **nome do cliente** (normalizado, sem acentos/pontuação), já que os pedidos não trazem o código. Se o Auge devolver o código na consulta ao vivo, ele terá prioridade.
- Pedidos cancelados não entram na soma.

## Detalhes técnicos
- Arquivos: `supabase/functions/auge-sync/index.ts` (nova ação `romaneio_valor_minimo`, reaproveitando `fetchPedidos`/`mapPedidoAuge`), `src/components/expedicao/RomaneioImportDialog.tsx` (chamada após o parse + colunas novas), `src/pages/expedicao/RomaneioPage.tsx` (`handleImportRomaneio` usa o resultado e a data da planilha).
- Lógica de decisão extraída para `src/lib/expedicao/regraFrete.ts` com testes unitários.
- Sem mudanças no banco.

## Riscos
- Nomes de clientes diferentes entre planilha e Auge podem não casar → aparecem como "Sem pedidos" para revisão manual.
- Tempo de resposta do Auge com muitos clientes; a consulta é feita uma vez por data, não por cliente.
