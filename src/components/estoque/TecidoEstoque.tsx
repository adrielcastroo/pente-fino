import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Package, Layers, LogOut, Trash2, Box, Grid3X3, Shirt, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDateBR } from '@/lib/app-utils';
import { useAuth } from '@/hooks/use-auth';

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
  data_registro: string | null;
  composicao?: string;
  fornecedor?: string;
  codigo_cor?: string;
  estoque_minimo?: number;
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

const TOTAL_SLOTS = Object.values(TEC_CONFIG).reduce((acc, { cols, levels }) => acc + (cols.length * levels * 30), 0);

export default function TecidoEstoque() {
  const { isGuest } = useAuth();
  const setFormData = useAppStore(s => s.setFormData);
  const activeTec = useAppStore(s => s.formData.estoqueActiveTec) || 'TEC01';
  const setActiveTec = (val: string) => setFormData({ estoqueActiveTec: val });

  const [allPosicoes, setAllPosicoes] = useState<Posicao[]>([]);
  const [posicoesForActiveTec, setPosicoesForActiveTec] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const loadStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('estoque_posicoes').select('id, status, m_linear, estoque_minimo');
      if (error) throw error;
      setAllPosicoes((data as any[]) || []);
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
    }
  }, []);

  const loadPosicoes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('estoque_posicoes').select('*').eq('estrutura', activeTec);
      if (error) throw error;
      setPosicoesForActiveTec(data as Posicao[]);
    } catch (e) {
      console.error('Erro ao carregar estoque:', e);
      toast.error('Erro ao carregar dados do estoque');
    }
    setLoading(false);
  }, [activeTec]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadPosicoes(); }, [loadPosicoes]);

  const stats = useMemo(() => {
    let occupied = 0, blocked = 0, reserved = 0, lowStock = 0;
    
    for (const p of allPosicoes) {
      if (p.status === 'ocupado') {
        occupied++;
        if (p.estoque_minimo && p.m_linear < p.estoque_minimo) lowStock++;
      }
      else if (p.status === 'bloqueado') blocked++;
      else if (p.status === 'reservado') reserved++;
    }
    
    const free = TOTAL_SLOTS - occupied - blocked - reserved;
    return { totalSlots: TOTAL_SLOTS, occupied, blocked, reserved, free, lowStock };
  }, [allPosicoes]);

  const cellMap = useMemo(() => {
    const map: Record<string, Posicao[]> = {};
    for (const p of posicoesForActiveTec) {
      const key = `${p.coluna}-${p.nivel}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [posicoesForActiveTec]);

  const handleStatusChange = useCallback(async (pos: Posicao, newStatus: string) => {
    const previousStatus = pos.status;
    setDetailPos(prev => prev ? { ...prev, status: newStatus } : null);
    setPosicoesForActiveTec(prev => prev.map(p => p.id === pos.id ? { ...p, status: newStatus } : p));
    setAllPosicoes(prev => prev.map(p => p.id === pos.id ? { ...p, status: newStatus } as any : p));
    
    const { error } = await supabase.from('estoque_posicoes').update({ status: newStatus } as any).eq('id', pos.id);
    if (error) {
      toast.error('Erro ao atualizar status');
      setDetailPos(prev => prev ? { ...prev, status: previousStatus } : null);
      setPosicoesForActiveTec(prev => prev.map(p => p.id === pos.id ? { ...p, status: previousStatus } : p));
      setAllPosicoes(prev => prev.map(p => p.id === pos.id ? { ...p, status: previousStatus } as any : p));
    } else {
      toast.success(`Status atualizado para ${STATUS_CONFIG[newStatus]?.label}`);
    }
  }, []);

  const executeSaida = async (pos: Posicao) => {
    // Logic moved from EstoquePage
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
    loadStats();
    toast.success('Saída realizada com sucesso');
  };

  const selectedCellItems = selectedCell ? (cellMap[`${selectedCell.col}-${selectedCell.nivel}`] || []) : [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'total', label: 'Capacidade', value: stats.totalSlots, config: { color: 'text-foreground', bg: 'bg-card/40', border: 'border-border/30' } },
          { key: 'ocupado', label: 'Ocupado', value: stats.occupied, config: STATUS_CONFIG.ocupado },
          { key: 'reservado', label: 'Reservado', value: stats.reserved, config: STATUS_CONFIG.reservado },
          { key: 'bloqueado', label: 'Bloqueado', value: stats.blocked, config: STATUS_CONFIG.bloqueado },
          { key: 'baixo_estoque', label: 'Reposição', value: stats.lowStock, config: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' } },
          { key: 'livre', label: 'Livre', value: stats.free, config: { color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' } },
        ].map(s => (
          <Card key={s.label} className={`border ${s.config.border} ${s.config.bg} shadow-none`}>
            <CardContent className="p-4 text-center space-y-1">
              <div className={`text-2xl font-black tabular-nums ${s.config.color}`}>{s.value}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Structure Selector */}
      <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/30 overflow-x-auto custom-scrollbar">
        {Object.keys(TEC_CONFIG).map(tec => (
          <button 
            key={tec} 
            onClick={() => setActiveTec(tec)} 
            className={`flex-1 min-w-[64px] py-2 rounded-lg text-xs font-black tracking-wide transition-all ${
              activeTec === tec 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tec}
          </button>
        ))}
      </div>

      {/* Storage Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="font-semibold">Sincronizando TEC...</span>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[600px] space-y-2">
            <div className="flex gap-2">
              <div className="w-12 shrink-0" />
              {config.cols.map(col => (
                <div key={col} className="flex-1 text-center text-[10px] font-black text-primary uppercase tracking-widest py-1">{col}</div>
              ))}
            </div>
            {Array.from({ length: config.levels }, (_, i) => config.levels - i).map(nivel => (
              <div key={nivel} className="flex gap-2">
                <div className="w-12 text-[10px] font-black text-muted-foreground flex items-center justify-center bg-muted/40 rounded-lg shrink-0 border border-border/30">
                  N{String(nivel).padStart(2, '0')}
                </div>
                {config.cols.map(col => {
                  const items = cellMap[`${col}-${nivel}`] || [];
                  const fillPercent = Math.round((items.length / 30) * 100);
                  const isCritical = items.some(i => i.estoque_minimo && i.m_linear < i.estoque_minimo);
                  
                  return (
                    <div 
                      key={col} 
                      onClick={() => setSelectedCell({ col, nivel })} 
                      className={`flex-1 h-16 rounded-xl cursor-pointer p-2 transition-all relative overflow-hidden border group ${
                        items.length > 0
                          ? 'bg-accent/40 border-border/40 hover:border-primary/60'
                          : 'bg-muted/10 border-border/20 hover:border-primary/20'
                      } ${isCritical ? 'ring-2 ring-amber-500/30' : ''}`}
                    >
                      {items.length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/10" style={{ height: `${fillPercent}%` }} />
                      )}
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-bold text-muted-foreground/60">{col}-{nivel}</span>
                          {isCritical && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {items.length}
                          <span className="text-[10px] text-muted-foreground/40 font-semibold ml-0.5">/30</span>
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

      {/* Cell Detail Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-primary" />
              {activeTec} · Col {selectedCell?.col} · N{selectedCell?.nivel}
            </DialogTitle>
            <DialogDescription>{selectedCellItems.length} de 30 posições ocupadas</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedCellItems.sort((a,b) => a.posicao - b.posicao).map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex items-center justify-between hover:border-primary/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_CONFIG[item.status]?.bg} ${STATUS_CONFIG[item.status]?.color}`}>
                      Pos {item.posicao} · {STATUS_CONFIG[item.status]?.label}
                    </Badge>
                    {item.estoque_minimo && item.m_linear < item.estoque_minimo && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">Reposição Necessária</Badge>
                    )}
                  </div>
                  <h4 className="font-bold text-sm">{item.item}</h4>
                  <div className="flex gap-4 text-[10px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {item.proc}</span>
                    <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {item.m_linear}m</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateBR(item.data_registro)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDetailPos(item)} className="font-bold text-xs uppercase text-primary">Detalhes</Button>
              </div>
            ))}
            {selectedCellItems.length === 0 && (
              <div className="py-10 text-center text-muted-foreground font-semibold">Célula vazia</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Full Detail Dialog */}
      <Dialog open={!!detailPos} onOpenChange={() => setDetailPos(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-primary" />
              {detailPos?.item}
            </DialogTitle>
            <DialogDescription>Atributos e especificações do tecido</DialogDescription>
          </DialogHeader>
          {detailPos && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Attribute label="Composição" value={detailPos.composicao || 'Não informada'} />
                <Attribute label="Fornecedor" value={detailPos.fornecedor || 'Não informado'} />
                <Attribute label="Cor/Estampa" value={detailPos.codigo_cor || '—'} />
                <Attribute label="Metragem" value={`${detailPos.m_linear} m`} />
                <Attribute label="Largura" value={`${detailPos.largura} m`} />
                <Attribute label="Estoque Mínimo" value={detailPos.estoque_minimo ? `${detailPos.estoque_minimo} m` : 'Não definido'} />
                <Attribute label="Lote Sistema" value={detailPos.lote_sistema} mono />
                <Attribute label="Entrada" value={formatDateBR(detailPos.data_registro)} />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status e Ações</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['ocupado', 'reservado', 'bloqueado'] as const).map(st => (
                    <Button 
                      key={st}
                      variant={detailPos.status === st ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(detailPos, st)}
                      className="h-10 text-xs font-bold gap-2"
                    >
                      <div className={`w-2 h-2 rounded-full ${st === 'ocupado' ? 'bg-emerald-400' : st === 'bloqueado' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      {STATUS_CONFIG[st].label}
                    </Button>
                  ))}
                  {!isGuest && (
                    <Button 
                      onClick={() => executeSaida(detailPos)}
                      className="h-10 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs gap-2"
                    >
                      <LogOut className="w-3 h-3" />
                      Dar Saída
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Attribute({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-3 rounded-xl border border-border/20 bg-muted/5 space-y-1">
      <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">{label}</div>
      <div className={`text-sm font-bold ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
