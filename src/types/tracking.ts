export type TrackingStatus =
  | 'pendente'
  | 'pagamento'
  | 'preparacao'
  | 'despachado'
  | 'em_transito'
  | 'entregue'
  | 'erro'
  | 'devolvido';

export interface TrackingEvent {
  timestamp: string;
  status: TrackingStatus;
  location?: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface TrackResponse {
  code: string;
  carrier: string;
  status: TrackingStatus;
  events: TrackingEvent[];
  lastUpdate: string;
  raw?: unknown;
}

export interface TrackingLink {
  id: string;
  trackingCode: string;
  carrier: string;
  carrierRaw?: unknown;
  status: TrackingStatus;
  lastEvent: TrackingEvent | null;
  events: TrackingEvent[];
  linkedType?: string | null;
  linkedId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkTrackingInput {
  id: string;
  linkedType: string;
  linkedId: string;
}
