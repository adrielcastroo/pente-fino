import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata quantidade numérica eliminando erros de ponto flutuante
 * (ex.: 8887.999999999998 → "8.888"). Usa pt-BR.
 */
export function formatQty(n: number | null | undefined, maxDecimals = 2): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '0';
  const rounded = Math.round(Number(n) * 100) / 100;
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: maxDecimals,
  });
}
