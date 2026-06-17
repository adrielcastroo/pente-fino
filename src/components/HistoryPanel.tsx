import { useEffect, useState, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatML, formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Conference, Registro } from '@/types';
import { toast } from 'sonner';
import { usePerformance } from '@/hooks/use-performance';
import { useShallow } from 'zustand/react/shallow';
import { FolderOpen, ChevronDown, Package, Trash2, User, Pencil, CheckCircle2, Search, Calendar, FileSpreadsheet, Clock, Plus, X, Download } from 'lucide-react';
import { exportConferenceToExcel, exportMotorControleToExcel } from '@/lib/export-utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';



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
  const isMotor = form?.modoOrigem === 'motor';

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
        nf: form.nf || '',
        endereco: isPVT ? '' : (form.endereco || '').toUpperCase(),
        tipoTecido: form.tipoTecido || '',
        modoOrigem: form.modoOrigem || '',
        quantidade: form.quantidade,
        loteSistema: form.loteSistema || '',
        posicao: Number(form.posicao) || null,
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
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-xl rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-8 sm:p-10 bg-gradient-to-br from-muted/50 to-muted/20 relative overflow-hidden border-b border-border/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-4 relative">
             <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white animate-in zoom-in duration-500"><Pencil className="w-5 h-5" /></div>
             Editar Registro
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold mt-2 opacity-70 relative">
            {form?.modoOrigem ? `${form.modoOrigem === 'motor' ? 'Motor' : form.modoOrigem === 'controle' ? 'Controle' : form.tipoTecido || ''} • ` : ''}Ajuste as especificações deste item no histórico.
          </DialogDescription>
        </DialogHeader>


        {form && (
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Referência do Item</label>
              <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.item} onChange={e => updateField('item', e.target.value)} />
            </div>

            {(isDiversos || isMotor) && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Nota Fiscal</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.nf || ''} onChange={e => updateField('nf', e.target.value)} />
              </div>
            )}

            {isMotor && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote / Batch</label>
                  <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.lote || ''} onChange={e => updateField('lote', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">QTD</label>
                  <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" value={String(form.quantidade ?? '')} onChange={e => updateField('quantidade', Number(e.target.value) || 0)} />
                </div>
              </div>
            )}

            {isMotor && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote Final</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all font-mono text-sm" value={form.loteSistema || ''} onChange={e => updateField('loteSistema', e.target.value)} />
              </div>
            )}

            {!isPVT && !isMotor && (
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

            {!isMotor && (
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
            )}

            {!isPVT && !isMotor && (
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

function AddHistoryRegistroDialog({
  open,
  onOpenChange,
  conferenceId,
  isDiversos,
  isMotor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conferenceId: string;
  isDiversos: boolean;
  isMotor: boolean;
}) {
  const addHistoryRegistro = useAppStore(s => s.addHistoryRegistro);
  const [form, setForm] = useState({
    item: '',
    m2: '',
    mLinear: '',
    largura: '',
    lote: '',
    nf: '',
    endereco: '',
    tipoTecido: isMotor ? 'Motor' : isDiversos ? 'Cortina' : '',
    modoOrigem: isMotor ? 'motor' : isDiversos ? 'diversos' : 'manual',
    quantidade: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.item.trim()) {
      toast.warning('Informe o Item/Referência.');
      return;
    }

    setSaving(true);
    try {
      await addHistoryRegistro(conferenceId, {
        item: form.item.trim(),
        m2: Number(form.m2) || 0,
        mLinear: Number(form.mLinear) || 0,
        largura: Number(form.largura) || 0,
        lote: form.lote || '',
        nf: form.nf || '',
        endereco: form.endereco.toUpperCase(),
        tipoTecido: form.tipoTecido,
        modoOrigem: form.modoOrigem,
        quantidade: Number(form.quantidade) || undefined,
        processo: '', // Will be filled by store using conference processo
        loteSistema: '', // Will be generated by store
      });
      toast.success('Registro adicionado ao histórico.');
      setForm({
        item: '',
        m2: '',
        mLinear: '',
        largura: '',
        lote: '',
        nf: '',
        endereco: '',
        tipoTecido: isMotor ? 'Motor' : isDiversos ? 'Cortina' : '',
        modoOrigem: isMotor ? 'motor' : isDiversos ? 'diversos' : 'manual',
        quantidade: '',
      });
      onOpenChange(false);
    } catch {
      toast.error('Erro ao adicionar registro ao histórico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-xl rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-8 sm:p-10 bg-gradient-to-br from-muted/50 to-muted/20 relative overflow-hidden border-b border-border/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-4 relative">
             <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white animate-in zoom-in duration-500"><Plus className="w-5 h-5" /></div>
             Novo Registro
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold mt-2 opacity-70 relative">
            Adicione um item esquecido a esta conferência de forma rápida e precisa.
          </DialogDescription>
        </DialogHeader>


        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Referência do Item</label>
            <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} />
          </div>

          {(isDiversos || isMotor) && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Nota Fiscal</label>
              <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.nf} onChange={e => setForm({ ...form, nf: e.target.value })} />
            </div>
          )}

          {isMotor && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote / Batch</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">QTD</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
              </div>
            </div>
          )}

          {!isMotor && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Metragem Quadrada (M²)</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" step="0.1" value={form.m2} onChange={e => setForm({ ...form, m2: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Largura (m)</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" step="0.01" value={form.largura} onChange={e => setForm({ ...form, largura: e.target.value })} />
              </div>
            </div>
          )}

          {!isMotor && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Metro Linear</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" type="number" step="0.1" value={form.mLinear} onChange={e => setForm({ ...form, mLinear: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote / Batch</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} />
              </div>
            </div>
          )}

          {!isMotor && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Endereço de Armazenagem</label>
              <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all uppercase" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value.toUpperCase() })} />
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/30 gap-3">
          <Button variant="outline" className="rounded-xl font-bold px-6 h-11" onClick={() => onOpenChange(false)} disabled={saving}>Descartar</Button>
          <Button className="rounded-xl font-black px-8 h-11 bg-primary shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getConferenceFolderName(conf: Conference): string {
  if (conf.processo && conf.processo !== 'conferencia_conferencia' && !conf.processo.startsWith('conferencia_NF_')) return conf.processo;
  
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
  const isMotorControle = conf.registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
  
  if (isMotorControle) {
    const nfs = Array.from(new Set(conf.registros.map(r => (r.nf || '').trim()).filter(Boolean)));
    const fileName = nfs.length > 0 ? `Motores NF ${nfs.join(' ')}` : 'Motores';
    exportMotorControleToExcel(conf.registros, fileName);
    return;
  }

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
      case 'posicao': return r.posicao || '';
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
  const allMotor = regs.every(r => r.modoOrigem === 'motor');
  const allControle = regs.every(r => r.modoOrigem === 'controle');
  const allMotorControle = regs.every(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');

  if (allMadeira) {
    const totalQtd = regs.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return `${regs.length} caixas${totalQtd > 0 ? ` (${totalQtd} und)` : ''}`;
  }
  if (allMotor) {
    const totalQtd = regs.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return totalQtd > 0 ? `${totalQtd} motores` : `${regs.length} motores`;
  }
  if (allControle) {
    const totalQtd = regs.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return totalQtd > 0 ? `${totalQtd} controles` : `${regs.length} controles`;
  }
  if (allMotorControle) {
    const motors = regs.filter(r => r.modoOrigem === 'motor').reduce((s, r) => s + (r.quantidade || 1), 0);
    const ctrls = regs.filter(r => r.modoOrigem === 'controle').reduce((s, r) => s + (r.quantidade || 1), 0);
    return `${motors} motores · ${ctrls} controles`;
  }
  if (allCelular) return `${regs.length} rolos (Celular)`;

  const hasMixed = new Set(regs.map(r => r.modoOrigem)).size > 1;
  if (hasMixed) return `${regs.length} itens`;
  return `${regs.length} rolos`;
}

function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—';
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return '—';
    const diff = Math.abs(e - s);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainMins}min`;
    return `${mins}min`;
  } catch { return '—'; }
}

const ConferenceCard = memo(({ conf, onDelete, highlight = false }: { conf: Conference; onDelete: () => void; highlight?: boolean }) => {
  const [open, setOpen] = useState(highlight);

  const { isGuest, isAdmin } = useAuth();
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Registro | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { isLow } = usePerformance();
  const totalML = useMemo(() => {
    let sum = 0;
    for (let i = 0, len = conf.registros.length; i < len; i++) sum += conf.registros[i].mLinear;
    return sum;
  }, [conf.registros]);
  const columns = useMemo(() => open ? getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual') : [], [conf.registros, open]);
  const folderName = useMemo(() => getConferenceFolderName(conf), [conf]);
  const modeBadges = useMemo(() => getModeBadges(conf), [conf.registros]);

  const tableContent = (
    <div className="overflow-x-auto custom-scrollbar p-3 sm:p-6 lg:p-8">
      <div className="rounded-2xl lg:rounded-[2rem] overflow-hidden border border-border/20 shadow-2xl bg-background/40 backdrop-blur-2xl">
        <table className="w-full text-xs min-w-full sm:min-w-[800px] border-separate border-spacing-0">

          <thead>
            <tr className="bg-muted/40">
              {columns.map(column => (
                <th key={column.key} className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/20">{column.shortLabel || column.label}</th>
              ))}
              <th className="px-6 py-4 border-b border-border/20 w-[100px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {conf.registros.map((r, i) => (
              <tr key={r.id} className="group/row hover:bg-primary/5 transition-colors">
                {columns.map(column => (
                  <td key={column.key} className={`px-6 py-4 ${column.key === 'item' ? 'font-black text-foreground' : 'font-mono text-muted-foreground/90'}`}>
                    {column.key === 'item' ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm tracking-tight">{r.item || '—'}</span>
                        {r.tipoTecido && <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 w-fit bg-primary/5 border-primary/10 text-primary/60">{r.tipoTecido}</Badge>}
                      </div>
                    ) : column.key === 'mLinear' ? (
                      <span className="font-black text-foreground/80">{formatML(r.mLinear)}</span>
                    ) : column.key === 'm2' ? (
                      <span className="font-bold">{r.m2 > 0 ? r.m2.toFixed(1) : '—'}</span>
                    ) : column.key === 'largura' ? (
                      <span className="font-bold opacity-70">{r.largura > 0 ? `${r.largura.toFixed(2)}m` : '—'}</span>
                    ) : (
                      <span className="opacity-80">{(r as any)[column.key] || '—'}</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover/row:opacity-100 transition-all duration-300">
                    {isAdmin && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRegistro(r)}
                            className="h-9 w-9 rounded-xl border border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar registro</TooltipContent>
                      </Tooltip>
                    )}
                    
                    {isAdmin && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDeleteItem(r)}
                            className="h-9 w-9 rounded-xl border border-border/40 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir item</TooltipContent>
                      </Tooltip>
                    )}

                    {r.wasEdited && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="ml-1 p-1.5 rounded-full bg-primary/10 text-primary cursor-help">
                            <CheckCircle2 className="w-4 h-4" />
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
    </div>
  );


  const headerContent = (
    <div className="group/header">
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full px-4 sm:px-6 py-5 flex items-center gap-4 hover:bg-muted/40 transition-all text-left relative overflow-hidden"
      >
        <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500 shrink-0 ${open ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-primary/10 text-primary group-hover/header:bg-primary/20'}`}>
          <FolderOpen className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-500 ${open ? 'scale-110' : 'group-hover/header:scale-110'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-lg font-black tracking-tight truncate max-w-[200px] sm:max-w-none">{folderName}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {modeBadges.map(b => (
                    <Badge key={b} variant="secondary" className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary/5 text-primary/70 border-primary/10 transition-colors group-hover/header:bg-primary/10">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground font-bold flex-wrap">
                <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md"><Calendar className="w-3.5 h-3.5 opacity-60" /> {formatDateBR(conf.date)}</span>
                
                {conf.startedAt && (
                  <span className="flex items-center gap-1.5 text-emerald-600/80 bg-emerald-500/5 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5" /> {formatTimeBR(conf.startedAt)}
                    {conf.finishedAt && <span className="text-muted-foreground/60">→ {formatTimeBR(conf.finishedAt)}</span>}
                  </span>
                )}
                
                {conf.startedAt && conf.finishedAt && (
                  <Badge variant="outline" className="text-[8px] sm:text-[9px] font-black px-2 py-0 h-5 border-primary/10 text-primary/60 bg-primary/5">
                    {formatDuration(conf.startedAt, conf.finishedAt)}
                  </Badge>
                )}
                
                <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md">
                  <Package className="w-3.5 h-3.5 opacity-60" /> {getSmartCount(conf)}
                </span>
                
                {totalML > 0 && (
                  <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">{formatML(totalML)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!isAdmin) {
                          toast.error('Somente administradores podem incluir itens no histórico.');
                          return;
                        }
                        setIsAdding(true); 
                      }}
                      className="h-9 sm:h-10 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-wider px-3"
                    >
                      <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden lg:inline">Incluir Item</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Adicionar novo registro</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); downloadConferenceExcel(conf); }}
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary/10 text-primary transition-all border border-border/40 group/btn"
                    >
                      <Download className="w-4 h-4 transition-transform group-hover/btn:-translate-y-0.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar para Excel</TooltipContent>
                </Tooltip>

                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all border border-border/40 group/delete"
                      >
                        <Trash2 className="w-4 h-4 transition-transform group-hover/delete:scale-110" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir Conferência</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className={`p-2 rounded-full transition-all duration-500 ${open ? 'rotate-180 bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground/50'}`}>
                 <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );


  const deleteHistoryRegistro = useAppStore(s => s.deleteHistoryRegistro);

  const handleDeleteItem = async (registroId: string) => {
    try {
      await deleteHistoryRegistro(conf.id, registroId);
      toast.success('Item removido do histórico.');
    } catch {
      toast.error('Erro ao remover item do histórico.');
    }
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ y: -2 }}
        className={`border rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-card/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 backdrop-blur-sm group/card ${highlight ? 'border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10' : 'border-border/40 hover:border-primary/40'}`}
      >
        {highlight && (
          <div className="bg-primary/10 text-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Exportado agora
          </div>
        )}
        {headerContent}

        <AnimatePresence mode="wait">
          {open && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden border-t border-border/10 bg-muted/10"
            >
              {tableContent}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>



      <EditRegistroDialog
        open={!!editingRegistro}
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditingRegistro(null); }}
        registro={editingRegistro}
        conferenceId={conf.id}
      />

      <AddHistoryRegistroDialog
        open={isAdding}
        onOpenChange={setIsAdding}
        conferenceId={conf.id}
        isDiversos={conf.registros.some(r => r.modoOrigem === 'diversos')}
        isMotor={conf.registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle')}
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
  const { isGuest, isAdmin } = useAuth();
  const { history, isHistoryLoading, historyError, deleteConference, clearHistory, loadHistory, lastArchivedConferenceId, setLastArchivedConferenceId } = useAppStore(useShallow(s => ({

    history: s.history,
    isHistoryLoading: s.isHistoryLoading,
    historyError: s.historyError,
    deleteConference: s.deleteConference,
    clearHistory: s.clearHistory,
    loadHistory: s.loadHistory,
    lastArchivedConferenceId: s.lastArchivedConferenceId,
    setLastArchivedConferenceId: s.setLastArchivedConferenceId,
  })));
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { isLow } = usePerformance();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (lastArchivedConferenceId) {
      setHighlightId(lastArchivedConferenceId);
      setLastArchivedConferenceId(null);
      const t = setTimeout(() => setHighlightId(null), 6000);
      return () => clearTimeout(t);
    }
  }, [lastArchivedConferenceId, setLastArchivedConferenceId]);


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return history;
    
    const result: Conference[] = [];
    for (let i = 0, len = history.length; i < len; i++) {
      const c = history[i];
      if (
        (c.processo || '').toLowerCase().includes(q) || 
        (c.conferente || '').toLowerCase().includes(q)
      ) {
        result.push(c);
        continue;
      }
      
      const regs = c.registros;
      for (let j = 0, rLen = regs.length; j < rLen; j++) {
        const r = regs[j];
        if ((r.item || '').toLowerCase().includes(q) || (r.nf || '').toLowerCase().includes(q)) {
          result.push(c);
          break;
        }
      }
    }
    return result;
  }, [history, debouncedSearch]);

  const handleClear = async () => {
    try {
      await clearHistory();
      toast.success('Todo o histórico foi removido.');
      setShowClearConfirm(false);
    } catch {
      toast.error('Erro ao limpar o histórico.');
    }
  };

  if (isHistoryLoading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <p className="font-black text-foreground uppercase tracking-widest text-sm animate-pulse">Sincronizando Histórico</p>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider opacity-60">Carregando dados do servidor...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-6 sm:p-10 space-y-8 flex-shrink-0">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1.5 text-center lg:text-left"
          >
             <h1 className="text-[clamp(1.75rem,5vw,3.5rem)] font-black tracking-tight text-foreground leading-tight">
               Histórico de <span className="text-primary italic relative">
                 Conferências
                 <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                   <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                 </svg>
               </span>
             </h1>
             <p className="text-muted-foreground font-medium text-sm sm:text-base">Acompanhe e gerencie todos os registros de conferência realizados.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 w-full lg:w-auto"
          >
             <div className="relative group flex-1 w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                <Input 
                  value={localSearch} 
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder="Pesquisar por item, conferente ou NF..."
                  className="pl-11 h-12 rounded-2xl border-border/40 bg-card/40 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm shadow-sm"
                />
             </div>
             {history.length > 0 && !isGuest && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button 
                     variant="outline" 
                     size="icon" 
                     onClick={() => setShowClearConfirm(true)}
                     className="h-12 w-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all shadow-sm group"
                   >
                     <Trash2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>Limpar todo o histórico</TooltipContent>
               </Tooltip>
             )}
          </motion.div>
        </header>


        {historyError && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-destructive font-bold text-sm">
              <span>⚠️ {historyError}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => loadHistory()} className="h-8 rounded-lg font-black uppercase text-[10px] hover:bg-destructive/10 text-destructive">Tentar Novamente</Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 custom-scrollbar">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 max-w-[1400px] mx-auto pb-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((conf, index) => (
                <motion.div
                  key={conf.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <ConferenceCard 
                    conf={conf} 
                    onDelete={() => deleteConference(conf.id)} 
                    highlight={conf.id === highlightId}
                  />

                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/10 rounded-[3rem] blur-2xl animate-pulse" />
              <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-card to-muted border border-border/40 flex items-center justify-center relative shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <FolderOpen className="w-12 h-12 text-primary/40" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">O histórico está pronto.</h3>
            <p className="text-muted-foreground text-base font-medium max-w-xs leading-relaxed">
              {localSearch 
                ? `Nenhum registro encontrado para "${localSearch}". Tente outro termo.` 
                : 'Suas conferências finalizadas aparecerão aqui organizadas por data e conferente.'}
            </p>
          </motion.div>
        )}

      </div>

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="rounded-[2rem] max-w-sm border-none shadow-2xl">
          <DialogHeader className="p-2">
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Limpar Tudo?</DialogTitle>
            <DialogDescription className="font-bold text-sm leading-relaxed mt-2 text-muted-foreground text-center">
              Você está prestes a remover permanentemente <span className="text-destructive font-black">{history.length} conferências</span>. Esta ação limpará todo o banco de dados histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-2 gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-2xl font-bold h-12" onClick={() => setShowClearConfirm(false)}>Manter Dados</Button>
            <Button variant="destructive" className="flex-1 rounded-2xl font-black h-12 shadow-lg shadow-destructive/20" onClick={handleClear}>Limpar Tudo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
