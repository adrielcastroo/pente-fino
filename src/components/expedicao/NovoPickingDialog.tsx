import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreatePicking, useTransportadoras } from '@/hooks/expedicao/useExpedicaoData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NovoPickingDialog({ open, onOpenChange }: Props) {
  const { data: transps = [] } = useTransportadoras();
  const create = useCreatePicking();
  const [form, setForm] = useState({
    numero: '',
    cliente: '',
    cidade: '',
    regiao: '',
    transportadora_id: '',
    observacao: '',
  });

  const reset = () => setForm({ numero: '', cliente: '', cidade: '', regiao: '', transportadora_id: '', observacao: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero.trim() || !form.cliente.trim()) return;
    await create.mutateAsync({
      ...form,
      transportadora_id: form.transportadora_id || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0">
          <DialogTitle>Novo picking</DialogTitle>
          <DialogDescription>
            Cadastre uma ordem de separação para a expedição.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col">
          <div className="p-5 sm:p-6 space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número *</Label>
              <Input id="numero" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input id="cliente" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="regiao">Região</Label>
              <Input id="regiao" value={form.regiao} onChange={e => setForm(f => ({ ...f, regiao: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Transportadora</Label>
            <Select
              value={form.transportadora_id}
              onValueChange={v => setForm(f => ({ ...f, transportadora_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {transps.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Cadastre em Configurações</div>
                ) : transps.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observação</Label>
            <Textarea id="obs" rows={2} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
          </div>
          </div>
          <DialogFooter className="p-5 sm:p-6 pt-4 sm:pt-4 mt-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Criando...' : 'Criar picking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
