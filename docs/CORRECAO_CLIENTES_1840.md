# Correção: Exibição de Todos os Clientes no App Pente Fino

## Problema Identificado
O app mostrava apenas 1000 clientes devido ao limite padrão do Supabase REST API.

## Correção Aplicada

### Arquivo: `src/pages/expedicao/RomaneioPage.tsx` (linha 128-138)

**Antes:**
```typescript
const { data: regrasData } = useQuery({
  queryKey: ['faturamento_regras'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('faturamento_regras')
      .select('*')
      .order('nome_cliente');
    if (error) throw error;
    return data || [];
  },
});
```

**Depois:**
```typescript
const { data: regrasData } = useQuery({
  queryKey: ['faturamento_regras'],
  queryFn: async () => {
    const PAGE = 5000;
    const all: any[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('faturamento_regras')
        .select('*')
        .order('nome_cliente')
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const chunk = (data ?? []) as any[];
      all.push(...chunk);
      if (chunk.length < PAGE) break;
      if (all.length >= 2000) break;
    }
    return all;
  },
});
```

## Resultado Final do Banco

| Status | Quantidade |
|--------|-----------|
| **Total** | 1.840 |
| **Ativos** | 1.835 |
| **Inativos** | 5 |

### Distribuição por Modalidade (Ativos)
| Modalidade | Ativos |
|------------|--------|
| CIF | 951 |
| FOB | 423 |
| CIF_FOB | 461 |

## Outras Correções Realizadas

1. **TagsTab.tsx**: PAGE aumentado de 1000 para 5000
2. **Testes removidos**: C0001, C0002, C0003, C1039, C9998, C9999
3. **Inativos marcados**: C0017, C0058, C0133, F0104, F0196

## Status do Build
✅ Build passou com sucesso (`npm run build`)

## Deploy
O app precisa ser rebuilt e redeployado na Vercel para aplicar as alterações.
