import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';
import { correios } from './correios';
import { jt } from './jt';
import { loggi } from './loggi';
import { melhorEnvio } from './melhorEnvio';
import { mock } from './mock';
import { saoMiguel } from './saoMiguel';
import { rodonaves } from './rodonaves';
import { jamef } from './jamef';
import { aceville } from './aceville';

export type { TrackResponse, TrackingEvent, TrackingStatus };

export interface CarrierAdapter {
  name: string;
  code: string;
  icon: string;
  color: string;
  detect: (code: string) => boolean;
  track: (code: string) => Promise<TrackResponse>;
  validate?: (code: string) => boolean;
}

export const carriers: CarrierAdapter[] = [correios, jt, loggi, jamef, aceville, rodonaves, saoMiguel, melhorEnvio];

if (import.meta.env.DEV) {
  carriers.unshift(mock);
}

export function detectCarrier(code: string): CarrierAdapter | null {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (/^[A-Z]{2}\d{9}BR$/.test(c)) return carriers.find(x => x.code === 'correios') ?? null;
  if (/^BR\d{13,}$/.test(c)) return carriers.find(x => x.code === 'jt') ?? null;
  if (/^LGG\d+$/.test(c)) return carriers.find(x => x.code === 'loggi') ?? null;
  if (/^JMF\d{8,12}$/.test(c) || /^JAMEF\d{8,}$/.test(c)) return carriers.find(x => x.code === 'jamef') ?? null;
  if (/^ACE\d{8,12}$/.test(c) || /^ACV\d{8,}$/.test(c)) return carriers.find(x => x.code === 'aceville') ?? null;
  if (/^RN\d{8,12}$/.test(c) || /^ROD\d{8,}$/.test(c)) return carriers.find(x => x.code === 'rodonaves') ?? null;
  if (/^SM\d{8,12}$/.test(c) || /^SAO\d{8,}$/.test(c)) return carriers.find(x => x.code === 'saomiguel') ?? null;
  if (/^\d{6,}$/.test(c)) return carriers.find(x => x.code === 'melhorenvio') ?? null;
  return null;
}


export async function trackWithFallback(code: string, preferred?: string): Promise<TrackResponse> {
  const errors: string[] = [];

  if (preferred) {
    const c = carriers.find(x => x.code === preferred);
    if (c) {
      try { return await c.track(code); } catch (e) { errors.push(`${c.name}: ${(e as Error).message}`); }
    }
  }

  const detected = detectCarrier(code);
  if (detected && detected.code !== preferred) {
    try { return await detected.track(code); } catch (e) { errors.push(`${detected.name}: ${(e as Error).message}`); }
  }

  const me = carriers.find(x => x.code === 'melhorenvio');
  if (me && me.code !== preferred && me.code !== detected?.code) {
    try { return await me.track(code); } catch (e) { errors.push(`${me.name}: ${(e as Error).message}`); }
  }

  for (const c of carriers) {
    if (c.code === preferred || c.code === detected?.code || c.code === 'melhorenvio' || c.code === 'mock') continue;
    try { return await c.track(code); } catch (e) { errors.push(`${c.name}: ${(e as Error).message}`); }
  }

  throw new Error(`Nenhuma transportadora encontrou este código.${errors.length ? ' Detalhes: ' + errors.join(' | ') : ''}`);
}
