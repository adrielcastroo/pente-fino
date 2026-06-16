# Correção do "PROC" duplicado na exportação XLSX

## Problema
No XLSX exportado (Motor/Controle), a coluna "Lote Final (Sistema)" sai com `PROC` duplicado, por vezes em capitalizações diferentes:

```
TEC00.A.N04 PROC Proc29863/26 27M
```

## Solução
Antes de gravar cada célula que contém o `loteSistema` no XLSX, normalizar a string:

1. Detectar ocorrências da palavra `proc` (qualquer capitalização: `proc`, `Proc`, `PROC`) usando regex case-insensitive.
2. Se aparecer mais de uma vez consecutiva (com espaço/colado), colapsar para uma única ocorrência.
3. Forçar sempre a forma maiúscula `PROC`.
4. Aplicar também quando o token `Proc` vier colado ao número (ex.: `Proc29863/26` → `PROC29863/26`), mantendo só um `PROC`.

Resultado esperado para o exemplo:
```
TEC00.A.N04 PROC 29863/26 27M
```

## Onde alterar

Arquivo: `src/lib/export-utils.ts`

- Criar helper local `normalizeProcToken(value: string): string` que:
  - Substitui qualquer sequência `(PROC\s*)+` (case-insensitive) por um único `PROC ` .
  - Garante espaço entre `PROC` e o número seguinte.
- Aplicar no `exportMotorControleToExcel` em todas as linhas onde `r.loteSistema` é escrito (motor, controle e coulisse) e também no header `[`${cx} ${firstItem}`]` se aplicável.

Nenhuma outra exportação ou lógica de negócio é alterada.
