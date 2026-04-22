import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Save, X, Palette, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { lotesMestresService, LoteMestre } from '@/services/lotesMestresService';
import { RalColorPicker } from '@/components/madeira/RalColorPicker';
import { findRalByHex } from '@/lib/ral-colors';
import { toast } from 'sonner';

interface DraftRow {
  nome: string;
  cor_hex: string;
  descricao: string;
}

const EMPTY_DRAFT: DraftRow = { nome: '', cor_hex: '#e5e7eb', descricao: '' };

export default function LotesMestresPanel() {
  const [items, setItems] = useState<LoteMestre[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftRow>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftRow>(EMPTY_DRAFT);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lotesMestresService.list();
      setItems(data);
    } catch (e: any) {
      toast.error('Erro ao carregar lotes mestres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!draft.nome.trim()) { toast.error('Informe o nome'); return; }
    setCreating(true);
    try {
      const created = await lotesMestresService.create({
        nome: draft.nome,
        cor_hex: draft.cor_hex,
        descricao: draft.descricao,
      });
      setItems(prev => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setDraft(EMPTY_DRAFT);
      toast.success('Lote mestre criado');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (l: LoteMestre) => {
    setEditingId(l.id);
    setEditDraft({ nome: l.nome, cor_hex: l.cor_hex, descricao: l.descricao || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingId(editingId);
    try {
      await lotesMestresService.update(editingId, {
        nome: editDraft.nome,
        cor_hex: editDraft.cor_hex,
        descricao: editDraft.descricao || null,
      });
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...editDraft } : i)
        .sort((a, b) => a.nome.localeCompare(b.nome)));
      setEditingId(null);
      toast.success('Atualizado');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lote mestre? Os registros vinculados perderão a referência.')) return;
    try {
      await lotesMestresService.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Excluído');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Lotes Mestres
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Gerencie tonalidades de referência para classificar lâminas, bases e bandôs no módulo Madeira.
          Use a paleta <strong>RAL Classic</strong> para padronizar a homologação de cores.
        </p>
      </div>

      {/* Create row */}
      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1.5fr_2fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase">Nome</Label>
              <Input value={draft.nome} onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} placeholder="Ex: Branco Gelo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase">Cor RAL</Label>
              <RalColorPicker
                value={draft.cor_hex}
                onChange={(hex, ral) => setDraft(d => ({
                  ...d,
                  cor_hex: hex,
                  // Auto-fill name when empty and a RAL is picked
                  nome: d.nome || (ral ? `${ral.code} — ${ral.name}` : d.nome),
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase">Descrição</Label>
              <Input value={draft.descricao} onChange={e => setDraft(d => ({ ...d, descricao: e.target.value }))} placeholder="Detalhes…" />
            </div>
            <Button onClick={handleCreate} disabled={creating} className="h-10">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span className="ml-1.5">Adicionar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">
            Nenhum lote mestre cadastrado ainda.
          </p>
        )}
        {items.map(l => {
          const isEditing = editingId === l.id;
          return (
            <Card key={l.id} className="overflow-hidden">
              <CardContent className="py-3">
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_2fr_auto_auto] gap-3 items-end">
                    <Input value={editDraft.nome} onChange={e => setEditDraft(d => ({ ...d, nome: e.target.value }))} />
                    <RalColorPicker
                      value={editDraft.cor_hex}
                      onChange={(hex) => setEditDraft(d => ({ ...d, cor_hex: hex }))}
                    />
                    <Input value={editDraft.descricao} onChange={e => setEditDraft(d => ({ ...d, descricao: e.target.value }))} placeholder="Descrição" />
                    <Button size="sm" onClick={saveEdit} disabled={savingId === l.id} className="h-10">
                      {savingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (() => {
                  const ral = findRalByHex(l.cor_hex);
                  return (
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full border border-border/40 flex-shrink-0"
                        style={{ backgroundColor: l.cor_hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{l.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ral && <span className="font-mono font-bold text-primary mr-1.5">{ral.code}</span>}
                          {l.descricao || (ral?.name ?? '')}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">{l.cor_hex.toUpperCase()}</span>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(l)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
