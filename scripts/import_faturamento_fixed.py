#!/usr/bin/env python3
"""
Script de importação - Insere clientes no Supabase
Usa psycopg2 para conexão direta com o banco
"""
import json
import re
from datetime import datetime

# Load records
with open("C:/Users/adriel.avila/AppData/Local/Temp/faturamento_import_ready.json", "r", encoding="utf-8") as f:
    records = json.load(f)

print(f"Total records: {len(records)}")

# Generate individual INSERT statements with proper escaping
def escape_sql(value):
    """Escape SQL string values"""
    if value is None:
        return "NULL"
    if isinstance(value, str):
        # Escape single quotes by doubling them
        return "'" + value.replace("'", "''").replace("\\", "\\\\") + "'"
    if isinstance(value, float):
        return str(value)
    if isinstance(value, dict):
        return "'{" + str(value).replace("'", "\\'").replace('"', '').replace(':', ':').replace(',', ',') + "}'"
    return str(value)

# Create batches of 50 records each
batch_size = 50
batches = []
for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    batches.append(batch)

print(f"Created {len(batches)} batches of ~{batch_size} records each")

# Generate SQL file with individual INSERT statements
output_lines = []
output_lines.append("-- ============================================================")
output_lines.append("-- Faturamento Regras - População Automática")
output_lines.append(f"-- Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
output_lines.append(f"-- Total: {len(records)} clientes ativos")
output_lines.append("-- ============================================================\n")

for batch_idx, batch in enumerate(batches):
    output_lines.append(f"\n-- BATCH {batch_idx + 1}/{len(batches)} ({len(batch)} records)\n")
    
    for record in batch:
        # Build INSERT statement
        cols = ["codigo_cliente", "nome_cliente", "modalidade_frete", 
                "valor_minimo_frete", "transportadora_cif", "transportadora_fob",
                "frequencia_envio", "grupo_economico", "status", "condicao_pagamento",
                "limite_credito", "dados_extra", "observacoes"]
        
        vals = []
        for col in cols:
            val = record.get(col)
            vals.append(escape_sql(val))
        
        values_str = ", ".join(vals)
        output_lines.append(f"INSERT INTO public.faturamento_regras ({', '.join(cols)}) VALUES ({values_str});")

# Write to file
output_content = "\n".join(output_lines)
output_path = "C:/Users/adriel.avila/AppData/Local/Temp/faturamento_insert_escaped.sql"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(output_content)

print(f"\n✅ Generated SQL file with {len(records)} INSERT statements")
print(f"📄 File saved to: {output_path}")
print(f"📊 Total file size: {len(output_content)} bytes")

# Show first few records as preview
print("\n=== PREVIEW (First 3 records) ===")
for i, record in enumerate(records[:3]):
    print(f"{i+1}. {record['codigo_cliente']}: {record['nome_cliente']}")
