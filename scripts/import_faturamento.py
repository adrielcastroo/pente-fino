#!/usr/bin/env python3
"""
Script para popular a tabela faturamento_regras no Supabase

REQUISITOS:
1. Ter a SERVICE_ROLE_KEY do Supabase (mais permissões que a anon key)
2. Executar: pip install supabase requests python-dotenv

COMO OBTER A SERVICE_ROLE_KEY:
1. Acesse https://supabase.com/dashboard/project/ymqrfgqdmgjbwpikcwnk/settings/api
2. Copie a "Service Role Key" (não a Anon Public Key)
3. Adicione ao .env: SUPABASE_SERVICE_ROLE_KEY=sua_chave
   OU passe como variável de ambiente:
   export SUPABASE_SERVICE_ROLE_KEY=sua_chave
"""
import json
import sys
import os
import requests
from pathlib import Path

# Configuration - ATUALIZE COM SUAS CREDENCIAIS
SUPABASE_URL = 'https://ymqrfgqdmgjbwpikcwnk.supabase.co'

# Try to get from environment
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
ANON_KEY = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')

# Fallback to hardcoded (INSEGURO - use apenas para testes locais)
if not SERVICE_ROLE_KEY:
    print("⚠️  SUPABASE_SERVICE_ROLE_KEY não definida no ambiente")
    print("   Opções:")
    print("   1. Adicione ao arquivo .env: SUPABASE_SERVICE_ROLE_KEY=sua_chave")
    print("   2. Execute: export SUPABASE_SERVICE_ROLE_KEY='sua_chave'")
    print("   3. Ou insira manualmente abaixo:\n")
    SERVICE_ROLE_KEY = input("Cole aqui a Service Role Key do Supabase: ").strip()

print("\n" + "=" * 60)
print("📥 IMPORTADOR DE REGRAS DE FATURAMENTO")
print("=" * 60)
print(f"🔗 URL: {SUPABASE_URL}")
print(f"🔑 Usando Service Role Key: {'✓' if SERVICE_ROLE_KEY else '✗'}")

# Load records
print(f"\n📦 Carregando registros...")
records_path = Path('C:/Users/adriel.avila/AppData/Local/Temp/faturamento_import_ready.json')
if not records_path.exists():
    print(f"❌ Arquivo não encontrado: {records_path}")
    print("   Execute primeiro: python -c \"import json; ...\" para gerar")
    sys.exit(1)

with open(records_path, 'r', encoding='utf-8') as f:
    records = json.load(f)

print(f"   Total: {len(records)} clientes")

# Headers for API
headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Prefer': 'return=minimal'
}

# Test connection
print(f"\n🔍 Testando conexão...")
try:
    test = requests.get(
        f'{SUPABASE_URL}/rest/v1/faturamento_regras',
        headers=headers,
        params={'limit': '1'}
    )
    
    if test.status_code == 200:
        print("   ✅ Conexão estabelecida!")
    elif test.status_code == 404:
        print("   ❌ Tabela não existe!")
        print("\n   📋 EXECUTE A MIGRATION PRIMEIRO:")
        print(f"   1. Acesse: https://supabase.com/dashboard/project/ymqrfgqdmgjbwpikcwnk/sql/new")
        print("   2. Copie o conteúdo de:")
        print("      supabase/migrations/20260902000000_faturamento_regras.sql")
        print("   3. Execute e depois retorne aqui")
        sys.exit(1)
    elif test.status_code == 401:
        print("   ❌ Credenciais inválidas!")
        print(f"   Verifique se a Service Role Key está correta")
        sys.exit(1)
    else:
        print(f"   ⚠️  Status: {test.status_code}")
        print(f"   Response: {test.text[:200]}")
        
except Exception as e:
    print(f"   ❌ Erro de conexão: {e}")
    sys.exit(1)

# Clear existing data
print(f"\n🗑️  Limpando dados existentes...")
try:
    delete = requests.delete(
        f'{SUPABASE_URL}/rest/v1/faturamento_regras',
        headers=headers,
        params={'id': 'ne.00000000-0000-0000-0000-000000000000'}
    )
    print(f"   ✅ Dados limpos (status: {delete.status_code})")
except Exception as e:
    print(f"   ⚠️  Erro ao limpar: {e}")

# Insert in batches
print(f"\n📥 Inserindo {len(records)} registros...")
batch_size = 50
success_count = 0
error_count = 0
failed_batches = []

for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    batch_num = (i // batch_size) + 1
    total_batches = (len(records) - 1) // batch_size + 1
    
    try:
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/faturamento_regras',
            headers=headers,
            json=batch
        )
        
        if response.status_code in [200, 201]:
            success_count += len(batch)
            print(f"   [{batch_num}/{total_batches}] ✅ {len(batch)} inseridos")
        else:
            error_count += len(batch)
            failed_batches.append({
                'batch': batch_num,
                'status': response.status_code,
                'error': response.text[:200]
            })
            print(f"   [{batch_num}/{total_batches}] ❌ HTTP {response.status_code}")
            
            # Show first few errors
            if len(failed_batches) <= 3:
                print(f"         Error: {response.text[:100]}...")
                
    except Exception as e:
        error_count += len(batch)
        print(f"   [{batch_num}/{total_batches}] ❌ {str(e)[:50]}...")

# Final verification
print(f"\n🔍 Verificando总数...")
try:
    verify = requests.get(
        f'{SUPABASE_URL}/rest/v1/faturamento_regras',
        headers=headers,
        params={'count': 'exact'}
    )
    
    if verify.status_code == 200:
        # Count is in the Link header
        count_header = verify.headers.get('link', '')
        import re
        count_match = re.search(r'count=(\d+)', count_header)
        if count_match:
            actual_count = int(count_match.group(1))
            print(f"   Total na base: {actual_count} registros")
        else:
            actual_count = success_count
            print(f"   Total estimado: {success_count} registros")
    else:
        actual_count = success_count
        print(f"   Não foi possível verificar, estimado: {success_count}")
        
except Exception as e:
    actual_count = success_count
    print(f"   Estimado: {success_count}")

# Summary
print(f"\n{'=' * 60}")
print("📊 RESUMO DA IMPORTAÇÃO")
print("=" * 60)
print(f"Total processado: {len(records)}")
print(f"Inseridos com sucesso: {success_count}")
print(f"Erros: {error_count}")
print(f"Taxa de sucesso: {(success_count/len(records))*100:.1f}%")

if error_count == 0:
    print(f"\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
    print(f"\n📊 Seus {actual_count} clientes estão prontos para uso no Pente Fino!")
else:
    print(f"\n⚠️  {error_count} registros falharam")
    if failed_batches:
        print(f"\nBatches com erro:")
        for fb in failed_batches[:5]:
            print(f"  - Batch {fb['batch']}: HTTP {fb['status']}")

print(f"\n💡 Para verificar no Supabase:")
print(f"   SELECT COUNT(*) FROM faturamento_regras;")
print(f"\n💡 Para ver os dados na UI do Pente Fino:")
print(f"   Abra http://localhost:8080/expedicao/romaneio")
print(f"   Vá para a aba 'Regras de Frete'")
