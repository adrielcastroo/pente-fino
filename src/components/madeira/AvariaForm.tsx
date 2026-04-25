import { useRef, useState } from 'react';
import { AlertTriangle, Camera, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { lotesMestresService } from '@/services/lotesMestresService';
import { toast } from 'sonner';

export type AvariaTipo = 'riscado' | 'manchado' | 'quebrado' | 'outro';

interface Props {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  tipo: AvariaTipo | null;
  onTipoChange: (t: AvariaTipo) => void;
  descricao: string;
  onDescricaoChange: (v: string) => void;
  fotoUrl: string | null;
  onFotoUrlChange: (url: string | null) => void;
}

const TIPO_OPTIONS: { value: AvariaTipo; label: string }[] = [
  { value: 'riscado', label: 'Riscado' },
  { value: 'manchado', label: 'Manchado' },
  { value: 'quebrado', label: 'Quebrado' },
  { value: 'outro', label: 'Outro' },
];

export function AvariaForm({
  enabled, onEnabledChange,
  tipo, onTipoChange,
  descricao, onDescricaoChange,
  fotoUrl, onFotoUrlChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = async (file: File) => {
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const url = await lotesMestresService.uploadAvariaPhoto(file, ext);
      onFotoUrlChange(url);
      toast.success('Foto enviada');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${enabled ? 'text-amber-500' : 'text-muted-foreground/60'}`} />
          <Label htmlFor="avaria-toggle" className="text-[11px] font-semibold uppercase tracking-wide cursor-pointer">
            Reportar Avaria
          </Label>
        </div>
        <Switch id="avaria-toggle" checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/40 bg-background/40">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tipo</Label>
            <Select value={tipo ?? ''} onValueChange={(v) => onTipoChange(v as AvariaTipo)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Selecionar tipo…" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Descrição</Label>
            <Textarea
              value={descricao}
              onChange={e => onDescricaoChange(e.target.value)}
              placeholder="Detalhes da avaria…"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Foto</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePick(f);
                e.target.value = '';
              }}
            />
            {fotoUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border/50">
                <img src={fotoUrl} alt="Avaria" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => onFotoUrlChange(null)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 text-xs"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1" />}
                  {uploading ? 'Enviando…' : 'Câmera / Galeria'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AvariaForm;
