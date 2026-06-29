// ============================================================================
// Helpers para EtiquetasPage: presets, variáveis, validação, histórico, ZPL.
// ============================================================================

export type BarcodeFmt = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'ITF14' | 'UPC';

// ----------------------------------------------------------------------------
// PRESETS — modelos pré-definidos carregáveis em 1 clique.
// ----------------------------------------------------------------------------
export interface LabelPreset {
  id: string;
  label: string;
  description: string;
  patch: Record<string, unknown>;
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: 'correios-pac',
    label: 'Correios · PAC',
    description: '100×150 mm · CODE128 · destinatário em destaque',
    patch: {
      titulo: 'CORREIOS · PAC',
      subtitulo: '{{romaneio}} · NF {{nf}}',
      codigo: '{{romaneio}}',
      destino: '{{cliente}}',
      showQr: false,
      showBarcode: true,
      barcodeFmt: 'CODE128',
      pageSize: '100x150',
      align: 'center',
      borderStyle: 'solid',
    },
  },
  {
    id: 'correios-sedex',
    label: 'Correios · SEDEX',
    description: '100×150 mm · QR + barras · prioridade',
    patch: {
      titulo: 'SEDEX',
      subtitulo: 'Entrega expressa · {{romaneio}}',
      codigo: '{{romaneio}}',
      destino: '{{cliente}}',
      showQr: true,
      showBarcode: true,
      barcodeFmt: 'CODE128',
      pageSize: '100x150',
      align: 'center',
      borderStyle: 'solid',
    },
  },
  {
    id: 'dhl',
    label: 'DHL Express',
    description: '100×150 mm · QR · internacional',
    patch: {
      titulo: 'DHL EXPRESS',
      subtitulo: 'Waybill {{romaneio}}',
      codigo: '{{romaneio}}',
      destino: '{{cliente}}',
      showQr: true,
      showBarcode: false,
      pageSize: '100x150',
      align: 'center',
      borderStyle: 'solid',
    },
  },
  {
    id: 'palete',
    label: 'Palete',
    description: '100×100 mm · ITF-14 · logística interna',
    patch: {
      titulo: 'PALETE',
      subtitulo: 'Romaneio {{romaneio}}',
      codigo: '{{romaneio}}',
      destino: '{{cliente}}',
      showQr: false,
      showBarcode: true,
      barcodeFmt: 'ITF14',
      pageSize: '100x100',
      align: 'center',
      borderStyle: 'solid',
    },
  },
  {
    id: 'caixa-pequena',
    label: 'Caixa pequena',
    description: '60×40 mm · QR compacto',
    patch: {
      titulo: 'EXPEDIÇÃO',
      subtitulo: '{{romaneio}}',
      codigo: '{{romaneio}}',
      destino: '',
      showQr: true,
      showBarcode: false,
      pageSize: '60x40',
      codeSize: 120,
      titleSize: 9,
      codeFontSize: 14,
      paddingMm: 2,
    },
  },
];

// ----------------------------------------------------------------------------
// Interpolação de variáveis dinâmicas: {{romaneio}} {{nf}} {{cliente}} etc.
// ----------------------------------------------------------------------------
export type Vars = Record<string, string>;

export function interpolate(input: string, vars: Vars): string {
  if (!input) return input;
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? '' : String(v);
  });
}

export const KNOWN_VARS = ['romaneio', 'nf', 'cliente', 'transportadora', 'data'] as const;

// ----------------------------------------------------------------------------
// Validação por formato de código de barras.
// ----------------------------------------------------------------------------
export interface ValidationResult { ok: boolean; msg?: string }

export function validateBarcode(value: string, fmt: BarcodeFmt): ValidationResult {
  const v = (value ?? '').trim();
  if (!v) return { ok: false, msg: 'Valor vazio.' };
  switch (fmt) {
    case 'EAN13':
      if (!/^\d{12,13}$/.test(v)) return { ok: false, msg: 'EAN-13: 12 ou 13 dígitos numéricos.' };
      return { ok: true };
    case 'EAN8':
      if (!/^\d{7,8}$/.test(v)) return { ok: false, msg: 'EAN-8: 7 ou 8 dígitos numéricos.' };
      return { ok: true };
    case 'UPC':
      if (!/^\d{11,12}$/.test(v)) return { ok: false, msg: 'UPC-A: 11 ou 12 dígitos numéricos.' };
      return { ok: true };
    case 'ITF14':
      if (!/^\d{13,14}$/.test(v)) return { ok: false, msg: 'ITF-14: 13 ou 14 dígitos numéricos.' };
      return { ok: true };
    case 'CODE39':
      if (!/^[0-9A-Z\-. $/+%]+$/.test(v)) {
        return { ok: false, msg: 'CODE39: apenas 0-9, A-Z, espaço, - . $ / + %.' };
      }
      return { ok: true };
    case 'CODE128':
    default:
      // CODE128 aceita praticamente qualquer ASCII imprimível
      if (!/^[\x20-\x7E]+$/.test(v)) return { ok: false, msg: 'CODE128: apenas caracteres ASCII imprimíveis.' };
      return { ok: true };
  }
}

// ----------------------------------------------------------------------------
// Histórico de impressões em localStorage.
// ----------------------------------------------------------------------------
const HISTORY_KEY = 'exp_label_history_v1';
const MAX_HISTORY = 100;

export interface PrintHistoryEntry {
  id: string;
  templateId: string;
  templateName: string;
  copies: number;
  printedAt: number;
  payload: string;
  method: 'browser' | 'zpl-usb' | 'zpl-serial';
  snapshot?: unknown; // snapshot completo opcional para reimpressão
}

export function loadHistory(): PrintHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function pushHistory(entry: Omit<PrintHistoryEntry, 'id' | 'printedAt'>) {
  const list = loadHistory();
  const next: PrintHistoryEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    printedAt: Date.now(),
  };
  list.unshift(next);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function historyStatsByTemplate(history: PrintHistoryEntry[]) {
  const map = new Map<string, { name: string; count: number; copies: number }>();
  for (const h of history) {
    const cur = map.get(h.templateId) ?? { name: h.templateName, count: 0, copies: 0 };
    cur.count += 1;
    cur.copies += h.copies;
    cur.name = h.templateName;
    map.set(h.templateId, cur);
  }
  return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
}

// ----------------------------------------------------------------------------
// Geração de ZPL (Zebra) — texto, barras e QR.
// ----------------------------------------------------------------------------
export interface ZplInput {
  widthMm: number;
  heightMm: number;
  titulo: string;
  subtitulo: string;
  codigo: string;
  destino: string;
  observacoes: string;
  customFields: { label: string; value: string }[];
  showQr: boolean;
  showBarcode: boolean;
  barcodeFmt: BarcodeFmt;
  payload: string;
  copies: number;
}

// 8 dots/mm (203 dpi padrão) — heurística simples sem layout sofisticado.
export function generateZpl(input: ZplInput): string {
  const DPMM = 8;
  const widthDots = Math.round(input.widthMm * DPMM);
  const heightDots = Math.round(input.heightMm * DPMM);
  const lines: string[] = [];
  lines.push('^XA');
  lines.push(`^PW${widthDots}`);
  lines.push(`^LL${heightDots}`);
  lines.push('^CI28'); // UTF-8

  let y = 16;
  if (input.titulo) {
    lines.push(`^FO16,${y}^A0N,42,42^FD${escapeZpl(input.titulo)}^FS`);
    y += 52;
  }
  if (input.subtitulo) {
    lines.push(`^FO16,${y}^A0N,22,22^FD${escapeZpl(input.subtitulo)}^FS`);
    y += 30;
  }
  if (input.codigo) {
    lines.push(`^FO16,${y}^A0N,34,34^FD${escapeZpl(input.codigo)}^FS`);
    y += 44;
  }

  const payload = (input.payload || input.codigo || input.titulo || '').slice(0, 700);
  if (input.showBarcode && payload) {
    const zplFmt = mapBarcodeFmtToZpl(input.barcodeFmt);
    lines.push(`^FO16,${y}^BY2,2,80${zplFmt}^FD${escapeZpl(payload)}^FS`);
    y += 110;
  }
  if (input.showQr && payload) {
    lines.push(`^FO16,${y}^BQN,2,6^FDLA,${escapeZpl(payload)}^FS`);
    y += 160;
  }
  for (const f of input.customFields) {
    if (!f.value.trim()) continue;
    lines.push(`^FO16,${y}^A0N,20,20^FD${escapeZpl(`${f.label}: ${f.value}`)}^FS`);
    y += 26;
  }
  if (input.destino) {
    y += 6;
    lines.push(`^FO16,${y}^A0N,22,22^FD${escapeZpl(`Destino: ${input.destino}`)}^FS`);
    y += 28;
  }
  if (input.observacoes) {
    lines.push(`^FO16,${y}^A0N,18,18^FB${widthDots - 32},4,0,L^FD${escapeZpl(input.observacoes)}^FS`);
  }

  if (input.copies > 1) lines.push(`^PQ${input.copies}`);
  lines.push('^XZ');
  return lines.join('\n');
}

function mapBarcodeFmtToZpl(fmt: BarcodeFmt): string {
  switch (fmt) {
    case 'CODE39': return '^B3N,N,80,Y,N';
    case 'EAN13':  return '^BEN,80,Y,N';
    case 'EAN8':   return '^B8N,80,Y,N';
    case 'UPC':    return '^BUN,80,Y,N,N';
    case 'ITF14':  return '^BIN,80,Y,N';
    case 'CODE128':
    default:       return '^BCN,80,Y,N,N';
  }
}

function escapeZpl(s: string): string {
  return s.replace(/[\^~]/g, ' ');
}

// ----------------------------------------------------------------------------
// Envio via WebUSB / Web Serial para impressoras térmicas.
// ----------------------------------------------------------------------------

interface UsbDeviceLike {
  open: () => Promise<void>;
  selectConfiguration: (n: number) => Promise<void>;
  claimInterface: (n: number) => Promise<void>;
  transferOut: (endpoint: number, data: Uint8Array) => Promise<unknown>;
  close: () => Promise<void>;
  configuration?: { interfaces: { interfaceNumber: number; alternate: { endpoints: { direction: string; endpointNumber: number }[] } }[] } | null;
}

export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

// Filtros conhecidos: Zebra (0x0a5f), Argox (0x1664), Bixolon (0x1504), Brother (0x04f9).
const USB_FILTERS = [
  { vendorId: 0x0a5f },
  { vendorId: 0x1664 },
  { vendorId: 0x1504 },
  { vendorId: 0x04f9 },
];

export async function sendZplViaUsb(zpl: string): Promise<{ ok: true; method: 'zpl-usb' } | { ok: false; error: string }> {
  if (!isWebUsbSupported()) return { ok: false, error: 'WebUSB não suportado neste navegador.' };
  try {
    const nav = navigator as unknown as { usb: { requestDevice: (opts: { filters: { vendorId: number }[] }) => Promise<UsbDeviceLike> } };
    const device = await nav.usb.requestDevice({ filters: USB_FILTERS });
    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);
    const iface = device.configuration?.interfaces[0];
    const ifaceNum = iface?.interfaceNumber ?? 0;
    await device.claimInterface(ifaceNum);
    const ep = iface?.alternate.endpoints.find((e) => e.direction === 'out');
    const endpointNumber = ep?.endpointNumber ?? 1;
    const data = new TextEncoder().encode(zpl);
    await device.transferOut(endpointNumber, data);
    await device.close();
    return { ok: true, method: 'zpl-usb' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao enviar via USB.' };
  }
}

interface SerialPortLike {
  open: (opts: { baudRate: number }) => Promise<void>;
  writable: WritableStream<Uint8Array> | null;
  close: () => Promise<void>;
}

export async function sendZplViaSerial(zpl: string): Promise<{ ok: true; method: 'zpl-serial' } | { ok: false; error: string }> {
  if (!isWebSerialSupported()) return { ok: false, error: 'Web Serial não suportado neste navegador.' };
  try {
    const nav = navigator as unknown as { serial: { requestPort: () => Promise<SerialPortLike> } };
    const port = await nav.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable?.getWriter();
    if (!writer) throw new Error('Porta sem stream de escrita.');
    await writer.write(new TextEncoder().encode(zpl));
    writer.releaseLock();
    await port.close();
    return { ok: true, method: 'zpl-serial' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao enviar via Serial.' };
  }
}
