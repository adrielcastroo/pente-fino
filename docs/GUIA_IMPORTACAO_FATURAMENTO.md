# ============================================================
# IMPORTAÇÃO DE REGRAS DE FATURAMENTO - PASSO A PASSO
# ============================================================

## ✅ Resumo
- **Total de clientes:** 1.844 ativos
- **Arquivo SQL:** supabase/migrations/20260902000001_popular_faturamento_regras.sql (1MB)
- **Script Python:** scripts/import_faturamento.py

---

## 🚀 MÉTODO 1: Via Supabase Dashboard (RECOMENDADO)

### Passo 1: Criar a Tabela
1. Acesse: https://supabase.com/dashboard/project/ymqrfgqdmgjbwpikcwnk/sql/new
2. Copie o conteúdo do arquivo:
   ```
   supabase/migrations/20260902000000_faturamento_regras.sql
   ```
3. Clique em **"Run"**

### Passo 2: Inserir os Dados
1. No mesmo SQL Editor, copie o conteúdo do arquivo:
   ```
   supabase/migrations/20260902000001_popular_faturamento_regras.sql
   ```
2. Clique em **"Run"** (pode levar alguns segundos)

### Passo 3: Verificar
Execute:
```sql
SELECT COUNT(*) FROM faturamento_regras;
-- Deve retornar: 1844
```

---

## 🚀 MÉTODO 2: Via Script Python

### Pré-requisitos
```bash
pip install supabase requests python-dotenv
```

### Configurar Credenciais
1. Vá em: https://supabase.com/dashboard/project/ymqrfgqdmgjbwpikcwnk/settings/api
2. Copie a **"Service Role Key"** (não a Anon Key!)
3. Adicione ao arquivo `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
   ```

### Executar
```bash
cd C:\Users\adriel.avila\pente-fino
python scripts/import_faturamento.py
```

---

## 📊 Distribuição das Regras

| Modalidade | Quantidade | % |
|---|---|---|
| CIF (apenas) | 951 | 51.6% |
| FOB (apenas) | 423 | 22.9% |
| CIF+FOB | 470 | 25.5% |

---

## ✅ Pós-Importação

Após popular a base, acesse o Pente Fino:
- **URL:** http://localhost:8080/expedicao/romaneio
- **Aba "Regras de Frete":** Visualize todos os 1.844 clientes
- **Aba "Romaneio":** Gere romaneios automáticos

---

## 📝 Notas

- O arquivo SQL de população tem ~46 mil linhas (1.844 INSERTs)
- Alguns campos podem estar NULL para clientes sem regra específica
- Clientes inativos foram ignorados (36 removidos)
- Transportadoras foram padronizadas (ex: "E" → "Expresso São Miguel")
