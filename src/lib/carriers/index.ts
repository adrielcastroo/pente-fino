import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';
import { supabase } from '@/integrations/supabase/client';
import { correios } from './correios';
import { jt } from './jt';
import { loggi } from './loggi';
import { melhorEnvio } from './melhorEnvio';
import { mock } from './mock';
import { saoMiguel } from './saoMiguel';
import { rodonaves } from './rodonaves';
import { jamef } from './jamef';
import { aceville } from './aceville';

export type { TrackResponse, TrackingEvent, TrackingStatus };

export interface CarrierAdapter {
  name: string;
  code: string;
  icon: string;
  color: string;
  detect: (code: string) => boolean;
  track?: (code: string) => Promise<TrackResponse>;
  validate?: (code: string) => boolean;
}

// Metadados de cada transportadora (usados por UI: badges, ícones, seletor).
// A LÓGICA de rastreio real vive na edge function `carrier-track` (server-side).
// Isso elimina CORS, protege tokens e centraliza fallbacks.
export const carriers: CarrierAdapter[] = [
  correios, jt, loggi, jamef, aceville, rodonaves, saoMiguel, melhorEnvio,
];

if (import.meta.env.DEV) {
  carriers.unshift(mock);
}

/**
 * Detecção heurística client-side para exibir o badge da transportadora
 * enquanto o usuário digita. NÃO é usada para decidir chamadas — a edge
 * function tenta múltiplas fontes independentemente do detect.
 */
export function detectCarrier(code: string): CarrierAdapter | null {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (/^[A-Z]{2}\d{9}BR$/.test(c)) return carriers.find(x => x.code === 'correios') ?? null;
  if (/^BR\d{13,}$/.test(c)) return carriers.find(x => x.code === 'jt') ?? null;
  if (/^LGG\d+$/.test(c)) return carriers.find(x => x.code === 'loggi') ?? null;
  if (/^JMF\d{8,12}$/.test(c) || /^JAMEF\d{8,}$/.test(c)) return carriers.find(x => x.code === 'jamef') ?? null;
  if (/^ACE\d{8,12}$/.test(c) || /^ACV\d{8,}$/.test(c)) return carriers.find(x => x.code === 'aceville') ?? null;
  if (/^RN\d{8,12}$/.test(c) || /^ROD\d{8,}$/.test(c)) return carriers.find(x => x.code === 'rodonaves') ?? null;
  if (/^SM\d{8,12}$/.test(c) || /^SAO\d{8,}$/.test(c)) return carriers.find(x => x.code === 'saomiguel') ?? null;
  if (/^\d{6,}$/.test(c)) return carriers.find(x => x.code === 'melhorenvio') ?? null;
  return null;
}

export interface TrackOptions {
  preferred?: string;
  cnpj?: string;
  nf?: string;
}

/**
 * Rastreia via edge function `carrier-track` (server-side proxy).
 * Tenta em cascata: Melhor Envio → Seu Rastreio (agregador) → SSW (se CNPJ+NF).
 * Nunca faz fetch direto a APIs externas (evita CORS e vazamento de tokens).
 */
export async function trackWithFallback(code: string, preferredOrOpts?: string | TrackOptions): Promise<TrackResponse> {
  const opts: TrackOptions = typeof preferredOrOpts === 'string'
    ? { preferred: preferredOrOpts }
    : (preferredOrOpts || {});

  const { data, error } = await supabase.functions.invoke('carrier-track', {
    body: {
      code: code.trim().toUpperCase(),
      preferred: opts.preferred,
      cnpj: opts.cnpj?.replace(/\D/g, ''),
      nf: opts.nf?.replace(/\D/g, ''),
    },
  });

  // Supabase invoke returns error on non-2xx; the body may still have structured info.
  if (error) {
    // Try to surface the structured error body from the edge function.
    // deno-lint-ignore no-explicit-any
    const ctx = (error as any).context;
    let detail = error.message || 'Falha ao chamar carrier-track';
    try {
      if (ctx && typeof ctx.text === 'function') {
        const txt = await ctx.text();
        const parsed = JSON.parse(txt);
        if (parsed?.error) {
          detail = parsed.error;
          if (Array.isArray(parsed.attempts)) {
            const parts = parsed.attempts
              .filter((a: { ok: boolean }) => !a.ok)
              .map((a: { carrier: string; reason: string }) => `${a.carrier}: ${a.reason}`);
            if (parts.length) detail += ` — ${parts.join(' | ')}`;
          }
          if (parsed.hint) detail += `\n${parsed.hint}`;
        }
      }
    } catch { /* fallback to raw message */ }
    throw new Error(detail);
  }

  if (!data || typeof data !== 'object') throw new Error('Resposta inválida do rastreio');
  return data as TrackResponse;
}
