import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Paperclip, Send, Trash2, Download, User2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  useAddComentario, useAnexos, useComentarios, useDeleteAnexo, useDeleteComentario,
  useProfilesMap, useUploadAnexo, useUpdatePedido, baixarAnexo,
  type ComprasPedidoCard,
} from '@/hooks/compras/useComprasKanban';

interface PedidoDetailDialogProps {
  pedido: ComprasPedidoCard | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PedidoDetailDialog({ pedido, open, onOpenChange }: PedidoDetailDialogProps) {
  const pedidoId = pedido?.id ?? null;

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [numero, setNumero] = useState('');
  const [previsao, setPrevisao] = useState('');
  const [status, setStatus] = useState<ComprasPedidoStatus>('pendente');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [novoComentario, setNovoComentario] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);

  const updatePedido = useUpdatePedido();
  const { data: comentarios = [] } = useComentarios(pedidoId);
  const { data: anexos = [] } = useAnexos(pedidoId);
  const addComentario = useAddComentario(pedidoId);
  const delComentario = useDeleteComentario(pedidoId);
  const uploadAnexo = useUploadAnexo(pedidoId);
  const delAnexo = useDeleteAnexo(pedidoId);

  const profileIds = useMemo(
    () => [pedido?.created_by, ...comentarios.map(c => c.user_id), ...anexos.map(a => a.user_id)],
    [pedido?.created_by, comentarios, anexos],
  );
  const profiles = useProfilesMap(profileIds);

  // Reidrata os campos ao trocar de pedido (sem sobrescrever edição em curso).
  useEffect(() => {
    if (!pedido) return;
    dirtyRef.current = false;
    setTitulo(pedido.titulo ?? '');
    setDescricao(pedido.descricao ?? '');
    setFornecedor(pedido.fornecedor ?? '');
    setNumero(pedido.numero ?? '');
    setPrevisao(pedido.previsao ? String(pedido.previsao).slice(0, 10) : '');
    setStatus(pedido.status);
    setSavedAt(null);
  }, [pedido?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Salvamento automático (debounce 700ms), como na página de configurações.
  useEffect(() => {
    if (!pedidoId || !dirtyRef.current) return;
    const t = setTimeout(async () => {
      setSaving(true);
      try {
        await updatePedido.mutateAsync({
          id: pedidoId,
          patch: {
            titulo: titulo || null,
            descricao: descricao || null,
            fornecedor: fornecedor.trim() || '—',
            numero: numero.trim() || pedido?.numero || '',
            previsao: previsao || null,
            status,
          },
        });
        setSavedAt(Date.now());
      } catch (err) {
        toast.error(`Não foi possível salvar: ${(err as Error).message}`);
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [titulo, descricao, fornecedor, numero, previsao, status, pedidoId]); // eslint-disable-line react-hooks/exhaustive-deps


  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`"${file.name}" excede 20 MB.`);
        continue;
      }
      try {
        await uploadAnexo.mutateAsync(file);
      } catch (err) {
        toast.error(`Falha ao enviar "${file.name}": ${(err as Error).message}`);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleComentar() {
    const texto = novoComentario.trim();
    if (!texto) return;
    try {
      await addComentario.mutateAsync(texto);
      setNovoComentario('');
    } catch (err) {
      toast.error(`Não foi possível comentar: ${(err as Error).message}`);
    }
  }

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <span className="font-mono">{pedido.numero}</span>
            <Badge variant="outline">{pedido.fornecedor}</Badge>
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User2 className="w-3 h-3" aria-hidden />
              {pedido.created_by ? (profiles[pedido.created_by] ?? 'Usuário') : 'Sistema'}
            </span>
            <span>Criado em {formatDateTime(pedido.created_at)}</span>
          </div>
        </DialogHeader>

        {/* Título e descrição — autosave */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="pedido-titulo" className="text-xs font-medium text-muted-foreground">Título</label>
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                {saving ? (<><Loader2 className="w-3 h-3 animate-spin" /> Salvando…</>)
                  : savedAt ? (<><Check className="w-3 h-3 text-primary" /> Salvo</>) : null}
              </span>
            </div>
            <Input
              id="pedido-titulo"
              value={titulo}
              placeholder="Sem título"
              onChange={(e) => { dirtyRef.current = true; setTitulo(e.target.value); }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pedido-desc" className="text-xs font-medium text-muted-foreground">Descrição detalhada</label>
            <Textarea
              id="pedido-desc"
              value={descricao}
              rows={5}
              placeholder="Adicione detalhes, combinados e pendências deste acompanhamento…"
              onChange={(e) => { dirtyRef.current = true; setDescricao(e.target.value); }}
            />
          </div>
        </div>

        <Separator />

        {/* Anexos */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Anexos</h3>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadAnexo.isPending}>
              {uploadAnexo.isPending
                ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                : <Paperclip className="w-4 h-4 mr-1" />}
              Anexar
            </Button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>
          {anexos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
          ) : (
            <ul className="space-y-1">
              {anexos.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-xs truncate flex-1">{a.file_name}</span>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">{formatSize(a.size_bytes)}</span>
                  <Button variant="ghost" size="sm" onClick={() => baixarAnexo(a).catch((e) => toast.error(e.message))} aria-label={`Baixar ${a.file_name}`}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => delAnexo.mutate(a)} aria-label={`Remover ${a.file_name}`}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        {/* Comentários */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Comentários</h3>
          {comentarios.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
          ) : (
            <ul className="space-y-3">
              {comentarios.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold shrink-0">
                    {(c.user_id ? (profiles[c.user_id] ?? 'U') : 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{c.user_id ? (profiles[c.user_id] ?? 'Usuário') : 'Usuário'}</span>
                      <span>{formatDateTime(c.created_at)}</span>
                      <Button variant="ghost" size="sm" className="ml-auto h-6 px-1" onClick={() => delComentario.mutate(c.id)} aria-label="Excluir comentário">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{c.conteudo}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={novoComentario}
              rows={2}
              placeholder="Escreva um comentário…"
              onChange={(e) => setNovoComentario(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleComentar(); }
              }}
            />
            <Button onClick={handleComentar} disabled={!novoComentario.trim() || addComentario.isPending}>
              {addComentario.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

export default PedidoDetailDialog;
