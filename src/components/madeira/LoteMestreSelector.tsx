import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { Plus, Palette, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { lotesMestresService, LoteMestre as DbLoteMestre } from '@/services/lotesMestresService';
import { toast } from 'sonner';

interface Props {
  value: string | null;
  onChange: (id: string | null, lote: DbLoteMestre | null) => void;
}

export const LoteMestreSelector = memo(function LoteMestreSelector({ value, onChange }: Props) {
  const [lotes, setLotes] = useState<DbLoteMestre[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#e5e7eb');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lotesMestresService.list();
      setLotes(data);
    } catch (e: any) {
      toast.error('Falha ao carregar lotes mestres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = lotes.find(l => l.id === value) || null;

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Informe um nome para o lote mestre');
      return;
    }
    setCreating(true);
    try {
      const created = await lotesMestresService.create({
        nome: newName.trim(),
        cor_hex: newColor,
        descricao: newDesc.trim() || undefined,
      });
      setLotes(prev => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      onChange(created.id, created);
      toast.success('Lote mestre criado');
      setCreateOpen(false);
      setNewName(''); setNewColor('#e5e7eb'); setNewDesc('');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar lote mestre');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Palette className="w-3 h-3" /> Lote Mestre (Tonalidade)
      </Label>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 h-11 rounded-lg border border-border/50 bg-muted/20 px-3 text-sm flex items-center justify-between gap-2 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                {selected ? (
                  <>
                    <span
                      className="w-4 h-4 rounded-full border border-border/40 flex-shrink-0"
                      style={{ backgroundColor: selected.cor_hex }}
                    />
                    <span className="truncate font-medium">{selected.nome}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Selecionar tonalidade…</span>
                )}
              </span>
              {selected && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
                  className="text-muted-foreground hover:text-destructive p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-2" align="start">
            <div className="max-h-[260px] overflow-y-auto space-y-1">
              {loading && <p className="text-xs text-muted-foreground p-2">Carregando…</p>}
              {!loading && lotes.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">Nenhum lote mestre cadastrado.</p>
              )}
              {lotes.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { onChange(l.id, l); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm hover:bg-muted/60 transition-colors ${
                    l.id === value ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-border/40 flex-shrink-0"
                    style={{ backgroundColor: l.cor_hex }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{l.nome}</span>
                    {l.descricao && (
                      <span className="block text-[10px] text-muted-foreground truncate">{l.descricao}</span>
                    )}
                  </span>
                  {l.id === value && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                onClick={() => { setOpen(false); setCreateOpen(true); }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Novo Lote Mestre
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Novo Lote Mestre</DialogTitle>
            <DialogDescription>Defina uma tonalidade de referência para classificar lâminas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lm-nome" className="text-xs font-semibold">Nome</Label>
              <Input id="lm-nome" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Branco Gelo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-cor" className="text-xs font-semibold">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  id="lm-cor"
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="h-10 w-16 rounded-md border border-border/50 cursor-pointer bg-transparent"
                />
                <Input value={newColor} onChange={e => setNewColor(e.target.value)} className="font-mono uppercase" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-desc" className="text-xs font-semibold">Descrição (opcional)</Label>
              <Input id="lm-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Detalhes da tonalidade…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando…' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LoteMestreSelector;
