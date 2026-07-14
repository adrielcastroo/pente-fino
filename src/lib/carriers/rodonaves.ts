import type { CarrierAdapter } from './index';

export const rodonaves: CarrierAdapter = {
  name: 'Rodonaves',
  code: 'rodonaves',
  icon: 'truck',
  color: 'bg-yellow-700 text-white',
  detect: (c) => /^RN\d{8,12}$/i.test(c.trim()) || /^ROD\d{8,}$/i.test(c.trim()),
  validate: (c) => /^RN\d{8,12}$/i.test(c.trim()) || /^ROD\d{8,}$/i.test(c.trim()),
};
