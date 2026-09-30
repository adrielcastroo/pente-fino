# Motros Bipados por Visitantes - Consulta SQL

## Para consultar diretamente no Supabase:

```sql
-- 1. Registros de motor/controle criados recentemente
SELECT 
  id,
  item,
  processo,
  lote,
  quantidade,
  modo_origem,
  created_at,
  edited_by,
  edited_at,
  CASE 
    WHEN edited_by IS NULL THEN 'Não bipado por visitante'
    ELSE 'Bipado por visitante'
  END as status_bipagem
FROM registros
WHERE modo_origem IN ('motor', 'controle')
ORDER BY created_at DESC
LIMIT 100;
```

```sql
-- 2. Histórico de contagem (bipagem real)
SELECT 
  hc.id,
  hc.tarefa_id,
  hc.conferente_nome,
  hc.quantidade_contada,
  hc.quantidade_sistema,
  hc.diferenca,
  hc.data_conferencia
FROM historico_contagem hc
JOIN tarefas_contagem tc ON hc.tarefa_id = tc.id
WHERE tc.lote LIKE '%MOTOR%' OR tc.lote LIKE '%CONTROL%'
ORDER BY hc.data_conferencia DESC
LIMIT 100;
```

```sql
-- 3. Verificar se itens estão salvos (não bipados)
SELECT 
  COUNT(*) as total_nao_salvo,
  modo_origem
FROM registros
WHERE modo_origem IN ('motor', 'controle')
  AND item IS NOT NULL
  AND item != ''
GROUP BY modo_origem;
```

## Como usar:
1. Acesse https://supabase.com/dashboard → Seu Projeto → SQL Editor
2. Cole uma das queries acima
3. Execute para ver os resultados

## Dúvidas comuns:
- **"Itens não salvos"**: Se `edited_by` é NULL e `created_at` é recente
- **"Bipado por visitante"**: Se `edited_by` tem um usuário diferente do dono da sessão
- **Falta de dados**: Verifique se a conferência foi finalizada (status na tabela `conferencias`)