import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, X, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [allPosicoes, setAllPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const loadPosicoes = async () => {
    setLoading(true);
    const { data: allData } = await supabase.from('estoque_posicoes').select('*');
    setAllPosicoes((allData as Posicao[]) || []);

    const { data, error } = await supabase
      .from('estoque_posicoes')
      .select('*')
      .eq('estrutura', activeTec)
      .order('coluna')
      .order('nivel')
      .order('posicao');
    
    if (!error) setPosicoes((data as Posicao[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadPosicoes(); }, [activeTec]);

  const stats = useMemo(() => {
    const totalSlots = Object.values(TEC_CONFIG).reduce((acc, c) => acc + c.cols.length * c.levels * 30, 0);
    const occupied = allPosicoes.filter(p => p.status === 'ocupado').length;
    const blocked = allPosicoes.filter(p => p.status === 'bloqueado').length;
    const reserved = allPosicoes.filter(p => p.status === 'reservado').length;
    const exited = allPosicoes.filter(p => p.status === 'saida').length;
    const free = totalSlots - occupied - blocked - reserved - exited;
    return { totalSlots, occupied, blocked, reserved, exited, free };
  }, [allPosicoes]);

  const cellMap = useMemo(() => {
    const map: Record<string, Posicao[]> = {};
    for (const p of posicoes) {
      const key = `${p.coluna}-${p.nivel}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [posicoes]);

  const handleStatusChange = async (pos: Posicao, newStatus: string) => {
    if (newStatus === 'saida') {
        if (!confirm('Dar saída neste tecido? Isso removerá o item do estoque e arquivará o registro.')) return;
        
        // 1. Move to estoque_saidas
        const { error: saError } = await supabase.from('estoque_saidas').insert({
            registro_id: pos.id, item: pos.item, proc: pos.proc, m2: pos.m2, largura: pos.largura, m_linear: pos.m_linear,
            lote: pos.lote, endereco: pos.endereco, lote_sistema: pos.lote_sistema, estrutura: pos.estrutura,
            coluna: pos.coluna, nivel: pos.nivel, posicao: pos.posicao, conferente_entrada: pos.conferente_entrada,
            conferente_saida: useAppStore.getState().conferente || 'Sistema',
            data_registro: pos.data_registro, data_saida: new Date().toISOString()
        });
        if (saError) return toast.error('Erro ao arquivar');

        // 2. Delete from current
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
        toast.success(`Status → ${STATUS_LABELS[newStatus]}`);
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

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10 min-w-0"
    >
      <div className="space-y-1.5">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter">Estoque</h1>
        <p className="text-muted-foreground text-sm sm:text-base font-medium">Controle de posições e níveis das estruturas TEC.</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: stats.totalSlots, color: 'text-foreground', bg: 'bg-muted/10' },
          { label: 'Ocupado', value: stats.occupied, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Reservado', value: stats.reserved, color: 'text-amber-500', bg: 'bg-amber-500/5' },
          { label: 'Bloqueado', value: stats.blocked, color: 'text-red-500', bg: 'bg-red-500/5' },
          { label: 'Livre', value: stats.free, color: 'text-primary', bg: 'bg-primary/5' },
        ].map(s => (
          <Card key={s.label} className={`border-none shadow-sm ${s.bg} cursor-pointer hover:scale-[1.02] transition-all duration-300`}>
            <CardContent className="p-3 sm:p-4 text-center space-y-0.5">
              <div className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex surface-2-bg rounded-lg p-1 gap-1">
        {Object.keys(TEC_CONFIG).map(tec => (
          <button key={tec} onClick={() => setActiveTec(tec)} className={`flex-1 py-2 rounded-md text-xs font-black ${activeTec === tec ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
            {tec}
          </button>
        ))}
      </div>

      {loading ? <div>Carregando...</div> : (
        <div className="overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-full sm:min-w-[600px] space-y-2">
                {Array.from({ length: config.levels }, (_, i) => config.levels - i).map(nivel => (
                  <div key={nivel} className="flex gap-2">
                    <div className="w-10 sm:w-12 text-[8px] sm:text-[10px] font-black text-muted-foreground flex items-center justify-center bg-muted/20 rounded-lg">N{String(nivel).padStart(2, '0')}</div>
                    {config.cols.map(col => {
                        const items = cellMap[`${col}-${nivel}`] || [];
                        return (
                            <div key={col} onClick={() => setSelectedCell({ col, nivel })} className="flex-1 h-14 sm:h-16 border border-border/40 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 p-1.5 transition-all">
                                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter opacity-60">{col}·N{nivel}</div>
                                <div className="text-[10px] sm:text-xs font-black text-primary">{items.length}<span className="text-[8px] sm:text-[10px] text-muted-foreground font-bold ml-1">/ 30</span></div>
                            </div>
                        )
                    })}
                  </div>
                ))}
            </div>
        </div>
      )}

      {selectedCell && (
        <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
          <DialogContent className="max-w-4xl">
            <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(pos => {
                    const item = (cellMap[`${selectedCell.col}-${selectedCell.nivel}`] || []).find(p => p.posicao === pos);
                    return (
                        <div key={pos} onClick={() => item && setDetailPos(item)} className={`h-12 border rounded flex items-center justify-center text-[10px] font-bold ${item ? 'bg-primary text-white' : 'bg-muted/50'}`}>
                            {pos}
                        </div>
                    )
                })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {detailPos && (
        <Dialog open={!!detailPos} onOpenChange={() => setDetailPos(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Detalhes: {detailPos.item}</DialogTitle></DialogHeader>
                <div className="space-y-4 text-sm">
                    <p>Lote: {detailPos.lote}</p>
                    <p>Lote Final: {detailPos.lote_sistema}</p>
                    <p>Conferente Entrada: {detailPos.conferente_entrada || '—'}</p>
                    <div className="flex gap-2">
                      {['ocupado', 'reservado', 'bloqueado', 'saida'].map(st => (
                        <Button key={st} onClick={() => handleStatusChange(detailPos, st)} variant={detailPos.status === st ? 'default' : 'outline'}>
                            {STATUS_LABELS[st]}
                        </Button>
                      ))}
                    </div>
                    <Button variant="destructive" onClick={() => handleDelete(detailPos)}>Excluir Item</Button>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
