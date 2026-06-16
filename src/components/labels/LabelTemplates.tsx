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
}

export function TecidoPreview({ wPx, hPx, fs, has, data = TECIDO_SAMPLE }: PreviewProps & { data?: TecidoLabelData }) {
  const descLines = data.descricao.split("\n");
  return (
    <div
      style={{ width: `${wPx}px`, height: `${hPx}px`, fontSize: `${fs}px`, margin: "0 auto" }}
      className="bg-white text-black shadow-2xl border-4 border-black flex flex-col font-mono"
    >
      <div className="flex border-b-4 border-black flex-[1.1]">
        <div className="flex-1 pt-4 pb-2 px-2 flex flex-col justify-start overflow-hidden border-r-4 border-black">
          {has("sku") && (
            <div className="font-black tracking-tight leading-none truncate" style={{ fontSize: `${fs * 5}px` }}>
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
            className="font-black tracking-wide whitespace-normal leading-tight"
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
            <div className="font-black leading-none truncate mt-1" style={{ fontSize: `${fs * 4}px` }}>
              {data.qtd}
            </div>
          </div>
        )}
        <div className="flex-1 border-r-4 border-black p-2 flex flex-col justify-around overflow-hidden">
          {has("rnp") && (
            <div style={{ fontSize: `${fs * 3.2}px` }} className="truncate">
              <span className="font-bold">RNP: </span>
              <span className="font-black">{data.rnp}</span>
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

export function MotorPreview({ wPx, hPx, fs, has, data = MOTOR_SAMPLE }: PreviewProps & { data?: MotorLabelData }) {
  const descLines = data.descricao.split("\n");
  return (
    <div
      style={{ width: `${wPx}px`, height: `${hPx}px`, fontSize: `${fs}px` }}
      className="bg-white text-black shadow-2xl border-4 border-black flex flex-col font-mono p-1 gap-1"
    >
      <div className="border-4 border-black p-1 flex flex-col overflow-hidden">
        {has("sku") && (
          <div
            className="font-black tracking-tight leading-none text-center truncate"
            style={{ fontSize: `${fs * 1.7}px` }}
          >
            {data.sku}
          </div>
        )}
        {has("descricao") && (
          <div
            className="mt-1 leading-tight text-center line-clamp-2 overflow-hidden"
            style={{ fontSize: `${fs * 1.05}px` }}
          >
            {descLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
      </div>

      <div className="border-4 border-black p-1 flex flex-col gap-0.5 overflow-hidden">
        {has("serie") && (
          <span
            className="bg-black text-white font-bold px-1.5 py-0.5 w-fit shrink-0"
            style={{ fontSize: `${fs * 0.8}px` }}
          >
            SERIE
          </span>
        )}
        <div
          className="flex items-center gap-2 font-black tracking-wide truncate"
          style={{ fontSize: `${fs * 1.3}px` }}
        >
          {has("cx") && <span className="shrink-0">{data.cx}</span>}
          {has("nf") && <span className="truncate">{data.nf}</span>}
        </div>
        {has("nt") && (
          <div className="font-black tracking-tight truncate" style={{ fontSize: `${fs * 1.2}px` }}>
            {data.nt}
          </div>
        )}
      </div>

      <div className="border-4 border-black flex flex-1 overflow-hidden">
        <div className="flex-1 p-1 flex flex-col justify-center gap-1 border-r-4 border-black overflow-hidden">
          {has("rnp") && (
            <div style={{ fontSize: `${fs * 0.9}px` }} className="truncate">
              <span className="font-bold">RNP: </span>
              <span className="font-black">{data.rnp}</span>
            </div>
          )}
          {has("data") && (
            <div style={{ fontSize: `${fs * 1.05}px` }} className="truncate">
              <span className="font-bold">DATA:</span> {data.data}
            </div>
          )}
        </div>
        {has("qr_lote_sku") && (
          <div className="w-[40%] flex flex-col items-center justify-center p-1">
            <QRCodeSVG value={data.qrLoteSku} size={Math.min(hPx * 0.35, wPx * 0.32)} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 0.8}px` }}>
              Lote+SKU
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
