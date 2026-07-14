import type { CarrierAdapter } from './index';

export const jamef: CarrierAdapter = {
  name: 'Jamef',
  code: 'jamef',
  icon: 'truck',
  color: 'bg-red-700 text-white',
  detect: (c) => /^JMF\d{8,12}$/i.test(c.trim()) || /^JAMEF\d{8,}$/i.test(c.trim()),
  validate: (c) => /^JMF\d{8,12}$/i.test(c.trim()) || /^JAMEF\d{8,}$/i.test(c.trim()),
};
