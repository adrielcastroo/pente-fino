import { useEffect, useState, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatML, formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Conference, Registro } from '@/types';
import { toast } from 'sonner';
import { usePerformance } from '@/hooks/use-performance';
import { useShallow } from 'zustand/react/shallow';
import { FolderOpen, ChevronDown, Trash2, Pencil, CheckCircle2, Search, Plus, X, Download, Printer, ArrowRightLeft } from 'lucide-react';
import { RequireRole } from '@/components/auth/RequireRole';
import { exportConferenceToExcel, exportMotorControleToExcel } from '@/lib/export-utils';
import { itensCadastroService } from '@/services/itensCadastroService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { routeForConference } from '@/lib/conferenceRouting';
import { printTecidoLabel, printMotorLabel, printLabelsBatch, type BatchItem } from '@/services/printService';



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
  const [isDirty, setIsDirty] = useState(false);

  // Não sobrescrever edições do usuário quando o pai re-renderiza
  useEffect(() => {
    if (!isDirty) setForm(registro);
  }, [registro, isDirty]);

  useEffect(() => {
    if (!open) setIsDirty(false);
  }, [open]);

  const isPVT = form?.tipoTecido === 'PVT';
  const isDiversos = form?.modoOrigem === 'diversos';
  const isMotor = form?.modoOrigem === 'motor' || form?.modoOrigem === 'controle' || form?.tipoTecido === 'Coulisse';

  const updateField = <K extends keyof Registro>(key: K, value: Registro[K]) => {
    setIsDirty(true);
    setForm(current => current ? { ...current, [key]: value } : current);
  };

  const hasChanges = useMemo(() => {
    if (!form || !registro) return false;
    return JSON.stringify(form) !== JSON.stringify(registro);
  }, [form, registro]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && hasChanges) {
      if (!window.confirm('Descartar alterações não salvas?')) return;
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.item.trim()) {
      toast.warning('Informe o Item/Referência.');
      return;
    }

    const m2 = Number(form.m2);
    const mLinear = Number(form.mLinear);
    const largura = Number(form.largura);
    const quantidade = Number(form.quantidade);

    if (!isMotor) {
      if (m2 < 0) { toast.warning('Metragem não pode ser negativa.'); return; }
      if (largura < 0 || largura > 10) { toast.warning('Largura deve estar entre 0 e 10m.'); return; }
      if (mLinear < 0) { toast.warning('Metro linear não pode ser negativo.'); return; }
    }
    if (isMotor && form.quantidade !== undefined && quantidade < 1) {
      toast.warning('Quantidade deve ser pelo menos 1.');
      return;
    }

    const snapshot = registro ? { ...registro } : null;
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
      toast.success('Registro atualizado.', {
        action: snapshot ? {
          label: 'Desfazer',
          onClick: async () => {
            try {
              await updateHistoryRegistro(conferenceId, snapshot.id, snapshot as any);
              toast.info('Alteração desfeita.');
            } catch (err) {
              console.error('[HistoryPanel] Erro ao desfazer:', err);
              toast.error('Não foi possível desfazer.');
            }
          },
        } : undefined,
        duration: 8000,
      });
      setIsDirty(false);
      onOpenChange(false);
    } catch (err) {
      console.error('[HistoryPanel] Erro ao salvar registro:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-10 rounded-md border-border/40 bg-muted/20 focus:bg-background transition-colors";
  const labelCls = "text-xs font-medium text-muted-foreground ml-1";

  const fieldWithOriginal = (key: keyof Registro, label: string, extra?: React.ReactNode) => (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {extra}
      {form && registro && String(form[key] ?? '') !== String(registro[key] ?? '') && (
        <span className="block text-[10px] text-amber-600 ml-1">
          Anterior: {String(registro[key] ?? '—') || '—'}
        </span>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-xl rounded-md p-0 overflow-hidden border border-border max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Editar Registro
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {(() => {
              const tipo = form?.modoOrigem === 'motor' ? 'Motor'
                : form?.modoOrigem === 'controle' ? 'Controle'
                : form?.tipoTecido === 'Coulisse' ? 'Coulisse'
                : form?.tipoTecido || '';
              return `${tipo ? tipo + ' • ' : ''}Ajuste as especificações deste item no histórico.`;
            })()}
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="p-4 space-y-4">
            {fieldWithOriginal('item', 'Referência do Item',
              <Input className={inputCls} value={form.item} onChange={e => updateField('item', e.target.value)} />
            )}

            {fieldWithOriginal('nf', 'Nota Fiscal',
              <Input className={inputCls} value={form.nf || ''} onChange={e => updateField('nf', e.target.value)} />
            )}

            {isMotor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldWithOriginal('lote', 'Lote / Batch',
                  <Input className={inputCls} value={form.lote || ''} onChange={e => updateField('lote', e.target.value)} />
                )}
                {fieldWithOriginal('quantidade', 'QTD',
                  <Input className={inputCls} type="number" min={1} value={String(form.quantidade ?? '')} onChange={e => updateField('quantidade', Number(e.target.value) || 0)} />
                )}
              </div>
            )}

            {isMotor && fieldWithOriginal('loteSistema', 'Lote Final',
              <Input className={`${inputCls} font-mono text-sm tabular-nums`} value={form.loteSistema || ''} onChange={e => updateField('loteSistema', e.target.value)} />
            )}

            {!isPVT && !isMotor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldWithOriginal('m2', 'Metragem Quadrada (M²)',
                  <Input className={inputCls} type="number" min={0} step="0.1" value={String(form.m2 ?? '')} onChange={e => updateField('m2', Number(e.target.value) || 0)} />
                )}
                {fieldWithOriginal('largura', 'Largura (m)',
                  <Input className={inputCls} type="number" min={0} max={10} step="0.01" value={String(form.largura ?? '')} onChange={e => updateField('largura', Number(e.target.value) || 0)} />
                )}
              </div>
            )}

            {!isMotor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldWithOriginal('mLinear', 'Metro Linear',
                  <Input className={inputCls} type="number" min={0} step="0.1" value={String(form.mLinear ?? '')} onChange={e => updateField('mLinear', Number(e.target.value) || 0)} />
                )}
                {fieldWithOriginal('lote', 'Lote / Batch',
                  <Input className={inputCls} value={form.lote || ''} onChange={e => updateField('lote', e.target.value)} />
                )}
              </div>
            )}

            {!isPVT && !isMotor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fieldWithOriginal('endereco', 'Endereço de Armazenagem',
                  <Input className={`${inputCls} uppercase`} value={form.endereco || ''} onChange={e => updateField('endereco', e.target.value.toUpperCase())} />
                )}
                {fieldWithOriginal('posicao', 'Posição no Estoque',
                  <Input className={inputCls} type="number" value={String(form.posicao ?? '')} onChange={e => updateField('posicao', (e.target.value === '' ? null : Number(e.target.value)) as any)} />
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-4 bg-muted/10 border-t border-border gap-3">
          <Button variant="outline" className="rounded-md font-medium px-6 h-10" onClick={() => handleClose(false)} disabled={saving}>Descartar</Button>
          <Button className="rounded-md font-medium px-6 h-10 bg-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar'}</Button>
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
  const initial = () => ({
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
    loteSistema: '',
  });
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.item.trim()) {
      toast.warning('Informe o Item/Referência.');
      return;
    }

    const m2 = Number(form.m2);
    const mLinear = Number(form.mLinear);
    const largura = Number(form.largura);
    const quantidade = Number(form.quantidade);

    if (!isMotor) {
      if (m2 < 0) { toast.warning('Metragem não pode ser negativa.'); return; }
      if (largura < 0 || largura > 10) { toast.warning('Largura deve estar entre 0 e 10m.'); return; }
      if (mLinear < 0) { toast.warning('Metro linear não pode ser negativo.'); return; }
    }
    if (isMotor && form.quantidade !== '' && quantidade < 1) {
      toast.warning('Quantidade deve ser pelo menos 1.');
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
        processo: '',
        loteSistema: form.loteSistema || '',
      });
      toast.success('Registro adicionado ao histórico.');
      setForm(initial());
      onOpenChange(false);
    } catch (err) {
      console.error('[HistoryPanel] Erro ao adicionar registro:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao adicionar: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-10 rounded-md border-border/40 bg-muted/20 focus:bg-background transition-colors";
  const labelCls = "text-xs font-medium text-muted-foreground ml-1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-xl rounded-md p-0 overflow-hidden border border-border max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold tracking-tight">Novo Registro</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Adicione um item esquecido a esta conferência.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className={labelCls}>Referência do Item</label>
            <Input className={inputCls} value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} />
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Nota Fiscal</label>
            <Input className={inputCls} value={form.nf} onChange={e => setForm({ ...form, nf: e.target.value })} />
          </div>

          {isMotor && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>Lote / Batch</label>
                  <Input className={inputCls} value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>QTD</label>
                  <Input className={inputCls} type="number" min={1} value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Lote Final</label>
                <Input className={`${inputCls} font-mono text-sm tabular-nums`} value={form.loteSistema} onChange={e => setForm({ ...form, loteSistema: e.target.value })} />
              </div>
            </>
          )}

          {!isMotor && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>Metragem Quadrada (M²)</label>
                  <Input className={inputCls} type="number" min={0} step="0.1" value={form.m2} onChange={e => setForm({ ...form, m2: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Largura (m)</label>
                  <Input className={inputCls} type="number" min={0} max={10} step="0.01" value={form.largura} onChange={e => setForm({ ...form, largura: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>Metro Linear</label>
                  <Input className={inputCls} type="number" min={0} step="0.1" value={form.mLinear} onChange={e => setForm({ ...form, mLinear: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Lote / Batch</label>
                  <Input className={inputCls} value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Endereço de Armazenagem</label>
                <Input className={`${inputCls} uppercase`} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value.toUpperCase() })} />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/10 border-t border-border gap-3">
          <Button variant="outline" className="rounded-md font-medium px-6 h-10" onClick={() => onOpenChange(false)} disabled={saving}>Descartar</Button>
          <Button className="rounded-md font-medium px-6 h-10 bg-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar Item'}</Button>
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

async function downloadConferenceExcel(conf: Conference) {
  const isMotorControle = conf.registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
  
  if (isMotorControle) {
    const nfs = Array.from(new Set(conf.registros.map(r => (r.nf || '').trim()).filter(Boolean)));
    const fileName = nfs.length > 0 ? `Motores NF ${nfs.join(' ')}` : 'Motores';
    exportMotorControleToExcel(conf.registros, fileName);
    return;
  }

  const columns = getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual');
  const folderName = getConferenceFolderName(conf);
  const resolveCodigoInterno = await itensCadastroService.buildCodigoInternoResolver();
  const headers = ['Código Interno', ...columns.map(c => c.label)];
  const data = conf.registros.map(r => {
    const row = columns.map(c => {
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
    });
    return [resolveCodigoInterno(r.item || ''), ...row];
  });
  const columnWidths = [18, ...columns.map(c => c.width)];
  const fileName = `conferencia_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  exportConferenceToExcel(headers, data, fileName, columnWidths);
}

// Constrói o payload inicial para o dialog de transferência a partir da conferência.
// Agrupa por código de item; junta lotes (tecidos) e séries (motores/controles).
function buildTransferInitialFromConference(conf: Conference) {
  const map = new Map<string, {
    cdItem: string;
    descricao: string;
    lotes: { lote: string; qtd: number; disponivel: number }[];
    qtd: number;
    modoLote?: 'lote' | 'serie';
  }>();
  for (const r of conf.registros) {
    const code = (r.item || '').trim();
    if (!code) continue;
    const isMotor = r.modoOrigem === 'motor' || r.modoOrigem === 'controle';
    const lote = (isMotor ? (r.loteSistema || r.lote) : r.lote) || '';
    const qtd = isMotor
      ? Number(r.quantidade || 1)
      : Number(r.mLinear || r.m2 || r.quantidade || 0) || 0;
    const cur = map.get(code) ?? { cdItem: code, descricao: '', lotes: [], qtd: 0 };
    cur.qtd += qtd;
    if (isMotor) cur.modoLote = 'serie';
    if (lote) {
      const ex = cur.lotes.find(l => l.lote === lote);
      if (ex) { ex.qtd += qtd; ex.disponivel += qtd; }
      else cur.lotes.push({ lote, qtd, disponivel: qtd });
    }
    map.set(code, cur);
  }
  return {
    itens: [...map.values()].map(v => ({
      cdItem: v.cdItem,
      descricao: v.descricao,
      cdDepositoOrigem: '',
      cdDepositoDestino: '',
      qtd: v.qtd || (v.lotes.reduce((a, b) => a + b.qtd, 0)),
      lotes: v.lotes,
      modoLote: v.modoLote,
    })),
    observacao: `Origem: conferência ${getConferenceFolderName(conf)}`,
  };
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

import { BADGE_COLOR_MAP, getBadgeClass } from '@/lib/badge-colors';
export { BADGE_COLOR_MAP, getBadgeClass };

function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? singular : plural}`;
}

function formatMLDisplay(v: number): string {
  if (typeof v !== 'number' || v === 0) return '';
  const rounded = Math.round(v * 10) / 10;
  if (rounded === 0) return '';
  const numStr = rounded.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  return `${numStr} M`;
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
    return `${pluralize(regs.length, 'caixa', 'caixas')}${totalQtd > 0 ? ` (${pluralize(totalQtd, 'unidade', 'unidades')})` : ''}`;
  }
  if (allMotor) {
    const totalQtd = regs.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return pluralize(totalQtd > 0 ? totalQtd : regs.length, 'motor', 'motores');
  }
  if (allControle) {
    const totalQtd = regs.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return pluralize(totalQtd > 0 ? totalQtd : regs.length, 'controle', 'controles');
  }
  if (allMotorControle) {
    const motors = regs.filter(r => r.modoOrigem === 'motor').reduce((s, r) => s + (r.quantidade || 1), 0);
    const ctrls = regs.filter(r => r.modoOrigem === 'controle').reduce((s, r) => s + (r.quantidade || 1), 0);
    return `${pluralize(motors, 'motor', 'motores')} · ${pluralize(ctrls, 'controle', 'controles')}`;
  }
  if (allCelular) return `${pluralize(regs.length, 'rolo', 'rolos')} (Celular)`;

  const hasMixed = new Set(regs.map(r => r.modoOrigem)).size > 1;
  if (hasMixed) return pluralize(regs.length, 'item', 'itens');
  return pluralize(regs.length, 'rolo', 'rolos');
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
    if (hours > 0) return remainMins === 0 ? `${hours} h` : `${hours} h ${remainMins} min`;
    if (mins < 1) return '< 1 min';
    return `${mins} min`;
  } catch { return '—'; }
}

function getDurationHours(start: string | null | undefined, end: string | null | undefined): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.abs(e - s) / 3600000;
}

function isTestConference(conf: Conference): boolean {
  const proc = (conf.processo || '').toLowerCase().trim();
  if (proc.includes('sem_proc') || proc === 'conferencia_conferencia') return true;
  // duplicated empty placeholder rows
  if (conf.registros.length === 0) return true;
  return false;
}

type MergedConference = Conference & { _underlyingIds?: string[]; _regToConfId?: Record<string, string> };

function groupConferencesByNF(confs: Conference[]): MergedConference[] {
  const parent: number[] = confs.map((_, i) => i);
  const find = (i: number): number => parent[i] === i ? i : (parent[i] = find(parent[i]));
  const union = (a: number, b: number) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };

  const nfToIdx = new Map<string, number>();
  confs.forEach((c, i) => {
    const nfs = new Set(c.registros.map(r => (r.nf || '').trim().toUpperCase()).filter(Boolean));
    nfs.forEach(nf => {
      if (nfToIdx.has(nf)) union(nfToIdx.get(nf)!, i);
      else nfToIdx.set(nf, i);
    });
  });

  const groups = new Map<number, number[]>();
  confs.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  });

  const result: MergedConference[] = [];
  for (const idxs of groups.values()) {
    if (idxs.length === 1) { result.push(confs[idxs[0]]); continue; }
    const members = idxs.map(i => confs[i]).sort((a, b) =>
      new Date(b.finishedAt || b.startedAt || b.date).getTime() -
      new Date(a.finishedAt || a.startedAt || a.date).getTime()
    );
    const primary = members[0];
    const allRegs = members.flatMap(m => m.registros);
    const regToConfId: Record<string, string> = {};
    members.forEach(m => m.registros.forEach(r => { regToConfId[r.id] = m.id; }));
    const nfs = Array.from(new Set(allRegs.map(r => (r.nf || '').trim()).filter(Boolean)));
    const starts = members.map(m => m.startedAt).filter(Boolean).sort();
    const finishes = members.map(m => m.finishedAt).filter(Boolean).sort();
    const conferentes = Array.from(new Set(members.map(m => m.conferente).filter(Boolean)));
    result.push({
      ...primary,
      id: `nfgroup:${members.map(m => m.id).join('|')}`,
      name: nfs.length ? `NF ${nfs.join(', ')}` : primary.name,
      processo: nfs.length ? `NF ${nfs.join(', ')}` : primary.processo,
      conferente: conferentes.join(', '),
      registros: allRegs,
      startedAt: starts[0] || primary.startedAt,
      finishedAt: finishes[finishes.length - 1] || primary.finishedAt,
      _underlyingIds: members.map(m => m.id),
      _regToConfId: regToConfId,
    });
  }
  result.sort((a, b) =>
    new Date(b.finishedAt || b.startedAt || b.date).getTime() -
    new Date(a.finishedAt || a.startedAt || a.date).getTime()
  );
  return result;
}

async function printRegistro(r: Registro, labelSettings: any) {
  const isMotorCtrl = r.modoOrigem === 'motor' || r.modoOrigem === 'controle' || r.tipoTecido === 'Coulisse';
  const settings = { ...labelSettings, autoPrint: true };
  if (isMotorCtrl) {
    await printMotorLabel({
      item: r.item,
      descricao: r.modoOrigem === 'motor' ? 'Motor' : r.modoOrigem === 'controle' ? 'Controle' : 'Coulisse',
      lote: r.lote,
      loteSistema: r.loteSistema,
      nf: r.nf,
      cx: (r as any).caixaNum ?? null,
    }, settings);
  } else {
    await printTecidoLabel({
      item: r.item,
      descricao: r.tipoTecido || '',
      lote: r.lote,
      loteSistema: r.loteSistema,
      processo: r.processo,
      nf: r.nf,
      m2: r.m2,
      mLinear: r.mLinear,
      largura: r.largura,
      endereco: r.endereco,
    }, settings);
  }
}

const ConferenceCard = memo(({ conf, onDelete, highlight = false }: { conf: Conference; onDelete: () => void; highlight?: boolean }) => {
  const [open, setOpen] = useState(highlight);
  const navigate = useNavigate();
  const startResumeConference = useAppStore(s => s.startResumeConference);
  const labelSettings = useAppStore(s => s.labelSettings);
  const historyAll = useAppStore(s => s.history);
  const merged = conf as MergedConference;
  const isGrouped = (merged._underlyingIds?.length ?? 0) > 1;
  const resolveConfId = (regId: string) => merged._regToConfId?.[regId] || conf.id;
  const resolveResumeTarget = (): Conference => {
    if (!isGrouped) return conf;
    // Para grupos de NF: retoma a conferência primária (mais recente) do grupo.
    // Os novos itens são inseridos nela e o trigger de audit_logs registra tudo em /auditoria.
    const ids = merged._underlyingIds || [];
    const candidates = historyAll.filter(h => ids.includes(h.id));
    candidates.sort((a, b) =>
      new Date(b.finishedAt || b.startedAt || b.date).getTime() -
      new Date(a.finishedAt || a.startedAt || a.date).getTime()
    );
    return candidates[0] || conf;
  };

  const { isGuest, isAdmin } = useAuth();
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Registro | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected(prev => prev.size === conf.registros.length ? new Set() : new Set(conf.registros.map(r => r.id)));
  };

  const handlePrint = async (regs: Registro[]) => {
    if (regs.length === 0) {
      toast.warning('Nenhum item selecionado.');
      return;
    }
    setPrinting(true);
    const tid = toast.loading(`Preparando ${regs.length} etiqueta(s)...`);
    try {
      const items: BatchItem[] = regs.map((r) => {
        const isMotorCtrl = r.modoOrigem === 'motor' || r.modoOrigem === 'controle' || r.tipoTecido === 'Coulisse';
        if (isMotorCtrl) {
          return {
            kind: 'motor',
            input: {
              item: r.item,
              descricao: r.modoOrigem === 'motor' ? 'Motor' : r.modoOrigem === 'controle' ? 'Controle' : 'Coulisse',
              lote: r.lote,
              loteSistema: r.loteSistema,
              nf: r.nf,
              cx: (r as any).caixaNum ?? null,
            },
          };
        }
        return {
          kind: 'tecido',
          input: {
            item: r.item,
            descricao: r.tipoTecido || '',
            lote: r.lote,
            loteSistema: r.loteSistema,
            processo: r.processo,
            nf: r.nf,
            m2: r.m2,
            mLinear: r.mLinear,
            largura: r.largura,
            endereco: r.endereco,
          },
        };
      });
      const { ok, total } = await printLabelsBatch(items, { ...labelSettings, autoPrint: true, printMethod: 'browser' });
      toast.dismiss(tid);
      if (ok === total) toast.success(`${total} etiqueta(s) enviada(s) para impressão em lote.`);
      else if (ok > 0) toast.warning(`${ok}/${total} etiqueta(s) enviadas — verifique o console.`);
      else toast.error('Falha ao imprimir etiquetas.');
    } catch (e) {
      toast.dismiss(tid);
      console.error(e);
      toast.error('Falha ao imprimir etiquetas.');
    } finally {
      setPrinting(false);
    }
  };


  const { isLow } = usePerformance();
  const totalML = useMemo(() => {
    let sum = 0;
    for (let i = 0, len = conf.registros.length; i < len; i++) sum += conf.registros[i].mLinear;
    return sum;
  }, [conf.registros]);
  const columns = useMemo(() => open ? getRegistroColumns(conf.registros, conf.registros[0]?.modoOrigem === 'openrouter' ? 'openrouter' : conf.registros[0]?.modoOrigem === 'diversos' ? 'diversos' : 'manual') : [], [conf.registros, open]);
  const folderName = useMemo(() => getConferenceFolderName(conf), [conf]);
  const modeBadges = useMemo(() => getModeBadges(conf), [conf.registros]);

  const allSelected = selected.size === conf.registros.length && conf.registros.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  const tableContent = (
    <div className="overflow-x-auto custom-scrollbar p-2 sm:p-4 lg:p-8 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={toggleSelectAll}
            aria-label="Selecionar todos"
          />
          <span>{selected.size > 0 ? `${selected.size} selecionado(s)` : 'Selecionar todos'}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={printing || selected.size === 0}
            onClick={() => handlePrint(conf.registros.filter(r => selected.has(r.id)))}
            className="h-9 rounded-md text-xs flex-1 sm:flex-none whitespace-nowrap"
          >
            <Printer className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Imprimir selecionados</span>
            <span className="ml-1">({selected.size})</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={printing || conf.registros.length === 0}
            onClick={() => handlePrint(conf.registros)}
            className="h-9 rounded-md text-xs flex-1 sm:flex-none whitespace-nowrap"
          >
            <Printer className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Imprimir todos</span>
            <span className="ml-1">({conf.registros.length})</span>
          </Button>
        </div>
      </div>
      <div className="rounded-md overflow-hidden border border-border/30 bg-card">
        <table className="w-full text-xs min-w-[520px] sm:min-w-[800px] border-separate border-spacing-0">

          <thead>
            <tr className="bg-muted/40">
              <th className="px-2 sm:px-4 py-2 sm:py-4 border-b border-border/20 w-[40px]"></th>
              {columns.map(column => (
                <th key={column.key} className="px-2 sm:px-6 py-2 sm:py-4 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] border-b border-border/20">{column.shortLabel || column.label}</th>
              ))}
              <th className="px-2 sm:px-6 py-2 sm:py-4 border-b border-border/20 w-[80px] sm:w-[100px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {conf.registros.map((r, i) => (
              <tr key={r.id} className={`group/row hover:bg-primary/5 transition-colors ${selected.has(r.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-2 sm:px-4 py-2 sm:py-4 align-middle">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggleSelect(r.id)}
                    aria-label={`Selecionar ${r.item}`}
                  />
                </td>
                {columns.map(column => (
                  <td key={column.key} className={`px-2 sm:px-6 py-2 sm:py-4 ${column.key === 'item' ? 'font-semibold text-foreground' : 'font-mono text-muted-foreground/90'}`}>
                    {column.key === 'item' ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm tracking-tight">{r.item || '—'}</span>
                        {(() => {
                          const label = r.modoOrigem === 'motor' ? 'Motor'
                            : r.modoOrigem === 'controle' ? 'Controle'
                            : r.modoOrigem === 'madeira' ? 'Madeira'
                            : r.modoOrigem === 'openrouter' ? 'IA Vision'
                            : r.tipoTecido === 'Celular' ? 'Celular/Plissada'
                            : (r.tipoTecido || '').trim() || (r.modoOrigem === 'diversos' ? 'Diversos' : 'Coulisse');
                          return <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide w-fit ${getBadgeClass(label)}`}>{label}</span>;
                        })()}
                      </div>
                    ) : column.key === 'mLinear' ? (
                      <span className="font-semibold text-foreground/80 tabular-nums">{formatMLDisplay(r.mLinear)}</span>
                    ) : column.key === 'm2' ? (
                      <span className="font-bold">{r.m2 > 0 ? r.m2.toFixed(1) : '—'}</span>
                    ) : column.key === 'largura' ? (
                      <span className="font-bold opacity-70">{r.largura > 0 ? `${r.largura.toFixed(2)}m` : '—'}</span>
                    ) : (
                      <span className="opacity-80">{(r as any)[column.key] || '—'}</span>
                    )}
                  </td>
                ))}
                <td className="px-2 sm:px-6 py-2 sm:py-4">
                  <div className="flex items-center justify-end gap-2 opacity-70 hover:opacity-100 transition-opacity duration-150">
                    {!isGuest && (
                      <RequireRole action="edit:registro-antigo" showLocked>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingRegistro(r)}
                              className="h-9 w-9 rounded-md border border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar registro</TooltipContent>
                        </Tooltip>
                      </RequireRole>
                    )}
                    
                    {!isGuest && (
                      <RequireRole action="delete:registro" showLocked>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDeleteItem(r)}
                              className="h-9 w-9 rounded-md border border-border/40 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir item</TooltipContent>
                        </Tooltip>
                      </RequireRole>
                    )}

                    {r.wasEdited && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide cursor-help">
                            Editado
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Editado por {r.editedBy || 'Conferente'}
                          {r.editedAt && ` em ${formatDateBR(r.editedAt)} às ${formatTimeBR(r.editedAt)}`}
                        </TooltipContent>
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        aria-expanded={open}
        className="w-full px-4 py-4 flex items-center gap-3 hover:bg-muted/20 transition-colors duration-150 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-none">{folderName}</span>
                {!conf.finishedAt && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Aberta
                  </span>
                )}
                <div className="flex gap-1 flex-wrap">
                  {modeBadges.map(b => (
                    <span key={b} className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide ${getBadgeClass(b)}`}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground flex-wrap">
                <span className="tabular-nums">{formatDateBR(conf.date)}</span>

                {conf.conferente && (
                  <span className="text-foreground/70">{conf.conferente}</span>
                )}

                {conf.startedAt && (
                  <span className="tabular-nums">
                    {formatTimeBR(conf.startedAt)}
                    {conf.finishedAt && <span className="text-muted-foreground/60"> → {formatTimeBR(conf.finishedAt)}</span>}
                  </span>
                )}

                {conf.startedAt && conf.finishedAt && (() => {
                  const h = getDurationHours(conf.startedAt, conf.finishedAt);
                  const suspect = h > 8;
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`tabular-nums cursor-help ${suspect ? 'font-semibold text-amber-600' : ''}`}>
                          {suspect && '⚠ '}{formatDuration(conf.startedAt, conf.finishedAt)}
                        </span>
                      </TooltipTrigger>
                      {suspect && <TooltipContent>Duração anormal ({h.toFixed(1)}h). Possível sessão esquecida aberta.</TooltipContent>}
                    </Tooltip>
                  );
                })()}

                <span className="tabular-nums">{getSmartCount(conf)}</span>

                {totalML > 0 && (
                  <span className="font-semibold text-foreground tabular-nums">{formatMLDisplay(totalML)}</span>
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
                        const target = resolveResumeTarget();
                        startResumeConference(target);
                        navigate(routeForConference(target));
                      }}
                      className="h-9 rounded-md border-border/40 bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors font-medium text-xs px-3"
                    >
                      <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Incluir item</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isGrouped ? 'Retoma a conferência mais recente deste grupo de NFs. Você pode incluir itens quantas vezes quiser — tudo fica registrado em /auditoria.' : 'Reabrir esta conferência para incluir novos itens'}</TooltipContent>

                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const initial = buildTransferInitialFromConference(conf);
                        if (!initial.itens.length) {
                          toast.warning('Nenhum item válido para transferir.');
                          return;
                        }
                        navigate('/estoque/transferencias', { state: { transferInitial: initial } });
                      }}
                      className="h-9 rounded-md border-border/40 bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors font-medium text-xs px-3"
                    >
                      <ArrowRightLeft className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Transferir</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Criar transferência no Auge com os itens desta pasta (lotes/séries pré-preenchidos)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); downloadConferenceExcel(conf); }}
                      className="h-9 w-9 rounded-md border-border/40 bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar para Excel</TooltipContent>
                </Tooltip>


                {!isGuest && (
                  <RequireRole action="delete:registro" showLocked>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                          className="h-9 w-9 rounded-md border-border/40 bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir conferência</TooltipContent>
                    </Tooltip>
                  </RequireRole>
                )}
              </div>

              <div className={`p-1.5 rounded-md transition-transform duration-150 text-muted-foreground ${open ? 'rotate-180' : ''}`}>
                 <ChevronDown className="w-4 h-4" />

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const deleteHistoryRegistro = useAppStore(s => s.deleteHistoryRegistro);

  const handleDeleteItem = async (registroId: string) => {
    try {
      await deleteHistoryRegistro(resolveConfId(registroId), registroId);
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
        className={`border rounded-md overflow-hidden bg-card hover:bg-muted/30 transition-colors duration-150 group/card ${highlight ? 'border-primary/60 ring-2 ring-primary/30' : 'border-border/50'}`}
      >
        {highlight && (
          <div className="bg-primary/10 text-primary px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2 border-b border-primary/20">
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
        conferenceId={editingRegistro ? resolveConfId(editingRegistro.id) : conf.id}
      />

      <AddHistoryRegistroDialog
        open={isAdding}
        onOpenChange={setIsAdding}
        conferenceId={conf.id}
        isDiversos={conf.registros.some(r => r.modoOrigem === 'diversos')}
        isMotor={conf.registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle')}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md rounded-md p-6 border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-md flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-center">Excluir Histórico?</DialogTitle>
            <DialogDescription className="text-center text-sm font-medium mt-2 leading-relaxed">
              Esta ação removerá permanentemente a conferência <span className="text-foreground font-semibold">"{folderName}"</span> e todos os seus registros do banco de dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <Button variant="outline" className="rounded-md font-bold h-12 w-full" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-md font-semibold h-12 w-full shadow-lg shadow-destructive/20" onClick={() => { onDelete(); setConfirmDelete(false); }}>Excluir Agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteItem} onOpenChange={(o) => { if (!o) setConfirmDeleteItem(null); }}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md rounded-md p-6 border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-md flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-center">Excluir Item?</DialogTitle>
            <DialogDescription className="text-center text-sm font-medium mt-2 leading-relaxed">
              Esta ação removerá permanentemente o registro{' '}
              <span className="text-foreground font-semibold">
                "{confirmDeleteItem?.item || confirmDeleteItem?.lote || confirmDeleteItem?.id || ''}"
              </span>{' '}
              desta conferência. Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <Button variant="outline" className="rounded-md font-bold h-12 w-full" onClick={() => setConfirmDeleteItem(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              className="rounded-md font-semibold h-12 w-full shadow-lg shadow-destructive/20"
              onClick={() => {
                if (confirmDeleteItem) handleDeleteItem(confirmDeleteItem.id);
                setConfirmDeleteItem(null);
              }}
            >
              Excluir Agora
            </Button>
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
  const [showTestData, setShowTestData] = useState(false);
  const [periodo, setPeriodo] = useState<'todos' | '7' | '30' | '90'>('30');
  const [pageSize, setPageSize] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
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

  const { visibleHistory, testCount } = useMemo(() => {
    let testCount = 0;
    const visible: Conference[] = [];
    const now = Date.now();
    const cutoff = periodo === 'todos' ? 0 : now - Number(periodo) * 24 * 60 * 60 * 1000;
    for (const c of history) {
      if (isTestConference(c)) {
        testCount++;
        if (!showTestData) continue;
      }
      if (cutoff) {
        const ref = c.finishedAt || c.startedAt || c.date;
        if (ref && new Date(ref).getTime() < cutoff) continue;
      }
      visible.push(c);
    }
    return { visibleHistory: visible, testCount };
  }, [history, showTestData, periodo]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return visibleHistory;
    
    const result: Conference[] = [];
    for (let i = 0, len = visibleHistory.length; i < len; i++) {
      const c = visibleHistory[i];
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
  }, [visibleHistory, debouncedSearch]);

  const grouped = useMemo(() => groupConferencesByNF(filtered), [filtered]);
  const paged = useMemo(() => grouped.slice(0, pageSize), [grouped, pageSize]);

  // Infinite scroll: auto-load more when sentinel enters viewport
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (grouped.length <= pageSize) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setPageSize(p => p + 20);
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [grouped.length, pageSize]);

  useEffect(() => { setPageSize(20); }, [debouncedSearch, periodo, showTestData]);

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
          <p className="font-semibold text-foreground text-sm animate-pulse">Sincronizando Histórico</p>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider opacity-60">Carregando dados do servidor...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-3 sm:p-6 lg:p-10 space-y-4 sm:space-y-8 flex-shrink-0">
        <PageHeader
          title="Histórico de conferências"
          subtitle="Conferências finalizadas por data e conferente."
          actions={
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[180px] lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" strokeWidth={1.75} />
                <Input
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder="Pesquisar por item, conferente ou NF..."
                  className="pl-9 h-9 rounded-md border-border/40 bg-card/50 text-sm w-full"
                />
              </div>
              <select
                value={periodo}
                onChange={e => setPeriodo(e.target.value as any)}
                className="h-9 rounded-md border border-border/40 bg-card/50 px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="todos">Todo período</option>
              </select>
              {testCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showTestData ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowTestData(v => !v)}
                      className="h-9 rounded-md px-2.5 text-xs font-medium shrink-0"
                    >
                      {showTestData ? 'Ocultar' : 'Mostrar'} testes ({testCount})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Conferências marcadas como dados de teste</TooltipContent>
                </Tooltip>
              )}
              {history.length > 0 && !isGuest && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowClearConfirm(true)}
                      className="h-9 w-9 rounded-md border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Limpar todo o histórico</TooltipContent>
                </Tooltip>
              )}
            </div>
          }
        />



        {historyError && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-destructive font-bold text-sm">
              <span>⚠️ {historyError}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => loadHistory()} className="h-8 rounded-lg font-semibold uppercase text-[10px] hover:bg-destructive/10 text-destructive">Tentar Novamente</Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 custom-scrollbar">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 max-w-[1400px] mx-auto pb-8">
            <AnimatePresence mode="popLayout">
              {paged.map((conf, index) => (
                <motion.div
                  key={conf.id}
                  initial={isLow ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={isLow ? { duration: 0 } : { delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                >
                  <ConferenceCard 
                    conf={conf} 
                    onDelete={async () => {
                      const ids = (conf as MergedConference)._underlyingIds || [conf.id];
                      for (const id of ids) await deleteConference(id);
                    }}
                    highlight={(conf as MergedConference)._underlyingIds ? (conf as MergedConference)._underlyingIds!.includes(highlightId || '') : conf.id === highlightId}
                  />

                </motion.div>
              ))}
            </AnimatePresence>
            {grouped.length > paged.length && (
              <div ref={loadMoreRef} className="flex flex-col items-center gap-2 py-6">
                <p className="text-sm text-muted-foreground tabular-nums">
                  Exibindo <span className="font-semibold text-foreground">{paged.length}</span> de <span className="font-semibold text-foreground">{grouped.length}</span>
                </p>
                <Button variant="outline" onClick={() => setPageSize(p => p + 20)} className="rounded-md font-medium text-sm h-10 px-4">
                  Carregar mais
                </Button>
              </div>
            )}
          </div>

        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-md bg-muted/30 flex items-center justify-center mb-4">
              <FolderOpen className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {localSearch
                ? `Nenhum registro para "${localSearch}".`
                : 'Suas conferências finalizadas aparecerão aqui.'}
            </p>
          </div>
        )}

      </div>

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="max-w-sm rounded-md border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-2">
            <DialogTitle className="text-lg font-semibold tracking-tight text-center">Limpar Tudo?</DialogTitle>
            <DialogDescription className="font-bold text-sm leading-relaxed mt-2 text-muted-foreground text-center">
              Você está prestes a remover permanentemente <span className="text-destructive font-semibold">{history.length} conferências</span>. Esta ação limpará todo o banco de dados histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-2 gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-md font-bold h-12" onClick={() => setShowClearConfirm(false)}>Manter Dados</Button>
            <Button variant="destructive" className="flex-1 rounded-md font-semibold h-12 shadow-lg shadow-destructive/20" onClick={handleClear}>Limpar Tudo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
