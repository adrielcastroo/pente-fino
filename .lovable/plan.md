# Plano de Implementação - Fluxo de Edição Seguro de TAGs Custom

Implementação de um mecanismo de edição rigoroso para as TAGs Customizadas no Auge ERP, garantindo integridade de dados e conformidade com as regras de negócio do Pente Fino.

## 1. Backend (Edge Function: auge-sync)

*   **Ação `tag_custom_por_config`**: Criar/Ajustar o endpoint para consultar os registros reais do Auge via `listaTagsCustomizadas.php`.
*   **Normalização de Identificadores**: Garantir que campos como `cdTagCustomizada` e `cdTagCalculada` sejam mapeados corretamente, aceitando os aliases listados.
*   **Deduplicação Atômica**: Refinar a lógica de `idAcao=2` e `idAcao=3` para garantir que apenas as alterações solicitadas sejam aplicadas e duplicatas sejam removidas se detectadas no Auge.

## 2. Frontend (GerarTagTab.tsx)

*   **Estado de Snapshot**: Implementar `snapshotLinhas` para restaurar o estado original em caso de cancelamento.
*   **Função `iniciarEdicao`**: 
    *   Chamada via botões "Editar" e histórico.
    *   Consulta obrigatória ao Auge antes de carregar o formulário.
    *   Validação de registros com ID real.
*   **Modo de Edição UI**:
    *   Badge "MODO DE EDIÇÃO".
    *   Bloqueio visual de campos não editáveis (TAG configurada, Fórmula).
    *   Desativação de botões de inclusão/exclusão.
    *   Botão principal alterado para "Confirmar Alterações".
*   **Componente TagCalculadaCell**: Adicionar prop `disabled` para controle granular.

## 3. Validação e Segurança

*   **Verificação Pós-Gravação**: Realizar nova consulta ao Auge após o `UPSERT` para confirmar que os dados persistiram no ERP.
*   **Preservação de IDs**: Impedir a geração de IDs locais ou baseados em índice de array.

---

### 📊 Relatório de Execução

**Padrão utilizado:** Orquestração Multi-Agente (Jacquard v4.10)

**Sub-agentes ativados:**

- 🎨 **UI Architect** — ✅ Executado (Ajustes de responsividade e estados de edição)
- 🗄️ **Supabase Engineer** — ✅ Executado (Refinamento de Edge Functions)
- 🔍 **Code Auditor** — ✅ Executado (Garantia de não-regressão no Bloco Resumo)

**Arquivos a serem modificados:**
- `src/components/acabamentos/GerarTagTab.tsx`
- `supabase/functions/auge-sync/index.ts`
