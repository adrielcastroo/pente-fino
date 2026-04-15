import { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Package, MapPin, Layers, ArrowRightLeft, Trash2, ChevronRight, Box, Grid3X3, Info, LogOut, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePerformance } from '@/hooks/use-performance';
import ImportDialog from '@/components/estoque/ImportDialog';

interface Posicao {
  id: string;
  estrutura: string;
  coluna: string;
  nivel: number;
  posicao: number;
  status: string;
  item: string;
  proc: string;
  m2: number;
  largura: number;
  m_linear: number;
  lote: string;
  endereco: string;
  lote_sistema: string;
  conferente_entrada: string;
  conferente_saida: string;
  data_registro: string | null;
  data_saida: string | null;
  registro_id: string | null;
}

const TEC_CONFIG: Record<string, { cols: string[]; levels: number }> = {
  TEC00: { cols: ['A', 'B'], levels: 9 },
  TEC01: { cols: ['A', 'B', 'C', 'D', 'E', 'F'], levels: 5 },
  TEC02: { cols: ['A', 'B'], levels: 4 },
  TEC03: { cols: ['A', 'B'], levels: 9 },
  TEC04: { cols: ['A', 'B', 'C'], levels: 5 },
  TEC05: { cols: ['A', 'B', 'C'], levels: 5 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ocupado: { label: 'Ocupado', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  bloqueado: { label: 'Bloqueado', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  reservado: { label: 'Reservado', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  saida: { label: 'Saída', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  livre: { label: 'Livre', color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border/30' },
};

// Reuse centralized formatter
import { formatDateBR } from '@/lib/app-utils';

export default function EstoquePage() {
  const activeTec = useAppStore(s => s.formData.estoqueActiveTec);
  const setFormData = useAppStore(s => s.setFormData);
  const setActiveTec = (val: string) => setFormData({ estoqueActiveTec: val });

  const [allPosicoes, setAllPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [confirmSaida, setConfirmSaida] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { isLow } = usePerformance();

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const loadPosicoes = async () => {
    setLoading(true);
    try {
      // Fetch all pages to avoid Supabase's default 1000-row limit
      const allData: Posicao[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('estoque_posicoes')
          .select('id,estrutura,coluna,nivel,posicao,status,item,proc,m2,largura,m_linear,lote,endereco,lote_sistema,conferente_entrada,conferente_saida,data_registro,data_saida,registro_id')
          .range(from, from + PAGE_SIZE - 1);
        
        if (error) {
          console.error('Erro ao carregar posições:', error);
          toast.error('Erro ao carregar dados do estoque');
          break;
        }
        
        if (data && data.length > 0) {
          allData.push(...(data as Posicao[]));
          from += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }
      
      setAllPosicoes(allData);
    } catch (e) {
      console.error('Erro ao carregar estoque:', e);
      toast.error('Erro inesperado ao carregar estoque');
    }
    setLoading(false);
  };

  useEffect(() => { loadPosicoes(); }, []);

  const posicoes = useMemo(() => {
    return allPosicoes.filter(p => p.estrutura === activeTec);
  }, [allPosicoes, activeTec]);

  // Pre-computed constant - no need for useMemo
  const totalSlots = 3120; // Pre-computed: sum of cols*levels*30 across TEC_CONFIG

  const stats = useMemo(() => {
    let occupied = 0, blocked = 0, reserved = 0, exited = 0;
    
    for (let i = 0, len = allPosicoes.length; i < len; i++) {
      const status = allPosicoes[i].status;
      if (status === 'ocupado') occupied++;
      else if (status === 'bloqueado') blocked++;
      else if (status === 'reservado') reserved++;
      else if (status === 'saida') exited++;
    }
    
    const free = totalSlots - occupied - blocked - reserved - exited;
    return { totalSlots, occupied, blocked, reserved, exited, free };
  }, [allPosicoes, totalSlots]);

  const cellMap = useMemo(() => {
    const map: Record<string, Posicao[]> = {};
    for (let i = 0, len = posicoes.length; i < len; i++) {
      const p = posicoes[i];
      const key = `${p.coluna}-${p.nivel}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [posicoes]);


  const handleStatusChange = async (pos: Posicao, newStatus: string) => {
    if (newStatus === 'saida') {
      setConfirmSaida(true);
      return;
    }

    const { error } = await supabase.from('estoque_posicoes').update({ status: newStatus } as any).eq('id', pos.id);
    if (error) toast.error('Erro ao atualizar status', { id: 'status-update' });
    else {
      toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label}`, { id: 'status-update' });
      setDetailPos(prev => prev ? { ...prev, status: newStatus } : null);
      loadPosicoes();
    }
  };

  const executeSaida = async (pos: Posicao) => {
    const { error: saError } = await supabase.from('estoque_saidas').insert({
      registro_id: pos.registro_id || pos.id, item: pos.item, proc: pos.proc, m2: pos.m2, largura: pos.largura, m_linear: pos.m_linear,
      lote: pos.lote, endereco: pos.endereco, lote_sistema: pos.lote_sistema, estrutura: pos.estrutura,
      coluna: pos.coluna, nivel: pos.nivel, posicao: pos.posicao, conferente_entrada: pos.conferente_entrada,
      conferente_saida: useAppStore.getState().conferente || 'Sistema',
      data_registro: pos.data_registro, data_saida: new Date().toISOString()
    });
    if (saError) return toast.error('Erro ao arquivar');

    const { error: delError } = await supabase.from('estoque_posicoes').delete().eq('id', pos.id);
    if (delError) return toast.error('Erro ao remover do estoque');
    
    setDetailPos(null);
    loadPosicoes();
    toast.success('Saída realizada com sucesso');
  };

  const handleDelete = async (pos: Posicao) => {
    setConfirmDelete(true);
  };

  const executeDelete = async (pos: Posicao) => {
    const { error } = await supabase.from('estoque_posicoes').delete().eq('id', pos.id);
    if (error) toast.error('Erro ao excluir');
    else {
      setDetailPos(null);
      loadPosicoes();
      toast.success('Item excluído');
    }
  };

  const selectedCellItems = selectedCell ? (cellMap[`${selectedCell.col}-${selectedCell.nivel}`] || []) : [];
  const occupiedCount = selectedCellItems.length;

  const getTooltipSide = (pos: number): 'top' | 'bottom' | 'left' | 'right' => {
    const colIndex = (pos - 1) % 6;
    if (colIndex <= 1) return 'right';
    if (colIndex >= 4) return 'left';
    return 'top';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Layers className="w-3.5 h-3.5" />
            <span>Gestão de Armazém</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">Estoque</h1>
          <p className="text-muted-foreground text-sm font-medium">Controle de posições e níveis das estruturas TEC.</p>
        </div>
        <Button onClick={() => setImportOpen(true)} variant="outline" className="shrink-0 h-10 sm:h-11 px-4 font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Importar</span>
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { key: 'total', label: 'Total', value: stats.totalSlots, percent: 100, config: { color: 'text-foreground', bg: 'bg-card/40', border: 'border-border/30' } },
          { key: 'ocupado', label: 'Ocupado', value: stats.occupied, percent: stats.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0, config: STATUS_CONFIG.ocupado },
          { key: 'reservado', label: 'Reservado', value: stats.reserved, percent: stats.totalSlots ? Math.round((stats.reserved / stats.totalSlots) * 100) : 0, config: STATUS_CONFIG.reservado },
          { key: 'bloqueado', label: 'Bloqueado', value: stats.blocked, percent: stats.totalSlots ? Math.round((stats.blocked / stats.totalSlots) * 100) : 0, config: STATUS_CONFIG.bloqueado },
          { key: 'livre', label: 'Livre', value: stats.free, percent: stats.totalSlots ? Math.round((stats.free / stats.totalSlots) * 100) : 0, config: { color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' } },
        ].map(s => (
          <Card 
            key={s.label} 
            onClick={() => setSelectedStat(s.key)}
            className={`border ${s.config.border} ${s.config.bg} shadow-none hover:scale-[1.02] transition-all duration-150 cursor-pointer hover:shadow-md`}
          >
            <CardContent className="p-4 text-center space-y-1">
              <div className={`text-2xl sm:text-3xl font-black tabular-nums ${s.config.color}`}>{s.value}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{s.label}</div>
              <div className="text-[10px] font-semibold text-muted-foreground/70">{s.percent}%</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TEC Tabs */}
      <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/30 overflow-x-auto custom-scrollbar">
        {Object.keys(TEC_CONFIG).map(tec => (
          <button 
            key={tec} 
            onClick={() => setActiveTec(tec)} 
            className={`flex-1 min-w-[56px] py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-black tracking-wide transition-all duration-200 ${
              activeTec === tec 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tec}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-semibold">Carregando...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-full space-y-1 sm:space-y-1.5">
            {/* Column headers */}
            <div className="flex gap-1 sm:gap-1.5">
              <div className="w-8 sm:w-10 md:w-14 shrink-0" />
              {config.cols.map(col => (
                <div key={col} className="flex-1 text-center text-[7px] sm:text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest py-1">
                  {col}
                </div>
              ))}
            </div>
            {Array.from({ length: config.levels }, (_, i) => config.levels - i).map(nivel => (
              <div key={nivel} className="flex gap-1 sm:gap-1.5">
                <div className="w-8 sm:w-10 md:w-14 text-[7px] sm:text-[8px] md:text-[10px] font-black text-muted-foreground flex items-center justify-center bg-muted/40 dark:bg-muted/20 rounded-md sm:rounded-lg shrink-0 border border-border/40 dark:border-border/30">
                  N{String(nivel).padStart(2, '0')}
                </div>
                {config.cols.map(col => {
                  const items = cellMap[`${col}-${nivel}`] || [];
                  const fillPercent = Math.round((items.length / 30) * 100);
                  const hasItems = items.length > 0;
                  return (
                    <div 
                      key={col} 
                      onClick={() => setSelectedCell({ col, nivel })} 
                      className={`flex-1 min-w-0 h-12 sm:h-16 md:h-[4.5rem] rounded-lg sm:rounded-xl cursor-pointer p-1.5 sm:p-2 md:p-2.5 transition-colors duration-150 group relative overflow-hidden border ${
                        hasItems
                          ? 'bg-accent/60 dark:bg-accent/20 border-border/50 dark:border-border/40 hover:border-primary/60 hover:bg-primary/10'
                          : 'bg-muted/30 dark:bg-muted/10 border-border/40 dark:border-border/25 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {/* Fill bar */}
                      {hasItems && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-primary/10 dark:bg-primary/8" 
                          style={{ height: `${fillPercent}%` }} 
                        />
                      )}
                      <div className="relative z-10">
                        <div className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tight text-muted-foreground/70 dark:text-muted-foreground/50 group-hover:text-primary transition-colors">
                          {col}-N{nivel}
                        </div>
                        <div className="text-sm sm:text-base font-black text-foreground mt-0.5">
                          {items.length}
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground/60 dark:text-muted-foreground/40 font-semibold ml-0.5">/30</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== POSITIONS GRID DIALOG ===== */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border-border/40 bg-card/95  overflow-hidden rounded-2xl">
          {selectedCell && (
            <>
              {/* Dialog Header */}
              <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/20 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Grid3X3 className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg sm:text-xl font-black tracking-tight">
                        {activeTec} · Coluna {selectedCell.col} · Nível {String(selectedCell.nivel).padStart(2, '0')}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                        {occupiedCount} de 30 posições ocupadas
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-black px-2.5 py-1 rounded-lg border mr-14 ${
                    occupiedCount === 0 ? 'border-primary/30 text-primary bg-primary/5' :
                    occupiedCount >= 25 ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                    'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  }`}>
                    {occupiedCount === 0 ? 'Vazio' : occupiedCount >= 25 ? 'Quase Cheio' : `${Math.round((occupiedCount/30)*100)}%`}
                  </Badge>
                </div>
                {/* Occupation bar */}
                <div className="mt-4 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div 
                    style={{ width: `${(occupiedCount/30)*100}%` }}
                    className={`h-full rounded-full transition-all ${
                      occupiedCount >= 25 ? 'bg-red-500' : occupiedCount >= 15 ? 'bg-amber-500' : 'bg-primary'
                    }`} 
                  />
                </div>
              </div>

              {/* Positions Grid */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-2.5">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(pos => {
                    const item = selectedCellItems.find(p => p.posicao === pos);
                    const statusCfg = item ? STATUS_CONFIG[item.status] || STATUS_CONFIG.livre : null;
                    
                    const posButton = (
                      <button
                        key={pos}
                        onClick={() => item && setDetailPos(item)}
                        disabled={!item}
                        className={`relative h-14 sm:h-16 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 group ${
                          item 
                            ? `${statusCfg!.bg} ${statusCfg!.border} cursor-pointer hover:shadow-md active:scale-[0.97]` 
                            : 'bg-muted/10 border-border/20 cursor-default opacity-50'
                        }`}
                      >
                        <span className={`text-sm sm:text-base font-black tabular-nums ${item ? statusCfg!.color : 'text-muted-foreground/40'}`}>
                          {String(pos).padStart(2, '0')}
                        </span>
                        {item && (
                          <span className="text-[7px] sm:text-[8px] font-bold text-muted-foreground/60 truncate max-w-[90%] leading-none">
                            {item.item?.slice(0, 10) || '—'}
                          </span>
                        )}
                        {item && (
                          <div className="absolute top-1 right-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'ocupado' ? 'bg-emerald-400' :
                              item.status === 'bloqueado' ? 'bg-red-400' :
                              item.status === 'reservado' ? 'bg-amber-400' :
                              'bg-violet-400'
                            }`} />
                          </div>
                        )}
                      </button>
                    );

                    if (!item) return posButton;

                    return (
                      <Tooltip key={pos} delayDuration={200}>
                        <TooltipTrigger asChild>
                          {posButton}
                        </TooltipTrigger>
                        <TooltipContent side={getTooltipSide(pos)} align="center" sideOffset={6} avoidCollisions collisionPadding={16} className="bg-card border border-border/40 rounded-lg px-2.5 py-1.5 shadow-xl w-[180px] max-w-[calc(100vw-2rem)] z-[100] text-left">
                          <div className="flex flex-col gap-0.5 text-[10px] font-bold leading-tight">
                            <span className="text-foreground break-words whitespace-normal">{item.item || '—'}</span>
                            <span className="text-muted-foreground break-words whitespace-normal">{item.lote_sistema || '—'}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-5 pt-4 border-t border-border/15 flex flex-wrap items-center gap-4 justify-center">
                  {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'livre').map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        key === 'ocupado' ? 'bg-emerald-400' :
                        key === 'bloqueado' ? 'bg-red-400' :
                        key === 'reservado' ? 'bg-amber-400' : 'bg-violet-400'
                      }`} />
                      <span className="text-[10px] font-semibold text-muted-foreground">{cfg.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20 border border-border/30" />
                    <span className="text-[10px] font-semibold text-muted-foreground">Livre</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={!!detailPos} onOpenChange={() => setDetailPos(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
          {detailPos && (() => {
            const statusCfg = STATUS_CONFIG[detailPos.status] || STATUS_CONFIG.livre;
            return (
              <>
                {/* Detail Header */}
                <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border/20 bg-muted/20">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-sm sm:text-lg font-black tracking-tight truncate leading-snug">
                        {detailPos.item || 'Item sem nome'}
                      </DialogTitle>
                      <DialogDescription className="text-[10px] sm:text-sm text-muted-foreground font-medium mt-0.5">
                        Pos {String(detailPos.posicao).padStart(2, '0')} · {detailPos.estrutura} · Col {detailPos.coluna} · N{String(detailPos.nivel).padStart(2, '0')}
                      </DialogDescription>
                    </div>
                    <Badge className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border shrink-0 mr-14 sm:mr-12 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} bg-transparent`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {[
                      { label: 'Lote', value: detailPos.lote || '—' },
                      { label: 'Lote Sistema', value: detailPos.lote_sistema || '—' },
                      { label: 'Endereço', value: detailPos.endereco || '—' },
                      { label: 'Conferente', value: detailPos.conferente_entrada || '—' },
                      { label: 'M²', value: detailPos.m2 != null ? `${detailPos.m2}` : '—' },
                      { label: 'Largura', value: detailPos.largura != null ? `${detailPos.largura}` : '—' },
                      { label: 'M Linear', value: detailPos.m_linear != null ? `${detailPos.m_linear}` : '—' },
                      { label: 'Data Entrada', value: formatDateBR(detailPos.data_registro) },
                    ].map(f => (
                      <div key={f.label} className="bg-muted/15 border border-border/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5">
                        <div className="text-[8px] sm:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">{f.label}</div>
                        <div className="text-[11px] sm:text-base font-bold text-foreground mt-0.5 sm:mt-1 break-all leading-snug">{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">Alterar Status</div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {(['ocupado', 'reservado', 'bloqueado'] as const).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const isActive = detailPos.status === st;
                        const dotColor = st === 'ocupado' ? 'bg-emerald-400' : st === 'bloqueado' ? 'bg-red-400' : 'bg-amber-400';
                        const activeRing = st === 'ocupado' ? 'ring-emerald-500/30' : st === 'bloqueado' ? 'ring-red-500/30' : 'ring-amber-500/30';
                        const activeBg = st === 'ocupado' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-500' 
                          : st === 'bloqueado' ? 'bg-red-500/15 border-red-500/50 text-red-500' 
                          : 'bg-amber-500/15 border-amber-500/50 text-amber-500';
                        const hoverBg = st === 'ocupado' ? 'hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-500' 
                          : st === 'bloqueado' ? 'hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500' 
                          : 'hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-500';
                        return (
                          <Button 
                            key={st} 
                            onClick={() => handleStatusChange(detailPos, st)} 
                            variant="outline"
                            className={`h-9 sm:h-11 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                              isActive 
                                ? `${activeBg} ring-2 ${activeRing} ring-offset-1 ring-offset-card shadow-sm pointer-events-none` 
                                : `border-border/20 text-muted-foreground ${hoverBg} active:scale-[0.97]`
                            }`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-full mr-2 ${dotColor} ${isActive ? 'animate-pulse' : ''}`} 
                              style={isActive ? { boxShadow: `0 0 8px ${st === 'ocupado' ? '#34d399' : st === 'bloqueado' ? '#f87171' : '#fbbf24'}` } : {}}
                            />
                            {cfg.label}
                            {isActive && <span className="ml-1.5 text-[10px] font-bold opacity-80">✓</span>}
                          </Button>
                        );
                      })}
                      <Button 
                        onClick={() => handleStatusChange(detailPos, 'saida')} 
                        variant="outline"
                        className="h-9 sm:h-11 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl border-2 border-border/20 text-muted-foreground hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-500 transition-all duration-200 active:scale-[0.97] focus-visible:ring-0 focus-visible:ring-offset-0"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Dar Saída
                      </Button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-3 border-t border-border/15">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDelete(detailPos)} 
                      className="w-full h-9 sm:h-11 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Excluir Item
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== STAT DETAIL DIALOG ===== */}
      <Dialog open={!!selectedStat} onOpenChange={() => setSelectedStat(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl">
          {selectedStat && (() => {
            const statItems: { label: string; value: number; percent: number; color: string }[] = [
              { label: 'Total', value: stats.totalSlots, percent: 100, color: 'text-foreground' },
              { label: 'Ocupado', value: stats.occupied, percent: stats.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0, color: 'text-emerald-500' },
              { label: 'Reservado', value: stats.reserved, percent: stats.totalSlots ? Math.round((stats.reserved / stats.totalSlots) * 100) : 0, color: 'text-amber-500' },
              { label: 'Bloqueado', value: stats.blocked, percent: stats.totalSlots ? Math.round((stats.blocked / stats.totalSlots) * 100) : 0, color: 'text-red-500' },
              { label: 'Livre', value: stats.free, percent: stats.totalSlots ? Math.round((stats.free / stats.totalSlots) * 100) : 0, color: 'text-primary' },
            ];
            const current = statItems.find(s => s.label.toLowerCase() === selectedStat) || statItems[0];

            // Per-TEC breakdown
            const tecBreakdown = Object.entries(TEC_CONFIG).map(([tec, cfg]) => {
              const tecPosicoes = allPosicoes.filter(p => p.estrutura === tec);
              const totalForTec = cfg.cols.length * cfg.levels * 30;
              let val = 0;
              if (selectedStat === 'total') val = totalForTec;
              else if (selectedStat === 'livre') val = totalForTec - tecPosicoes.length;
              else val = tecPosicoes.filter(p => p.status === selectedStat).length;
              return { tec, value: val, total: totalForTec, percent: totalForTec ? Math.round((val / totalForTec) * 100) : 0 };
            });

            return (
              <>
                <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/20 bg-muted/20">
                  <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-3">
                    <div className={`text-3xl font-black tabular-nums ${current.color}`}>{current.value}</div>
                    <div>
                      <div className="text-base font-black">{current.label}</div>
                      <DialogDescription className="text-xs text-muted-foreground font-medium">{current.percent}% do total de posições</DialogDescription>
                    </div>
                  </DialogTitle>
                </div>
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Bar Chart */}
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Por Estrutura</div>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tecBreakdown} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                          <XAxis dataKey="tec" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <ChartTooltip
                            cursor={false}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                            formatter={(value: number, _name: string, props: any) => [`${value}/${props.payload.total} (${props.payload.percent}%)`, current.label]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={current.color.replace('text-', '').replace('foreground', 'hsl(var(--foreground))').replace('emerald-500', 'hsl(160, 84%, 39%)').replace('amber-500', 'hsl(38, 92%, 50%)').replace('red-500', 'hsl(0, 84%, 60%)').replace('primary', 'hsl(var(--primary))')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Mini Pie */}
                  <div className="flex items-center gap-4">
                    <div className="w-[80px] h-[80px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tecBreakdown.filter(t => t.value > 0)}
                            dataKey="value"
                            nameKey="tec"
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={36}
                            strokeWidth={0}
                          >
                            {tecBreakdown.filter(t => t.value > 0).map((_, i) => (
                              <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.15})`} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {tecBreakdown.map((t, i) => (
                        <div key={t.tec} className="flex items-center gap-1.5 text-[10px]">
                          <div className="w-2 h-2 rounded-full" style={{ background: `hsl(var(--primary) / ${1 - i * 0.15})` }} />
                          <span className="font-bold">{t.tec}</span>
                          <span className="text-muted-foreground">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmação Dar Saída */}
      <AlertDialog open={confirmSaida} onOpenChange={setConfirmSaida}>
        <AlertDialogContent className="border-border/40 bg-card rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black">Confirmar Saída</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Isso removerá o item do estoque e arquivará o registro. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-violet-600 hover:bg-violet-700" onClick={() => { if (detailPos) executeSaida(detailPos); }}>
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação Excluir */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-border/40 bg-card rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black">Excluir Item</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Deseja excluir este item do espaço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => { if (detailPos) executeDelete(detailPos); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImportComplete={loadPosicoes} />
    </div>
  );
}
