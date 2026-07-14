import type { CarrierAdapter } from './index';

// Metadata-only. Rastreio real é feito na edge function `carrier-track`.
export const correios: CarrierAdapter = {
  name: 'Correios',
  code: 'correios',
  icon: 'package',
  color: 'bg-blue-600 text-white',
  detect: (c) => /^[A-Z]{2}\d{9}BR$/i.test(c.trim()),
  validate: (c) => /^[A-Z]{2}\d{9}BR$/i.test(c.trim()),
};
