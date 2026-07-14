import type { CarrierAdapter } from './index';

export const saoMiguel: CarrierAdapter = {
  name: 'Expresso São Miguel',
  code: 'saomiguel',
  icon: 'truck',
  color: 'bg-amber-700 text-white',
  detect: (c) => /^SM\d{8,12}$/i.test(c.trim()) || /^SAO\d{8,}$/i.test(c.trim()),
  validate: (c) => /^SM\d{8,12}$/i.test(c.trim()) || /^SAO\d{8,}$/i.test(c.trim()),
};
