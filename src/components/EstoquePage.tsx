import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, Upload, Download, Eye, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

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

const STATUS_COLORS: Record<string, string> = {
  ocupado: '#10b981',
  bloqueado: '#ef4444',
  reservado: '#f59e0b',
  saida: '#8b5cf6',
  livre: '#1e2a3f',
};

const STATUS_LABELS: Record<string, string> = {
  ocupado: 'Ocupado',
  bloqueado: 'Bloqueado',
  reservado: 'Reservado',
  saida: 'Saída',
  livre: 'Livre',
};

function formatDateBR(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EstoquePage() {
  const activeTec = useAppStore(s => s.formData.estoqueActiveTec);
  const search = useAppStore(s => s.formData.estoqueSearch);
  const highlightStatus = useAppStore(s => s.formData.estoqueHighlightStatus);
  const setFormData = useAppStore(s => s.setFormData);

  const setActiveTec = (val: string) => setFormData({ estoqueActiveTec: val });
  const setSearch = (val: string) => setFormData({ estoqueSearch: val });
  const setHighlightStatus = (val: string | null) => setFormData({ estoqueHighlightStatus: val });

  
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const loadPosicoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estoque_posicoes')
        .select('id, estrutura, coluna, nivel, posicao, status, item, proc, m2, largura, m_linear, lote, endereco, lote_sistema, conferente_saida, data_registro, data_saida')
        .eq('estrutura', activeTec)
        .order('coluna')
        .order('nivel')
        .order('posicao');
      
      if (error) throw error;
      setPosicoes((data as Posicao[]) || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosicoes();
  }, [activeTec]);

  // Compute stats
  const stats = useMemo(() => {
    const totalSlots = (config.cols?.length || 0) * (config.levels || 0) * 30;
    const occupied = posicoes.filter(p => p.status === 'ocupado').length;
    const blocked = posicoes.filter(p => p.status === 'bloqueado').length;
    const reserved = posicoes.filter(p => p.status === 'reservado').length;
    const exited = posicoes.filter(p => p.status === 'saida').length;
    const free = totalSlots - occupied - blocked - reserved - exited;
    return { totalSlots, occupied, blocked, reserved, exited, free };
  }, [posicoes, config]);

  // Group positions by col+level
  const cellMap = useMemo(() => {
    const map: Record<string, Posicao[]> = {};
    for (const p of posicoes) {
      const key = `${p.coluna}-${p.nivel}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [posicoes]);

  const filteredPosicoes = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return posicoes.filter(p =>
      p.item?.toLowerCase().includes(q) ||
      p.proc?.toLowerCase().includes(q) ||
      p.lote?.toLowerCase().includes(q) ||
      String(p.m2).includes(q)
    );
  }, [search, posicoes]);

  const handleStatusChange = async (pos: Posicao, newStatus: string) => {
    const updates: Partial<Posicao> = { status: newStatus };
    if (newStatus === 'saida') {
      updates.data_saida = new Date().toISOString();
    }
    
    // Update local state first (optimistic)
    setPosicoes(current => current.map(p => p.id === pos.id ? { ...p, ...updates } : p));
    if (detailPos?.id === pos.id) {
      setDetailPos({ ...detailPos, ...updates } as Posicao);
    }

    const { error } = await supabase
      .from('estoque_posicoes')
      .update(updates as any)
      .eq('id', pos.id);

    if (error) {
      toast.error('Erro ao atualizar status');
      // Rollback on error
      loadPosicoes();
    } else {
      toast.success(`Status → ${STATUS_LABELS[newStatus]}`);
    }
  };

  const pct = (n: number) => stats.totalSlots > 0 ? ((n / stats.totalSlots) * 100).toFixed(1) : '0';

  const getCellCount = (col: string, nivel: number) => {
    const key = `${col}-${nivel}`;
    return cellMap[key]?.length || 0;
  };

  const getCellStatusBreakdown = (col: string, nivel: number) => {
    const key = `${col}-${nivel}`;
    const items = cellMap[key] || [];
    const counts: Record<string, number> = {};
    for (const p of items) {
      counts[p.status] = (counts[p.status] || 0) + 1;
    }
    return counts;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8"
    >
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Estoque 2D</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Visualização das estruturas de tecido</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.totalSlots, color: 'text-foreground', bg: 'bg-muted/30' },
          { label: 'Ocupado', value: stats.occupied, color: 'text-emerald-600 dark:text-emerald-400', pctVal: pct(stats.occupied), bg: 'bg-emerald-500/10' },
          { label: 'Reservado', value: stats.reserved, color: 'text-amber-600 dark:text-amber-400', pctVal: pct(stats.reserved), bg: 'bg-amber-500/10' },
          { label: 'Bloqueado', value: stats.blocked, color: 'text-red-600 dark:text-red-400', pctVal: pct(stats.blocked), bg: 'bg-red-500/10' },
          { label: 'Saída', value: stats.exited, color: 'text-violet-600 dark:text-violet-400', pctVal: pct(stats.exited), bg: 'bg-violet-500/10' },
          { label: 'Livre', value: stats.free, color: 'text-primary', pctVal: pct(stats.free), bg: 'bg-primary/10' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-none shadow-sm`}>
            <CardContent className="p-4 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</div>
              {s.pctVal && <div className="text-[10px] font-medium text-muted-foreground/70">{s.pctVal}%</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TEC tabs */}
      <div className="flex surface-2-bg border border-border rounded-lg p-0.5 gap-0.5 overflow-x-auto">
        {Object.keys(TEC_CONFIG).map(tec => (
          <button
            key={tec}
            onClick={() => setActiveTec(tec)}
            className={`flex-1 min-w-[60px] py-2 rounded-md text-xs font-medium transition-all duration-200 ${
              activeTec === tec
                ? 'surface-bg text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tec}
          </button>
        ))}
      </div>

      {/* Search + actions */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar item, proc, m², lote..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {['livre', 'ocupado', 'reservado', 'bloqueado'].map(st => (
            <button
              key={st}
              onClick={() => setHighlightStatus(highlightStatus === st ? null : st)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
                highlightStatus === st
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {STATUS_LABELS[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {filteredPosicoes && filteredPosicoes.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Resultados ({filteredPosicoes.length})</div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {filteredPosicoes.map(p => (
                <div
                  key={p.id}
                  onClick={() => setDetailPos(p)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer text-xs"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[p.status] }} />
                  <span className="font-mono">{p.estrutura}.{p.coluna}.N{String(p.nivel).padStart(2, '0')}</span>
                  <span className="font-medium">{p.item}</span>
                  <span className="text-muted-foreground ml-auto">{p.proc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2D Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Column headers */}
            <div className="flex gap-2 mb-2">
              <div className="w-12 flex-shrink-0" />
              {config.cols.map(col => (
                <div key={col} className="flex-1 text-center text-xs font-bold text-muted-foreground">
                  {col}
                </div>
              ))}
            </div>

            {/* Levels (bottom to top) */}
            {Array.from({ length: config.levels }, (_, i) => config.levels - i).map(nivel => (
              <div key={nivel} className="flex gap-2 mb-2">
                <div className="w-12 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  N{String(nivel).padStart(2, '0')}
                </div>
                {config.cols.map(col => {
                  const count = getCellCount(col, nivel);
                  const breakdown = getCellStatusBreakdown(col, nivel);
                  const isSelected = selectedCell?.col === col && selectedCell?.nivel === nivel;
                  const freeCount = 30 - count;

                  return (
                    <div
                      key={col}
                      onClick={() => setSelectedCell(isSelected ? null : { col, nivel })}
                      className={`flex-1 min-h-[64px] rounded-lg border-2 p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? 'border-primary shadow-md'
                          : highlightStatus
                            ? (breakdown[highlightStatus] || highlightStatus === 'livre' && freeCount > 0)
                              ? 'border-primary/50'
                              : 'border-border/30 opacity-40'
                            : 'border-border hover:border-primary/30'
                      }`}
                      style={{
                        background: count > 0
                          ? `linear-gradient(135deg, ${STATUS_COLORS[Object.keys(breakdown)[0] || 'livre']}15, transparent)`
                          : undefined
                      }}
                    >
                      <div className="text-[10px] font-semibold text-foreground">
                        {col}·N{nivel}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {count}/30
                      </div>
                      {/* Mini status dots */}
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {Object.entries(breakdown).map(([status, cnt]) => (
                          <div
                            key={status}
                            className="flex items-center gap-0.5"
                            title={`${STATUS_LABELS[status]}: ${cnt}`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                            <span className="text-[8px] text-muted-foreground">{cnt}</span>
                          </div>
                        ))}
                        {freeCount > 0 && (
                          <div className="flex items-center gap-0.5" title={`Livre: ${freeCount}`}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS.livre }} />
                            <span className="text-[8px] text-muted-foreground">{freeCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded cell view */}
      {selectedCell && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">
                {activeTec}.{selectedCell.col}.N{String(selectedCell.nivel).padStart(2, '0')}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map(pos => {
                const key = `${selectedCell.col}-${selectedCell.nivel}`;
                const item = cellMap[key]?.find(p => p.posicao === pos);
                const statusColor = item ? STATUS_COLORS[item.status] : STATUS_COLORS.livre;

                return (
                  <div
                    key={pos}
                    onClick={() => item && setDetailPos(item)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all duration-150 hover:scale-110 border ${
                      item ? 'border-transparent text-white' : 'border-border/50 text-muted-foreground'
                    }`}
                    style={{ background: statusColor }}
                    title={item ? `${item.item} - ${STATUS_LABELS[item.status]}` : `Livre (${pos})`}
                  >
                    {pos}
                  </div>
                );
              })}
            </div>

            {/* Items list in cell */}
            {(() => {
              const key = `${selectedCell.col}-${selectedCell.nivel}`;
              const items = cellMap[key] || [];
              if (!items.length) return <p className="text-xs text-muted-foreground mt-3">Nenhum tecido nesta posição</p>;
              return (
                <div className="mt-3 space-y-1 max-h-[200px] overflow-y-auto">
                  {items.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setDetailPos(p)}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer text-xs"
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[p.status] }} />
                      <span className="font-medium">{p.item || '—'}</span>
                      <span className="text-muted-foreground">{p.proc}</span>
                      <span className="ml-auto font-mono text-muted-foreground">Pos {p.posicao}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailPos} onOpenChange={() => setDetailPos(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Tecido</DialogTitle>
            <DialogDescription>
              {detailPos && `${detailPos.estrutura}.${detailPos.coluna}.N${String(detailPos.nivel).padStart(2, '0')} — Posição ${detailPos.posicao}`}
            </DialogDescription>
          </DialogHeader>
          {detailPos && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">Item/Ref:</span><br/><span className="font-medium">{detailPos.item || '—'}</span></div>
                <div><span className="text-muted-foreground">PROC:</span><br/><span className="font-medium">{detailPos.proc || '—'}</span></div>
                <div><span className="text-muted-foreground">M²:</span><br/><span className="font-medium">{detailPos.m2 || '—'}</span></div>
                <div><span className="text-muted-foreground">Largura:</span><br/><span className="font-medium">{detailPos.largura || '—'}</span></div>
                <div><span className="text-muted-foreground">M Linear:</span><br/><span className="font-medium">{detailPos.m_linear || '—'}</span></div>
                <div><span className="text-muted-foreground">Lote:</span><br/><span className="font-medium">{detailPos.lote || '—'}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span><br/><span className="font-medium">{detailPos.endereco || '—'}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Lote Final:</span><br/><span className="font-mono text-[11px]">{detailPos.lote_sistema || '—'}</span></div>
                <div><span className="text-muted-foreground">Registro:</span><br/><span>{formatDateBR(detailPos.data_registro)}</span></div>
                <div><span className="text-muted-foreground">Saída:</span><br/><span>{formatDateBR(detailPos.data_saida)}</span></div>
                {detailPos.conferente_saida && (
                  <div className="col-span-2"><span className="text-muted-foreground">Conferente saída:</span><br/><span>{detailPos.conferente_saida}</span></div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Status:</span>
                <div className="flex gap-1">
                  {['ocupado', 'reservado', 'bloqueado', 'saida'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(detailPos, st)}
                      className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                        detailPos.status === st
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
