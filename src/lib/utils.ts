import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Re-exporting centralized formatters for backward compatibility.
 * @deprecated Use imports from '@/lib/formatters' directly.
 */
export { formatQty } from './formatters';
