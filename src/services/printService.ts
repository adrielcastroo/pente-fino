import { toast } from 'sonner';
import { renderTecidoLabel, renderMotorLabel } from './labelRenderer';
import { itensCadastroService } from './itensCadastroService';
import { codigoBate } from '@/lib/codigoFornecedor';
import { extractLarguraFromItem } from '@/lib/app-utils';
import { supabase } from '@/integrations/supabase/client';
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


export type PrintMethod = 'browser' | 'webhook' | 'both';

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
  const payloadJson = JSON.stringify(body);

  // 1) Preferir Edge Function `n8n-proxy` — nos dá status HTTP real do n8n
  //    sem passar por CORS do browser.
  try {
    const { data, error } = await supabase.functions.invoke('n8n-proxy', {
      body: {
        url: webhookUrl,
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    });
    if (error) throw error;
    if (data && typeof data === 'object') {
      const d = data as { ok?: boolean; status?: number; error?: string };
      if (d.ok) {
        void logN8nHealth(true);
        return;
      }
      const msg = d.error || `n8n respondeu ${d.status ?? '???'}`;
      void logN8nHealth(false, msg);
      throw new Error(msg);
    }
    void logN8nHealth(true);
    return;
  } catch (proxyErr) {
    console.warn('[print] n8n-proxy indisponível, fallback direto:', proxyErr);
  }

  // 2) Fallback: chamar o webhook diretamente (com retry no-cors em caso de bloqueio).
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: payloadJson,
      keepalive: true,
    });
    if (res.type === 'opaque') { void logN8nHealth(true); return; }
    if (!res.ok) {
      const msg = `Webhook respondeu ${res.status}`;
      void logN8nHealth(false, msg);
      throw new Error(msg);
    }
    void logN8nHealth(true);
    return;
  } catch (err) {
    console.warn('[print] webhook direto falhou, retry no-cors:', err);
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payloadJson,
      keepalive: true,
    });
    // no-cors: sem status real; registrar como aviso.
    void logN8nHealth(false, (err as Error).message || 'CORS/opaque — sem status HTTP');
    return;
  }
}

/**
 * Atualiza `integrations.last_checked_at` / `last_error` / `status` para a
 * chave `n8n_webhook`, permitindo que o card de Integrações mostre a saúde
 * real do fluxo de impressão.
 */
async function logN8nHealth(ok: boolean, errorMsg?: string): Promise<void> {
  try {
    await (supabase.from('integrations' as any).update({
      last_checked_at: new Date().toISOString(),
      last_error: ok ? null : (errorMsg ?? 'erro desconhecido').slice(0, 500),
      status: ok ? 'active' : 'error',
    }).eq('key', 'n8n_webhook') as any);
  } catch (e) {
    console.warn('[print] falha ao registrar saúde do n8n:', e);
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
  const browserDisabled = typeof localStorage !== 'undefined'
    && localStorage.getItem('pref_disable_browser_print') === 'true';

  // Webhook por tipo. Motor pode reaproveitar o webhook geral (n8n) como
  // fallback — o payload inclui `type`, `template` e `format` para que o
  // fluxo do n8n faça o roteamento correto e respeite as dimensões enviadas
  // (widthMm/heightMm) em vez de forçar o tamanho de tecido.
  const rawWebhook = payload.type === 'motor'
    ? (cfg.motorWebhookUrl?.trim() || cfg.webhookUrl?.trim() || '')
    : (cfg.webhookUrl?.trim() || '');

  // Se houver URL configurada mas inválida, avisa e desconsidera para não estourar erro obscuro.
  const validation = validateWebhookUrl(rawWebhook, { allowEmpty: true });
  if (rawWebhook && !validation.ok) {
    toast.error(`Webhook (${payload.type}) inválido: ${validation.error} — corrija em Configurações.`);
  }
  const resolvedWebhook = validation.ok ? rawWebhook : '';
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
 * Imprime a imagem da etiqueta diretamente pelo navegador, usando um iframe
 * oculto com @page no tamanho exato em mm. Substitui o envio para o n8n.
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
