import type { CarrierAdapter } from './index';

export const mock: CarrierAdapter = {
  name: 'Mock (dev)',
  code: 'mock',
  icon: 'package',
  color: 'bg-slate-500 text-white',
  detect: (c) => /^MOCK/i.test(c.trim()),
  validate: (c) => /^MOCK/i.test(c.trim()),
};
