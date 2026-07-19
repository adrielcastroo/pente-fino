import { useEffect, useState, useCallback } from 'react';
import { Plus, Palette, Check, X } from '@/components/icons';
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

export function LoteMestreSelector({ value, onChange }: Props) {
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
    <div className="space-y-2">
      <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
        Tonalidade de Referência
      </Label>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 h-12 rounded-md border border-border/50 bg-muted/20 px-4 text-sm flex items-center justify-between gap-3 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all duration-300 group"
            >
              <span className="flex items-center gap-3 min-w-0">
                {selected ? (
                  <>
                    <div className="relative">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm block transition-transform group-hover:scale-110"
                        style={{ backgroundColor: selected.cor_hex }}
                      />
                      <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
                    </div>
                    <span className="truncate font-bold text-foreground">{selected.nome}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/60 font-medium">Selecionar tonalidade…</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {selected && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
                    className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </span>
                )}
                <div className="w-px h-4 bg-border/40 mx-1" />
                <Plus className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-2 rounded-md shadow-2xl border-border/40 animate-in zoom-in-95 duration-200" align="start">
            <div className="max-h-[260px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
              {!loading && lotes.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Palette className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">Nenhum lote mestre encontrado.</p>
                </div>
              )}
              {lotes.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { onChange(l.id, l); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-all active:scale-[0.98] ${
                    l.id === value 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="relative">
                    <span
                      className={`w-6 h-6 rounded-full border-2 block ${l.id === value ? 'border-white' : 'border-border/40'}`}
                      style={{ backgroundColor: l.cor_hex }}
                    />
                  </div>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold truncate">{l.nome}</span>
                    {l.descricao && (
                      <span className={`block text-[10px] truncate ${l.id === value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {l.descricao}
                      </span>
                    )}
                  </span>
                  {l.id === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full h-10 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-md"
                onClick={() => { setOpen(false); setCreateOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Lote Mestre
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-md border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-primary px-6 py-8 text-primary-foreground relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Palette className="w-32 h-32" />
            </div>
            <DialogTitle className="text-2xl font-semibold mb-1">Novo Lote Mestre</DialogTitle>
            <DialogDescription className="text-primary-foreground/70 font-medium">
              Defina uma tonalidade de referência para classificar as lâminas.
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lm-nome" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome do Lote</Label>
              <Input 
                id="lm-nome" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                placeholder="Ex: Branco Gelo, Carvalho, etc."
                className="h-12 rounded-md bg-muted/20 border-border/50 focus:ring-4 focus:ring-primary/5 transition-all font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lm-cor" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Cor de Identificação</Label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <input
                    id="lm-cor"
                    type="color"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="h-14 w-20 rounded-md border border-border/50 cursor-pointer bg-muted/20 p-1.5 transition-all hover:scale-105 active:scale-95"
                  />
                </div>
                <Input 
                  value={newColor} 
                  onChange={e => setNewColor(e.target.value)} 
                  className="h-14 font-mono font-bold text-center rounded-md bg-muted/20 border-border/50" 
                  maxLength={7} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lm-desc" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Descrição (opcional)</Label>
              <Input 
                id="lm-desc" 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)} 
                placeholder="Ex: Utilizado para persianas de madeira 50mm..."
                className="h-12 rounded-md bg-muted/20 border-border/50 focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-muted/10 flex sm:justify-between items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setCreateOpen(false)} 
              disabled={creating}
              className="rounded-md font-bold px-6"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={creating}
              className="rounded-md font-semibold px-10 h-12 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              {creating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Criando…</span>
                </div>
              ) : 'Salvar Lote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LoteMestreSelector;
