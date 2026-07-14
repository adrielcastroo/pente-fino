import type { CarrierAdapter } from './index';

export const aceville: CarrierAdapter = {
  name: 'Aceville',
  code: 'aceville',
  icon: 'truck',
  color: 'bg-indigo-700 text-white',
  detect: (c) => /^ACE\d{8,12}$/i.test(c.trim()) || /^ACV\d{8,}$/i.test(c.trim()),
  validate: (c) => /^ACE\d{8,12}$/i.test(c.trim()) || /^ACV\d{8,}$/i.test(c.trim()),
};
