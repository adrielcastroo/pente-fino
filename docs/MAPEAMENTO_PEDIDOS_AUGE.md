# Mapeamento de Pedidos - Auge Suite → Pente Fino

## 📊 Estrutura de Dados Identificada (HAR)

### Campos da API `getListaGestaoPedidos.php`

| Campo Auge | Descrição | Tipo | Mapeamento Pente Fino |
|------------|-----------|------|----------------------|
| `CardName` | Nome do Cliente | String | `nome_cliente` |
| `NumAtCard` | Nº Pedido (Código Alt) | String | `numero_pedido` |
| `idSituacao` | ID da Situação/Status | Number | `id_status` |
| `dsStatusTMS` | Status TMS (com tracking) | String | `status_tms` |
| `dtEfetivacao` | Data Efetivação | Date | `data_efetivacao` |
| `DocDueDate` | Data Entrega Prevista | Date | `data_entrega` |
| `vlTotalPedido` | Valor Total do Pedido | Decimal | `valor_total` |
| `SlpName` | Nome do Supervisor/Vendedor | String | `supervisor` |
| `vlProdutos` | Valor dos Produtos | Decimal | `valor_produtos` |
| `vlImpostos` | Valor dos Impostos | Decimal | `valor_impostos` |
| `DocDate` | Data do Documento | Date | `data_documento` |
| `U_dsCliFim` | Descrição Cliente Final | String | `cliente_final` |
| `invoice_number` | Número da NF | String | `numero_nf` |
| `invoice_serie` | Série da NF | String | `serie_nf` |
| `cdCliente` | Código do Cliente | String | `codigo_cliente` |
| `transp` | Transportadora | String | `transportadora` |
| `obs` | Observações | String | `observacoes` |

## 🔍 Parâmetros de Busca (POST)

```
pesquisa[idAcao] = 1 (busca dados) ou 0 (limpa)
pesquisa[cdSupervisor] = Código do supervisor
pesquisa[cdCliente] = Código do cliente (ex: C0593)
pesquisa[nrRefPedido] = Referência do pedido
pesquisa[nmClienteFinal] = Nome do cliente final
pesquisa[dtPedidoDe] = Data início (DD/MM/YYYY)
pesquisa[dtPedidoAte] = Data fim
pesquisa[dtEntregaDe] = Data entrega início
pesquisa[dtEntregaAte] = Data entrega fim
pesquisa[valueAnaliseTecnica] = N (não tem análise técnica)
pesquisa[Situacao][] = Array de IDs: [10, 12, 40, 20, 30, 50, 55, 60]
```

## 📋 Status Identificados (IDs)

| ID | Significado (provável) |
|----|------------------------|
| 10 | Aberto / Em Análise |
| 12 | Aguardando Autorização |
| 20 | Autorizado |
| 30 | Em Separação |
| 40 | Separado / Aguardando Frete |
| 50 | Facturado |
| 55 | Enviado |
| 60 | Entregue |

## 🎯 Funcionalidade a ser Implementada

### 1. Consulta em Tempo Real
- Botão "Consultar Pedidos" na aba Faturamento
- Filtros: Data início/fim, Cliente, Status
- Exibe tabela com todos os campos mapeados

### 2. Integração com Faturamento
- Ao importar romaneio, cruzar dados do Auge
- Preencher automaticamente: transportadora, valor, status
- Atualizar pedidos conforme mudança de status

### 3. Dashboard de Pedidos
- Lista de pedidos por status
- Valor total por dia
- Transportadoras mais usadas
- Pedidos atrasados (data entrega < hoje)

## 📝 Próximos Passos

1. Criar componente de consulta de pedidos
2. Implementar busca via AJAX no Auge
3. Mapear dados para a tabela de faturamento
4. Adicionar botão de importação em lote
