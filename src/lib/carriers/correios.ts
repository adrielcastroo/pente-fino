import type { CarrierAdapter } from './index';
import type { TrackResponse } from '@/types/tracking';

export const correios: CarrierAdapter = {
  name: 'Correios',
  code: 'correios',
  icon: 'package',
  color: 'bg-blue-600 text-white',
  detect: (c) => /^[A-Z]{2}\d{9}BR$/i.test(c.trim()),
  validate: (c) => /^[A-Z]{2}\d{9}BR$/i.test(c.trim()),
  async track(code): Promise<TrackResponse> {
    // Correios não oferece API pública direta gratuita. Roteia via Melhor Envio (gateway).
    const { melhorEnvio } = await import('./melhorEnvio');
    return melhorEnvio.track(code);
  },
};
