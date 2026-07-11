import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent } from '@/types/tracking';

const MOCK_EVENTS: TrackingEvent[] = [
  { timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'pagamento', location: 'São Paulo - SP', description: 'Pagamento confirmado' },
  { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'preparacao', location: 'São Paulo - SP', description: 'Pedido em separação' },
  { timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'despachado', location: 'São Paulo - SP', description: 'Objeto postado' },
  { timestamp: new Date().toISOString(), status: 'em_transito', location: 'Curitiba - PR', description: 'Em trânsito para unidade de destino' },
];

export const mock: CarrierAdapter = {
  name: 'Mock (Dev)',
  code: 'mock',
  icon: 'flask-conical',
  color: 'bg-gray-500 text-white',
  detect: () => import.meta.env.DEV,
  validate: () => true,
  async track(code): Promise<TrackResponse> {
    await new Promise((r) => setTimeout(r, 400));
    return {
      code: code.trim().toUpperCase(),
      carrier: 'mock',
      status: 'em_transito',
      events: MOCK_EVENTS,
      lastUpdate: MOCK_EVENTS[MOCK_EVENTS.length - 1].timestamp,
      raw: { mock: true },
    };
  },
};
