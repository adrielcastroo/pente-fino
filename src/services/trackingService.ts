import { supabase } from '@/integrations/supabase/client';
import { trackWithFallback } from '@/lib/carriers';
import type { TrackResponse, TrackingLink, TrackingStatus, TrackingEvent } from '@/types/tracking';

class ServiceError extends Error {
  constructor(public code: string, message: string, public cause?: Error) {
    super(message);
    this.name = 'ServiceError';
  }
}

// tracking_links não está nos types gerados ainda — usar cast controlado
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from('tracking_links');

interface TrackingLinkRow {
  id: string;
  tracking_code: string;
  carrier: string;
  carrier_raw: unknown;
  status: TrackingStatus;
  last_event: TrackingEvent | null;
  events: TrackingEvent[] | null;
  linked_type: string | null;
  linked_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToTrackingLink(row: TrackingLinkRow): TrackingLink {
  return {
    id: row.id,
    trackingCode: row.tracking_code,
    carrier: row.carrier,
    carrierRaw: row.carrier_raw,
    status: row.status,
    lastEvent: row.last_event,
    events: row.events || [],
    linkedType: row.linked_type,
    linkedId: row.linked_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const trackingService = {
  async syncTracking(code: string, preferredCarrier?: string): Promise<TrackingLink> {
    const clean = code.trim().toUpperCase();
    let apiResult: TrackResponse;
    try {
      apiResult = await trackWithFallback(clean, preferredCarrier);
    } catch (e) {
      throw new ServiceError('CARRIER_UNAVAILABLE', (e as Error).message, e as Error);
    }

    const payload = {
      tracking_code: clean,
      carrier: apiResult.carrier,
      carrier_raw: apiResult.raw as object | null,
      status: apiResult.status,
      last_event: apiResult.events[apiResult.events.length - 1] || null,
      events: apiResult.events,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db()
      .upsert(payload, { onConflict: 'tracking_code' })
      .select()
      .single();

    if (error) throw new ServiceError('SYNC_FAILED', error.message);
    return mapDbToTrackingLink(data as TrackingLinkRow);
  },

  async getLinks(filters?: { status?: TrackingStatus; carrier?: string; linkedType?: string; linkedId?: string }): Promise<TrackingLink[]> {
    let query = db().select('*').order('updated_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.carrier) query = query.eq('carrier', filters.carrier);
    if (filters?.linkedType) query = query.eq('linked_type', filters.linkedType);
    if (filters?.linkedId) query = query.eq('linked_id', filters.linkedId);
    const { data, error } = await query;
    if (error) throw new ServiceError('LIST_FAILED', error.message);
    return ((data || []) as TrackingLinkRow[]).map(mapDbToTrackingLink);
  },

  async getLink(id: string): Promise<TrackingLink> {
    const { data, error } = await db().select('*').eq('id', id).single();
    if (error) throw new ServiceError('LINK_NOT_FOUND', error.message);
    return mapDbToTrackingLink(data as TrackingLinkRow);
  },

  async linkToEntity(id: string, linkedType: string, linkedId: string): Promise<TrackingLink> {
    const { data, error } = await db()
      .update({ linked_type: linkedType, linked_id: linkedId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ServiceError('LINK_FAILED', error.message);
    return mapDbToTrackingLink(data as TrackingLinkRow);
  },

  async unlink(id: string): Promise<void> {
    const { error } = await db()
      .update({ linked_type: null, linked_id: null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new ServiceError('UNLINK_FAILED', error.message);
  },

  async deleteLink(id: string): Promise<void> {
    const { error } = await db().delete().eq('id', id);
    if (error) throw new ServiceError('DELETE_FAILED', error.message);
  },
};
