
import subprocess

query = """
SELECT r.id, r.item, r.nf, r.m2, r.m_linear, r.largura, r.lote, r.endereco, r.lote_sistema, r.created_at, c.conferente
FROM registros r 
LEFT JOIN estoque_posicoes e ON r.id = e.registro_id 
LEFT JOIN conferences c ON r.conference_id = c.id
WHERE r.nf IN ('109265', '827') AND e.id IS NULL;
"""

def get_records():
    # Use CSV format for robustness
    cmd = ['psql', '-c', f"COPY ({query}) TO STDOUT WITH (FORMAT CSV, HEADER)"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    import csv
    import io
    return list(csv.DictReader(io.StringIO(result.stdout)))

records = get_records()
print(f"Records found: {len(records)}")

addr_counters = {
    'TEC01.D.N04': 1,
    'TEC01.D.N01': 13
}

sql_lines = []

for r in records:
    addr = r['endereco']
    pos = addr_counters[addr]
    addr_counters[addr] += 1
    
    parts = addr.split('.')
    est, col, niv = parts[0], parts[1], int(parts[2].replace('N', ''))
    
    item = r['item'].replace("'", "''")
    nf = r['nf'].replace("'", "''")
    lote = (r['lote'] or '').replace("'", "''")
    lote_sistema = r['lote_sistema'].replace("'", "''")
    conferente = (r['conferente'] or 'Sistema').replace("'", "''")
    rid = r['id']
    m2 = r['m2'] or '0'
    largura = r['largura'] or '0'
    ml = r['m_linear'] or '0'
    cat = r['created_at']

    sql_lines.append(f"INSERT INTO estoque_posicoes (estrutura, coluna, nivel, posicao, status, registro_id, item, proc, m2, largura, m_linear, lote, endereco, lote_sistema, conferente_entrada, data_registro) VALUES ('{est}', '{col}', {niv}, {pos}, 'ocupado', '{rid}', '{item}', '{nf}', {m2}, {largura}, {ml}, '{lote}', '{addr}', '{lote_sistema}', '{conferente}', '{cat}');")
    sql_lines.append(f"UPDATE registros SET posicao = {pos} WHERE id = '{rid}';")

if sql_lines:
    with open('apply.sql', 'w') as f:
        f.write("BEGIN;\n")
        f.write("\n".join(sql_lines))
        f.write("\nCOMMIT;")
    print("SQL generated in apply.sql")
else:
    print("No SQL generated.")
