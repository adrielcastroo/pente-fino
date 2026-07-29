// ⚠️  LÓGICA DE ENVIO PARA O N8N — TRAVADA POR SOLICITAÇÃO DO USUÁRIO (07/07/2026).
// Fluxo atual (form-urlencoded + no-cors para HTTP/local, JSON para HTTPS público,
// com fallback para <form> em iframe oculto) está funcionando como esperado.
// NÃO alterar `resolveWebhookUrl`, `isLocalWebhookUrl`, `shouldUseFormNoCors`,
// `buildWebhookForm`, `submitHiddenForm`, `postFormNoCors`, `sendToWebhook` nem
// as chamadas em `dispatchPrint`. Antes de qualquer mudança nesses trechos,
// pedir confirmação explícita do usuário.

import { toast } from 'sonner';
import { createElement, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { renderTecidoLabel, renderMotorLabel } from './labelRenderer';
import { itensCadastroService } from './itensCadastroService';
import { codigoBate, normalizarCodigo } from '@/lib/codigoFornecedor';
import { recordPayload } from './n8nApi';
import { extractLarguraFromItem } from '@/lib/app-utils';
import {
  LABEL_PX_PER_MM,
  MotorPreview,
  TecidoPreview,
  type LabelHas,
  type MotorLabelData,
  type TecidoLabelData,
} from '@/components/labels/LabelTemplates';
import { ZPLPreview } from '@/components/etiquetas/ZPLPreview';
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

    // 3. fallback por DESCRIÇÃO — o backfill do trigger substitui `registros.item`
    //    pela descrição cadastrada; ao reimprimir do histórico, o "item" chega
    //    aqui como texto de descrição. Buscamos o cadastro para recuperar o
    //    código interno correto e manter o padrão da etiqueta.
    const porDescricao = await itensCadastroService.findByDescricao(codigoBipadoOuInterno);
    if (porDescricao) {
      return {
        codigoInterno: porDescricao.codigo_interno,
        descricao: porDescricao.descricao || fallbackDescricao,
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
/**
 * Determina qual método de impressão será realmente usado com base nas
 * preferências. Usado para decidir se aplicamos os offsets de alinhamento
 * físico da impressora térmica dentro do PNG — offsets só fazem sentido
 * quando a etiqueta vai para o n8n/impressora térmica; no navegador eles
 * apenas deslocam o conteúdo e causam recorte.
 */
/** Lê uma flag booleana do localStorage de forma segura (SSR/privacy mode). */
function readFlag(key: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(key) === 'true';
  } catch { return false; }
}

/**
 * Impressão direta desabilitada por completo (chave mestre). Quando ligada,
 * nem o navegador nem o webhook (n8n) são acionados.
 */
export function isDirectPrintDisabled(): boolean {
  return readFlag('pref_disable_direct_print');
}

/** Impressão pelo navegador desabilitada (mestre OU sub-opção). */
export function isBrowserPrintDisabled(): boolean {
  return isDirectPrintDisabled() || readFlag('pref_disable_browser_print');
}

/** Impressão via n8n (webhook) desabilitada (mestre OU sub-opção). */
export function isWebhookPrintDisabled(): boolean {
  return isDirectPrintDisabled() || readFlag('pref_disable_n8n_print');
}

export function resolvePrintMethod(cfg: PrintConfig): PrintMethod {
  const browserDisabled = isBrowserPrintDisabled();
  const hasWebhook = !!resolveWebhookUrl() && !isWebhookPrintDisabled();
  return cfg.printMethod || (!browserDisabled ? 'browser' : (hasWebhook ? 'webhook' : 'browser'));
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
  if (isDirectPrintDisabled()) {
    toast.warning('Impressão direta está desabilitada nas configurações');
    return;
  }
  const browserDisabled = isBrowserPrintDisabled();


  // Webhook por tipo. Motor pode reaproveitar o webhook geral (n8n) como
  // fallback — o payload inclui `type`, `template` e `format` para que o
  // fluxo do n8n faça o roteamento correto e respeite as dimensões enviadas
  // (widthMm/heightMm) em vez de forçar o tamanho de tecido.
  const resolvedWebhook = resolveWebhookUrl();
  const hasWebhook = !!resolvedWebhook && !isWebhookPrintDisabled();

  // Regra do usuário: quando a impressão pelo navegador está LIGADA, NÃO
  // enviar ao n8n (evita redundância — o navegador já cuida da impressão).
  // Só usa n8n quando o navegador está explicitamente desabilitado ou quando
  // o método foi forçado para 'webhook'.
  const explicitMethod: PrintMethod = cfg.printMethod
    || (!browserDisabled ? 'browser' : (hasWebhook ? 'webhook' : 'browser'));

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

  // Modo 'both': se o navegador está ligado, o n8n é ignorado (regra
  // anti-redundância). Só dispara os dois se o usuário forçou 'both' E o
  // navegador está desabilitado — nesse caso 'both' vira efetivamente 'webhook'.
  if (explicitMethod === 'both') {
    if (!browserDisabled) {
      // Navegador ligado → prioriza o navegador, ignora n8n.
      const browserOk = await tryBrowser();
      if (browserOk) toast.success('Etiqueta enviada para impressão!');
      else toast.error('Falha na impressão pelo navegador');
      return;
    }
    // Navegador desabilitado → só n8n mesmo.
    const webhookOk = await tryWebhook();
    if (webhookOk) toast.success('Etiqueta enviada para o n8n');
    else toast.error('Falha ao enviar ao n8n');
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
    // Fidelidade extrema: page size = tamanho físico da etiqueta, sem margens,
    // imagem preenchendo 100% da página SEM stretch (object-fit: contain
    // mantém o aspect ratio caso o driver decida escalar).
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0 !important; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff;
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        overflow: hidden;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      img#lbl {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        margin: 0;
        padding: 0;
        border: 0;
        object-fit: fill;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      @media print {
        html, body { width: ${widthMm}mm; height: ${heightMm}mm; }
        img#lbl { width: ${widthMm}mm; height: ${heightMm}mm; }
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
            // Impressão silenciosa: só funciona se o navegador foi iniciado com
            // `--kiosk-printing` (Chrome/Edge). Nesse modo, o navegador imprime
            // direto na impressora padrão sem mostrar o diálogo. Sem a flag,
            // o diálogo aparece normalmente — o app continua funcionando.
            const silent = typeof localStorage !== 'undefined'
              && localStorage.getItem('pref_silent_browser_print') === 'true';
            win.addEventListener('afterprint', cleanup, { once: true });
            // Em modo silencioso o `afterprint` dispara rápido; ainda assim
            // mantemos um timeout de segurança para não vazar iframe.
            setTimeout(cleanup, silent ? 5_000 : 60_000);
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

    const rendered = await renderTecidoLabel(data, labelSettings, {
      applyPrintOffset: resolvePrintMethod(labelSettings) === 'webhook',
    });
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

    const rendered = await renderMotorLabel(data, labelSettings, {
      applyPrintOffset: resolvePrintMethod(labelSettings) === 'webhook',
    });
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

// ============================================================================
// COMPONENTE — reaproveita o layout físico do Motor:
//  - `sku`  = código interno do componente
//  - `cx`   = quantidade + unidade (ex: "10 PC" / "10 MT")
//  - `qrLoteSku` = SÓ o código do item; sem lote (o "bloco de QR de lote"
//    da etiqueta motor exibe o próprio código, não há lote separado).
// A quebra em N etiquetas é responsabilidade de quem chama esta função
// (uma chamada por etiqueta física a ser impressa).
// ============================================================================

export interface ComponentePrintInput {
  codigo: string;
  descricao?: string;
  quantidade: number;
  unidade?: string | null;
}

export async function printComponenteLabel(
  input: ComponentePrintInput,
  labelSettings: LabelSettings & PrintConfig,
) {
  if (!labelSettings.autoPrint) return;
  try {
    const resolved = await resolverItem(input.codigo, input.codigo, input.descricao || '');
    const unidade = (input.unidade || '').trim().toUpperCase() || 'PC';
    const qtd = Number(input.quantidade);
    const qtdText = Number.isFinite(qtd)
      ? (Number.isInteger(qtd) ? String(qtd) : qtd.toFixed(2).replace(/\.00$/, ''))
      : String(input.quantidade);

    const data: MotorLabelData = {
      sku: resolved.codigoInterno,
      descricao: resolved.descricao,
      cx: `${qtdText} ${unidade}`,
      nf: '',
      nt: '',
      rnp: '',
      data: today(),
      // Sem lote — QR contém apenas o código do item.
      qrLoteSku: resolved.codigoInterno,
    };

    const rendered = await renderMotorLabel(data, labelSettings, {
      applyPrintOffset: resolvePrintMethod(labelSettings) === 'webhook',
    });
    await dispatchPrint(labelSettings, {
      type: 'motor',
      title: `Etiqueta ${resolved.codigoInterno}`,
      dataUrl: rendered.dataUrl,
      widthMm: rendered.widthMm,
      heightMm: rendered.heightMm,
      data: { ...data, input },
    });
  } catch (error) {
    console.error('Erro ao imprimir etiqueta (componente):', error);
    toast.error('Falha ao processar etiqueta.');
  }
}



// ============================================================================
// BATCH PRINT — imprime várias etiquetas com UMA ÚNICA janela de impressão
// do navegador. O envio para o n8n (webhook) continua sendo feito uma etiqueta
// por vez, respeitando a lógica travada de `sendToWebhook`.
// ============================================================================

export interface BatchPage {
  dataUrl: string;
  widthMm: number;
  heightMm: number;
}

interface DirectBrowserPage {
  element: ReactNode;
  widthMm: number;
  heightMm: number;
  basePx: { w: number; h: number };
}

const TECIDO_BATCH_DEFAULT_FIELDS = ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote'];
const MOTOR_BATCH_DEFAULT_FIELDS = ['sku', 'descricao', 'serie', 'cx', 'nf', 'nt', 'rnp', 'data', 'qr_lote_sku'];
const CSS_PX_PER_MM = 96 / 25.4;

function buildTecidoBrowserPage(data: TecidoLabelData, labelSettings: LabelSettings): DirectBrowserPage {
  const fields = labelSettings.fields?.length ? labelSettings.fields : TECIDO_BATCH_DEFAULT_FIELDS;
  const has: LabelHas = (id) => fields.includes(id);
  const w = labelSettings.width ?? 100;
  const h = labelSettings.height ?? 60;
  const orientation = labelSettings.orientation ?? 'landscape';
  const wPx = (orientation === 'landscape' ? w : h) * LABEL_PX_PER_MM;
  const hPx = (orientation === 'landscape' ? h : w) * LABEL_PX_PER_MM;
  const offsetXPx = (labelSettings.printOffsetXMm ?? 0) * LABEL_PX_PER_MM;
  const offsetYPx = (labelSettings.printOffsetYMm ?? 0) * LABEL_PX_PER_MM;
  // No batch pelo navegador, offsets físicos causam recorte — zeramos.
  const applyOffset = resolvePrintMethod(labelSettings) === 'webhook';
  const finalOffsetXPx = applyOffset ? offsetXPx : 0;
  const finalOffsetYPx = applyOffset ? offsetYPx : 0;
  const appearance = {
    borderWidth: labelSettings.borderWidth ?? 4,
    borderStyle: labelSettings.borderStyle ?? 'solid',
    borderRadius: labelSettings.borderRadius ?? 0,
    padding: labelSettings.padding ?? 0,
    margin: labelSettings.margin ?? 0,
    marginY: labelSettings.marginY ?? 0,
  };

  return {
    widthMm: w,
    heightMm: h,
    basePx: { w: wPx, h: hPx },
    element: createElement('div', { style: { position: 'relative', width: `${wPx}px`, height: `${hPx}px`, background: '#fff', overflow: 'hidden' } },
      createElement('div', { style: { position: 'absolute', left: 0, top: 0, transform: `translate(${finalOffsetXPx}px, ${finalOffsetYPx}px)` } },
        createElement(TecidoPreview, { wPx, hPx, fs: labelSettings.fontSize, has, data, ...appearance }),
      ),
    ),
  };
}

function buildMotorBrowserPage(data: MotorLabelData, labelSettings: LabelSettings): DirectBrowserPage {
  const fields = labelSettings.motorFields?.length ? labelSettings.motorFields : MOTOR_BATCH_DEFAULT_FIELDS;
  const has: LabelHas = (id) => fields.includes(id);
  const w = labelSettings.motorWidth ?? 60;
  const h = labelSettings.motorHeight ?? 50;
  const orientation = labelSettings.motorOrientation ?? labelSettings.orientation ?? 'landscape';
  const wPx = (orientation === 'landscape' ? w : h) * LABEL_PX_PER_MM;
  const hPx = (orientation === 'landscape' ? h : w) * LABEL_PX_PER_MM;
  const applyMotorOffset = resolvePrintMethod(labelSettings) === 'webhook';
  const offsetXPx = applyMotorOffset ? (labelSettings.motorPrintOffsetXMm ?? 0) * LABEL_PX_PER_MM : 0;
  const offsetYPx = applyMotorOffset ? (labelSettings.motorPrintOffsetYMm ?? 0) * LABEL_PX_PER_MM : 0;
  const appearance = {
    borderWidth: labelSettings.motorBorderWidth ?? 2,
    borderStyle: labelSettings.motorBorderStyle ?? 'solid',
    borderRadius: labelSettings.motorBorderRadius ?? 0,
    padding: labelSettings.motorPadding ?? 0,
    margin: labelSettings.motorMargin ?? 0,
    marginY: labelSettings.motorMarginY ?? 0,
  };

  return {
    widthMm: w,
    heightMm: h,
    basePx: { w: wPx, h: hPx },
    element: createElement('div', { style: { position: 'relative', width: `${wPx}px`, height: `${hPx}px`, background: '#fff', overflow: 'hidden' } },
      createElement('div', { style: { position: 'absolute', left: 0, top: 0, transform: `translate(${offsetXPx}px, ${offsetYPx}px)` } },
        createElement(MotorPreview, { wPx, hPx, fs: labelSettings.fontSize, has, data, ...appearance }),
      ),
    ),
  };
}


function collectPrintableStyles(): string {
  if (typeof document === 'undefined') return '';
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
}

async function printReactLabelsInBrowserBatch(pages: DirectBrowserPage[], title: string): Promise<void> {
  if (pages.length === 0) return;

  return new Promise((resolve, reject) => {
    const safeTitle = title.replace(/[<>&"']/g, '');
    const maxW = Math.max(...pages.map(p => p.widthMm));
    const maxH = Math.max(...pages.map(p => p.heightMm));
    const styles = collectPrintableStyles();
    const baseHref = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
    const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${baseHref}"><title>${safeTitle}</title>${styles}<style>
      @page { size: ${maxW}mm ${maxH}mm; margin: 0 !important; }
      * { box-sizing: border-box; }
      html, body, #label-root { margin: 0 !important; padding: 0 !important; background: #fff; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      section.page { display: block; margin: 0; padding: 0; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
      .label-scale { transform-origin: top left; }
    </style></head><body><div id="label-root"></div></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', safeTitle);
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${Math.max(maxW, 50)}mm`;
    iframe.style.height = `${Math.max(maxH, 50)}mm`;
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.srcdoc = html;

    let cleaned = false;
    let printed = false;
    let root: ReturnType<typeof createRoot> | null = null;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { root?.unmount(); } catch { /* noop */ }
      try { iframe.remove(); } catch { /* noop */ }
    };

    const triggerPrint = async () => {
      if (printed) return;
      printed = true;
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument || win?.document;
      const mount = doc?.getElementById('label-root');
      if (!win || !doc || !mount) {
        cleanup();
        reject(new Error('iframe de impressão sem documento'));
        return;
      }

      try {
        root = createRoot(mount);
        flushSync(() => {
          root?.render(createElement(
            'div',
            null,
            pages.map((page, index) => {
              const scaleX = (page.widthMm * CSS_PX_PER_MM) / page.basePx.w;
              const scaleY = (page.heightMm * CSS_PX_PER_MM) / page.basePx.h;
              return createElement('section', {
                key: index,
                className: 'page',
                style: {
                  width: `${page.widthMm}mm`,
                  height: `${page.heightMm}mm`,
                  pageBreakAfter: index < pages.length - 1 ? 'always' : undefined,
                  breakAfter: index < pages.length - 1 ? 'page' : undefined,
                },
              }, createElement('div', {
                className: 'label-scale',
                style: {
                  width: `${page.basePx.w}px`,
                  height: `${page.basePx.h}px`,
                  transform: `scale(${scaleX}, ${scaleY})`,
                },
              }, page.element));
            }),
          ));
        });

        await new Promise((r) => win.requestAnimationFrame(() => win.requestAnimationFrame(r)));
        await Promise.race([
          doc.fonts?.ready ?? Promise.resolve(),
          new Promise((r) => setTimeout(r, 300)),
        ]);

        win.focus();
        win.print();
        const silent = typeof localStorage !== 'undefined'
          && localStorage.getItem('pref_silent_browser_print') === 'true';
        win.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, silent ? 5_000 : 120_000);
        resolve();
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    iframe.addEventListener('load', () => { void triggerPrint(); }, { once: true });
    document.body.appendChild(iframe);
    setTimeout(() => { void triggerPrint(); }, 1200);
  });
}

export async function printImagesInBrowserBatch(pages: BatchPage[], title: string): Promise<void> {
  if (pages.length === 0) return;
  if (pages.length === 1) {
    return printImageInBrowser(pages[0].dataUrl, pages[0].widthMm, pages[0].heightMm, title);
  }

  return new Promise((resolve, reject) => {
    const safeTitle = title.replace(/[<>&"']/g, '');
    const maxW = Math.max(...pages.map(p => p.widthMm));
    const maxH = Math.max(...pages.map(p => p.heightMm));
    const sections = pages.map((p, i) => `
      <section class="page" style="width:${p.widthMm}mm;height:${p.heightMm}mm;${i < pages.length - 1 ? 'page-break-after:always;' : ''}">
        <img class="lbl" src="${p.dataUrl}" style="width:${p.widthMm}mm;height:${p.heightMm}mm">
      </section>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>
      @page { size: ${maxW}mm ${maxH}mm; margin: 0 !important; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0 !important; padding: 0 !important; background: #fff;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      section.page { display: block; margin: 0; padding: 0; overflow: hidden;
        break-inside: avoid; page-break-inside: avoid; }
      img.lbl { display: block; margin: 0; padding: 0; border: 0; image-rendering: pixelated; }
    </style></head><body>${sections}</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', safeTitle);
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${Math.max(maxW, 50)}mm`;
    iframe.style.height = `${Math.max(maxH, 50)}mm`;
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.srcdoc = html;

    let cleaned = false;
    const cleanup = () => { if (cleaned) return; cleaned = true; try { iframe.remove(); } catch { /* noop */ } };
    let printed = false;

    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      const win = iframe.contentWindow;
      if (!win) { cleanup(); reject(new Error('iframe sem contentWindow')); return; }
      const doc = win.document;
      const imgs = Array.from(doc.querySelectorAll('img.lbl')) as HTMLImageElement[];
      const waitAll = Promise.all(imgs.map(img => img.complete
        ? Promise.resolve()
        : new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new Error('Falha ao carregar imagem da etiqueta em lote'));
          })));
      waitAll.then(() => {
        requestAnimationFrame(() => setTimeout(() => {
          try {
            win.focus();
            win.print();
            const silent = typeof localStorage !== 'undefined'
              && localStorage.getItem('pref_silent_browser_print') === 'true';
            win.addEventListener('afterprint', cleanup, { once: true });
            setTimeout(cleanup, silent ? 5_000 : 120_000);
            resolve();
          } catch (e) { cleanup(); reject(e); }
        }, 30));
      }).catch((e) => { cleanup(); reject(e); });
    };

    iframe.addEventListener('load', triggerPrint, { once: true });
    document.body.appendChild(iframe);
    setTimeout(triggerPrint, 1200);
  });
}

export interface BatchItem {
  kind: 'tecido' | 'motor';
  input: TecidoPrintInput | MotorPrintInput;
}

/**
 * Callback opcional para acompanhar o envio em lote em tempo real.
 * Chamado para cada item ao mudar de estado.
 */
export type BatchProgressStatus = 'pending' | 'sending' | 'retrying' | 'ok' | 'failed';
export interface BatchProgressEvent {
  index: number;              // índice do item em `items`
  total: number;
  status: BatchProgressStatus;
  attempt: number;            // 1, 2, 3…
  title?: string;             // ex: "Etiqueta 002.001.002.000.323"
  error?: string;
}
export type BatchProgressCallback = (ev: BatchProgressEvent) => void;

/**
 * Imprime várias etiquetas em lote:
 *  - Envio ao n8n (webhook) permanece por-item (lógica travada) mas agora com
 *    retry automático (até 3 tentativas com backoff) por item.
 *  - Impressão pelo navegador é feita em UMA ÚNICA janela para todas as
 *    etiquetas selecionadas — o usuário vê um único diálogo de impressão.
 *  - Progresso é reportado via callback opcional `onProgress`.
 */
export async function printLabelsBatch(
  items: BatchItem[],
  labelSettings: LabelSettings & PrintConfig,
  onProgress?: BatchProgressCallback,
): Promise<{ ok: number; total: number; failed: number[] }> {
  if (items.length === 0) return { ok: 0, total: 0, failed: [] };
  const cfg: LabelSettings & PrintConfig = { ...labelSettings, autoPrint: true };

  const browserDisabled = typeof localStorage !== 'undefined'
    && localStorage.getItem('pref_disable_browser_print') === 'true';
  const resolvedWebhook = resolveWebhookUrl();
  const hasWebhook = !!resolvedWebhook;
  // Regra anti-redundância: navegador ligado → só navegador; navegador
  // desligado → n8n (se configurado). O caller ainda pode forçar via cfg.printMethod.
  const method: PrintMethod = cfg.printMethod
    || (!browserDisabled ? 'browser' : (hasWebhook ? 'webhook' : 'browser'));

  type Payload = {
    type: 'tecido' | 'motor';
    title: string;
    dataUrl: string;
    widthMm: number;
    heightMm: number;
    data: Record<string, unknown>;
  };
  const rendered: { page: BatchPage; payload: Payload }[] = [];

  // Pré-carrega TODOS os itens cadastrados em um único fetch e monta um cache
  // por (codigo_interno, fornecedores normalizados, descrição). Sem isso, cada
  // etiqueta disparava 2–3 queries no Supabase — com dezenas de itens a tela
  // travava no "Preparando…" por muito tempo.
  const cacheByInterno = new Map<string, { codigoInterno: string; descricao: string }>();
  const cacheByFornecedor = new Map<string, { codigoInterno: string; descricao: string }>();
  const cacheByDescricao = new Map<string, { codigoInterno: string; descricao: string }>();
  try {
    const all = await itensCadastroService.list();
    for (const it of all) {
      const entry = { codigoInterno: it.codigo_interno, descricao: it.descricao };
      cacheByInterno.set(normalizarCodigo(it.codigo_interno), entry);
      for (const n of it.codigos_fornecedor_normalizado || []) {
        if (n) cacheByFornecedor.set(n, entry);
      }
      if (it.descricao) cacheByDescricao.set(it.descricao.trim().toLowerCase(), entry);
    }
  } catch (e) {
    console.warn('Não foi possível pré-carregar cadastro; seguindo sem cache:', e);
  }

  const resolveLocal = (
    codigo: string,
    fallbackDescricao: string,
  ): { codigoInterno: string; descricao: string } => {
    const norm = normalizarCodigo(codigo);
    const byInt = norm ? cacheByInterno.get(norm) : undefined;
    if (byInt) return byInt;
    const byForn = norm ? cacheByFornecedor.get(norm) : undefined;
    if (byForn) return byForn;
    const byDesc = codigo ? cacheByDescricao.get(String(codigo).trim().toLowerCase()) : undefined;
    if (byDesc) return byDesc;
    return { codigoInterno: codigo, descricao: fallbackDescricao || codigo };
  };

  if (method === 'browser' && !browserDisabled) {
    const browserPages: DirectBrowserPage[] = [];
    for (const it of items) {
      try {
        if (it.kind === 'motor') {
          const inp = it.input as MotorPrintInput;
          const cxText = inp.cx != null && inp.cx !== ''
            ? (typeof inp.cx === 'number' ? `CX${String(inp.cx).padStart(2, '0')}` : String(inp.cx))
            : 'S/CX';
          const nfText = inp.nf ? `NF ${inp.nf}` : '';
          const ntText = inp.loteSistema || inp.lote;
          const resolved = resolveLocal(inp.item, inp.descricao || '');
          browserPages.push(buildMotorBrowserPage({
            sku: resolved.codigoInterno,
            descricao: resolved.descricao,
            cx: cxText,
            nf: nfText,
            nt: ntText,
            rnp: inp.endereco || '',
            data: today(),
            qrLoteSku: `${inp.lote};${resolved.codigoInterno}`,
          }, cfg));
        } else {
          const inp = it.input as TecidoPrintInput;
          const loteText = inp.loteSistema || (inp.nf ? `NFe ${inp.nf}` : '') || inp.lote || '';
          const largura = typeof inp.largura === 'number' && inp.largura > 0
            ? inp.largura : extractLarguraFromItem(inp.item);
          const m2Informado = typeof inp.m2 === 'number' && inp.m2 > 0 ? inp.m2 : 0;
          const mLinear = typeof inp.mLinear === 'number' && inp.mLinear > 0 ? inp.mLinear : 0;
          const m2Calc = mLinear > 0 && largura > 0 ? mLinear * largura : 0;
          const qtdM2 = m2Informado > 0 ? m2Informado : m2Calc;
          const qtdText = qtdM2 > 0 ? `${qtdM2.toFixed(2).replace('.', ',')} M²` : '';
          const resolved = resolveLocal(inp.item, inp.descricao || '');
          browserPages.push(buildTecidoBrowserPage({
            sku: resolved.codigoInterno,
            descricao: resolved.descricao,
            lote: loteText,
            qtd: qtdText,
            rnp: inp.endereco || '',
            data: today(),
            qrSku: resolved.codigoInterno,
            qrLote: loteText,
          }, cfg));
        }
      } catch (e) {
        console.error('Falha ao preparar etiqueta para lote:', e);
      }
    }

    try {
      await printReactLabelsInBrowserBatch(browserPages, `Etiquetas (${browserPages.length})`);
      return { ok: browserPages.length, total: items.length, failed: [] };
    } catch (e) {
      console.error('Impressão rápida em lote pelo navegador falhou; usando PNG como fallback:', e);
    }
  }

  for (const it of items) {
    try {
      if (it.kind === 'motor') {
        const inp = it.input as MotorPrintInput;
        const cxText = inp.cx != null && inp.cx !== ''
          ? (typeof inp.cx === 'number' ? `CX${String(inp.cx).padStart(2, '0')}` : String(inp.cx))
          : 'S/CX';
        const nfText = inp.nf ? `NF ${inp.nf}` : '';
        const ntText = inp.loteSistema || inp.lote;
        const resolved = resolveLocal(inp.item, inp.descricao || '');
        const data: MotorLabelData = {
          sku: resolved.codigoInterno,
          descricao: resolved.descricao,
          cx: cxText,
          nf: nfText,
          nt: ntText,
          rnp: inp.endereco || '',
          data: today(),
          qrLoteSku: `${inp.lote};${resolved.codigoInterno}`,
        };
        const r = await renderMotorLabel(data, cfg);
        rendered.push({
          page: { dataUrl: r.dataUrl, widthMm: r.widthMm, heightMm: r.heightMm },
          payload: { type: 'motor', title: `Etiqueta ${inp.item}`, dataUrl: r.dataUrl,
            widthMm: r.widthMm, heightMm: r.heightMm, data: { ...data, input: inp } },
        });
      } else {
        const inp = it.input as TecidoPrintInput;
        const loteText = inp.loteSistema || (inp.nf ? `NFe ${inp.nf}` : '') || inp.lote || '';
        const largura = typeof inp.largura === 'number' && inp.largura > 0
          ? inp.largura : extractLarguraFromItem(inp.item);
        const m2Informado = typeof inp.m2 === 'number' && inp.m2 > 0 ? inp.m2 : 0;
        const mLinear = typeof inp.mLinear === 'number' && inp.mLinear > 0 ? inp.mLinear : 0;
        const m2Calc = mLinear > 0 && largura > 0 ? mLinear * largura : 0;
        const qtdM2 = m2Informado > 0 ? m2Informado : m2Calc;
        const qtdText = qtdM2 > 0 ? `${qtdM2.toFixed(2).replace('.', ',')} M²` : '';
        const resolved = resolveLocal(inp.item, inp.descricao || '');
        const data: TecidoLabelData = {
          sku: resolved.codigoInterno,
          descricao: resolved.descricao,
          lote: loteText,
          qtd: qtdText,
          rnp: inp.endereco || '',
          data: today(),
          qrSku: resolved.codigoInterno,
          qrLote: loteText,
        };
        const r = await renderTecidoLabel(data, cfg);
        rendered.push({
          page: { dataUrl: r.dataUrl, widthMm: r.widthMm, heightMm: r.heightMm },
          payload: { type: 'tecido', title: `Etiqueta ${inp.item}`, dataUrl: r.dataUrl,
            widthMm: r.widthMm, heightMm: r.heightMm, data: { ...data, input: inp } },
        });
      }
    } catch (e) {
      console.error('Falha ao renderizar etiqueta para lote:', e);
    }
  }


  // Regra anti-redundância: se navegador está ligado, NUNCA enviamos ao n8n
  // — mesmo com method='both'. Só há envio ao n8n quando o navegador está
  // desabilitado (ou method='webhook' explícito).
  const wantWebhook = method === 'webhook'
    || (method === 'both' && browserDisabled && hasWebhook);
  const wantBrowser = (method === 'browser' || method === 'both') && !browserDisabled;
  const needsBrowserFallback = method === 'webhook' && !browserDisabled;

  let webhookOkCount = 0;
  const failedIdx: number[] = [];
  if (wantWebhook) {
    const MAX_ATTEMPTS = 3;
    const BACKOFF_MS = [0, 700, 1800]; // espera antes de cada tentativa
    for (let i = 0; i < rendered.length; i++) {
      const title = rendered[i].payload.title;
      let sent = false;
      let lastError: unknown = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (BACKOFF_MS[attempt - 1] > 0) {
          await new Promise(r => setTimeout(r, BACKOFF_MS[attempt - 1]));
        }
        onProgress?.({
          index: i,
          total: rendered.length,
          status: attempt === 1 ? 'sending' : 'retrying',
          attempt,
          title,
        });
        try {
          await sendToWebhook(resolvedWebhook, rendered[i].payload);
          sent = true;
          onProgress?.({ index: i, total: rendered.length, status: 'ok', attempt, title });
          break;
        } catch (e) {
          lastError = e;
          console.warn(`Webhook lote item ${i} tentativa ${attempt}/${MAX_ATTEMPTS} falhou:`, e);
        }
      }
      if (sent) {
        webhookOkCount++;
      } else {
        failedIdx.push(i);
        onProgress?.({
          index: i,
          total: rendered.length,
          status: 'failed',
          attempt: MAX_ATTEMPTS,
          title,
          error: lastError instanceof Error ? lastError.message : String(lastError ?? ''),
        });
      }
    }
  }

  const browserPages: BatchPage[] = wantBrowser
    ? rendered.map(r => r.page)
    : needsBrowserFallback
      ? failedIdx.map(i => rendered[i].page)
      : [];

  if (browserPages.length > 0) {
    try {
      await printImagesInBrowserBatch(browserPages, `Etiquetas (${browserPages.length})`);
    } catch (e) {
      console.error('Impressão em lote pelo navegador falhou:', e);
    }
  }

  const ok = wantWebhook
    ? webhookOkCount + (needsBrowserFallback ? 0 : 0)
    : (browserPages.length > 0 ? rendered.length : 0);
  return { ok, total: items.length, failed: failedIdx };
}

/**
 * Imprime N cópias de UMA imagem já renderizada (PNG dataURL) via iframe único.
 * Modelado no `printImageInBrowser` — mesmo tratamento de @page/fidelidade,
 * mas empilha várias páginas separadas por `page-break-after` para sair uma
 * etiqueta por página no diálogo/spooler.
 */
export async function printImagesInBrowser(
  dataUrl: string,
  widthMm: number,
  heightMm: number,
  copies: number,
  title: string,
): Promise<void> {
  const nCopies = Math.max(1, Math.floor(copies));
  return new Promise((resolve, reject) => {
    const safeTitle = title.replace(/[<>&"']/g, '');
    const pages = Array.from({ length: nCopies })
      .map(() => `<img class="lbl" src="${dataUrl}">`)
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0 !important; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        margin: 0 !important; padding: 0 !important; background: #fff;
        width: ${widthMm}mm;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      img.lbl {
        display: block;
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        margin: 0; padding: 0; border: 0;
        object-fit: fill;
        page-break-after: always;
        break-after: page;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      img.lbl:last-child { page-break-after: auto; break-after: auto; }
      @media print {
        html, body { width: ${widthMm}mm; }
        img.lbl { width: ${widthMm}mm; height: ${heightMm}mm; }
      }
    </style></head><body>${pages}</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', safeTitle);
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${Math.max(widthMm, 50)}mm`;
    iframe.style.height = `${Math.max(heightMm * nCopies, 50)}mm`;
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
      const doc = win.document;
      const imgs = Array.from(doc.querySelectorAll('img.lbl')) as HTMLImageElement[];
      const waitAll = Promise.all(imgs.map((img) => img.complete
        ? Promise.resolve()
        : new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Falha ao carregar imagem')); })));
      waitAll
        .then(() => new Promise<void>((res) => requestAnimationFrame(() => setTimeout(res, 30))))
        .then(() => {
          try {
            win.focus();
            win.print();
            const silent = typeof localStorage !== 'undefined'
              && localStorage.getItem('pref_silent_browser_print') === 'true';
            win.addEventListener('afterprint', cleanup, { once: true });
            setTimeout(cleanup, silent ? 5_000 : 60_000);
            resolve();
          } catch (e) { cleanup(); reject(e); }
        })
        .catch((e) => { cleanup(); reject(e); });
    };

    iframe.addEventListener('load', triggerPrint, { once: true });
    document.body.appendChild(iframe);
    setTimeout(triggerPrint, 800);
  });
}

/**
 * Impressão de etiquetas ZPL da Expedição usando o MESMO pipeline direto (React → iframe)
 * das etiquetas de Tecido/Motor no módulo estoque. Isso preserva 100% dos elementos
 * visuais do `ZPLPreview` (textos, códigos, QR, boxes, linhas) sem conversão para PNG
 * — nada é adicionado, nada é removido. Ajustes finos (offset X/Y, borda, padding)
 * vêm do LabelSettings (aba "Expedição (ZPL)").
 */
export async function printZplLabelsInBrowser(
  zpl: string,
  variaveis: Record<string, string>,
  dimensoes: { largura: number; altura: number },
  copies: number,
  labelSettings: LabelSettings,
  title: string,
): Promise<void> {
  const nCopies = Math.max(1, Math.floor(copies));
  const w = dimensoes.largura;
  const h = dimensoes.altura;
  const wPx = w * LABEL_PX_PER_MM;
  const hPx = h * LABEL_PX_PER_MM;
  const offsetXPx = (labelSettings.expedicaoPrintOffsetXMm ?? 0) * LABEL_PX_PER_MM;
  const offsetYPx = (labelSettings.expedicaoPrintOffsetYMm ?? 0) * LABEL_PX_PER_MM;
  const borderWidth = labelSettings.expedicaoBorderWidth ?? 0;
  const borderStyle = labelSettings.expedicaoBorderStyle ?? 'none';
  const borderRadius = labelSettings.expedicaoBorderRadius ?? 0;
  const padding = labelSettings.expedicaoPadding ?? 0;
  const lineThickness = labelSettings.expedicaoLineThickness ?? 2;
  const lineStyle = labelSettings.expedicaoLineStyle ?? 'solid';
  const lineColor = labelSettings.expedicaoLineColor ?? '#111';
  const fontFamily = labelSettings.expedicaoFontFamily ?? 'monospace';
  const buildPage = (): DirectBrowserPage => ({
    widthMm: w,
    heightMm: h,
    basePx: { w: wPx, h: hPx },
    element: createElement('div', {
      style: {
        position: 'relative',
        width: `${wPx}px`,
        height: `${hPx}px`,
        background: '#fff',
        overflow: 'hidden',
      },
    },
      createElement(ZPLPreview, {
        zpl,
        variaveis,
        dimensoes,
        lineThickness,
        lineStyle,
        lineColor,
        fontFamily,
        borderWidth,
        borderStyle,
        borderRadius,
        padding,
        offsetX: offsetXPx,
        offsetY: offsetYPx,
      }),
    ),
  });

  const pages: DirectBrowserPage[] = Array.from({ length: nCopies }, buildPage);
  await printReactLabelsInBrowserBatch(pages, title);
}


