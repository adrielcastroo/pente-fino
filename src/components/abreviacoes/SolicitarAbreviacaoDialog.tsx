import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
  defaultDsAtual?: string;
};

const TIPOS = ['Descrição do Item', 'Lote', 'Classe', 'Combinação'];

export default function SolicitarAbreviacaoDialog({ open, onOpenChange, onSaved, defaultDsAtual }: Props) {
  const [tipo, setTipo] = useState('Descrição do Item');
  const [dsAtual, setDsAtual] = useState(defaultDsAtual ?? '');
  const [dsAbrev, setDsAbrev] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!dsAtual.trim() || !dsAbrev.trim()) {
      toast.error('Preencha o texto atual e a abreviação desejada.');
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      const email = userData?.user?.email ?? null;
      if (!uid) throw new Error('Você precisa estar autenticado.');
      const { error } = await (supabase as any).from('abreviacoes_solicitadas').insert({
        tipo,
        ds_atual: dsAtual.trim(),
        ds_abreviada: dsAbrev.trim(),
        motivo: motivo.trim() || null,
        solicitante_id: uid,
        solicitante_email: email,
      });
      if (error) throw error;
      toast.success('Solicitação enviada para aprovação.');
      onOpenChange(false);
      setDsAtual(''); setDsAbrev(''); setMotivo('');
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao enviar solicitação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar abreviação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Texto atual (como aparece no Auge)</Label>
            <Input value={dsAtual} onChange={(e) => setDsAtual(e.target.value)} placeholder="Ex.: Perfil_10.0" className="h-9" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Abreviação desejada</Label>
            <Input value={dsAbrev} onChange={(e) => setDsAbrev(e.target.value)} placeholder="Ex.: Pfil10" className="h-9" maxLength={20} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Motivo / observação (opcional)</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Por que essa abreviação é necessária?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
