import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRightLeft } from 'lucide-react';

interface Deposito { codigo: string; nome: string | null; }

export default function NovaTransferenciaDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void }) {
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [cdItem, setCdItem] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [qtd, setQtd] = useState('1');
  const [observacao, setObservacao] = useState('');
  const [efetivar, setEfetivar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any).from('auge_depositos').select('codigo,nome').order('codigo');
      setDepositos(data || []);
    })();
  }, [open]);

  const canSubmit = useMemo(
    () => cdItem.trim() && origem && destino && origem !== destino && Number(qtd.replace(',', '.')) > 0,
    [cdItem, origem, destino, qtd],
  );

  const reset = () => {
    setCdItem(''); setOrigem(''); setDestino(''); setQtd('1'); setObservacao(''); setEfetivar(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const t = toast.loading(efetivar ? 'Criando e efetivando...' : 'Criando transferência...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=transferencia_criar', {
        body: {
          itens: [{
            cdItem: cdItem.trim(),
            cdDepositoOrigem: origem,
            cdDepositoDestino: destino,
            qtd: Number(qtd.replace(',', '.')),
          }],
          observacao: observacao.trim(),
          efetivar,
        },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || 'Falha ao criar');
      toast.success(
        `Transferência ${data.cdMovimentacao} ${data.efetivado ? 'criada e efetivada' : 'criada (rascunho)'}`,
        { id: t },
      );
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || String(e)), { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            Nova transferência (Auge)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cdItem" className="text-xs">Código do item (Auge)</Label>
            <Input
              id="cdItem"
              value={cdItem}
              onChange={(e) => setCdItem(e.target.value)}
              placeholder="ex: 1.1.003.001.1"
              className="font-mono"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Depósito origem</Label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {depositos.map(d => (
                    <SelectItem key={d.codigo} value={d.codigo}>
                      <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Depósito destino</Label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {depositos.map(d => (
                    <SelectItem key={d.codigo} value={d.codigo} disabled={d.codigo === origem}>
                      <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qtd" className="text-xs">Quantidade</Label>
            <Input
              id="qtd"
              type="text"
              inputMode="decimal"
              value={qtd}
              onChange={(e) => setQtd(e.target.value.replace(/[^\d.,]/g, ''))}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-xs">Observação</Label>
            <Textarea id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox checked={efetivar} onCheckedChange={(v) => setEfetivar(!!v)} />
            <span>Efetivar imediatamente após criar</span>
          </label>
          {efetivar && (
            <p className="text-[11px] text-amber-500 -mt-2">
              ⚠ Movimenta estoque no Auge sem conferência manual.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {efetivar ? 'Criar e efetivar' : 'Criar rascunho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
