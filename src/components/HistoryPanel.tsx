import { useEffect, useState, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatML } from '@/lib/app-utils';
import { Conference, Registro } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, ChevronDown, ChevronRight, Package, Clock, Trash2, User, Pencil, CheckCircle2, Download, Search, AlertTriangle, Calendar, LayoutGrid, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
      toast.warning('Informe o Item/Referência.');
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
      toast.success('Registro histórico atualizado com sucesso.');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar as alterações no histórico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl rounded-[2rem] p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-8 bg-muted/30">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 text-primary"><Pencil className="w-5 h-5" /></div>
             Editar Registro
          </DialogTitle>
          <DialogDescription className="text-sm font-medium mt-1">
            {form?.tipoTecido ? `${form.tipoTecido} • ` : ''}Ajuste as especificações deste item no histórico.
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Referência do Item</label>
              <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.item} onChange={e => updateField('item', e.target.value)} />
            </div>

            {isDiversos && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Nota Fiscal</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.nf || ''} onChange={e => updateField('nf', e.target.value)} />
              </div>
            )}

            {!isPVT && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Metragem Quadrada (M²)</label>
                  <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" step="0.1" value={String(form.m2 ?? '')} onChange={e => updateField('m2', Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Largura (m)</label>
                  <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" step="0.01" value={String(form.largura ?? '')} onChange={e => updateField('largura', Number(e.target.value) || 0)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Metro Linear</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" step="0.1" value={String(form.mLinear ?? '')} onChange={e => updateField('mLinear', Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote / Batch</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.lote || ''} onChange={e => updateField('lote', e.target.value)} />
              </div>
            </div>

            {!isPVT && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Endereço de Armazenagem</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all uppercase" value={form.endereco || ''} onChange={e => updateField('endereco', e.target.value.toUpperCase())} />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/30 gap-3">
          <Button variant="outline" className="rounded-xl font-bold px-6 h-11" onClick={() => onOpenChange(false)} disabled={saving}>Descartar</Button>
          <Button className="rounded-xl font-black px-8 h-11 bg-primary shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar Alterações'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getConferenceFolderName(conf: Conference): string {
  const isMotorControle = conf.registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
  if (isMotorControle) {
    const nfs = Array.from(new Set(conf.registros.map(r => (r.nf || '').trim()).filter(Boolean)));
    if (nfs.length > 0) return `NF ${nfs.join(', ')}`;
    return 'Motores / Controle';
  }
  const isDiversos = conf.registros.some(r => r.modoOrigem === 'diversos');
  if (isDiversos) {
    const nfs = Array.from(new Set(conf.registros.map(r => (r.nf || '').trim()).filter(Boolean)));
    if (nfs.length > 0) return `NF ${nfs.join(', ')}`;
  }
  return conf.name;
}

function downloadConferenceExcel(conf: Conference) {
  const columns = getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual');
  const folderName = getConferenceFolderName(conf);
  const headers = columns.map(c => c.label);
  const data = conf.registros.map(r => columns.map(c => {
    switch (c.key) {
      case 'item': return r.item || '';
      case 'nf': return r.nf || '';
      case 'processo': return r.processo || '';
      case 'm2': return r.m2 > 0 ? r.m2 : '';
      case 'mLinear': return r.mLinear > 0 ? r.mLinear : '';
      case 'largura': return r.largura > 0 ? r.largura : '';
      case 'lote': return r.lote || '';
      case 'endereco': return r.endereco || '';
      case 'loteSistema': return r.loteSistema || '';
      default: return '';
    }
  }));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  columns.forEach((c, i) => { ws['!cols'] = ws['!cols'] || []; (ws['!cols'] as any)[i] = { wch: c.width }; });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
  XLSX.writeFile(wb, `conferencia_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

function getModeBadges(conf: Conference): string[] {
  const badges = new Set<string>();
  for (const r of conf.registros) {
    if (r.modoOrigem === 'madeira') badges.add('Madeira');
    else if (r.modoOrigem === 'motor') badges.add('Motor');
    else if (r.modoOrigem === 'controle') badges.add('Controle');
    else if (r.modoOrigem === 'openrouter') badges.add('IA Vision');
    else if (r.modoOrigem === 'diversos') {
      const tipo = (r.tipoTecido || '').trim();
      if (tipo) badges.add(tipo === 'Celular' ? 'Celular/Plissada' : tipo);
      else badges.add('Diversos');
    } else badges.add('Coulisse');
  }
  return Array.from(badges);
}

function getSmartCount(conf: Conference): string {
  const regs = conf.registros;
  const allMadeira = regs.every(r => r.modoOrigem === 'madeira');
  const allCelular = regs.every(r => r.modoOrigem === 'diversos' && r.tipoTecido === 'Celular');
  
  if (allMadeira) {
    const totalQtd = regs.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return `${regs.length} caixas${totalQtd > 0 ? ` (${totalQtd} und)` : ''}`;
  }
  if (allCelular) return `${regs.length} rolos (Celular)`;
  
  const hasMixed = new Set(regs.map(r => r.modoOrigem)).size > 1;
  if (hasMixed) return `${regs.length} itens`;
  return `${regs.length} rolos`;
}

const ConferenceCard = memo(({ conf, onDelete }: { conf: Conference; onDelete: () => void }) => {
  const [open, setOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalML = conf.registros.reduce((a, r) => a + r.mLinear, 0);
  const columns = getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual');
  const folderName = getConferenceFolderName(conf);
  const modeBadges = getModeBadges(conf);

  const startTime = formatTime(conf.startedAt);
  const endTime = formatTime(conf.finishedAt);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/60 rounded-[1.5rem] overflow-hidden bg-card/40 backdrop-blur-md shadow-xl shadow-black/5 hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex items-center group/header">
        <button onClick={() => setOpen(!open)} className="flex-1 px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-all text-left">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${open ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover/header:scale-110'}`}>
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-black tracking-tight truncate">{folderName}</span>
              <div className="flex gap-1">
                {modeBadges.map(b => (
                  <Badge key={b} variant="secondary" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary/5 text-primary/80 border-primary/10">{b}</Badge>
                ))}
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground font-bold flex items-center gap-2.5 mt-1 uppercase tracking-widest opacity-70">
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatDate(conf.date)}</span>
              <span className="h-3 w-[1px] bg-border" />
              <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> {getSmartCount(conf)}</span>
              <span className="h-3 w-[1px] bg-border" />
              <span className="text-primary/90">{formatML(totalML)}</span>
              {conf.conferente && (
                <>
                  <span className="h-3 w-[1px] bg-border" />
                  <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {conf.conferente}</span>
                </>
              )}
              {startTime && endTime && (
                <>
                  <span className="h-3 w-[1px] bg-border" />
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {startTime} → {endTime}</span>
                </>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-full transition-transform duration-500 ${open ? 'rotate-180 bg-muted/50' : ''}`}>
             <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
          </div>
        </button>
        <div className="flex items-center gap-2 mr-4 ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); downloadConferenceExcel(conf); }}
                className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary transition-all"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar para Excel</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir Conferência</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden border-t border-border/40"
          >
            <div className="overflow-x-auto bg-muted/5">
              <table className="w-full text-xs min-w-[700px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-muted/30">
                    {columns.map(column => (
                      <th key={column.key} className="px-5 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/20">{column.shortLabel || column.label}</th>
                    ))}
                    <th className="px-5 py-3 border-b border-border/20 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {conf.registros.map((r, i) => (
                    <tr key={r.id} className="group/row hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                      {columns.map(column => (
                        <td key={column.key} className={`px-5 py-3.5 ${column.key === 'item' ? 'font-black text-foreground' : 'font-mono text-muted-foreground/90'}`}>
                          {column.key === 'item' ? (
                            <div className="flex flex-col gap-1">
                              <span>{r.item || '—'}</span>
                              {r.tipoTecido && <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 w-fit bg-muted/20 border-border/50">{r.tipoTecido}</Badge>}
                            </div>
                          ) : column.key === 'mLinear' ? formatML(r.mLinear) 
                          : column.key === 'm2' ? (r.m2 > 0 ? r.m2.toFixed(1) : '—')
                          : column.key === 'largura' ? (r.largura > 0 ? `${r.largura.toFixed(2)}m` : '—')
                          : ((r as any)[column.key] || '—')}
                        </td>
                      ))}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col items-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRegistro(r)}
                            className="h-8 w-8 rounded-lg border border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all opacity-0 group-hover/row:opacity-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {r.wasEdited && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-primary/60">
                                  <CheckCircle2 className="w-3 h-3" /> EDITADO
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Editado por {r.editedBy || 'Conferente'}</TooltipContent>
                            </Tooltip>
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

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-destructive/5">
            <DialogTitle className="flex items-center gap-3 text-destructive text-2xl font-black">
              <div className="p-2.5 rounded-2xl bg-destructive/10"><AlertTriangle className="w-6 h-6" /></div>
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Deseja remover permanentemente a conferência <strong>"{folderName}"</strong> com {conf.registros.length} registros? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 bg-muted/20 border-t border-border/30 gap-3">
            <Button variant="outline" className="rounded-xl font-bold h-11 px-6" onClick={() => setConfirmDelete(false)}>Manter Conferência</Button>
            <Button variant="destructive" className="rounded-xl font-black h-11 px-8 shadow-lg shadow-destructive/20" onClick={() => { setConfirmDelete(false); onDelete(); }}>Remover Histórico</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
});

export default function HistoryPanel() {
  const history = useAppStore(s => s.history);
  const loadHistory = useAppStore(s => s.loadHistory);
  const deleteConference = useAppStore(s => s.deleteConference);
  const clearHistory = useAppStore(s => s.clearHistory);
  
  const [search, setSearch] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearAll = async () => {
    await clearHistory();
    setConfirmClearAll(false);
    toast.success('O histórico geral foi limpo com sucesso.');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return history;
    return history.filter(conf => {
      const folderName = getConferenceFolderName(conf).toLowerCase();
      if (folderName.includes(q)) return true;
      if (conf.conferente?.toLowerCase().includes(q)) return true;
      return conf.registros.some(r =>
        r.item.toLowerCase().includes(q) ||
        (r.nf || '').toLowerCase().includes(q) ||
        (r.lote || '').toLowerCase().includes(q)
      );
    });
  }, [history, search]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background/50">
       <div className="px-6 py-6 border-b border-border/40 bg-card/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-primary" />
              Histórico de <span className="text-primary">Conferências</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-60 ml-11">Arquivo Digital Operacional</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto max-w-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-2xl border border-border/50 bg-muted/40 text-sm font-bold tracking-tight focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder:text-muted-foreground/30" 
                placeholder="Pesquisar histórico..." 
                autoComplete="off" 
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/60 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setConfirmClearAll(true)}
                  className="h-11 w-11 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                  disabled={history.length === 0}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar Histórico Geral</TooltipContent>
            </Tooltip>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            {filtered.map(conf => (
              <ConferenceCard 
                key={conf.id} 
                conf={conf} 
                onDelete={() => deleteConference(conf.id)} 
              />
            ))}

            {filtered.length === 0 && history.length > 0 && (
              <div className="py-24 text-center">
                 <div className="inline-flex p-6 rounded-[2.5rem] bg-muted/30 text-muted-foreground/40 mb-6">
                    <Search className="w-12 h-12" />
                 </div>
                 <h3 className="text-xl font-black tracking-tight text-foreground">Nenhum resultado encontrado</h3>
                 <p className="text-muted-foreground font-medium mt-2">Tente ajustar seus termos de pesquisa.</p>
                 <Button variant="link" className="mt-4 font-bold text-primary" onClick={() => setSearch('')}>Limpar pesquisa</Button>
              </div>
            )}

            {history.length === 0 && (
              <div className="py-32 text-center flex flex-col items-center">
                 <div className="p-8 rounded-[3rem] bg-primary/5 text-primary/30 mb-8 -rotate-12">
                    <LayoutGrid className="w-16 h-16" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight text-foreground">O histórico está vazio</h3>
                 <p className="text-muted-foreground font-medium max-w-[320px] mx-auto mt-4 leading-relaxed">
                   Aqui ficarão armazenadas todas as conferências finalizadas e exportadas.
                 </p>
              </div>
            )}
          </div>
       </div>

       <Dialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
          <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-destructive/5">
              <DialogTitle className="flex items-center gap-3 text-destructive text-2xl font-black">
                <div className="p-2.5 rounded-2xl bg-destructive/10"><AlertTriangle className="w-6 h-6" /></div>
                Limpar Histórico
              </DialogTitle>
              <DialogDescription className="text-sm font-medium pt-2 leading-relaxed">
                Você está prestes a apagar <strong>TODO</strong> o histórico de conferências ({history.length} pastas). Esta ação é irreversível e removerá todos os registros permanentes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-6 bg-muted/20 border-t border-border/30 gap-3">
              <Button variant="outline" className="rounded-xl font-bold h-11 px-6" onClick={() => setConfirmClearAll(false)}>Manter Histórico</Button>
              <Button variant="destructive" className="rounded-xl font-black h-11 px-8 shadow-lg shadow-destructive/20" onClick={handleClearAll}>Apagar Tudo</Button>
            </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}
