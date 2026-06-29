import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, Tag, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface LabelData {
  titulo: string;
  subtitulo: string;
  codigo: string;
  qrPayload: string;
  destino: string;
  observacoes: string;
  showQr: boolean;
  copias: number;
}

const DEFAULT: LabelData = {
  titulo: 'EXPEDIÇÃO',
  subtitulo: '',
  codigo: '',
  qrPayload: '',
  destino: '',
  observacoes: '',
  showQr: true,
  copias: 1,
};

export default function ExpedicaoEtiquetasPage() {
  useDocumentTitle('Impressão de etiqueta');
  const [data, setData] = useState<LabelData>(DEFAULT);

  const update = <K extends keyof LabelData>(key: K, value: LabelData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const handlePrint = () => {
    if (!data.codigo.trim() && !data.titulo.trim()) {
      toast.error('Preencha pelo menos o título ou código.');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Tag className="size-5 text-primary" /> Etiqueta genérica
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Térmica 100×150mm — Zebra/Argox. Preencha, visualize e imprima.
          </p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="size-4" /> Imprimir
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Form */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-base">Dados da etiqueta</CardTitle>
            <CardDescription>Os campos vazios não aparecem na impressão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Título" value={data.titulo} onChange={(v) => update('titulo', v)} placeholder="EXPEDIÇÃO" />
            <Field label="Subtítulo" value={data.subtitulo} onChange={(v) => update('subtitulo', v)} placeholder="Romaneio · NF · Cliente…" />
            <Field label="Código principal" value={data.codigo} onChange={(v) => update('codigo', v)} placeholder="ROM-00123" mono />
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <Field
                label="Payload do QR Code"
                value={data.qrPayload}
                onChange={(v) => update('qrPayload', v)}
                placeholder="Vazio = usa o código principal"
                mono
              />
              <div className="flex items-center gap-2 h-11">
                <Switch checked={data.showQr} onCheckedChange={(v) => update('showQr', v)} id="qr-toggle" />
                <Label htmlFor="qr-toggle" className="text-sm">QR</Label>
              </div>
            </div>
            <Field label="Destino / Cliente" value={data.destino} onChange={(v) => update('destino', v)} placeholder="Nome · Cidade · UF" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
              <Textarea
                rows={3}
                value={data.observacoes}
                onChange={(e) => update('observacoes', e.target.value)}
                placeholder="Texto livre que aparece no rodapé."
              />
            </div>
            <Field
              label="Cópias"
              value={String(data.copias)}
              onChange={(v) => update('copias', Math.max(1, Math.min(50, Number(v) || 1)))}
              placeholder="1" type="number"
            />
            <div className="flex gap-2 pt-2">
              <Button
                type="button" variant="outline" className="gap-2"
                onClick={() => {
                  localStorage.setItem('exp_label_template', JSON.stringify(data));
                  toast.success('Template salvo');
                }}
              >
                <Save className="size-4" /> Salvar como modelo
              </Button>
              <Button
                type="button" variant="ghost"
                onClick={() => {
                  const raw = localStorage.getItem('exp_label_template');
                  if (!raw) return toast.error('Nenhum modelo salvo.');
                  try { setData({ ...DEFAULT, ...JSON.parse(raw) }); toast.success('Modelo carregado'); }
                  catch { toast.error('Modelo inválido.'); }
                }}
              >
                Carregar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setData(DEFAULT)}>Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground print:hidden">Pré-visualização</p>
          <div className="print:contents">
            {Array.from({ length: data.copias }).map((_, i) => (
              <LabelSheet key={i} data={data} />
            ))}
          </div>
        </div>
      </div>

      {/* Print styles: 100x150mm, hide app chrome */}
      <style>{`
        @media print {
          @page { size: 100mm 150mm; margin: 0; }
          body * { visibility: hidden !important; }
          .label-sheet, .label-sheet * { visibility: visible !important; }
          .label-sheet { position: relative; page-break-after: always; }
          .label-sheet:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, mono, type,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={mono ? 'font-mono tracking-tight' : ''}
      />
    </div>
  );
}

function LabelSheet({ data }: { data: LabelData }) {
  const qrValue = (data.qrPayload || data.codigo || data.titulo || '').slice(0, 700);
  return (
    <div
      className="label-sheet bg-white text-black border border-dashed border-border rounded-md mx-auto mb-4 overflow-hidden"
      style={{ width: '100mm', height: '150mm', padding: '4mm' }}
    >
      <div className="h-full w-full flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div className="border-b-2 border-black pb-2">
          <p className="text-[10pt] font-bold uppercase tracking-widest text-center">
            {data.titulo || '—'}
          </p>
          {data.subtitulo && (
            <p className="text-[8pt] text-center mt-0.5">{data.subtitulo}</p>
          )}
        </div>

        {/* Code + QR */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">
          {data.codigo && (
            <p
              className="font-mono font-extrabold text-center leading-none"
              style={{ fontSize: data.codigo.length > 14 ? '18pt' : '26pt' }}
            >
              {data.codigo}
            </p>
          )}
          {data.showQr && qrValue && (
            <QRCodeCanvas value={qrValue} size={200} level="M" includeMargin={false} />
          )}
        </div>

        {/* Destino */}
        {data.destino && (
          <div className="border-t border-black pt-1.5">
            <p className="text-[7pt] uppercase tracking-wider text-black/60">Destino</p>
            <p className="text-[10pt] font-semibold leading-tight">{data.destino}</p>
          </div>
        )}

        {/* Obs */}
        {data.observacoes && (
          <p className="mt-1 text-[8pt] leading-tight whitespace-pre-wrap border-t border-dashed border-black/40 pt-1">
            {data.observacoes}
          </p>
        )}
      </div>
    </div>
  );
}
