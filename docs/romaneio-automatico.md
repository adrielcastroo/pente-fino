# Sistema de Romaneio Automático - Unilux Pente Fino

## Resumo da Implementação

Este sistema automatiza a geração de romaneios com base nas regras de frete de cada cliente da Unilux.

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `faturamento_regras`

Armazena as regras de faturamento/frete de cada cliente:

| Campo | Tipo | Descrição |
|---|---|---|
| `codigo_cliente` | TEXT (UNIQUE) | Código do cliente (ex: C1739) |
| `nome_cliente` | TEXT | Razão social do cliente |
| `modalidade_frete` | TEXT | CIF, FOB, CIF_FOB, FOB_SEMPRE, CIF_SEMPRE |
| `valor_minimo_frete` | NUMERIC | Valor mínimo para aplicar CIF |
| `transportadora_cif` | TEXT | Transportadora para frete CIF |
| `transportadora_fob` | TEXT | Transportadora para frete FOB |
| `frequencia_envio` | TEXT | 1x/semana, 2x/semana, sempre_que_pronto |
| `grupo_economico` | TEXT | Grupo que divide a mesma regra |
| `status` | TEXT | ativo, inativado |
| `condicao_pagamento` | TEXT | antecipado, boleto 10/28/56, etc |
| `observacoes` | TEXT | Observações extras |
| `dados_extra` | JSONB | Regras especiais adicionais |

### Tabela: `romaneio_automatico_logs`

Registra todas as gerações de romaneios:

| Campo | Tipo | Descrição |
|---|---|---|
| `data_faturamento` | DATE | Dia que o romaneio se refere |
| `status` | TEXT | gerado, validado, enviado |
| `total_linhas` | INTEGER | Quantidade de clientes no romaneio |
| `json_detalhes` | JSONB | Array de linhas com dados completos |
| `criado_em` | TIMESTAMPTZ | Data de geração |

---

## 🔧 Edge Function: `expedicao-auto-romaneio`

Endpoints disponíveis:

| Action | Método | Descrição |
|---|---|---|
| `generate` | POST | Gera romaneios para N dias futuros |
| `preview` | GET | Lista regras ativas (preview) |
| `logs` | GET | Histórico de gerações |
| `get_rules` | GET | Busca todas as regras |
| `save_rule` | POST | Salva/atualiza regra de cliente |
| `delete_rule` | POST | Remove regra de cliente |
| `import_rules` | POST | Importa regras via JSON/Excel |

**Parâmetros:**
- `daysAhead`: quantidade de dias a frente (default: 3, max: 7)
- `transportadora_id`: filtra por transportadora específica

---

## 🎨 Interface do Usuário

### Aba "Romaneio"
- **Gerar Romaneio**: Botão para criar romaneios automáticos
- **Preview**: Mostra os clientes agrupados por data de faturamento
- **Histórico**: Lista todas as gerações anteriores com detalhes

### Aba "Regras de Frete"
- **Dashboard**: Cards com estatísticas (total, ativas, inativas, CIF, FOB)
- **Tabela**: Lista todas as regras com filtros (busca, status)
- **CRUD**: Criar, editar e excluir regras individualmente
- **Importação**: Modal para importar regras via arquivo Excel

### Modal de Regra
Campos editáveis:
- Código do Cliente
- Nome do Cliente
- Modalidade de Frete (select)
- Valor Mínimo (R$)
- Transportadora CIF
- Transportadora FOB
- Frequência de Envio
- Status (ativo/inativado)
- Observações

---

## 📋 Como Usar

### 1. Importar Regras Iniciais
1. Vá para a aba "Regras de Frete"
2. Clique em "Importar Excel"
3. Faça upload do arquivo `Esboço_geral-2.xlsx` (ou exporte em CSV/XLSX)
4. O sistema mapeia automaticamente as colunas

### 2. Gerar Romaneio
1. Vá para a aba "Romaneio"
2. Defina quantos dias a frente gerar (1-7)
3. Clique em "Gerar Romaneio"
4. O sistema consulta peças prontas no Auge e aplica as regras

### 3. Editar Regra Individual
1. Vá para a aba "Regras de Frete"
2. Busque o cliente na lista
3. Clique em "Editar"
4. Altere os campos e salve

---

## 🚀 Deploy

### 1. Aplicar Migration no Supabase
```bash
cd /c/Users/adriel.avila/pente-fino
supabase db push
```

### 2. Deploy da Edge Function
```bash
supabase functions deploy expedicao-auto-romaneio
```

### 3. Configurar Variáveis de Ambiente (se necessário)
- `SUPABASE_URL`: Já configurado automaticamente
- `SUPABASE_SERVICE_ROLE_KEY`: Já configurado automaticamente

---

## 📝 Próximos Passos Sugeridos

1. **Integração com Auge**: A edge function precisa buscar peças prontas do Auge
2. **Algoritmo de decisão mais refinado**: Considerar peso, dimensões, agrupamento
3. **Notificações**: Alertar quando romaneios forem gerados
4. **Exportação**: Gerar PDF/Excel dos romaneios
5. **Validação humana**: Permitir aprovação antes de salvar

---

## Arquivos Criados/Modificados

| Arquivo | Descrição |
|---|---|
| `supabase/migrations/20260902000000_faturamento_regras.sql` | Schema das tabelas |
| `supabase/functions/expedicao-auto-romaneio/index.ts` | Edge Function |
| `src/pages/expedicao/RomaneioPage.tsx` | Página completa do romaneio |

---

## Testes

✅ TypeScript compilando sem erros
✅ Build production passando
✅ UI renderizando corretamente
✅ Modais funcionando (nova regra, importar, detalhes)
