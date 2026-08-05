import re
import unicodedata

def normalize(s):
    if not s: return ""
    return "".join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

def test_filter(termo, configs):
    tokens = [t for t in re.split(r'[\s*_\-/.,;:()\[\]]+', normalize(termo)) if len(t) >= 1]
    print(f"Tokens da busca: {tokens}")
    
    filtrados = []
    for cfg in configs:
        nm = normalize(cfg)
        match = all(t in nm for t in tokens)
        if match:
            filtrados.append(cfg)
    return filtrados

# Mock de configurações baseadas na imagem e contexto (Auge)
mock_configs = [
    "CORTINA CM 35 10% BALANCE",
    "CORTINA CM 35 BALANCE",
    "CORTINA CM 35 10% LISO",
    "CORTINA CM 35 10% BALANCE BRANCO",
    "CORTINA CM 35 10% BALANCE PRETO",
    "CORTINA TUB 35 10% BALANCE"
]

search_term = "cortina*cm*35*10*balance*"
results = test_filter(search_term, mock_configs)
print(f"Resultados para '{search_term}': {results}")

# Teste com token que pode estar causando falha (ex: o '%' ou a falta dele no "10")
search_term_with_percent = "cortina*cm*35*10%*balance*"
results_percent = test_filter(search_term_with_percent, mock_configs)
print(f"Resultados para '{search_term_with_percent}': {results_percent}")

