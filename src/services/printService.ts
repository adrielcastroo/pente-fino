import { toast } from 'sonner';
import { renderTecidoLabel, renderMotorLabel } from './labelRenderer';
import { itensCadastroService } from './itensCadastroService';
import { codigoBate } from '@/lib/codigoFornecedor';
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

export interface PrintConfig {
  autoPrint: boolean;
  /** 'browser' (padrão), 'webhook' (n8n) ou 'both'. */
  printMethod?: PrintMethod;
  /** URL do webhook (n8n) — usado quando printMethod inclui webhook. */
  webhookUrl?: string;
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
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, sentAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Webhook respondeu ${res.status}`);
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
  const method: PrintMethod = cfg.printMethod || 'browser';
  const browserDisabled = typeof localStorage !== 'undefined'
    && localStorage.getItem('pref_disable_browser_print') === 'true';
  const wantBrowser = (method === 'browser' || method === 'both') && !browserDisabled;
  const wantWebhook = (method === 'webhook' || method === 'both') && !!cfg.webhookUrl;

  const tasks: Promise<{ k: 'browser' | 'webhook'; ok: boolean }>[] = [];
  if (wantBrowser) {
    tasks.push(
      printImageInBrowser(payload.dataUrl, payload.widthMm, payload.heightMm, payload.title)
        .then(() => ({ k: 'browser' as const, ok: true }))
        .catch((e) => { console.error('Browser print falhou:', e); return { k: 'browser' as const, ok: false }; })
    );
  }
  if (wantWebhook) {
    tasks.push(
      sendToWebhook(cfg.webhookUrl!, payload)
        .then(() => ({ k: 'webhook' as const, ok: true }))
        .catch((e) => { console.error('Webhook falhou:', e); return { k: 'webhook' as const, ok: false }; })
    );
  }

  const results = await Promise.all(tasks);
  const browserOk = results.find(r => r.k === 'browser')?.ok;
  const webhookOk = results.find(r => r.k === 'webhook')?.ok;

  if (method === 'both') {
    if (browserOk && webhookOk) toast.success('Etiqueta enviada (navegador + n8n)');
    else if (browserOk) toast.warning('Etiqueta impressa no navegador, mas webhook falhou');
    else if (webhookOk) toast.warning('Webhook enviado, mas impressão no navegador falhou');
    else toast.error('Falha em ambos os métodos de impressão');
  } else if (wantBrowser) {
    if (browserOk) toast.success('Etiqueta enviada para impressão!');
    else toast.error('Falha ao abrir diálogo de impressão.');
  } else if (wantWebhook) {
    if (webhookOk) toast.success('Etiqueta enviada para o n8n');
    else toast.error('Falha ao enviar etiqueta para o webhook');
  } else {
    toast.warning('Nenhum método de impressão configurado');
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
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      img { width: ${widthMm}mm; height: ${heightMm}mm; display: block; }
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
