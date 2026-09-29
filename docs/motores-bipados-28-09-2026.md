# Motores Bipados 28/09/2026 - CSV Gerado

## Resumo da Consulta

**Data:** 28/09/2026
**Total de registros:** 100 motores bipados encontrados
**Tipo:** `modo_origem IN ('motor', 'controle')`

## Resultados

| Quantidade | Contagem | Status |
|------------|----------|--------|
| 0 (pendente) | 10 | `edited_by` vazio - aguardando confirmação |
| 2 | 10 | Quantidade ajustada |
| 3 | 10 | Quantidade ajustada |
| 4 | 10 | Quantidade ajustada |
| 5 | 10 | Quantidade ajustada |
| 6 | 2 | Quantidade ajustada |

## Análise

**Problema identificado:** Todos os motores bipados hoje possuem `edited_by=""` (vazio), indicando que foram criados em lote mas NÃO foram editados/bipados individualmente por visitantes.

**Lotes com quantidade nula (pendentes):**
- ERD4540260500279
- ERD4540260500281
- ERD4540260500289
- ERD4540260500277
- ERD4540260500291
- ERD4540260500282
- ERD4540260500280
- ERD4540260500288
- ERD4540260500283
- ERD4540260500290

## Link para download do CSV

:o_file: [motores-bipados-28-09-2026.csv](./motores-bipados-28-09-2026.csv)

## Próximos passos

1. Verificar se esses itens estão realmente no Pente Fino
2. Confirmar se a bipagem foi feita por visitantes reais
3. Atualizar `edited_by` com o usuário correto se necessário