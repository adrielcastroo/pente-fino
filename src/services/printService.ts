import { toast } from 'sonner';
import { renderTecidoLabel, renderMotorLabel } from './labelRenderer';
import { itensCadastroService } from './itensCadastroService';
import { codigoBate } from '@/lib/codigoFornecedor';
import { extractLarguraFromItem } from '@/lib/app-utils';
import { validateWebhookUrl } from '@/lib/webhook-url';
import type { TecidoLabelData, MotorLabelData } from '@/components/labels/LabelTemplates';
import type { LabelSettings } from '@/store/useAppStore';

/**
 * Resolve o item a partir do que foi bipado.
 *  - Se o bipado já é um código interno cadastrado → usa esse.
 *  - Senão, tenta encontrar pelo código do fornecedor → substitui pelo código interno cadastrado.
 *  - Caso nada bata, segue com os dados do registro (apenas avisa).
 */
async function resolverItem(
  codigoBipadoOuInterno: string,
  codigoBipadoOriginal: string,
  fallbackDescricao: string,
): Promise<{ codigoInterno: string; descricao: string }> {
  const fallback = { codigoInterno: codigoBipadoOuInterno, descricao: fallbackDescricao };
  try {
    // 1. é o nosso código interno?
    const porInterno = await itensCadastroService.findByCodigoInterno(codigoBipadoOuInterno);
    if (porInterno) {
      const codigos = (porInterno.codigos_fornecedor && porInterno.codigos_fornecedor.length)
        ? porInterno.codigos_fornecedor
        : (porInterno.codigo_fornecedor ? [porInterno.codigo_fornecedor] : []);
      if (codigos.length && !codigos.some((c) => codigoBate(codigoBipadoOriginal, c))) {
        toast.warning(
          `Código bipado "${codigoBipadoOriginal}" não confere com nenhum fornecedor cadastrado (${codigos.join(', ')})`,
          { duration: 5000 },
        );
      }
      return {
        codigoInterno: porInterno.codigo_interno,
        descricao: porInterno.descricao || fallbackDescricao,
      };
    }

    // 2. é um código de fornecedor cadastrado?
    const porFornecedor = await itensCadastroService.findByCodigoFornecedor(codigoBipadoOriginal);
    if (porFornecedor) {
      toast.success(
        `Fornecedor "${codigoBipadoOriginal}" → ${porFornecedor.codigo_interno}`,
        { duration: 3000 },
      );
      return {
        codigoInterno: porFornecedor.codigo_interno,
        descricao: porFornecedor.descricao || fallbackDescricao,
      };
    }

    toast.warning(`Código "${codigoBipadoOriginal}" não encontrado nos cadastros — etiqueta usará dados do registro`);
    return fallback;
  } catch (e) {
    console.warn('Resolução de cadastro falhou:', e);
    return fallback;
  }
}


export interface PrintConfig {
  autoPrint: boolean;
  /** URL única do webhook n8n usada por todas as etiquetas. */
  webhookUrl?: string;
}

/**
 * Limpa um dataURL/base64 e devolve apenas a string base64 pura.
 * Remove prefixo data:..;base64, aspas extras e qualquer whitespace.
 * Valida o formato antes de retornar.
 */
function cleanBase64(input: string): { base64: string; mimeType: string } {
  if (!input) throw new Error('Imagem vazia');
  let cleaned = String(input).trim();
  // remover aspas externas que alguns runtimes (ex.: PowerShell) podem reintroduzir
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');

  let mimeType = 'image/png';
  if (cleaned.startsWith('data:')) {
    const match = cleaned.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) throw new Error('dataURL inválido');
    mimeType = match[1];
    cleaned = match[2];
  }
  // remover qualquer whitespace/quebra de linha
  cleaned = cleaned.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    throw new Error('Base64 inválido após limpeza');
  }
  return { base64: cleaned, mimeType };
}

/**
 * Detecta se a URL do webhook aponta para uma rede local/privada (n8n rodando
 * na máquina do usuário ou na LAN). Nesses casos usamos um POST "simple"
 * (form-urlencoded + no-cors) para evitar o preflight OPTIONS que quebra o
 * envio em n8n locais que não respondem CORS.
 */
function isLocalWebhookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
    if (h.endsWith('.local')) return true;
    // 10.x.x.x
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    // 192.168.x.x
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    // 172.16.x.x - 172.31.x.x
    const m = h.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 16 && n <= 31) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * O fluxo que funcionava no n8n não tentava fazer POST JSON quando a URL era
 * HTTP/local: isso aciona CORS/preflight (e, em deploy com HTTPS, costuma ser
 * bloqueado antes de chegar ao n8n). Para esses destinos, mantemos exatamente
 * o envio "simple request" por formulário.
 */
function shouldUseFormNoCors(webhookUrl: string): boolean {
  try {
    const u = new URL(webhookUrl);
    return u.protocol === 'http:' || isLocalWebhookUrl(webhookUrl);
  } catch {
    return false;
  }
}

async function sendToWebhook(
  webhookUrl: string,
  payload: {
    type: 'tecido' | 'motor';
    title: string;
    dataUrl: string;
    widthMm: number;
    heightMm: number;
    data: Record<string, any>;
  },
): Promise<void> {
  const { base64, mimeType } = cleanBase64(payload.dataUrl);
  const body = {
    ...payload,
    template: payload.type,
    format: payload.type,
    imageBase64: base64,
    mimeType,
    imageSize: base64.length,
    sentAt: new Date().toISOString(),
  };

  // n8n local/HTTP → evita preflight CORS usando form-urlencoded + no-cors
  // (POST "simple request"). O workflow continua lendo $json.body.imageBase64.
  // Sem `keepalive` (descarta payloads grandes ~64KB).
  if (shouldUseFormNoCors(webhookUrl)) {
    const form = new URLSearchParams();
    form.set('type', payload.type);
    form.set('template', payload.type);
    form.set('format', payload.type);
    form.set('title', payload.title);
    form.set('widthMm', String(payload.widthMm));
    form.set('heightMm', String(payload.heightMm));
    form.set('imageBase64', base64);
    form.set('mimeType', mimeType);
    form.set('imageSize', String(base64.length));
    form.set('sentAt', body.sentAt);
    form.set('data', JSON.stringify(payload.data));

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: form,
    });
    // Resposta é opaque em no-cors — consideramos entregue.
    return;
  }

  // URL pública → JSON normal, com telemetria real do status HTTP.
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Webhook respondeu ${res.status}`);
  }
}


async function dispatchPrint(
  cfg: PrintConfig,
  payload: {
    type: 'tecido' | 'motor';
    title: string;
    dataUrl: string;
    widthMm: number;
    heightMm: number;
    data: Record<string, any>;
  },
): Promise<void> {
  // URL única para o teste app -> n8n: nenhuma rota alternativa por tipo.
  const rawWebhook = cfg.webhookUrl?.trim() || '';

  // Se houver URL configurada mas inválida, avisa e desconsidera para não estourar erro obscuro.
  const validation = validateWebhookUrl(rawWebhook, { allowEmpty: true });
  if (rawWebhook && !validation.ok) {
    toast.error(`Webhook (${payload.type}) inválido: ${validation.error} — corrija em Configurações.`);
  }
  const resolvedWebhook = validation.ok ? rawWebhook : '';
  const hasWebhook = !!resolvedWebhook;

  if (hasWebhook) {
    try {
      await sendToWebhook(resolvedWebhook, payload);
      toast.success('Etiqueta enviada para o n8n');
    } catch (e) {
      console.error('Webhook falhou:', e);
      toast.error('Webhook (n8n) falhou — envio direto não confirmado');
    }
    return;
  }

  // Sem webhook configurado: usa navegador (se permitido).
  const browserDisabled = typeof localStorage !== 'undefined'
    && localStorage.getItem('pref_disable_browser_print') === 'true';
  if (browserDisabled) {
    toast.error('Nenhum método disponível: configure o webhook (n8n) ou habilite a impressão pelo navegador');
    return;
  }
  try {
    await printImageInBrowser(payload.dataUrl, payload.widthMm, payload.heightMm, payload.title);
    toast.success('Etiqueta enviada para impressão!');
  } catch (e) {
    console.error('Browser print falhou:', e);
    toast.error('Falha ao abrir diálogo de impressão.');
  }
}


export interface TecidoPrintInput {
  item: string;
  descricao?: string;
  lote: string;
  loteSistema?: string;
  nf?: string;
  processo?: string;
  m2?: number;
  mLinear?: number;
  largura?: number;
  endereco?: string;
}

export interface MotorPrintInput {
  item: string;
  descricao?: string;
  lote: string;
  loteSistema?: string;
  nf?: string;
  cx?: string | number | null;
  sequencial?: number;
  endereco?: string;
}

function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Imprime a imagem da etiqueta diretamente pelo navegador, usando um iframe
 * oculto com @page no tamanho exato em mm quando nenhum webhook estiver configurado.
 */
async function printImageInBrowser(
  dataUrl: string,
  widthMm: number,
  heightMm: number,
  title: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { iframe.remove(); } catch { /* noop */ }
    };

    const safeTitle = title.replace(/[<>&"']/g, '');
    // Renderização "driver-only": tamanho fixo em mm via @page, sem margem,
    // cores exatas (sem ajuste do navegador) e imagem ocupando 100% da página
    // — assim "Ajustar à página", margens e escala do diálogo do navegador
    // não afetam o resultado; quem manda é o driver da impressora.
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0 !important; padding: 0 !important; }
      @page :first { margin: 0 !important; }
      @page :left  { margin: 0 !important; }
      @page :right { margin: 0 !important; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff;
        width: ${widthMm}mm !important;
        height: ${heightMm}mm !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      img#lbl {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${widthMm}mm !important;
        height: ${heightMm}mm !important;
        max-width: none !important;
        max-height: none !important;
        min-width: ${widthMm}mm !important;
        min-height: ${heightMm}mm !important;
        display: block;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        image-rendering: pixelated;
        transform: none !important;
        zoom: 1 !important;
      }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; width: ${widthMm}mm !important; height: ${heightMm}mm !important; }
        img#lbl { width: ${widthMm}mm !important; height: ${heightMm}mm !important; }
      }
    </style></head><body><img id="lbl" src="${dataUrl}"></body></html>`;

    const doc = iframe.contentDocument;
    if (!doc) { cleanup(); reject(new Error('iframe sem contentDocument')); return; }
    doc.open();
    doc.write(html);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) { cleanup(); reject(new Error('iframe sem contentWindow')); return; }

    const triggerPrint = () => {
      try {
        win.focus();
        win.print();
        win.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, 60_000);
        resolve();
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    const img = doc.getElementById('lbl') as HTMLImageElement | null;
    if (img && !img.complete) {
      img.onload = triggerPrint;
      img.onerror = () => { cleanup(); reject(new Error('Falha ao carregar imagem da etiqueta')); };
    } else {
      setTimeout(triggerPrint, 50);
    }
  });
}

/**
 * Renderiza a etiqueta de tecido como PNG e envia para o diálogo de impressão do navegador.
 */
export async function printTecidoLabel(
  input: TecidoPrintInput,
  labelSettings: LabelSettings & PrintConfig,
) {
  if (!labelSettings.autoPrint) return;
  try {
    const loteText = input.loteSistema || (input.nf ? `NFe ${input.nf}` : '') || input.lote || '';
    const largura = typeof input.largura === 'number' && input.largura > 0
      ? input.largura
      : extractLarguraFromItem(input.item);
    const m2Informado = typeof input.m2 === 'number' && input.m2 > 0 ? input.m2 : 0;
    const mLinear = typeof input.mLinear === 'number' && input.mLinear > 0 ? input.mLinear : 0;
    const m2Calculado = mLinear > 0 && largura > 0 ? mLinear * largura : 0;
    const qtdM2 = m2Informado > 0 ? m2Informado : m2Calculado;
    const qtdText = qtdM2 > 0
      ? `${qtdM2.toFixed(2).replace('.', ',')} M²`
      : '';

    const resolved = await resolverItem(input.item, input.item, input.descricao || '');

    const data: TecidoLabelData = {
      sku: resolved.codigoInterno,
      descricao: resolved.descricao,
      lote: loteText,
      qtd: qtdText,
      rnp: input.endereco || '',
      data: today(),
      qrSku: resolved.codigoInterno,
      qrLote: loteText,
    };

    const rendered = await renderTecidoLabel(data, labelSettings);
    await dispatchPrint(labelSettings, {
      type: 'tecido',
      title: `Etiqueta ${input.item}`,
      dataUrl: rendered.dataUrl,
      widthMm: rendered.widthMm,
      heightMm: rendered.heightMm,
      data: { ...data, input },
    });
  } catch (error) {
    console.error('Erro ao imprimir etiqueta (tecido):', error);
    toast.error('Falha ao processar etiqueta.');
  }
}

/**
 * Renderiza a etiqueta de motor/controle/coulisse como PNG e envia para o diálogo de impressão do navegador.
 */
export async function printMotorLabel(
  input: MotorPrintInput,
  labelSettings: LabelSettings & PrintConfig,
) {
  if (!labelSettings.autoPrint) return;
  try {
    const cxText = input.cx != null && input.cx !== ''
      ? (typeof input.cx === 'number' ? `CX${String(input.cx).padStart(2, '0')}` : String(input.cx))
      : 'S/CX';
    const nfText = input.nf ? `NF ${input.nf}` : '';
    const ntText = input.loteSistema || input.lote;

    const resolved = await resolverItem(input.item, input.item, input.descricao || '');

    const data: MotorLabelData = {
      sku: resolved.codigoInterno,
      descricao: resolved.descricao,
      cx: cxText,
      nf: nfText,
      nt: ntText,
      rnp: input.endereco || '',
      data: today(),
      qrLoteSku: `${input.lote};${resolved.codigoInterno}`,
    };

    const rendered = await renderMotorLabel(data, labelSettings);
    await dispatchPrint(labelSettings, {
      type: 'motor',
      title: `Etiqueta ${input.item}`,
      dataUrl: rendered.dataUrl,
      widthMm: rendered.widthMm,
      heightMm: rendered.heightMm,
      data: { ...data, input },
    });
  } catch (error) {
    console.error('Erro ao imprimir etiqueta (motor):', error);
    toast.error('Falha ao processar etiqueta.');
  }
}
