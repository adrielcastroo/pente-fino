import type { CarrierAdapter } from './index';

export const loggi: CarrierAdapter = {
  name: 'Loggi',
  code: 'loggi',
  icon: 'truck',
  color: 'bg-purple-600 text-white',
  detect: (c) => /^LGG\d+$/i.test(c.trim()),
  validate: (c) => /^LGG\d+$/i.test(c.trim()),
};
