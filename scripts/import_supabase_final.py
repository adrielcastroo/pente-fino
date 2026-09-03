#!/usr/bin/env python3
"""
Script para popular a tabela faturamento_regras no Supabase
Usa o cliente oficial supabase-py
"""
import json
from supabase import create_client, Client
import os

# Load records
with open("C:/Users/adriel.avila/AppData/Local/Temp/faturamento_import_ready.json", "r", encoding="utf-8") as f:
    records = json.load(f)

print(f"Total records: {len(records)}")

# Columns to insert (excluding id, created_at, updated_at which are auto-generated)
columns = ['codigo_cliente', 'nome_cliente', 'modalidade_frete', 'valor_minimo_frete', 
           'transportadora_cif', 'transportadora_fob', 'frequencia_envio', 'grupo_economico',
           'status', 'condicao_pagamento', 'limite_credito', 'observacoes', 'dados_extra']

# Supabase connection using project URL
SUPABASE_URL = "https://ymqrfgqdmgjbwpikcwnk.supabase.co"

# Try to get service role key from environment or file
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
if not SUPABASE_KEY:
    # Try to read from file
    try:
        with open("C:/Users/adriel.avila/AppData/Local/hermes/mcp-tokens/supabase.json", "r", encoding="utf-8") as f:
            import json
            tokens = json.load(f)
            SUPABASE_KEY = tokens.get('service_role_key', '')
    except:
        print("ERROR: Cannot find Supabase Service Role Key")
        exit(1)

print(f"Connecting to Supabase with key: {SUPABASE_KEY[:10]}...")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Insert records in batches
BATCH_SIZE = 25
for i in range(0, len(records), BATCH_SIZE):
    batch = records[i:i+BATCH_SIZE]
    batch_num = i // BATCH_SIZE + 1
    
    # Prepare data for insertion
    data = []
    for rec in batch:
        row = {col: rec.get(col) for col in columns}
        data.append(row)
    
    print(f"Inserting batch {batch_num}/{len(records)//BATCH_SIZE + 1} ({len(batch)} records)...")
    
    try:
        result = supabase.table('faturamento_regras').insert(data).execute()
        print(f"  Success: {len(result.data)} records inserted")
    except Exception as e:
        print(f"  ERROR: {e}")
        print(f"  Response: {result}")
        exit(1)

print(f"\nAll {len(records)} records inserted successfully!")

# Verify
result = supabase.table('faturamento_regras').select("*", count="exact").execute()
print(f"\nVerification: {result.count} total records in table")
