// ⚠️  LÓGICA DE ENVIO PARA O N8N — TRAVADA POR SOLICITAÇÃO DO USUÁRIO (07/07/2026).
// Fluxo atual (form-urlencoded + no-cors para HTTP/local, JSON para HTTPS público,
// com fallback para <form> em iframe oculto) está funcionando como esperado.
// NÃO alterar `resolveWebhookUrl`, `isLocalWebhookUrl`, `shouldUseFormNoCors`,
// `buildWebhookForm`, `submitHiddenForm`, `postFormNoCors`, `sendToWebhook` nem
// as chamadas em `dispatchPrint`. Antes de qualquer mudança nesses trechos,
// pedir confirmação explícita do usuário.

import { toast } from 'sonner';
import { renderTecidoLabel, renderMotorLabel } from './labelRenderer';
import { itensCadastroService } from './itensCadastroService';
import { codigoBate } from '@/lib/codigoFornecedor';
import { recordPayload } from './n8nApi';
import { extractLarguraFromItem } from '@/lib/app-utils';
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


export type PrintMethod = 'browser' | 'webhook' | 'both';

const DEFAULT_N8N_WEBHOOK_PATH = '/webhook/imprimir-etiqueta';
const DEFAULT_N8N_WEBHOOK_URL = 'http://localhost:5678' + DEFAULT_N8N_WEBHOOK_PATH;

/**
 * Resolve a URL do webhook usando (em ordem):
 *  1. `n8n_webhook_url` no localStorage (override manual completo)
 *  2. base do painel n8n (`n8n_api_url`) + path padrão do webhook — assim,
 *     quando o usuário configura um túnel HTTPS no painel de monitoramento,
 *     o webhook passa a usar automaticamente a mesma URL pública.
 *  3. fallback: localhost:5678
 */
function resolveWebhookUrl(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_N8N_WEBHOOK_URL;
  const override = localStorage.getItem('n8n_webhook_url');
  if (override && override.trim()) return override.trim();
  const base = localStorage.getItem('n8n_api_url');
  if (base && base.trim()) return base.replace(/\/+$/, '') + DEFAULT_N8N_WEBHOOK_PATH;
  return DEFAULT_N8N_WEBHOOK_URL;
}

export interface PrintConfig {
  autoPrint: boolean;
  /** 'browser' (padrão), 'webhook' (n8n) ou 'both'. */
  printMethod?: PrintMethod;
  /** URL do webhook (n8n) — usado para tecido e como fallback geral. */
  webhookUrl?: string;
  /** URL do webhook (n8n) específico para etiquetas de motor. Se vazio, usa `webhookUrl`. */
  motorWebhookUrl?: string;
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
 * Detecta destinos locais/privados. Esses endpoints de n8n normalmente não
 * respondem corretamente ao preflight CORS gerado por JSON direto.
 */
function isLocalWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (host.endsWith('.local')) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

    const private172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (private172) {
      const octet = Number(private172[1]);
      return octet >= 16 && octet <= 31;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Qualquer HTTP/local usa requisição simples para evitar bloqueio antes do POST.
 * HTTPS público tenta JSON primeiro, mas pode cair no mesmo caminho se CORS falhar.
 */
function shouldUseFormNoCors(webhookUrl: string): boolean {
  try {
    const parsed = new URL(webhookUrl);
    return parsed.protocol === 'http:' || isLocalWebhookUrl(webhookUrl);
  } catch {
    return false;
  }
}

function buildWebhookForm(
  payload: {
    type: 'tecido' | 'motor';
    title: string;
    widthMm: number;
    heightMm: number;
    data: Record<string, any>;
  },
  base64: string,
  mimeType: string,
  sentAt: string,
): URLSearchParams {
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
  form.set('sentAt', sentAt);
  form.set('data', JSON.stringify(payload.data));
  return form;
}

function submitHiddenForm(webhookUrl: string, form: URLSearchParams): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    const iframeName = `n8n-print-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    const htmlForm = document.createElement('form');
    htmlForm.method = 'POST';
    htmlForm.action = webhookUrl;
    htmlForm.target = iframeName;
    htmlForm.enctype = 'application/x-www-form-urlencoded';
    htmlForm.style.display = 'none';

    form.forEach((value, key) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      htmlForm.appendChild(input);
    });

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      try { htmlForm.remove(); } catch { /* noop */ }
      try { iframe.remove(); } catch { /* noop */ }
      resolve();
    };

    iframe.addEventListener('load', cleanup, { once: true });
    document.body.appendChild(iframe);
    document.body.appendChild(htmlForm);
    htmlForm.submit();
    window.setTimeout(cleanup, 1500);
  });
}

async function postFormNoCors(webhookUrl: string, form: URLSearchParams): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: form,
    });
  } catch (fetchError) {
    console.warn('Envio fetch no-cors bloqueado; tentando formulário oculto:', fetchError);
    await submitHiddenForm(webhookUrl, form);
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
  // Enviamos múltiplos formatos para máxima compatibilidade com o agente n8n:
  //  - imageBase64: base64 PURO (sem prefixo, sem aspas) → use este no agente
  //  - mimeType: tipo MIME (geralmente image/png)
  //  - dataUrl: mantido por retrocompatibilidade
  const body = {
    ...payload,
    template: payload.type,                 // alias explícito p/ roteamento
    format: payload.type,                   // alias adicional
    imageBase64: base64,
    mimeType,
    imageSize: base64.length,
    sentAt: new Date().toISOString(),
  };

  const recordOk = () => recordPayload({
    sentAt: new Date().toISOString(),
    webhookUrl,
    status: 'ok',
    payload: body,
    title: payload.title,
  });
  const recordFail = (errorMessage: string) => recordPayload({
    sentAt: new Date().toISOString(),
    webhookUrl,
    status: 'fail',
    errorMessage,
    payload: body,
    title: payload.title,
  });

  // n8n local/HTTP → form-urlencoded + no-cors evita preflight e preserva
  // `imageBase64` como campo de body para o workflow antigo.
  if (shouldUseFormNoCors(webhookUrl)) {
    const form = buildWebhookForm(payload, base64, mimeType, body.sentAt);
    await postFormNoCors(webhookUrl, form);
    recordOk();
    return;
  }

  let res: Response;
  try {
    res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    // Tunnel/URL pública sem CORS: ainda enviamos por requisição simples.
    try {
      const form = buildWebhookForm(payload, base64, mimeType, body.sentAt);
      await postFormNoCors(webhookUrl, form);
      recordOk();
      return;
    } catch (fallbackError: any) {
      const message = fallbackError?.message || e?.message || String(fallbackError || e);
      recordFail(message);
      throw fallbackError || e;
    }
  }

  if (!res.ok) {
    const message = `HTTP ${res.status}`;
    recordFail(message);
    throw new Error(`Webhook respondeu ${res.status}`);
  }

  recordOk();
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
  const browserDisabled = typeof localStorage !== 'undefined'
    && localStorage.getItem('pref_disable_browser_print') === 'true';

  // Webhook por tipo. Motor pode reaproveitar o webhook geral (n8n) como
  // fallback — o payload inclui `type`, `template` e `format` para que o
  // fluxo do n8n faça o roteamento correto e respeite as dimensões enviadas
  // (widthMm/heightMm) em vez de forçar o tamanho de tecido.
  const resolvedWebhook = resolveWebhookUrl();
  const hasWebhook = !!resolvedWebhook;
  const explicitMethod: PrintMethod = cfg.printMethod || (hasWebhook ? 'webhook' : 'browser');

  const tryBrowser = async () => {
    if (browserDisabled) {
      toast.warning('Impressão pelo navegador está desabilitada nas configurações');
      return false;
    }
    try {
      await printImageInBrowser(payload.dataUrl, payload.widthMm, payload.heightMm, payload.title);
      return true;
    } catch (e) {
      console.error('Browser print falhou:', e);
      return false;
    }
  };

  const tryWebhook = async () => {
    if (!hasWebhook) return false;
    try {
      await sendToWebhook(resolvedWebhook, payload);
      return true;
    } catch (e) {
      console.error('Webhook falhou:', e);
      return false;
    }
  };

  // Modo 'both': dispara os dois em paralelo (respeitando preferência de desabilitar navegador).
  if (explicitMethod === 'both') {
    const [webhookOk, browserOk] = await Promise.all([tryWebhook(), tryBrowser()]);
    if (webhookOk && browserOk) toast.success('Etiqueta enviada (n8n + navegador)');
    else if (webhookOk) toast.success('Etiqueta enviada para o n8n');
    else if (browserOk) toast.success('Etiqueta enviada para impressão!');
    else toast.error('Falha em ambos os métodos de impressão');
    return;
  }

  // Preferência padrão: tenta webhook (n8n) primeiro; se falhar, cai para navegador.
  if (hasWebhook) {
    const webhookOk = await tryWebhook();
    if (webhookOk) {
      toast.success('Etiqueta enviada para o n8n');
      return;
    }
    if (browserDisabled) {
      toast.error('Webhook (n8n) falhou e impressão pelo navegador está desabilitada');
      return;
    }
    toast.warning('Webhook (n8n) falhou — tentando impressão pelo navegador…');
    const browserOk = await tryBrowser();
    if (browserOk) toast.success('Etiqueta enviada para impressão (fallback navegador)');
    else toast.error('Falha ao imprimir etiqueta');
    return;
  }

  // Sem webhook configurado: usa navegador (se permitido).
  if (browserDisabled) {
    toast.error('Nenhum método disponível: configure o webhook (n8n) ou habilite a impressão pelo navegador');
    return;
  }
  const browserOk = await tryBrowser();
  if (browserOk) toast.success('Etiqueta enviada para impressão!');
  else toast.error('Falha ao abrir diálogo de impressão.');
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
 * Imprime a imagem da etiqueta diretamente pelo navegador usando um iframe
 * oculto — mas com dimensões REAIS (não 0×0) posicionado fora da tela, porque
 * Chrome/Edge recusam abrir o diálogo de impressão de iframes 0×0/opacity:0
 * e acabam caindo para uma janela pop-up (que o usuário vê como "nova aba").
 *
 * Uso srcdoc + onload para garantir que o documento está totalmente pronto
 * antes de chamar contentWindow.print(); focar o iframe antes é essencial
 * para o diálogo aparecer na aba atual em vez de uma nova.
 */
async function printImageInBrowser(
  dataUrl: string,
  widthMm: number,
  heightMm: number,
  title: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeTitle = title.replace(/[<>&"']/g, '');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0 !important; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff;
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        overflow: hidden;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      img#lbl {
        display: block;
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        margin: 0;
        padding: 0;
        border: 0;
        image-rendering: pixelated;
      }
      @media print {
        html, body { width: ${widthMm}mm; height: ${heightMm}mm; }
      }
    </style></head><body><img id="lbl" src="${dataUrl}"></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', safeTitle);
    // Dimensões REAIS fora da tela — 0×0 faz o Chrome abrir uma janela nova.
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${Math.max(widthMm, 50)}mm`;
    iframe.style.height = `${Math.max(heightMm, 50)}mm`;
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.srcdoc = html;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { iframe.remove(); } catch { /* noop */ }
    };

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      const win = iframe.contentWindow;
      if (!win) { cleanup(); reject(new Error('iframe sem contentWindow')); return; }
      try {
        // Focar o iframe é essencial: sem foco, Chrome pode delegar a impressão
        // à janela principal (ou abrir uma nova) em vez do documento do iframe.
        win.focus();
        // Se houver imagem, esperar carregamento antes do print().
        const doc = win.document;
        const img = doc.getElementById('lbl') as HTMLImageElement | null;
        const doPrint = () => {
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
        if (img && !img.complete) {
          img.onload = doPrint;
          img.onerror = () => { cleanup(); reject(new Error('Falha ao carregar imagem da etiqueta')); };
        } else {
          // dá 1 frame ao layout aplicar @page/dimensões antes de imprimir
          requestAnimationFrame(() => setTimeout(doPrint, 30));
        }
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    iframe.addEventListener('load', triggerPrint, { once: true });
    document.body.appendChild(iframe);
    // Fallback caso o evento load não dispare (raro com srcdoc)
    setTimeout(triggerPrint, 800);
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
