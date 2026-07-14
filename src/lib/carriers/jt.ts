import type { CarrierAdapter } from './index';

export const jt: CarrierAdapter = {
  name: 'J&T Express',
  code: 'jt',
  icon: 'truck',
  color: 'bg-orange-600 text-white',
  detect: (c) => /^BR\d{13,}$/i.test(c.trim()),
  validate: (c) => /^BR\d{13,}$/i.test(c.trim()),
};
