import { toast } from 'sonner';
import { renderTecidoLabel, renderMotorLabel } from './labelRenderer';
import { itensCadastroService } from './itensCadastroService';
import { codigoBate } from '@/lib/codigoFornecedor';
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
      if (porInterno.codigo_fornecedor && !codigoBate(codigoBipadoOriginal, porInterno.codigo_fornecedor)) {
        toast.warning(
          `Código bipado "${codigoBipadoOriginal}" não confere com fornecedor "${porInterno.codigo_fornecedor}"`,
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
  /** Mantido por compatibilidade — o webhook real é fixo em PRINT_WEBHOOK_URL. */
  webhookUrl?: string;
}

/**
 * Webhook fixo do n8n local. Não pode ser alterado pelo usuário —
 * o n8n se encarrega de repassar a imagem para a impressora correta.
 */
export const PRINT_WEBHOOK_URL = 'http://localhost:5678/webhook/imprimir-etiqueta';

export interface TecidoPrintInput {
  item: string;
  descricao?: string;
  lote: string;
  loteSistema?: string;
  nf?: string;
  processo?: string;
  mLinear?: number;
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

function safeFilename(s: string): string {
  return (s || 'etiqueta').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);
}

async function sendToWebhook(payload: Record<string, unknown>, webhookUrl: string) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`n8n respondeu ${response.status} ${response.statusText}`);
  }
}

/**
 * Renderiza a etiqueta de tecido como PNG e envia para o webhook do n8n.
 */
export async function printTecidoLabel(
  input: TecidoPrintInput,
  labelSettings: LabelSettings & PrintConfig,
) {
  if (!labelSettings.autoPrint) return;
  try {
    const loteText = input.loteSistema || (input.nf ? `NFe ${input.nf}` : '') || input.lote || '';
    const qtdText = typeof input.mLinear === 'number' && input.mLinear > 0
      ? `${input.mLinear.toFixed(2).replace('.', ',')} M`
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

    await sendToWebhook({
      kind: 'tecido',
      format: 'png',
      filename: `etiqueta-${safeFilename(input.item)}-${safeFilename(input.lote)}.png`,
      widthMm: rendered.widthMm,
      heightMm: rendered.heightMm,
      widthPx: rendered.widthPx,
      heightPx: rendered.heightPx,
      imageBase64: rendered.imageBase64,
      dataUrl: rendered.dataUrl,
      item: input.item,
      lote: input.lote,
      loteSistema: input.loteSistema,
      nf: input.nf,
      processo: input.processo,
      endereco: input.endereco,
      mLinear: input.mLinear,
      timestamp: new Date().toISOString(),
    }, PRINT_WEBHOOK_URL);

    toast.success('Etiqueta enviada para impressão!');
  } catch (error) {
    console.error('Erro ao imprimir etiqueta (tecido):', error);
    toast.error('Falha ao enviar etiqueta para o n8n.');
  }
}

/**
 * Renderiza a etiqueta de motor/controle/coulisse como PNG e envia para o webhook do n8n.
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

    await sendToWebhook({
      kind: 'motor',
      format: 'png',
      filename: `etiqueta-${safeFilename(input.item)}-${safeFilename(input.lote)}.png`,
      widthMm: rendered.widthMm,
      heightMm: rendered.heightMm,
      widthPx: rendered.widthPx,
      heightPx: rendered.heightPx,
      imageBase64: rendered.imageBase64,
      dataUrl: rendered.dataUrl,
      item: input.item,
      lote: input.lote,
      loteSistema: input.loteSistema,
      nf: input.nf,
      cx: input.cx,
      sequencial: input.sequencial,
      endereco: input.endereco,
      timestamp: new Date().toISOString(),
    }, PRINT_WEBHOOK_URL);

    toast.success('Etiqueta enviada para impressão!');
  } catch (error) {
    console.error('Erro ao imprimir etiqueta (motor):', error);
    toast.error('Falha ao enviar etiqueta para o n8n.');
  }
}
