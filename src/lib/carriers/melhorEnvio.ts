import { supabase } from '@/integrations/supabase/client';
import type { CarrierAdapter } from './index';
import type { TrackResponse } from '@/types/tracking';

/**
 * Adapter Melhor Envio — chama a Edge Function `melhor-envio` (proxy seguro).
 * Todo o OAuth (refresh, access token) é gerenciado no backend.
 * Frontend nunca vê CLIENT_ID / CLIENT_SECRET / tokens.
 */
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
    if (error) throw new Error(error.message || 'Falha ao consultar Melhor Envio');
    if (data?.error) throw new Error(data.error);
    return data as TrackResponse;
  },
};
