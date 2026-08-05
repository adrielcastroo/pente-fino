import type React from "react";
import { QRCodeSVG } from "qrcode.react";

// Escala física compartilhada entre preview e PNG final (≈ 203 dpi = 8 px/mm).
// Usar a mesma constante garante que o preview seja pixel-a-pixel idêntico
// ao PNG enviado para a impressora.
export const LABEL_PX_PER_MM = 8;

export type LabelHas = (id: string) => boolean;

export interface TecidoLabelData {
  sku: string;
  descricao: string;
  lote: string; // ex: "NFe 148551" ou loteSistema
  qtd: string; // ex: "1,00 M"
  rnp: string; // endereço
  data: string; // dd/mm/yyyy
  qrSku: string;
  qrLote: string;
}

export interface MotorLabelData {
  sku: string;
  descricao: string;
  cx: string; // ex: "CX01" ou "S/CX"
  nf: string; // ex: "NF 148362"
  nt: string; // série completa
  rnp: string;
  data: string;
  qrLoteSku: string;
}

export const TECIDO_SAMPLE: TecidoLabelData = {
  sku: "002.001.002.000.323",
  descricao: "VB.Mot. Interruptor Inis Uno (1800492 persi. 2/25) (C)\nPCT1 (T.V.) (2)F0085",
  lote: "NFe 148551",
  qtd: "1,00 M",
  rnp: "G4.C10.C10",
  data: "29/05/2026",
  qrSku: "002.001.002.000.323",
  qrLote: "NFe 148551",
};

export const MOTOR_SAMPLE: MotorLabelData = {
  sku: "002.001.002.000.83.4",
  descricao: "Motor LSN 40 220v RTS (1245968)\n6N/33rpm ( (t.v.) (A) PCT1 RR)",
  cx: "CX01",
  nf: "NF 148362",
  nt: "NT725284000424",
  rnp: "G2.C01.A01/2 B01/2 -IS",
  data: "21/05/2026",
  qrLoteSku: "NT725284000424;002.001.002.000.83.4",
};

interface PreviewProps {
  wPx: number;
  hPx: number;
  fs: number;
  has: LabelHas;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderRadius?: number;
  padding?: number;
  margin?: number;
  marginY?: number;
  offsetX?: number;
}

export function TecidoPreview({ wPx, hPx, fs, has, data = TECIDO_SAMPLE, borderWidth = 4, borderStyle = 'solid', borderRadius = 0, padding = 0, margin = 0, marginY, offsetX = 0 }: PreviewProps & { data?: TecidoLabelData }) {
  const descLines = data.descricao.split("\n");
  const my = marginY ?? margin;
  return (
    <div
      style={{
        width: `${wPx}px`,
        height: `${hPx}px`,
        fontSize: `${fs}px`,
        margin: `${my}px auto`,
        transform: offsetX ? `translateX(${offsetX}px)` : undefined,
        padding: `${padding}px`,
        borderWidth: `${borderWidth}px`,
        borderStyle,
        borderColor: '#000',
        borderRadius: `${borderRadius}px`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      className="bg-white text-black shadow-2xl flex flex-col font-['OCR-B','OCR_B_10_BT','IBM_Plex_Mono',ui-monospace,monospace]"
    >
      <div className="flex border-b-4 border-black flex-[1.1]">
        <div className="flex-1 pt-4 pb-2 px-2 flex flex-col justify-start overflow-hidden border-r-4 border-black">
          {has("sku") && (
            <div className="font-semibold tracking-tight leading-none truncate" style={{ fontSize: `${fs * 5}px` }}>
              {data.sku}
            </div>
          )}
          {has("descricao") && (
            <div className="mt-1 leading-tight line-clamp-2 overflow-hidden" style={{ fontSize: `${fs * 2.2}px` }}>
              {descLines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>
        {has("qr_sku") && (
          <div className="w-[22%] flex flex-col items-center justify-end pt-4 pb-2 px-2">
            <QRCodeSVG value={data.qrSku} size={hPx * 0.22} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 1.8}px` }}>
              SKU
            </div>
          </div>
        )}
      </div>
      {has("nfe") && (
        <div className="border-b-4 border-black px-2 py-0.5 flex flex-col justify-start gap-0.5 flex-[0.5] overflow-hidden">
          <span
            className="bg-black text-white font-bold px-1.5 py-0 w-fit leading-none"
            style={{ fontSize: `${fs * 1.8}px` }}
          >
            LOTE
          </span>
          <span
            className="font-semibold tracking-wide whitespace-normal leading-tight"
            style={{ fontSize: `${fs * 3.5}px` }}
          >
            {data.lote}
          </span>
        </div>
      )}
      <div className="flex flex-[1.2]">
        {has("qtd") && (
          <div className="w-[28%] border-r-4 border-black p-1 flex flex-col items-center gap-1.5 overflow-hidden">
            <div style={{ fontSize: `${fs * 3}px` }} className="font-bold shrink-0">
              QTD:
            </div>
            <div className="font-semibold leading-none truncate mt-1" style={{ fontSize: `${fs * 3.2}px` }}>
              {data.qtd}
            </div>
          </div>
        )}
        <div className="flex-1 border-r-4 border-black p-2 flex flex-col justify-around overflow-hidden">
          {has("rnp") && (
            <div style={{ fontSize: `${fs * 3.2}px` }} className="truncate">
              <span className="font-bold">RNP: </span>
              <span className="font-semibold">{data.rnp}</span>
            </div>
          )}
          {has("data") && (
            <div style={{ fontSize: `${fs * 3.2}px` }} className="truncate">
              <span className="font-bold">DATA:</span> {data.data}
            </div>
          )}
        </div>
        {has("qr_lote") && (
          <div className="w-[22%] flex flex-col items-center justify-center p-1">
            <QRCodeSVG value={data.qrLote} size={hPx * 0.26} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 1.8}px` }}>
              Lote
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MotorPreview({ wPx, hPx, fs, has, data = MOTOR_SAMPLE, borderWidth = 2, borderStyle = 'solid', borderRadius = 0, padding = 0, margin = 0, marginY, offsetX = 0 }: PreviewProps & { data?: MotorLabelData }) {
  const descLines = data.descricao.split("\n");
  const my = marginY ?? margin;
  return (
    <div
      style={{
        width: `${wPx}px`,
        height: `${hPx}px`,
        fontSize: `${fs}px`,
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility',
        margin: `${my}px auto`,
        transform: offsetX ? `translateX(${offsetX}px)` : undefined,
        padding: `${padding}px`,
        borderWidth: `${borderWidth}px`,
        borderStyle,
        borderColor: '#000',
        borderRadius: `${borderRadius}px`,
      } as React.CSSProperties}
      className="bg-white text-black flex flex-col font-['OCR-B','OCR_B_10_BT','IBM_Plex_Mono',ui-monospace,monospace] overflow-hidden antialiased"
    >
      {/* Top: SKU + descrição */}
      <div className="border-b-[3px] border-black px-3 py-2 flex flex-col justify-center overflow-hidden flex-[1.15]">
        {has("sku") && (
          <div
            className="font-semibold tracking-tight leading-none truncate"
            style={{ fontSize: `${fs * 2.4}px` }}
          >
            {data.sku}
          </div>
        )}
        {has("descricao") && (
          <div
            className="mt-1.5 leading-tight line-clamp-3 overflow-hidden font-semibold"
            style={{ fontSize: `${fs * 1.85}px` }}
          >
            {descLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
      </div>

      {/* Middle: SERIE tag + CX/NF + NT (mais compacta) */}
      <div className="border-b-[3px] border-black px-3 py-1 flex flex-col gap-0.5 overflow-hidden flex-[0.8]">
        {has("serie") && (
          <span
            className="bg-black text-white font-bold px-2 w-fit shrink-0 leading-tight"
            style={{ fontSize: `${fs * 1.55}px`, letterSpacing: '0.1em' }}
          >
            SÉRIE
          </span>
        )}
        <div
          className="flex items-center gap-3 font-semibold tracking-wide truncate leading-tight"
          style={{ fontSize: `${fs * 2.1}px` }}
        >
          {has("cx") && <span className="shrink-0">{data.cx}</span>}
          {has("nf") && <span className="truncate">{data.nf}</span>}
        </div>
        {has("nt") && (() => {
          const cxNf = `${has("cx") ? data.cx : ''} ${has("nf") ? data.nf : ''}`.trim().replace(/\s+/g, ' ');
          let ntNorm = (data.nt || '').trim().replace(/\s+/g, ' ');
          // Remove duplicação: se nt começa com "CX/NF", remove esse prefixo
          if (cxNf && ntNorm.toLowerCase().startsWith(cxNf.toLowerCase())) {
            ntNorm = ntNorm.slice(cxNf.length).trim();
          }
          if (!ntNorm) return null;
          return (
            <div className="font-semibold tracking-tight truncate leading-tight" style={{ fontSize: `${fs * 2.0}px` }}>
              {ntNorm}
            </div>
          );
        })()}
      </div>

      {/* Bottom: RNP/DATA + QR Lote+SKU */}
      <div className="flex flex-[1.3] overflow-hidden">
        <div className="flex-1 px-3 py-2 flex flex-col justify-center gap-2 border-r-[3px] border-black overflow-hidden">
          {has("rnp") && (
            <div style={{ fontSize: `${fs * 1.75}px` }} className="truncate">
              <span className="font-bold">RNP: </span>
              <span className="font-semibold">{data.rnp}</span>
            </div>
          )}
          {has("data") && (
            <div style={{ fontSize: `${fs * 1.75}px` }} className="truncate">
              <span className="font-bold">DATA: </span>
              <span className="font-semibold">{data.data}</span>
            </div>
          )}
        </div>
        {has("qr_lote_sku") && (
          <div className="w-[46%] flex flex-col items-center justify-center p-1">
            <QRCodeSVG value={data.qrLoteSku} size={Math.min(hPx * 0.46, wPx * 0.42)} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 1.4}px` }}>
              Lote+SKU
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
