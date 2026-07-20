import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Palette } from 'lucide-react';

interface AcabamentoItem {
  cd_acabamento_item: string;
  cd_acabamento: string;
  cd_item_acabamento: string;
  ds_item_acabamento: string | null;
  ds_item_acabamento_original: string | null;
  ds_item_acabamento_reduzida: string | null;
  cd_kit_complementar_1?: string | null; nm_kit_complementar_1?: string | null;
  cd_kit_complementar_2?: string | null; nm_kit_complementar_2?: string | null;
  cd_kit_complementar_3?: string | null; nm_kit_complementar_3?: string | null;
  cd_kit_complementar_4?: string | null; nm_kit_complementar_4?: string | null;
  cd_kit_complementar_5?: string | null; nm_kit_complementar_5?: string | null;
  auge_acabamentos?: { nm_acabamento?: string } | null;
  nm_acabamento?: string;
}

interface Props {
  item: AcabamentoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export default function AcabamentoItemEditDialog({ item, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState({
    dsItemAcabamento: '',
    dsItemAcabamentoReduzida: '',
    dsItemAcabamentoOriginal: '',
    cdKitComplementar1: '',
    cdKitComplementar2: '',
    cdKitComplementar3: '',
    cdKitComplementar4: '',
    cdKitComplementar5: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item && open) {
      setForm({
        dsItemAcabamento: item.ds_item_acabamento ?? '',
        dsItemAcabamentoReduzida: item.ds_item_acabamento_reduzida ?? '',
        dsItemAcabamentoOriginal: item.ds_item_acabamento_original ?? '',
        cdKitComplementar1: item.cd_kit_complementar_1 ?? '',
        cdKitComplementar2: item.cd_kit_complementar_2 ?? '',
        cdKitComplementar3: item.cd_kit_complementar_3 ?? '',
        cdKitComplementar4: item.cd_kit_complementar_4 ?? '',
        cdKitComplementar5: item.cd_kit_complementar_5 ?? '',
      });
    }
  }, [item, open]);

  if (!item) return null;

  const nmAcabamento = item.auge_acabamentos?.nm_acabamento ?? item.nm_acabamento ?? item.cd_acabamento;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=update_acabamento_item', {
        body: {
          cdAcabamentoItem: item.cd_acabamento_item,
          cdAcabamento: item.cd_acabamento,
          cdItemAcabamento: item.cd_item_acabamento,
          dsItemAcabamento: form.dsItemAcabamento,
          dsItemAcabamentoReduzida: form.dsItemAcabamentoReduzida,
          dsItemAcabamentoOriginal: form.dsItemAcabamentoOriginal,
          cdKitComplementar1: form.cdKitComplementar1,
          cdKitComplementar2: form.cdKitComplementar2,
          cdKitComplementar3: form.cdKitComplementar3,
          cdKitComplementar4: form.cdKitComplementar4,
          cdKitComplementar5: form.cdKitComplementar5,
        },
      });
      if (error) throw error;
      if (data && data.ok === false) throw new Error(data.error ?? 'Falha ao atualizar no Auge.');
      toast.success('Item de acabamento atualizado no Auge.');
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Palette className="h-5 w-5 text-primary" />
            Editar item do acabamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 rounded border bg-muted/40 p-2 text-[11px]">
            <div><span className="text-muted-foreground">Acabamento:</span> <span className="font-medium">{nmAcabamento}</span></div>
            <div><span className="text-muted-foreground">Código item:</span> <span className="font-mono">{item.cd_item_acabamento}</span></div>
          </div>

          <div>
            <Label className="text-[11px]">Descrição</Label>
            <Input value={form.dsItemAcabamento} onChange={(e) => setForm({ ...form, dsItemAcabamento: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px]">Descrição reduzida</Label>
            <Input value={form.dsItemAcabamentoReduzida} onChange={(e) => setForm({ ...form, dsItemAcabamentoReduzida: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px]">Descrição original</Label>
            <Textarea value={form.dsItemAcabamentoOriginal} onChange={(e) => setForm({ ...form, dsItemAcabamentoOriginal: e.target.value })} rows={2} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const key = `cdKitComplementar${n}` as keyof typeof form;
              const name = (item as any)[`nm_kit_complementar_${n}`];
              return (
                <div key={n}>
                  <Label className="text-[11px]">Kit {n}</Label>
                  <Input
                    value={(form as any)[key] ?? ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value } as any)}
                    className="h-9 font-mono text-[11px]"
                    placeholder="—"
                  />
                  {name && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{name}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar no Auge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
