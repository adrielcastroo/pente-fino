
import os
import json
import subprocess

def run_query(query):
    result = subprocess.run(['psql', '-c', query, '-t', '-A'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return []
    return result.stdout.strip().split('\n')

# 1. Get the registros to allocate
query = """
SELECT r.id, r.item, r.nf, r.m2, r.m_linear, r.largura, r.lote, r.endereco, r.lote_sistema, r.tipo_tecido, r.modo_origem, r.created_at, c.conferente
FROM registros r 
LEFT JOIN estoque_posicoes e ON r.id = e.registro_id 
LEFT JOIN conferences c ON r.conference_id = c.id
WHERE r.nf IN ('109265', '827') AND e.id IS NULL;
"""

# Fetching with JSON format for easier parsing in python
result = subprocess.run(['psql', '-c', f"COPY ({query}) TO STDOUT WITH (FORMAT CSV, HEADER)"], capture_output=True, text=True)
import csv
import io
reader = csv.DictReader(io.StringIO(result.stdout))
records = list(reader)

print(f"Found {len(records)} records to allocate.")

# 2. Map addresses to positions
# TEC01.D.N04: starts at 1
# TEC01.D.N01: starts at 13
addr_counters = {
    'TEC01.D.N04': 1,
    'TEC01.D.N01': 13
}

insert_values = []
update_queries = []

for r in records:
    addr = r['endereco']
    pos = addr_counters[addr]
    addr_counters[addr] += 1
    
    # Parse address parts
    parts = addr.split('.')
    est, col, niv = parts[0], parts[1], int(parts[2].replace('N', ''))
    
    # Escape single quotes for SQL
    item = r['item'].replace("'", "''")
    lote = (r['lote'] or '').replace("'", "''")
    lote_sistema = r['lote_sistema'].replace("'", "''")
    conferente = (r['conferente'] or 'Sistema').replace("'", "''")
    
    insert_values.append(f"('{est}', '{col}', {niv}, {pos}, 'ocupado', '{r['id']}', '{item}', '{r['nf']}', {r['m2']}, {r['largura']}, {r['m_linear']}, '{lote}', '{addr}', '{lote_sistema}', '{conferente}', '{r['created_at']}')")
    update_queries.append(f"UPDATE registros SET posicao = {pos} WHERE id = '{r['id']}';")

if insert_values:
    # Build a single INSERT statement
    insert_sql = f"""
    INSERT INTO estoque_posicoes 
    (estrutura, coluna, nivel, posicao, status, registro_id, item, proc, m2, largura, m_linear, lote, endereco, lote_sistema, conferente_entrada, data_registro)
    VALUES {', '.join(insert_values)};
    """
    
    print("Executing insertion...")
    subprocess.run(['psql', '-c', insert_sql])
    
    print("Executing updates...")
    for q in update_queries:
        subprocess.run(['psql', '-c', q])

print("Allocation complete.")
