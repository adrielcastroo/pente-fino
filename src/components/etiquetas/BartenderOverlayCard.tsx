/**
 * Overlay BarTender — aceita PNG/JPG exportado do BarTender ou arquivo .btw.
 *
 * .btw é formato proprietário/binário sem parser JS público. Aceitamos o upload
 * como referência (armazenado em localStorage) mas exibimos um aviso claro:
 * o rendering usa a imagem exportada. Para conversão 1:1 seria necessário o
 * Automation SDK do BarTender (Windows-only, licenciado) — fora do escopo web.
 */
import { useEffect, useRef, useState } from 'react';
import { Upload, FileWarning, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  templateId: string | null;
}

const overlayKey = (id: string) => `etiqueta:bartender:overlay:${id}`;
const btwKey = (id: string) => `etiqueta:bartender:btw:${id}`;

export function BartenderOverlayCard({ templateId }: Props) {
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [btwName, setBtwName] = useState<string | null>(null);
  const pngRef = useRef<HTMLInputElement>(null);
  const btwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!templateId) {
      setOverlayUrl(null);
      setBtwName(null);
      return;
    }
    setOverlayUrl(localStorage.getItem(overlayKey(templateId)));
    setBtwName(localStorage.getItem(btwKey(templateId)));
  }, [templateId]);

  const handleImage = (file: File) => {
    if (!templateId) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Imagem maior que 4 MB.');
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result || '');
      localStorage.setItem(overlayKey(templateId), dataUrl);
      setOverlayUrl(dataUrl);
      toast.success('Overlay BarTender salvo.');
    };
    r.readAsDataURL(file);
  };

  const handleBtw = (file: File) => {
    if (!templateId) return;
    if (!file.name.toLowerCase().endsWith('.btw')) {
      toast.error('Envie um arquivo .btw.');
      return;
    }
    localStorage.setItem(btwKey(templateId), file.name);
    setBtwName(file.name);
    toast.message('Arquivo .btw registrado', {
      description:
        'O formato .btw é proprietário. Exporte no BarTender como PNG (100×150mm @ 203dpi) e use "Imagem PNG/JPG" para overlay.',
      duration: 6000,
    });
  };

  const clearOverlay = () => {
    if (!templateId) return;
    localStorage.removeItem(overlayKey(templateId));
    setOverlayUrl(null);
  };

  const clearBtw = () => {
    if (!templateId) return;
    localStorage.removeItem(btwKey(templateId));
    setBtwName(null);
  };

  if (!templateId) {
    return (
      <div className="border border-dashed border-border/60 rounded-xl p-6 text-sm text-muted-foreground bg-card/50">
        Selecione um modelo ativo para importar layout BarTender.
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-xl bg-card p-4 space-y-4">
      <header>
        <h3 className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Layout BarTender
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Importe um <span className="font-mono">.btw</span> como referência e/ou o PNG exportado para usar como overlay da etiqueta.
        </p>
      </header>

      {/* --- PNG/JPG overlay --- */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Imagem PNG/JPG (usada na renderização)
        </div>
        {overlayUrl ? (
          <div className="relative border border-border/60 rounded-md p-2 bg-muted/30">
            <img
              src={overlayUrl}
              alt="Overlay BarTender"
              className="mx-auto max-h-40 object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={clearOverlay}
              aria-label="Remover overlay"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => pngRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Enviar imagem
          </Button>
        )}
        <input
          ref={pngRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImage(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* --- .btw --- */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Arquivo .btw (referência)
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs flex items-start gap-2">
          <FileWarning className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-muted-foreground">
            O formato <span className="font-mono">.btw</span> é proprietário (binário OLE) e não tem parser JS público.
            Aceitamos o upload como referência, mas a renderização usa a imagem PNG acima. Conversão 1:1 requer o
            Automation SDK do BarTender.
          </p>
        </div>
        {btwName ? (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono truncate flex-1">{btwName}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearBtw}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => btwRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Registrar .btw
          </Button>
        )}
        <input
          ref={btwRef}
          type="file"
          accept=".btw"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleBtw(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
