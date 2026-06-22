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
    <div className="rounded-md border border-border/50 bg-muted/5 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-destructive/30">
      <div className={`flex items-center justify-between px-4 py-3.5 transition-all duration-500 ${enabled ? 'bg-destructive/10' : 'bg-background/40'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${enabled ? 'bg-destructive/20 text-destructive' : 'bg-muted/40 text-muted-foreground/60'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <Label 
            htmlFor="avaria-toggle" 
            className={`text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${enabled ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            Reportar Avaria
          </Label>
        </div>
        <Switch 
          id="avaria-toggle" 
          checked={enabled} 
          onCheckedChange={onEnabledChange}
          className="data-[state=checked]:bg-destructive transition-transform active:scale-90"
        />
      </div>

      {enabled && (
        <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/40 bg-background/60 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Tipo da Avaria</Label>
            <Select value={tipo ?? ''} onValueChange={(v) => onTipoChange(v as AvariaTipo)}>
              <SelectTrigger className="h-11 rounded-md bg-background border-border/60 text-sm transition-all focus:ring-2 focus:ring-destructive/10 focus:border-destructive/40">
                <SelectValue placeholder="Selecionar tipo…" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-border/40 shadow-xl">
                {TIPO_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="rounded-lg my-1">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Descrição dos Detalhes</Label>
            <Textarea
              value={descricao}
              onChange={e => onDescricaoChange(e.target.value)}
              placeholder="Descreva brevemente o problema encontrado..."
              rows={2}
              className="text-sm rounded-md bg-background border-border/60 resize-none transition-all focus:ring-2 focus:ring-destructive/10 focus:border-destructive/40 placeholder:text-muted-foreground/30"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Evidência Fotográfica</Label>
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
              <div className="relative rounded-md overflow-hidden border border-border/60 group animate-in zoom-in-95 duration-300">
                <img src={fotoUrl} alt="Avaria" className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  type="button"
                  onClick={() => onFotoUrlChange(null)}
                  className="absolute top-2 right-2 p-2 rounded-md bg-background/90 text-destructive shadow-lg hover:bg-destructive hover:text-white transition-all transform hover:rotate-90 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-md border-dashed border-border/80 bg-background/40 hover:bg-background hover:border-primary/50 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2 text-primary" />
                  )}
                  {uploading ? 'Enviando...' : 'Câmera ou Galeria'}
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
