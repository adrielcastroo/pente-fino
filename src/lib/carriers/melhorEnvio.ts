import type { CarrierAdapter } from './index';

export const melhorEnvio: CarrierAdapter = {
  name: 'Melhor Envio',
  code: 'melhorenvio',
  icon: 'truck',
  color: 'bg-teal-600 text-white',
  detect: (c) => /^\d{6,}$/.test(c.trim()),
  validate: (c) => /^\d{6,}$/.test(c.trim()),
};
