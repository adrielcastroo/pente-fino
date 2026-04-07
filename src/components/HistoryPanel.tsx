import { useEffect, useState } from 'react';
import { useAppStore, formatML, type Conference, type Registro } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, ChevronDown, ChevronRight, Package, Clock, Trash2, User, Pencil, CheckCircle2, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getRegistroColumns } from '@/lib/registroColumns';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function EditRegistroDialog({
  open,
  onOpenChange,
  registro,
  conferenceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: Registro | null;
  conferenceId: string;
}) {
  const updateHistoryRegistro = useAppStore(s => s.updateHistoryRegistro);
  const addToast = useToastStore(s => s.addToast);
  const [form, setForm] = useState<Registro | null>(registro);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(registro);
  }, [registro]);

  const isPVT = form?.tipoTecido === 'PVT';
  const isDiversos = form?.modoOrigem === 'diversos';

  const updateField = <K extends keyof Registro>(key: K, value: Registro[K]) => {
    setForm(current => current ? { ...current, [key]: value } : current);
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.item.trim()) {
      addToast('Informe o Item/Referência.', 'warn');
      return;
    }

    setSaving(true);
    try {
      await updateHistoryRegistro(conferenceId, form.id, {
        item: form.item.trim(),
        m2: Number(form.m2) || 0,
        mLinear: Number(form.mLinear) || 0,
        largura: Number(form.largura) || 0,
        lote: form.lote || '',
        endereco: isPVT ? '' : (form.endereco || '').toUpperCase(),
        tipoTecido: form.tipoTecido || '',
        modoOrigem: form.modoOrigem || '',
      });
      addToast('Tecido atualizado', 'ok');
      onOpenChange(false);
    } catch {
      addToast('Erro ao salvar edição', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar tecido</DialogTitle>
          <DialogDescription>
            {form?.tipoTecido ? `${form.tipoTecido} • ` : ''}Atualize os dados individuais deste registro.
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Item / Referência</label>
              <Input value={form.item} onChange={e => updateField('item', e.target.value)} />
            </div>

            {isDiversos && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">NF</label>
                <Input value={form.nf || ''} onChange={e => updateField('nf', e.target.value)} />
              </div>
            )}

            {!isPVT && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">M²</label>
                  <Input type="number" step="0.1" value={String(form.m2 ?? '')} onChange={e => updateField('m2', Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Largura</label>
                  <Input type="number" step="0.01" value={String(form.largura ?? '')} onChange={e => updateField('largura', Number(e.target.value) || 0)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">M Linear</label>
                <Input type="number" step="0.1" value={String(form.mLinear ?? '')} onChange={e => updateField('mLinear', Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Lote / Batch</label>
                <Input value={form.lote || ''} onChange={e => updateField('lote', e.target.value)} />
              </div>
            </div>

            {!isPVT && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Endereço</label>
                <Input value={form.endereco || ''} onChange={e => updateField('endereco', e.target.value.toUpperCase())} />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar edição'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getConferenceFolderName(conf: Conference): string {
  // For Diversos mode, use NF as folder name
  const isDiversos = conf.registros.some(r => r.modoOrigem === 'diversos');
  if (isDiversos) {
    const nfs = Array.from(new Set(conf.registros.map(r => (r.nf || '').trim()).filter(Boolean)));
    if (nfs.length > 0) return `NF ${nfs.join(', ')}`;
  }
  return conf.name;
}

function ConferenceCard({ conf, onDelete }: { conf: Conference; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const totalML = conf.registros.reduce((a, r) => a + r.mLinear, 0);
  const columns = getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual');
  const folderName = getConferenceFolderName(conf);

  const startTime = formatTime(conf.startedAt);
  const endTime = formatTime(conf.finishedAt);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center">
        <button onClick={() => setOpen(!open)} className="flex-1 px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{folderName}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Clock className="w-3 h-3" />
              {formatDate(conf.date)} · {conf.registros.length} rolos · {formatML(totalML)}
              {conf.conferente && (
                <span className="flex items-center gap-0.5">
                  <User className="w-3 h-3" /> {conf.conferente}
                </span>
              )}
              {startTime && endTime && (
                <span className="text-muted-foreground/70">
                  {startTime} → {endTime}
                </span>
              )}
            </div>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Remover esta conferência do histórico?')) onDelete(); }}
          className="p-2.5 mr-2 rounded-md hover:bg-muted transition-colors"
          title="Remover conferência"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-border overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="surface-2-bg">
                    {columns.map(column => (
                      <th key={column.key} className="px-3 py-2 text-left text-muted-foreground font-medium">{column.shortLabel || column.label}</th>
                    ))}
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium w-[74px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {conf.registros.map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      {columns.map(column => (
                        <td key={column.key} className={`px-3 py-1.5 ${column.key === 'item' ? 'font-semibold' : 'font-mono'}`}>
                          {column.key === 'item' && (
                            <div className="flex flex-col gap-1">
                              <span>{r.item || '—'}</span>
                              {r.tipoTecido && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground w-fit">{r.tipoTecido}</span>}
                            </div>
                          )}
                          {column.key === 'nf' && (r.nf || '—')}
                          {column.key === 'processo' && (r.processo || '—')}
                          {column.key === 'm2' && (r.m2 > 0 ? r.m2.toFixed(1) : '—')}
                          {column.key === 'mLinear' && formatML(r.mLinear)}
                          {column.key === 'largura' && (r.largura > 0 ? r.largura.toFixed(2) : '—')}
                          {column.key === 'lote' && (r.lote || '—')}
                          {column.key === 'endereco' && (r.endereco || '—')}
                          {column.key === 'loteSistema' && (r.loteSistema || '—')}
                        </td>
                      ))}
                      <td className="px-3 py-1.5">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setEditingRegistro(r)}
                            className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Editar tecido"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {r.wasEdited && (
                            <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                              {r.editedBy || 'Conferente atual'}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditRegistroDialog
        open={!!editingRegistro}
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditingRegistro(null); }}
        registro={editingRegistro}
        conferenceId={conf.id}
      />
    </div>
  );
}

export default function HistoryPanel() {
  const { history, loadHistory, deleteConference, clearHistory } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearAll = async () => {
    if (!history.length) return;
    if (confirm(`Limpar todo o histórico (${history.length} conferências)?`)) {
      await clearHistory();
      addToast('Histórico limpo', 'warn');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-hidden bg-background"
    >
      <div className="px-4 py-3 border-b border-border flex-shrink-0 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Conferências</span>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Limpar tudo
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <div className="text-sm font-medium text-foreground/60 mb-1">Nenhuma conferência arquivada</div>
            <div className="text-xs text-muted-foreground">Ao exportar o Excel, a conferência será salva aqui</div>
          </div>
        ) : (
          history.map(conf => (
            <ConferenceCard
              key={conf.id}
              conf={conf}
              onDelete={async () => {
                await deleteConference(conf.id);
                addToast('Conferência removida', 'ok');
              }}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
