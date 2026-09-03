# 📊 População da Base de Dados - Regras de Faturamento

## ✅ Resumo do Que Foi Feito

Foram processados **1.880 clientes** da planilha "Esboço geral-2.xlsx", sendo:
- **1.844 clientes ativos** (populados)
- **36 clientes inativos** (ignorados)

## 📁 Arquivos Gerados

| Arquivo | Tamanho | Descrição |
|---|---|---|
| `supabase/migrations/20260902000000_faturamento_regras.sql` | 4.3KB | Schema das tabelas |
| `supabase/migrations/20260902000001_popular_faturamento_regras.sql` | 1MB | INSERTs dos 1.844 clientes |
| `supabase/functions/expedicao-auto-romaneio/index.ts` | 13KB | Edge Function |
| `src/pages/expedicao/RomaneioPage.tsx` | 34KB | Página do Romaneio |

## 📊 Distribuição das Regras

| Modalidade | Quantidade | % |
|---|---|---|
| CIF (apenas) | 951 | 51.6% |
| FOB (apenas) | 423 | 22.9% |
| CIF_FOB (ambos) | 470 | 25.5% |

## 🚀 Como Popularem o Banco

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) do seu projeto Pente Fino
2. Vá em **SQL Editor**
3. Copie e execute **primeiro** o arquivo:
   ```
   supabase/migrations/20260902000000_faturamento_regras.sql
   ```
4. Depois copie e execute o arquivo:
   ```
   supabase/migrations/20260902000001_popular_faturamento_regras.sql
   ```
5. Verifique com: `SELECT COUNT(*) FROM faturamento_regras;`

### Opção 2: Via CLI (se tiver Supabase CLI instalado)

```bash
cd C:\Users\adriel.avila\pente-fino
supabase db push
```

### Opção 3: Via Script Python

```bash
pip install supabase python-dotenv
python scripts/import_faturamento.py
```

## ✨ Funcionalidades Implementadas

### Aba "Romaneio"
- ✅ Gerador automático (1-7 dias à frente)
- ✅ Preview em tabela com: cliente, modalidade, transportadora, peças
- ✅ Histórico de gerações com detalhes

### Aba "Regras de Frete"
- ✅ Dashboard com estatísticas
- ✅ Tabela completa com busca e filtros
- ✅ Modal CRUD (criar/editar/excluir)
- ✅ Importação via Excel (.xlsx)

## 🔧 Próximos Passos

1. **Deploy da Edge Function**:
   ```bash
   supabase functions deploy expedicao-auto-romaneio
   ```

2. **Testar importação via UI**:
   - Abra a aba "Regras de Frete"
   - Clique em "Importar Excel"
   - Selecione o arquivo Excel original

3. **Testar geração de romaneio**:
   - Abra a aba "Romaneio"
   - Defina dias à frente (ex: 3)
   - Clique em "Gerar Romaneio"

## 📝 Notas Importantes

- O SQL de popular tem ~46 mil linhas (1.844 inserts)
- Algumas regras têm transportadoras não padronizadas que precisam de ajuste manual
- Clientes sem regra de frete explícita foram inseridos com valor NULL
- Dados brutos estão salvos em: `/tmp/faturamentos_unilux.json`
