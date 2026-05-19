import { Registro, FormData } from '@/types';
import { generateLoteSistema, generateLoteSistemaCaixa } from '@/lib/app-utils';

export function generateLoteEtiqPronta(
  item: string,
  loteFinal: string,
  registros: Registro[]
): string {
  // Pattern: loteFinal
  return loteFinal.toUpperCase();
}

export function parseEtiqProntaLote(lote: string): { proc: string; endereco: string; mLinear: number } | null {
  // Logic moved to LeftPanel.tsx auto-lookup using Supabase
  return null;
}