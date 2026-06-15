# Remover prefixos dos QR codes

## Objetivo
Fazer com que os QR codes de SKU e Lote contenham apenas os valores puros, sem os prefixos textuais "SKU:" e "LOTE:".

## Arquivos
- `src/services/printService.ts` — onde os valores dos QR codes são montados antes da impressão
- `src/components/labels/LabelTemplates.tsx` — onde os dados de exemplo dos previews são definidos

## Mudancas

### printService.ts
- `qrSku`: `SKU:${input.item}` → `${input.item}`
- `qrLote`: `LOTE:${loteText}` → `${loteText}`
- `qrLoteSku`: `LOTE:${input.lote};SKU:${input.item}` → `${input.lote};${input.item}`

### LabelTemplates.tsx
- Atualizar `TECIDO_SAMPLE.qrSku` de `"SKU-002001002000323"` para `"002001002000323"`
- Atualizar `TECIDO_SAMPLE.qrLote` de `"LOTE-NFe-148551"` para `"NFe 148551"`
- Atualizar `MOTOR_SAMPLE.qrLoteSku` de `"LOTE-SKU-..."` para valor sem prefixos

## Validacao
- Build deve passar sem erros
- Preview das etiquetas deve continuar funcionando normalmente