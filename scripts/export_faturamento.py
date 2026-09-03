#!/usr/bin/env python3
"""
Script para exportar regras de faturamento da planilha Excel
para formato JSON (para importar no Supabase)

Uso:
    python scripts/export_faturamento.py input.xlsx output.json
"""

import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Erro: openpyxl não instalado. Instale com: pip install openpyxl")
    sys.exit(1)


def extrair_regra_texto(obs_texto: str) -> dict:
    """Extrai regras de faturamento do texto de observações."""
    regra = {
        "modalidade": None,
        "valor_minimo": None,
        "transportadora_cif": None,
        "transportadora_fob": None,
        "frequencia": None,
        "status": "ativo"
    }
    
    texto = obs_texto.upper()
    
    # Status
    if "INATIVADO" in texto or "INATIVA" in texto or "BAIXADO" in texto:
        regra["status"] = "inativado"
    
    # Modalidade
    if "SEMPRE FOB" in texto:
        regra["modalidade"] = "FOB_SEMPRE"
    elif "SEMPRE CIF" in texto:
        regra["modalidade"] = "CIF_SEMPRE"
    elif "FOB" in texto and "CIF" in texto:
        regra["modalidade"] = "CIF_FOB"
    elif "FOB" in texto:
        regra["modalidade"] = "FOB"
    elif "CIF" in texto:
        regra["modalidade"] = "CIF"
    
    # Valor mínimo
    match = re.search(r'ACIMA DE\s*R\$\s*([\d.,]+)', texto)
    if not match:
        match = re.search(r'VALOR MÍNIMO[:\s]*R\$\s*([\d.,]+)', texto)
    if match:
        val_str = match.group(1).replace('.', '').replace(',', '.')
        try:
            regra["valor_minimo"] = float(val_str)
        except:
            pass
    
    # Transportadora CIF
    cif_match = re.search(r'TRANSPORTADORA\s*CIF[:\s]*([^\n.]+?)(?:FOB|$)', texto)
    if cif_match:
        regra["transportadora_cif"] = cif_match.group(1).strip()[:50]
    
    # Transportadora FOB
    fob_match = re.search(r'TRANSPORTADORA\s*FOB[:\s]*([^\n.]+?)(?:METRAGEM|$)', texto)
    if fob_match:
        regra["transportadora_fob"] = fob_match.group(1).strip()[:50]
    
    # Simplificar nomes
    known_carriers = ["Expresso São Miguel", "Rodonaves", "Jamef", "Bauer", "Reunidas", 
                      "Aceville", "Braspress", "Ouro Negro", "São Miguel", "VIP"]
    for key in ["transportadora_cif", "transportadora_fob"]:
        if regra[key]:
            for carrier in known_carriers:
                if carrier.upper() in regra[key].upper():
                    regra[key] = carrier
                    break
    
    return regra


def processar_planilha(input_path: str, output_path: str):
    """Processa a planilha e gera JSON das regras."""
    
    wb = openpyxl.load_workbook(input_path, data_only=True)
    ws = wb.active
    
    resultado = []
    
    # Pula header
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[0]:
            continue
            
        codigo = str(row[0]).strip()
        nome = str(row[1]).strip() if row[1] else ""
        obs = str(row[2]).strip() if row[2] else ""
        
        if not codigo.startswith("C"):
            continue
            
        regra_texto = extrair_regra_texto(obs)
        
        registro = {
            "codigo_cliente": codigo,
            "nome_cliente": nome,
            "modalidade_frete": regra_texto["modalidade"] or "CIF",
            "valor_minimo_frete": regra_texto["valor_minimo"],
            "transportadora_cif": regra_texto["transportadora_cif"],
            "transportadora_fob": regra_texto["transportadora_fob"],
            "frequencia_envio": regra_texto["frequencia"],
            "status": regra_texto["status"],
            "observacoes": obs[:500] if obs else None
        }
        
        resultado.append(registro)
    
    # Salva JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Processados {len(resultado)} clientes")
    print(f"📄 Salvos em: {output_path}")
    
    # Estatísticas
    modos = {}
    status = {}
    for r in resultado:
        m = r["modalidade_frete"]
        s = r["status"]
        modos[m] = modos.get(m, 0) + 1
        status[s] = status.get(s, 0) + 1
    
    print("\n📊 Estatísticas:")
    print("  Modalidades:", modos)
    print("  Status:", status)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python export_faturamento.py <input.xlsx> <output.json>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    processar_planilha(input_file, output_file)
