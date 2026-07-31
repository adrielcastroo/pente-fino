import { useRef, useState } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
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
import { KANBAN_COLUNAS, useCreatePedido, uploadAnexoParaPedido } from '@/hooks/compras/useComprasKanban';
import type { ComprasPedidoStatus } from '@/hooks/compras/useComprasPedidos';

interface NovaTarefaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  statusInicial?: ComprasPedidoStatus;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function NovaTarefaDialog({ open, onOpenChange, statusInicial = 'pendente' }: NovaTarefaDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [numero, setNumero] = useState('');
  const [descricao, setDescricao] = useState('');
  const [previsao, setPrevisao] = useState('');
  const [status, setStatus] = useState<ComprasPedidoStatus>(statusInicial);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createPedido = useCreatePedido();

  function reset() {
    setTitulo(''); setFornecedor(''); setNumero(''); setDescricao(''); setPrevisao('');
    setStatus(statusInicial); setArquivos([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function adicionarArquivos(list: FileList | null) {
    if (!list?.length) return;
    const validos = Array.from(list).filter((f) => {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`"${f.name}" excede 20 MB.`);
        return false;
      }
      return true;
    });
    setArquivos((prev) => [...prev, ...validos]);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit() {
    if (!titulo.trim()) {
      toast.error('Informe um título para a tarefa.');
      return;
    }
    setEnviando(true);
    try {
      const criado = await createPedido.mutateAsync({
        titulo, fornecedor, numero, descricao, previsao: previsao || null, status,
      });
      for (const file of arquivos) {
        try {
          await uploadAnexoParaPedido(criado.id, file);
        } catch (err) {
          toast.error(`Falha ao anexar "${file.name}": ${(err as Error).message}`);
        }
      }
      toast.success('Tarefa criada.');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Não foi possível criar a tarefa: ${(err as Error).message}`);
    } finally {
      setEnviando(false);
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Anexos</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Paperclip className="w-4 h-4 mr-1" />
                Anexar
              </Button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => adicionarArquivos(e.target.files)}
              />
            </div>
            {arquivos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
            ) : (
              <ul className="space-y-1">
                {arquivos.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                    <span className="text-xs truncate flex-1">{f.name}</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">{formatSize(f.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover ${f.name}`}
                      onClick={() => setArquivos((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={enviando || createPedido.isPending}>
            {(enviando || createPedido.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar tarefa
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}

export default NovaTarefaDialog;
