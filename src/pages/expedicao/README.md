/**
 * ## Correção do Fluxo de Expedição - Etapa 1
 *
 * **Objetivo:** Adequar o Pente Fino para operar como um sistema simbiótico ao Auge, respeitando o fluxo operacional correto.
 *
 * **Fluxo de Operação:**
 * 1. Produção marca "PRONTO" no Auge.
 * 2. `auge-sync` (Edge Function) sincroniza o registro para `expedicao_pecas_auge_sync`.
 * 3. Conferente bipa a etiqueta na fila de pendências.
 * 4. Pente Fino bipa o picking para validação (Cliente/Pedido/Item/Quantidade).
 * 5. Se compatível, vincula.
 * 6. Somente após validação, abre modal de seleção de transportadora.
 * 7. Alocação -> Romaneio -> Faturamento.
 *
 * **Arquivos do Módulo:**
 * - `src/pages/expedicao/RecebimentoPage.tsx`: Processamento de entrada (pulmão).
 * - `src/pages/expedicao/ConferenciaPage.tsx`: Fluxo central de conferência.
 * - `src/components/expedicao/PickingSelectorDialog.tsx`: Modal de seleção de picking.
 * - `src/components/expedicao/CarrierSelectorDialog.tsx`: Modal de transportadora.
 * - `src/hooks/expedicao/useExpedicaoFlow.ts`: Validação de peças/picking.
 */

// Placeholder para o plano de ação técnico de implementação.
// As alterações serão feitas incrementalmente seguindo as regras de segurança e proteção das Etiquetas.
