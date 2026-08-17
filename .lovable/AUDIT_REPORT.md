# Relatório de Auditoria — AUDIT_ONLY (Jacquard v4.10+)

Este relatório foi gerado seguindo as diretrizes do **PROMPT MESTRE**. A análise focou em identificar código morto, dependências obsoletas e oportunidades de otimização, priorizando a segurança e a integridade da aplicação.

## 18.1 Resumo executivo

* **Estado geral:** Aplicação robusta com alta densidade de funcionalidades, porém com sinais de crescimento acelerado (arquivos duplicados e componentes de UI shadcn não utilizados).
* **Candidatos a remoção:** ~25 arquivos (components/hooks/pages).
* **Dependências:** 116 dependências diretas. 4-5 candidatos a remoção (AI-related, se a desativação for permanente).
* **Banco de Dados (Supabase):** ~50 tabelas identificadas. 4 tabelas possivelmente obsoletas ou duplicadas.
* **Ganho estimado:** Redução de ~5-8% no tamanho do repositório e melhoria na manutenibilidade.
* **Riscos:** Baixo no modo `AUDIT_ONLY`. Risco moderado em `SAFE_CLEANUP` devido a integrações externas (`n8n`, `Auge ERP`).

---

## 18.2 Análise de Referências e Inventário

### Código-Fonte (React/Vite)
* **Estrutura:** Segue padrão modular por funcionalidade (`estoque`, `expedicao`, `compras`).
* **Rotas:** 42 rotas mapeadas em `src/App.tsx`.
* **Hooks:** Alta dependência de `use-auth`, `use-page-access` e hooks de sincronização do Auge.

### Dependências (package.json)
* **Pesadas:** `xlsx`, `exceljs`, `jspdf`, `recharts`, `framer-motion`.
* **Polyfills/Legacy:** `@testing-library/dom` e `@types/leaflet` (sem uso aparente de mapas em páginas ativas).

---

## 18.3 Itens Candidatos a Remoção (Confirmar antes de SAFE_CLEANUP)

| Identificador | Caminho | Tipo | Motivo | Risco |
| :--- | :--- | :--- | :--- | :--- |
| `WidgetRenderer` | `src/components/agent/widgets/WidgetRenderer.tsx` | Component | Relacionado ao Fio AI (desativado) | Baixo |
| `useAIVision` | `src/hooks/useAIVision.ts` | Hook | Relacionado ao Fio AI (desativado) | Baixo |
| `AugeDepositosTab` | `src/components/auge/AugeDepositosTab.tsx` | Tab | Substituído por `DepositosAdminPage.tsx` | Médio |
| `expedicao_eventos` | `public.expedicao_eventos` | Tabela | Sem referências em `src` ou `Edge Functions` | Médio |
| `expedicao_rastreio_eventos` | `public.expedicao_rastreio_eventos` | Tabela | Sem referências no código | Médio |
| `Sol. Abreviacao` | `src/components/abreviacoes/SolicitarAbreviacaoDialog.tsx` | Dialog | Sem importações detectadas | Baixo |
| `GlossaryDialog` | `src/components/GlossaryDialog.tsx` | Dialog | Sem importações detectadas | Baixo |

---

## 18.4 Itens Preservados (INCERTO)

* **Tabelas Vazias:** `compras_starcolor_ops`, `expedicao_cargas`. Mantidas pois podem ser alimentadas via automações ou webhooks externos.
* **Componentes UI shadcn:** `aspect-ratio.tsx`, `carousel.tsx`, `menubar.tsx`. Mantidos como parte do Design System, mesmo sem uso imediato.
* **Edge Functions:** Todas mantidas, pois atendem integrações externas (`n8n`, `Auge`).

---

## 18.5 Relatório do Supabase (Amostra)

| Nome | Schema | Quantidade de Registros | Recomendação |
| :--- | :--- | :--- | :--- |
| `registros` | public | Alta | **Manter** (Core audit) |
| `audit_logs` | public | Média | **Monitorar** (Possível duplicidade com `registros`) |
| `inventory_configs`| public | 0-1 | **Deprecar** (Parece legado de `configuracoes_inventario`) |
| `fio_conversations`| public | - | **Manter** (Dados históricos do Fio AI) |

---

## 18.6 Próximos passos (SAFE_CLEANUP)

### Alta Prioridade
1. **Limpeza de Imports:** Executar `eslint --fix` para remover imports não utilizados em todo o projeto.
2. **Remoção de Código Inalcançável:** Remover referências ao `AgentChatWidget` que foram comentadas.

### Média Prioridade
1. **Deduplicação de Tabelas:** Analisar a necessidade de manter `audit_logs` e `registros` simultaneamente.
2. **Otimização de Assets:** Converter os 5 arquivos `.png` restantes em `.webp`.

### Baixa Prioridade
1. **Consolidação de Chunks:** Ajustar `vite.config.ts` para agrupar bibliotecas de PDF/Excel em chunks sob demanda mais eficientes.

---

**Conclusão da Auditoria:** O projeto está saudável, mas requer uma rodada de limpeza de "componentes órfãos" resultantes de refatorações recentes nos módulos de Expedição e Auge Sync.
