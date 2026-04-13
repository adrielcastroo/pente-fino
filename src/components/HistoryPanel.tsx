import { useEffect, useState, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatML, formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Conference, Registro } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/hooks/use-performance';
import { FolderOpen, ChevronDown, Package, Trash2, User, Pencil, CheckCircle2, Search, Calendar, FileSpreadsheet } from 'lucide-react';
import { exportConferenceToExcel } from '@/lib/export-utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const columnWidths = columns.map(c => c.width);
  const fileName = `conferencia_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  exportConferenceToExcel(headers, data, fileName, columnWidths);
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
  const { isLow } = usePerformance();
  const totalML = conf.registros.reduce((a, r) => a + r.mLinear, 0);
  const columns = getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual');
  const folderName = getConferenceFolderName(conf);
  const modeBadges = getModeBadges(conf);

  const tableContent = (
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
                    className="h-8 w-8 rounded-lg border border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all sm:opacity-0 sm:group-hover/row:opacity-100"
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
  );

  const headerContent = (
    <div className="group/header">
      <button onClick={() => setOpen(!open)} className="w-full px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4 hover:bg-muted/30 transition-all text-left">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-500 shrink-0 ${open ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover/header:scale-110'}`}>
          <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black tracking-tight truncate">{folderName}</span>
            <div className="flex gap-1 flex-wrap">
              {modeBadges.map(b => (
                <Badge key={b} variant="secondary" className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 bg-primary/5 text-primary/80 border-primary/10">{b}</Badge>
              ))}
            </div>
          </div>
          <div className="text-[9px] sm:text-xs text-muted-foreground font-bold flex items-center gap-1.5 sm:gap-2.5 mt-1 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {formatDateBR(conf.date)}</span>

            <span className="hidden xs:block h-3 w-[1px] bg-border" />
            <span className="flex items-center gap-1"><Package className="w-3 h-3 shrink-0" /> {getSmartCount(conf)}</span>
            {totalML > 0 && <span className="text-primary/90 font-black">{formatML(totalML)}</span>}
            {conf.conferente && (
              <span className="hidden sm:flex items-center gap-1"><User className="w-3 h-3 shrink-0" /> {conf.conferente}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); downloadConferenceExcel(conf); }}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl hover:bg-primary/10 text-primary transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl hover:bg-destructive/10 text-destructive transition-all"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className={`p-1.5 rounded-full transition-transform duration-500 ${open ? 'rotate-180 bg-muted/50' : ''}`}>
             <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50" />
          </div>
        </div>
      </button>
    </div>
  );

  return (
    <>
      {isLow ? (
        <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/40 shadow-lg shadow-black/5">
          {headerContent}
          {open && (
            <div className="overflow-hidden border-t border-border/40">
              {tableContent}
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border/60 rounded-2xl overflow-hidden bg-card/40 backdrop-blur-md shadow-lg shadow-black/5 hover:border-primary/20 transition-all duration-300"
        >
          {headerContent}
          <AnimatePresence>
            {open && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="overflow-hidden border-t border-border/40"
              >
                {tableContent}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <EditRegistroDialog
        open={!!editingRegistro}
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditingRegistro(null); }}
        registro={editingRegistro}
        conferenceId={conf.id}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Excluir Histórico?</DialogTitle>
            <DialogDescription className="text-center text-sm font-medium mt-2 leading-relaxed">
              Esta ação removerá permanentemente a conferência <span className="text-foreground font-black">"{folderName}"</span> e todos os seus registros do banco de dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <Button variant="outline" className="rounded-xl font-bold h-12 w-full" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-black h-12 w-full shadow-lg shadow-destructive/20" onClick={() => { onDelete(); setConfirmDelete(false); }}>Excluir Agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default function HistoryPanel() {
  const history = useAppStore(s => s.history);
  const deleteConference = useAppStore(s => s.deleteConference);
  const clearHistory = useAppStore(s => s.clearHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const { isLow } = usePerformance();

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return history;
    return history.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.registros.some(r => r.item.toLowerCase().includes(q) || (r.nf || '').toLowerCase().includes(q) || (r.lote || '').toLowerCase().includes(q))
    );
  }, [history, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-background/30 backdrop-blur-sm">
      <div className="px-6 py-4 bg-card/60 backdrop-blur-md border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-muted/40 text-sm font-bold tracking-tight focus:bg-background focus:border-primary/50 transition-all placeholder:text-muted-foreground/40" 
            placeholder="Buscar no histórico por nome, item, NF ou lote..." 
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            if (confirm('Deseja realmente limpar TODO o histórico? Esta ação não pode ser desfeita.')) clearHistory();
          }}
          className="h-11 px-6 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Limpar Tudo</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
          {filteredHistory.map(conf => (
            <ConferenceCard key={conf.id} conf={conf} onDelete={() => deleteConference(conf.id)} />
          ))}

          {filteredHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <div className="h-20 w-20 bg-muted rounded-[2rem] flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-black tracking-tight text-muted-foreground">Nenhuma conferência encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}