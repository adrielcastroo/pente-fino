#!/usr/bin/env python3
"""
Script para popular a tabela faturamento_regras no Supabase
Usa o cliente Python oficial do Supabase
"""
import json
import sys
from datetime import datetime

# Try to import supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("Erro: pacote supabase não instalado. Instalando...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase", "--quiet"])
    from supabase import create_client, Client

# Load credentials
import os
tokens_path = os.path.expanduser("~/.hermes/mcp-tokens/supabase.json")
if not os.path.exists(tokens_path):
    tokens_path = "C:/Users/adriel.avila/AppData/Local/hermes/mcp-tokens/supabase.json"

with open(tokens_path, 'r', encoding='utf-8') as f:
    tokens = json.load(f)

SUPABASE_URL = tokens['url']
SUPABASE_KEY = tokens['service_role_key']

print(f"Conectando ao Supabase...")
print(f"URL: {SUPABASE_URL[:50]}...")

# Initialize client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load records
print("\nCarregando dados dos clientes...")
with open("C:/Users/adriel.avila/AppData/Local/Temp/faturamento_import_ready.json", "r", encoding="utf-8") as f:
    records = json.load(f)

print(f"Total de registros: {len(records)}")

# Check existing records
print("\nVerificando registros existentes...")
existing = supabase.table('faturamento_regras').select('codigo_cliente').execute()
existing_codes = {r['codigo_cliente'] for r in existing.data}
print(f"Registros já existentes: {len(existing_codes)}")

# Filter out existing records
new_records = [r for r in records if r['codigo_cliente'] not in existing_codes]
print(f"Novos registros para inserir: {len(new_records)}")

if not new_records:
    print("\nNenhum novo registro para inserir!")
    sys.exit(0)

# Insert in batches
BATCH_SIZE = 25
total_inserted = 0
start_time = datetime.now()

for i in range(0, len(new_records), BATCH_SIZE):
    batch = new_records[i:i+BATCH_SIZE]
    batch_num = i // BATCH_SIZE + 1
    total_batches = (len(new_records) + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"\rLote {batch_num}/{total_batches} ({len(batch)} registros)...", end="", flush=True)
    
    try:
        # Insert batch
        result = supabase.table('faturamento_regras').insert(batch).execute()
        total_inserted += len(result.data)
    except Exception as e:
        print(f"\nErro no lote {batch_num}: {e}")
        # Try inserting one by one
        for record in batch:
            try:
                supabase.table('faturamento_regras').insert(record).execute()
                total_inserted += 1
            except Exception as e2:
                print(f"\nErro ao inserir {record['codigo_cliente']}: {e2}")

print(f"\n\nImportação concluída!")
print(f"Registros inseridos: {total_inserted}")
print(f"Tempo total: {datetime.now() - start_time}")

# Verify
print("\nVerificando total na tabela...")
verify = supabase.table('faturamento_regras').select('*').execute()
print(f"Total de registros na tabela: {len(verify.data)}")
