# Reconhecimento de código do fornecedor com largura no final

## Problema
Hoje o sistema casa o código bipado com o cadastrado via `normalizarCodigo` + `codigoBate` (contains tolerante). Funciona quando há separadores diferentes (`-`, `/`, espaço) no meio.

Mas alguns fornecedores anexam no **final** do código um número curto (ex.: `200`, `20`, `140`) representando a largura — às vezes com separador, às vezes colado. Isso quebra o match:

- Cadastrado: `RF-MOMBASSA-5600`
- Bipado: `RFMOMBASSA-5600-200` → casa (contains funciona)
- Bipado: `RFMOMBASSA200-5600` → **não casa** hoje
- Bipado: `RFMOMBASSA5600200` → casa por contains, mas ambíguo

Queremos: reconhecer o código nesses cenários, **sem calcular largura nem preencher campo** (apenas casar com o cadastro).

## Solução
Ampliar a heurística de comparação em `src/lib/codigoFornecedor.ts` (`codigoBate`) para tolerar um sufixo numérico curto (2–4 dígitos) no código bipado, tratado como possível largura embutida.

### Algoritmo de match (case-insensitive, ignora separadores)
1. Normalizar ambos os lados (já existe).
2. Match exato → ok.
3. `a.includes(b)` ou `b.includes(a)` → ok (já existe).
4. **Novo:** se `a` (bipado) termina em um grupo numérico de 2 a 4 dígitos, tentar de novo os passos 2–3 com esse sufixo removido. Se casar, retorna true.
5. **Novo (fallback opcional):** se a borda entre "código base" e "sufixo de largura" estiver com separador (`-`, `_`, `/`, `.`), também tentar remover o último segmento puro-numérico curto antes da normalização.

O sufixo removido é descartado — **não vira largura, não preenche nada**.

### Onde aplica
- `src/lib/codigoFornecedor.ts` → função `codigoBate` ganha a nova heurística.
- `src/services/itensCadastroService.ts` → `findByCodigoFornecedor` já usa `codigoBate` no passo 2 (parcial), então passa a aproveitar a nova lógica automaticamente. Sem mudanças adicionais.
- `src/services/printService.ts` → continua chamando `codigoBate` para validar bipado vs cadastrado; passa a aceitar os novos casos sem mudança.

### Testes
Atualizar `src/lib/codigoFornecedor.test.ts` com casos:
- `codigoBate('RFMOMBASSA-5600-200', 'RF-MOMBASSA-5600')` → true
- `codigoBate('RFMOMBASSA-5600200', 'RF-MOMBASSA-5600')` → true
- `codigoBate('RFMOMBASSA-5600-20', 'RF-MOMBASSA-5600')` → true
- `codigoBate('OUTROCODIGO-200', 'RF-MOMBASSA-5600')` → false
- Manter os casos atuais passando.

## Fora de escopo
- Não calcular nem preencher Largura a partir do número detectado.
- Não alterar regras de PROC, NF, divisor Celular/HC-45.
- Não alterar a UI da tela de cadastros.
