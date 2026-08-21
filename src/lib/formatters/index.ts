/**
 * Centralized formatting utilities for the application.
 * Follows PT-BR standards for dates, numbers, and measurements.
 */

// Memoized formatters for performance
const dateFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  day: '2-digit', month: '2-digit', year: 'numeric', 
  hour: '2-digit', minute: '2-digit' 
});

const timeFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  hour: '2-digit', minute: '2-digit' 
});

const numberFormatterBR = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an ISO string to a Brazilian date-time string (DD/MM/YYYY HH:mm).
 */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : dateFormatterBR.format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats an ISO string to a Brazilian time string (HH:mm).
 */
export function formatTimeBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : timeFormatterBR.format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats a number to Brazilian decimal format (e.g., 1.234,56).
 */
export function formatNumberBR(n: number | null | undefined, maxDecimals = 2): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '0,00';
  
  // Round to avoid floating point issues
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(Number(n) * factor) / factor;
  
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Formats a quantity, handling floating point precision errors.
 * Example: 8.99999999 -> "9,00"
 */
export function formatQty(n: number | null | undefined, maxDecimals = 2): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '0';
  
  // Use precision rounding
  const rounded = Math.round(Number(n) * 100) / 100;
  
  if (rounded === 1) return '1';
  
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Formats linear meters for display (e.g., "10,5M").
 */
export function formatML(v: number | null | undefined): string {
  if (typeof v !== 'number' || v === 0 || v === null) return '';
  const rounded = Math.round(v * 10) / 10;
  if (rounded === 0) return '';
  
  const formatted = rounded % 1 === 0 
    ? Math.round(rounded).toString() 
    : rounded.toFixed(1).replace('.', ',');
    
  return `${formatted}M`;
}
