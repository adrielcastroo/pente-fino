import { supabase } from '@/integrations/supabase/client';
import type { CarrierAdapter } from './index';
import type { TrackResponse } from '@/types/tracking';

/**
 * Adapter Melhor Envio — chama a Edge Function `melhor-envio` (proxy seguro).
 */
async function extractInvokeError(err: unknown): Promise<string> {
  const anyErr = err as { message?: string; context?: Response };
  const ctx = anyErr?.context;
  if (ctx && typeof ctx.text === 'function') {
    try {
      const txt = await ctx.text();
      if (txt) {
        try {
          const parsed = JSON.parse(txt);
          if (parsed?.error) return String(parsed.error);
        } catch {
          return txt;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return anyErr?.message || 'Falha ao consultar Melhor Envio';
}

export const melhorEnvio: CarrierAdapter = {
  name: 'Melhor Envio',
  code: 'melhorenvio',
  icon: 'globe',
  color: 'bg-teal-600 text-white',
  detect: () => true,
  validate: () => true,
  async track(code): Promise<TrackResponse> {
    const clean = code.trim();
    const { data, error } = await supabase.functions.invoke('melhor-envio', {
      body: { action: 'track', code: clean },
    });
    if (error) throw new Error(await extractInvokeError(error));
    if (data?.error) throw new Error(data.error);
    return data as TrackResponse;
  },
};
