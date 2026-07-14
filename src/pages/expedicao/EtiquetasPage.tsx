/**
 * Central de etiquetas — rota /expedicao/etiquetas.
 * Unifica expedição, conferência e devolução em fluxo único (Operação | Avançado).
 */
import { CentralEtiquetas } from '@/components/etiquetas/CentralEtiquetas';

export default function ExpedicaoEtiquetasPage() {
  return <CentralEtiquetas />;
}
