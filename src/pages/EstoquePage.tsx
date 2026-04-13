import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Layers, ArrowRightLeft, Trash2, ChevronRight, Box, Grid3X3, Info, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

function formatDateBR(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EstoquePage() {
  const activeTec = useAppStore(s => s.formData.estoqueActiveTec);
  const setFormData = useAppStore(s => s.setFormData);
  const setActiveTec = (val: string) => setFormData({ estoqueActiveTec: val });

  const [allPosicoes, setAllPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const loadPosicoes = async () => {
    setLoading(true);
    const { data: allData, error } = await supabase.from('estoque_posicoes').select('*');
    if (!error && allData) {
      setAllPosicoes(allData as Posicao[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadPosicoes(); }, []);

  const posicoes = useMemo(() => {
    return allPosicoes.filter(p => p.estrutura === activeTec);
  }, [allPosicoes, activeTec]);

  const stats = useMemo(() => {
    const totalSlots = Object.values(TEC_CONFIG).reduce((acc, c) => acc + c.cols.length * c.levels * 30, 0);
    let occupied = 0, blocked = 0, reserved = 0, exited = 0;
    
    for (let i = 0, len = allPosicoes.length; i < len; i++) {
      const p = allPosicoes[i];
      const status = p.status;
      if (status === 'ocupado') occupied++;
      else if (status === 'bloqueado') blocked++;
      else if (status === 'reservado') reserved++;
      else if (status === 'saida') exited++;
    }
    
    const free = totalSlots - occupied - blocked - reserved - exited;
    return { totalSlots, occupied, blocked, reserved, exited, free };
  }, [allPosicoes]);

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
      if (!confirm('Dar saída neste tecido? Isso removerá o item do estoque e arquivará o registro.')) return;
      
      const { error: saError } = await supabase.from('estoque_saidas').insert({
        registro_id: pos.id, item: pos.item, proc: pos.proc, m2: pos.m2, largura: pos.largura, m_linear: pos.m_linear,
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
      return;
    }

    const { error } = await supabase.from('estoque_posicoes').update({ status: newStatus } as any).eq('id', pos.id);
    if (error) toast.error('Erro ao atualizar status');
    else {
      toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label}`);
      loadPosicoes();
    }
  };

  const handleDelete = async (pos: Posicao) => {
    if (!confirm('Deseja excluir este item do espaço?')) return;
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

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0"
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
          <Layers className="w-3.5 h-3.5" />
          <span>Gestão de Armazém</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">Estoque</h1>
        <p className="text-muted-foreground text-sm font-medium">Controle de posições e níveis das estruturas TEC.</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.totalSlots, config: { color: 'text-foreground', bg: 'bg-card/40', border: 'border-border/30' } },
          { label: 'Ocupado', value: stats.occupied, config: STATUS_CONFIG.ocupado },
          { label: 'Reservado', value: stats.reserved, config: STATUS_CONFIG.reservado },
          { label: 'Bloqueado', value: stats.blocked, config: STATUS_CONFIG.bloqueado },
          { label: 'Livre', value: stats.free, config: { color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' } },
        ].map(s => (
          <Card key={s.label} className={`border ${s.config.border} ${s.config.bg} backdrop-blur-sm shadow-none hover:scale-[1.02] transition-all duration-300 cursor-default`}>
            <CardContent className="p-4 text-center space-y-1">
              <div className={`text-2xl sm:text-3xl font-black tabular-nums ${s.config.color}`}>{s.value}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TEC Tabs */}
      <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/30">
        {Object.keys(TEC_CONFIG).map(tec => (
          <button 
            key={tec} 
            onClick={() => setActiveTec(tec)} 
            className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-wide transition-all duration-200 ${
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
          <div className="min-w-full space-y-1.5">
            {/* Column headers */}
            <div className="flex gap-1.5">
              <div className="w-10 sm:w-14 shrink-0" />
              {config.cols.map(col => (
                <div key={col} className="flex-1 text-center text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest py-1">
                  Col {col}
                </div>
              ))}
            </div>
            {Array.from({ length: config.levels }, (_, i) => config.levels - i).map(nivel => (
              <div key={nivel} className="flex gap-1.5">
                <div className="w-10 sm:w-14 text-[8px] sm:text-[10px] font-black text-muted-foreground/60 flex items-center justify-center bg-muted/10 rounded-lg shrink-0 border border-border/20">
                  N{String(nivel).padStart(2, '0')}
                </div>
                {config.cols.map(col => {
                  const items = cellMap[`${col}-${nivel}`] || [];
                  const fillPercent = Math.round((items.length / 30) * 100);
                  return (
                    <div 
                      key={col} 
                      onClick={() => setSelectedCell({ col, nivel })} 
                      className="flex-1 h-16 sm:h-[4.5rem] border border-border/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 p-2 sm:p-2.5 transition-all duration-200 group relative overflow-hidden"
                    >
                      {/* Fill bar */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-primary/8 transition-all duration-500" 
                        style={{ height: `${fillPercent}%` }} 
                      />
                      <div className="relative z-10">
                        <div className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tight text-muted-foreground/50 group-hover:text-primary/60 transition-colors">
                          {col}·N{nivel}
                        </div>
                        <div className="text-sm sm:text-base font-black text-foreground mt-0.5">
                          {items.length}
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground/40 font-semibold ml-0.5">/30</span>
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border-border/40 bg-card/95 backdrop-blur-xl overflow-hidden rounded-2xl">
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
                  <Badge variant="outline" className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                    occupiedCount === 0 ? 'border-primary/30 text-primary bg-primary/5' :
                    occupiedCount >= 25 ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                    'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  }`}>
                    {occupiedCount === 0 ? 'Vazio' : occupiedCount >= 25 ? 'Quase Cheio' : `${Math.round((occupiedCount/30)*100)}%`}
                  </Badge>
                </div>
                {/* Occupation bar */}
                <div className="mt-4 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(occupiedCount/30)*100}%` }} 
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
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
                    
                    return (
                      <motion.button
                        key={pos}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: pos * 0.012, duration: 0.2 }}
                        onClick={() => item && setDetailPos(item)}
                        disabled={!item}
                        className={`relative h-14 sm:h-16 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-0.5 group ${
                          item 
                            ? `${statusCfg!.bg} ${statusCfg!.border} cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95` 
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
                      </motion.button>
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
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 border-border/40 bg-card/95 backdrop-blur-xl overflow-hidden rounded-2xl">
          {detailPos && (() => {
            const statusCfg = STATUS_CONFIG[detailPos.status] || STATUS_CONFIG.livre;
            return (
              <>
                {/* Detail Header */}
                <div className="px-5 sm:px-7 pt-6 pb-4 border-b border-border/20 bg-muted/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-lg font-black tracking-tight truncate">
                          {detailPos.item || 'Item sem nome'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                          Posição {String(detailPos.posicao).padStart(2, '0')} · {detailPos.estrutura} · Col {detailPos.coluna} · N{String(detailPos.nivel).padStart(2, '0')}
                        </DialogDescription>
                      </div>
                    </div>
                    <Badge className={`text-[9px] font-black px-2.5 py-1 rounded-lg border shrink-0 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} bg-transparent`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="px-5 sm:px-7 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Lote', value: detailPos.lote || '—' },
                      { label: 'Lote Sistema', value: detailPos.lote_sistema || '—' },
                      { label: 'Endereço', value: detailPos.endereco || '—' },
                      { label: 'Conferente', value: detailPos.conferente_entrada || '—' },
                      { label: 'M²', value: detailPos.m2 ? `${detailPos.m2}` : '—' },
                      { label: 'Largura', value: detailPos.largura ? `${detailPos.largura}` : '—' },
                      { label: 'M Linear', value: detailPos.m_linear ? `${detailPos.m_linear}` : '—' },
                      { label: 'Data Entrada', value: formatDateBR(detailPos.data_registro) },
                    ].map(f => (
                      <div key={f.label} className="bg-muted/15 border border-border/15 rounded-lg p-3">
                        <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">{f.label}</div>
                        <div className="text-sm font-bold text-foreground mt-0.5 truncate">{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Alterar Status</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['ocupado', 'reservado', 'bloqueado'] as const).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const isActive = detailPos.status === st;
                        return (
                          <Button 
                            key={st} 
                            onClick={() => handleStatusChange(detailPos, st)} 
                            variant="outline"
                            className={`h-10 text-xs font-bold rounded-xl border transition-all ${
                              isActive 
                                ? `${cfg.bg} ${cfg.border} ${cfg.color}` 
                                : 'border-border/30 text-muted-foreground hover:bg-muted/30'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              st === 'ocupado' ? 'bg-emerald-400' :
                              st === 'bloqueado' ? 'bg-red-400' : 'bg-amber-400'
                            }`} />
                            {cfg.label}
                          </Button>
                        );
                      })}
                      <Button 
                        onClick={() => handleStatusChange(detailPos, 'saida')} 
                        variant="outline"
                        className="h-10 text-xs font-bold rounded-xl border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all"
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
                      className="w-full h-10 text-xs font-bold rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
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
    </motion.div>
  );
}
