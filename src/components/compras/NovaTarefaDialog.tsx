import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KANBAN_COLUNAS, useCreatePedido } from '@/hooks/compras/useComprasKanban';
import type { ComprasPedidoStatus } from '@/hooks/compras/useComprasPedidos';

interface NovaTarefaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  statusInicial?: ComprasPedidoStatus;
}

export function NovaTarefaDialog({ open, onOpenChange, statusInicial = 'pendente' }: NovaTarefaDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [numero, setNumero] = useState('');
  const [descricao, setDescricao] = useState('');
  const [previsao, setPrevisao] = useState('');
  const [status, setStatus] = useState<ComprasPedidoStatus>(statusInicial);

  const createPedido = useCreatePedido();

  function reset() {
    setTitulo(''); setFornecedor(''); setNumero(''); setDescricao(''); setPrevisao('');
    setStatus(statusInicial);
  }

  async function handleSubmit() {
    if (!titulo.trim()) {
      toast.error('Informe um título para a tarefa.');
      return;
    }
    try {
      await createPedido.mutateAsync({
        titulo, fornecedor, numero, descricao, previsao: previsao || null, status,
      });
      toast.success('Tarefa criada.');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Não foi possível criar a tarefa: ${(err as Error).message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nt-titulo">Título *</Label>
            <Input
              id="nt-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Cotação de tecido blackout"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nt-fornecedor">Fornecedor</Label>
              <Input
                id="nt-fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-numero">Número</Label>
              <Input
                id="nt-numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Gerado automaticamente"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nt-previsao">Previsão</Label>
              <Input
                id="nt-previsao"
                type="date"
                value={previsao}
                onChange={(e) => setPrevisao(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-status">Coluna</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ComprasPedidoStatus)}>
                <SelectTrigger id="nt-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_COLUNAS.map((c) => (
                    <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nt-desc">Descrição</Label>
            <Textarea
              id="nt-desc"
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes da tarefa…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createPedido.isPending}>
            {createPedido.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NovaTarefaDialog;
