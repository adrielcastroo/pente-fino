// ============================================================================
// Converte NFeData (parser SEFAZ) em patch para o template de etiqueta ativo.
// ============================================================================
import type { NFeData } from '@/lib/nfe-parser';

export interface EtiquetaXmlPatch {
  titulo: string;
  subtitulo: string;
  codigo: string;
  destino: string;
  transportadora: string;
  nfNumero: string;
  volumeAtual: string;
  volumeTotal: string;
  codePayload: string;
  showBarcode: boolean;
  showQr: boolean;
  barcodeFmt: 'CODE128';
}

export function nfeToPatch(nfe: NFeData, volumeAtual = 1): EtiquetaXmlPatch {
  const totalVol = Math.max(1, nfe.volumes || 1);
  const atual = Math.min(Math.max(1, volumeAtual), totalVol);
  return {
    titulo: nfe.transportadora?.toUpperCase() || 'EXPEDIÇÃO',
    subtitulo: `NF ${nfe.numero} · Vol ${atual}/${totalVol}`,
    codigo: nfe.numero,
    destino: nfe.nomeDestinatario || '',
    transportadora: nfe.transportadora || '',
    nfNumero: nfe.numero,
    volumeAtual: String(atual),
    volumeTotal: String(totalVol),
    codePayload: nfe.chaveAcesso,
    showBarcode: true,
    showQr: false,
    barcodeFmt: 'CODE128',
  };
}
