import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Package, MapPin, Layers, ArrowRightLeft, Trash2, ChevronRight, Box, Grid3X3, Info, LogOut, Upload, ScanBarcode, Loader2, CheckCircle2, Archive, Calendar, Shirt, TreePine, ArrowLeft, LayoutDashboard, Barcode, Warehouse } from 'lucide-react';
import MadeiraEstoque from '@/components/estoque/MadeiraEstoque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { usePerformance } from '@/hooks/use-performance';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ImportDialog from '@/components/estoque/ImportDialog';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';


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
  TEC01: { cols: ['A', 'B', 'C', 'D', 'E', 'F'], levels: 6 },
  TEC02: { cols: ['A', 'B'], levels: 4 },
  TEC03: { cols: ['A', 'B'], levels: 9 },
  TEC04: { cols: ['A', 'B', 'C'], levels: 5 },
  TEC05: { cols: ['A', 'B', 'C'], levels: 5 },
  'CHÃO': { cols: ['G'], levels: 1 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ocupado: { label: 'Ocupado', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  bloqueado: { label: 'Bloqueado', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  reservado: { label: 'Reservado', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  saida: { label: 'Saída', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  livre: { label: 'Livre', color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border/30' },
};

// Constant: total physical slots across all TECs (computed once)
const TOTAL_SLOTS = Object.values(TEC_CONFIG).reduce((acc, { cols, levels }) => acc + (cols.length * levels * 30), 0);

// Reuse centralized formatter
import { formatDateBR } from '@/lib/app-utils';

export default function EstoquePage() {
  useDocumentTitle('Estoque');
  const { isGuest, isAdmin } = useAuth();
  const navigate = useNavigate();
  const activeTec = useAppStore(s => s.formData.estoqueActiveTec);

  const setFormData = useAppStore(s => s.setFormData);
  const setActiveTec = (val: string) => setFormData({ estoqueActiveTec: val });

  const [allPosicoes, setAllPosicoes] = useState<Posicao[]>([]);
  const [category, setCategory] = useState<'tecido' | 'madeira'>('tecido');
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [confirmSaida, setConfirmSaida] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ item: Posicao | null; success: boolean; message: string } | null>(null);
  const [confirmScan, setConfirmScan] = useState<Posicao | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const [locateQuery, setLocateQuery] = useState('');
  const { isLow } = usePerformance();

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const [posicoesForActiveTec, setPosicoesForActiveTec] = useState<Posicao[]>([]);

  const loadStats = useCallback(async () => {
    try {
      // Fetch status + estrutura (needed for per-TEC breakdown in stat dialogs)
      const { data, error } = await supabase.from('estoque_posicoes').select('id, status, estrutura');
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
  useEffect(() => {
    setFormData({ activeTab: 'estoque' });
  }, [setFormData]);

  const posicoes = posicoesForActiveTec;
  // totalSlots is constant — compute once at module scope below
  const totalSlots = TOTAL_SLOTS;

  const stats = useMemo(() => {
    let occupied = 0, blocked = 0, reserved = 0, exited = 0;
    
    for (let i = 0, len = allPosicoes.length; i < len; i++) {
      const s = (allPosicoes[i] as any).status;
      if (s === 'ocupado') occupied++;
      else if (s === 'bloqueado') blocked++;
      else if (s === 'reservado') reserved++;
      else if (s === 'saida') exited++;
    }
    
    const free = totalSlots - occupied - blocked - reserved; // Exited items are removed from DB, so they don't count against capacity
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

  const matchingCells = useMemo(() => {
    const q = locateQuery.trim().toLowerCase();
    if (!q) return null;
    const set = new Set<string>();
    for (const p of posicoes) {
      const hay = `${p.item ?? ''} ${p.lote ?? ''} ${p.lote_sistema ?? ''} ${p.proc ?? ''} ${p.endereco ?? ''}`.toLowerCase();
      if (hay.includes(q)) set.add(`${p.coluna}-${p.nivel}`);
    }
    return set;
  }, [locateQuery, posicoes]);


  const handleStatusChange = useCallback(async (pos: Posicao, newStatus: string) => {
    if (newStatus === 'saida') {
      setConfirmSaida(true);
      return;
    }

    // Optimistic UI update — instant feedback, no waiting for network
    const previousStatus = pos.status;
    setDetailPos(prev => prev ? { ...prev, status: newStatus } : null);
    setPosicoesForActiveTec(prev => prev.map(p => p.id === pos.id ? { ...p, status: newStatus } : p));
    setAllPosicoes(prev => prev.map(p => p.id === pos.id ? { ...p, status: newStatus } as any : p));
    toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label}`, { id: 'status-update' });

    // Background sync — rollback on error
    const { error } = await supabase.from('estoque_posicoes').update({ status: newStatus } as any).eq('id', pos.id);
    if (error) {
      toast.error('Erro ao atualizar status', { id: 'status-update' });
      setDetailPos(prev => prev ? { ...prev, status: previousStatus } : null);
      setPosicoesForActiveTec(prev => prev.map(p => p.id === pos.id ? { ...p, status: previousStatus } : p));
      setAllPosicoes(prev => prev.map(p => p.id === pos.id ? { ...p, status: previousStatus } as any : p));
    }
  }, []);

  const executeSaida = async (pos: Posicao) => {
    // Optimistic UI update
    const previousPosicoes = [...posicoesForActiveTec];
    const previousAll = [...allPosicoes];
    
    setPosicoesForActiveTec(prev => prev.filter(p => p.id !== pos.id));
    setAllPosicoes(prev => prev.filter(p => p.id !== pos.id));
    setDetailPos(null);
    
    try {
      const { error: saError } = await supabase.from('estoque_saidas').insert({
        registro_id: pos.registro_id || pos.id, 
        item: pos.item, 
        proc: pos.proc, 
        m2: pos.m2, 
        largura: pos.largura, 
        m_linear: pos.m_linear,
        lote: pos.lote, 
        endereco: pos.endereco, 
        lote_sistema: pos.lote_sistema, 
        estrutura: pos.estrutura,
        coluna: pos.coluna, 
        nivel: pos.nivel, 
        posicao: pos.posicao, 
        conferente_entrada: pos.conferente_entrada,
        conferente_saida: useAppStore.getState().conferente || 'Sistema',
        data_registro: pos.data_registro, 
        data_saida: new Date().toISOString()
      });
      
      if (saError) throw saError;

      const { error: delError } = await supabase.from('estoque_posicoes').delete().eq('id', pos.id);
      if (delError) throw delError;
      
      loadStats();
      toast.success('Saída realizada com sucesso');
    } catch (e: any) {
      console.error('Erro na saída:', e);
      toast.error('Erro ao processar saída: ' + (e.message || ''));
      // Rollback
      setPosicoesForActiveTec(previousPosicoes);
      setAllPosicoes(previousAll);
    }
  };

  const handleDelete = (pos: Posicao) => {
    setConfirmDelete(true);
  };

  const executeDelete = async (pos: Posicao) => {
    const previousPosicoes = [...posicoesForActiveTec];
    const previousAll = [...allPosicoes];
    
    if (!isAdmin) {
      toast.error('Somente administradores podem realizar saídas forçadas.');
      return;
    }
    setPosicoesForActiveTec(prev => prev.filter(p => p.id !== pos.id));
    setAllPosicoes(prev => prev.filter(p => p.id !== pos.id));
    setDetailPos(null);
    
    try {
    if (!isAdmin) {
      toast.error('Somente administradores podem remover posições.');
      return;
    }
    const { error } = await supabase.from('estoque_posicoes').delete().eq('id', pos.id);
      if (error) throw error;
      
      loadStats();
      toast.success('Item excluído');
    } catch (e: any) {
      console.error('Erro na exclusão:', e);
      toast.error('Erro ao excluir item');
      setPosicoesForActiveTec(previousPosicoes);
      setAllPosicoes(previousAll);
    }
  };

  useEffect(() => {
    if (scanMode && scanRef.current) {
      scanRef.current.focus();
    }
  }, [scanMode]);

  const handleScanSubmit = async () => {
    const loteFinal = scanInput.trim();
    if (!loteFinal) return;

    setScanning(true);
    try {
      const { data, error } = await supabase
        .from('estoque_posicoes')
        .select('*')
        .ilike('lote_sistema', loteFinal)
        .eq('status', 'ocupado')
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setScanResult({ item: null, success: false, message: `Nenhum tecido encontrado com lote final: "${loteFinal}"` });
      } else {
        setConfirmScan(data[0]);
      }
    } catch (e: any) {
      toast.error('Erro ao buscar tecido: ' + (e.message || ''));
    } finally {
      setScanning(false);
    }
  };

  const executeScanSaida = async () => {
    if (!confirmScan) return;
    const pos = confirmScan;

    try {
      const { error: saError } = await supabase.from('estoque_saidas').insert({
        registro_id: pos.registro_id || pos.id, item: pos.item, proc: pos.proc, m2: pos.m2, largura: pos.largura, m_linear: pos.m_linear,
        lote: pos.lote, endereco: pos.endereco, lote_sistema: pos.lote_sistema, estrutura: pos.estrutura,
        coluna: pos.coluna, nivel: pos.nivel, posicao: pos.posicao, conferente_entrada: pos.conferente_entrada,
        conferente_saida: useAppStore.getState().conferente || 'Sistema',
        data_registro: pos.data_registro, data_saida: new Date().toISOString()
      });
      if (saError) throw saError;

      const { error: delError } = await supabase.from('estoque_posicoes').delete().eq('id', pos.id);
      if (delError) throw delError;

      setScanResult({
        item: pos,
        success: true,
        message: `Saída realizada! Item "${pos.item}" removido de ${pos.estrutura}.${pos.coluna}.N${String(pos.nivel).padStart(2, '0')}`
      });
      setConfirmScan(null);
      setScanInput('');
      loadPosicoes();
      loadStats();
    } catch (e: any) {
      toast.error('Erro ao dar saída: ' + (e.message || ''));
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-full mx-auto space-y-4 sm:space-y-8 pb-20 p-2 sm:p-0 overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-md hover:bg-muted/50 transition-colors w-9 h-9"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Warehouse className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                Gestão de estoque
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoramento de posições e ocupação
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setImportOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 gap-2"
          >
            <Upload className="w-4 h-4" strokeWidth={1.75} />
            Importar
          </Button>
        </div>
      </div>

      {/* Categoria Tabs */}
      <div className="flex bg-card/40 backdrop-blur rounded-lg p-1 gap-1 border border-border/30 w-full sm:max-w-md">
        {(['tecido', 'madeira'] as const).map((key) => {
          const Icon = key === 'tecido' ? Shirt : TreePine;
          const label = key === 'tecido' ? 'Estoque de Tecidos' : 'Estoque de Madeira';
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex-1 py-2.5 rounded-md text-[10px] sm:text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 min-w-0 ${
                category === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>


      {category === 'madeira' ? (
        <MadeiraEstoque />
      ) : (
        <>
      {/* Stats Cards */}
      <div className="w-full pb-4 px-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { key: 'total', label: 'Capacidade Total', value: stats.totalSlots, percent: 100, config: { color: 'text-foreground', bg: 'bg-card/40 shadow-2xl ring-1 ring-white/10', border: 'border-white/5' } },
            { key: 'ocupado', label: 'Ocupação Atual', value: stats.occupied, percent: stats.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0, config: { ...STATUS_CONFIG.ocupado, bg: 'bg-emerald-500/10 shadow-emerald-500/5', border: 'border-emerald-500/20' } },
            { key: 'livre', label: 'Posições Livres', value: stats.free, percent: stats.totalSlots ? Math.round((stats.free / stats.totalSlots) * 100) : 0, config: { color: 'text-primary', bg: 'bg-primary/5 shadow-primary/5', border: 'border-primary/20' } },
            { key: 'bloqueado', label: 'Bloqueado', value: stats.blocked, percent: stats.totalSlots ? Math.round((stats.blocked / stats.totalSlots) * 100) : 0, config: { ...STATUS_CONFIG.bloqueado, bg: 'bg-red-500/10 shadow-red-500/5', border: 'border-red-500/20' } },
            { key: 'reservado', label: 'Reservado', value: stats.reserved, percent: stats.totalSlots ? Math.round((stats.reserved / stats.totalSlots) * 100) : 0, config: { ...STATUS_CONFIG.reservado, bg: 'bg-amber-500/10 shadow-amber-500/5', border: 'border-amber-500/20' } },
          ].map((s) => (
            <motion.div
              key={s.label}
              whileHover={{ scale: 1.05, translateY: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                onClick={() => setSelectedStat(prev => prev === s.key ? null : s.key)}
                className={`rounded-[1.5rem] sm:rounded-[2rem] border-2 ${s.config.border} ${s.config.bg} backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-2xl relative overflow-hidden group ${
                  selectedStat === s.key ? 'ring-4 ring-primary ring-offset-4 dark:ring-offset-background scale-[1.02] sm:scale-105' : ''
                } ${s.key === 'total' ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <CardContent className="p-4 sm:p-6 text-center space-y-1 sm:space-y-2 relative z-10">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tighter ${s.config.color} drop-shadow-sm`}>{s.value}</div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">{s.label}</div>
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    <div className="h-1 w-8 bg-muted-foreground/20 rounded-full overflow-hidden">
                       <div className={`h-full ${s.config.color.replace('text', 'bg')}`} style={{ width: `${s.percent}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground/80">{s.percent}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Locate search */}
      <div className="relative">
        <Input
          value={locateQuery}
          onChange={(e) => setLocateQuery(e.target.value)}
          placeholder="Onde está? Buscar por item, lote, processo ou endereço..."
          className="h-11 sm:h-12 rounded-2xl bg-card/40 backdrop-blur-xl border-white/10 pl-4 pr-24 text-xs sm:text-sm"
        />
        {locateQuery && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
              {matchingCells?.size ?? 0} células
            </Badge>
            <button onClick={() => setLocateQuery('')} className="text-muted-foreground hover:text-foreground text-xs font-black">×</button>
          </div>
        )}
      </div>

      {/* TEC Tabs */}
      <div className="flex bg-card/40 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-1.5 gap-1.5 sm:gap-2 border border-white/10 shadow-2xl flex-wrap sm:flex-nowrap ring-1 ring-white/5">
        {Object.keys(TEC_CONFIG).map(tec => (
          <button 
            key={tec} 
            onClick={() => setActiveTec(tec)} 
            className={`flex-1 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-black tracking-widest uppercase transition-all duration-500 ${
              activeTec === tec 
                ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-1 ring-white/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {tec}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl ring-1 ring-white/5">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <span className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Grade...</span>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full pb-6"
        >
          <div className="w-full space-y-2 sm:space-y-3 p-1 overflow-x-auto md:overflow-x-visible no-scrollbar">
            <div className="min-w-[520px] md:min-w-0 space-y-2 sm:space-y-3">
            {/* Column headers */}
            <div className="flex gap-2 sm:gap-3">
              <div className="w-10 sm:w-12 md:w-16 shrink-0" />
              {config.cols.map(col => (
                <div key={col} className="flex-1 text-center text-[8px] sm:text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em] py-2 bg-primary/5 rounded-xl border border-primary/10 mb-2">
                  {col}
                </div>
              ))}
            </div>
            {Array.from({ length: config.levels }, (_, i) => config.levels - i).map((nivel, idx) => (
              <motion.div 
                key={nivel} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-2 sm:gap-3"
              >
                <div className="w-10 sm:w-12 md:w-16 text-[8px] sm:text-[10px] md:text-xs font-black text-muted-foreground flex items-center justify-center bg-card/40 backdrop-blur-xl rounded-2xl shrink-0 border border-white/10 shadow-lg ring-1 ring-white/5">
                  N{String(nivel).padStart(2, '0')}
                </div>
                {config.cols.map(col => {
                  const items = cellMap[`${col}-${nivel}`] || [];
                  const filteredItems = selectedStat && selectedStat !== 'total' && selectedStat !== 'livre' 
                    ? items.filter(i => i.status === selectedStat)
                    : items;
                  
                  const fillPercent = Math.round((items.length / 30) * 100);
                  const hasItems = items.length > 0;
                  const matchesFilter = !selectedStat || selectedStat === 'total' || 
                                      (selectedStat === 'livre' && items.length < 30) ||
                                      items.some(i => i.status === selectedStat);
                  const cellKey = `${col}-${nivel}`;
                  const isHighlighted = matchingCells?.has(cellKey);
                  const isDimmed = matchingCells && !isHighlighted;

                  // Color by occupation: green <50%, amber 50-80%, red >80%
                  const fillTone = !hasItems
                    ? { bg: 'bg-muted/10', border: 'border-white/5', bar: 'bg-muted/30' }
                    : fillPercent <= 50
                      ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', bar: 'bg-emerald-500/30' }
                      : fillPercent <= 80
                        ? { bg: 'bg-amber-500/10', border: 'border-amber-500/30', bar: 'bg-amber-500/35' }
                        : { bg: 'bg-rose-500/10', border: 'border-rose-500/30', bar: 'bg-rose-500/40' };
                  
                  return (
                    <HoverCard key={col} openDelay={250} closeDelay={80}>
                      <HoverCardTrigger asChild>
                    <motion.div 
                      whileHover={{ scale: 1.02, zIndex: 10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCell({ col, nivel })} 
                      className={`flex-1 min-w-0 h-14 sm:h-20 md:h-24 rounded-xl sm:rounded-3xl cursor-pointer p-2 sm:p-4 transition-all duration-300 group relative overflow-hidden border backdrop-blur-xl shadow-lg hover:shadow-primary/10 ${fillTone.bg} ${fillTone.border} ${
                        !matchesFilter ? 'opacity-20 grayscale cursor-not-allowed' : ''
                      } ${
                        isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.03] z-10' : ''
                      } ${
                        isDimmed ? 'opacity-30 grayscale' : ''
                      } ${!hasItems ? 'opacity-50' : ''}`}
                    >
                      {/* Fill bar */}
                      {hasItems && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${fillPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`absolute bottom-0 left-0 right-0 ${fillTone.bar}`}
                        />
                      )}
                      
                      {/* Status indicator dots */}
                      <div className="absolute top-2 right-2 flex gap-0.5">
                         {items.slice(0, 3).map((it, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${
                              it.status === 'bloqueado' ? 'bg-red-500' : 
                              it.status === 'reservado' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                         ))}
                         {items.length > 3 && <div className="text-[6px] font-black text-muted-foreground/50">+</div>}
                      </div>

                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">
                          {col}N{nivel}
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-lg sm:text-2xl font-black text-foreground tracking-tighter leading-none">
                            {items.length}
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground/40 font-black uppercase mb-0.5">/30</span>
                        </div>
                      </div>
                    </motion.div>
                      </HoverCardTrigger>
                      {hasItems && (
                        <HoverCardContent side="top" align="center" className="hidden lg:block w-72 p-0 border-white/10 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
                          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{activeTec}.{col}.N{String(nivel).padStart(2,'0')}</div>
                            <div className="text-[10px] font-black text-muted-foreground">{items.length}/30 · {fillPercent}%</div>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                            {items.slice(0, 6).sort((a,b) => a.posicao - b.posicao).map((it) => {
                              const statusColor = it.status === 'bloqueado' ? 'bg-red-500' : it.status === 'reservado' ? 'bg-amber-500' : 'bg-emerald-500';
                              return (
                                <div key={it.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
                                  <div className="text-[10px] font-black text-muted-foreground/70 shrink-0 w-7">P{String(it.posicao).padStart(2,'0')}</div>
                                  <div className="text-xs font-bold text-foreground truncate flex-1">{it.item || '—'}</div>
                                </div>
                              );
                            })}
                            {items.length > 6 && (
                              <div className="text-[10px] font-black text-muted-foreground/60 text-center py-1">+ {items.length - 6} itens</div>
                            )}
                          </div>
                          <div className="px-4 py-2 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">
                            Clique para abrir
                          </div>
                        </HoverCardContent>
                      )}
                    </HoverCard>
                  );
                })}
              </motion.div>
            ))}
            </div>
          </div>
        </motion.div>
      )}
        </>
      )}

      {/* ===== POSITIONS GRID DIALOG ===== */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 gap-0 border-white/10 bg-card/60 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] ring-1 ring-white/10 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto">
          {selectedCell && (
            <>
              {/* Dialog Header */}
              <div className="px-8 pt-10 pb-8 border-b border-white/5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 ring-4 ring-primary/20">
                      <Grid3X3 className="w-8 h-8" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-semibold tracking-tight">
                        {activeTec} · {selectedCell.col}N{String(selectedCell.nivel).padStart(2, '0')}
                      </DialogTitle>
                      <DialogDescription className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mt-1 opacity-60">
                         Monitoramento de Célula · {occupiedCount} de 30 Posições
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-[10px] font-black px-5 py-2 rounded-2xl shadow-lg ring-4 uppercase tracking-widest",
                    occupiedCount === 0 ? "bg-primary text-primary-foreground ring-primary/10" :
                    occupiedCount >= 25 ? "bg-rose-500 text-white ring-rose-500/10" :
                    "bg-emerald-500 text-white ring-emerald-500/10"
                  )}>
                    {occupiedCount === 0 ? 'Célula Vazia' : occupiedCount >= 25 ? 'Capacidade Crítica' : `${Math.round((occupiedCount/30)*100)}% Ocupado`}
                  </Badge>
                </div>
                {/* Occupation bar */}
                <div className="mt-8 h-2 rounded-full bg-white/5 overflow-hidden shadow-inner border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(occupiedCount/30)*100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full transition-all shadow-[0_0_10px_rgba(var(--primary),0.5)]",
                      occupiedCount >= 25 ? 'bg-rose-500' : occupiedCount >= 15 ? 'bg-amber-500' : 'bg-primary'
                    )} 
                  />
                </div>
              </div>

              {/* Positions List/Grid */}
              <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar bg-card/20">
                {occupiedCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <Box className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-xs font-medium text-muted-foreground/60">Célula disponível</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                      {selectedCellItems.sort((a, b) => a.posicao - b.posicao).map((item, idx) => {
                        const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.livre;
                        return (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 shadow-xl shadow-black/5 ring-1 ring-white/5 hover:scale-[1.01] hover:-translate-y-1"
                          >
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-black px-3 py-1 rounded-xl border-2 uppercase tracking-widest",
                                  statusCfg.color,
                                  statusCfg.border,
                                  statusCfg.bg
                                )}>
                                  POS {String(item.posicao).padStart(2, '0')} · {statusCfg.label}
                                </Badge>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                                   <Barcode className="w-3 h-3 text-muted-foreground/50" />
                                   <span className="text-[10px] font-black text-muted-foreground/60 tracking-widest uppercase">{item.lote_sistema || 'S/ LOTE'}</span>
                                </div>
                              </div>
                              <h3 className="font-black text-foreground text-lg sm:text-xl tracking-tight uppercase group-hover:text-primary transition-colors">{item.item || 'Item sem identificação'}</h3>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> {item.proc || '—'}</span>
                                <span className="flex items-center gap-2"><Box className="w-3.5 h-3.5" /> {item.m_linear}M X {item.largura}M</span>
                                <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formatDateBR(item.data_registro)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Button
                                onClick={() => setDetailPos(item)}
                                variant="ghost"
                                size="sm"
                                  className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 border border-transparent hover:border-primary/20 hover:scale-105 active:scale-95"
                                >
                                  Ficha Técnica
                              </Button>
                              {!isGuest && (
                                <Button
                                  onClick={() => {
                                    setDetailPos(item);
                                    handleStatusChange(item, 'saida');
                                  }}
                                  size="sm"
                                  className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-violet-600 hover:bg-violet-500 text-white gap-3 shadow-2xl shadow-violet-600/30 ring-4 ring-violet-500/10 transition-all duration-300 hover:scale-105 active:scale-95"
                                >
                                  <LogOut className="w-4 h-4" />
                                  Dar Saída
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {/* Grid View Toggle or Helper */}
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">{occupiedCount} Itens encontrados nesta célula</span>
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">* Célula do Galpão G4</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={!!detailPos} onOpenChange={() => setDetailPos(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-white/10 bg-card/60 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] ring-1 ring-white/10 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-500">
          {detailPos && (() => {
            const statusCfg = STATUS_CONFIG[detailPos.status] || STATUS_CONFIG.livre;
            return (
              <>
                {/* Detail Header */}
                <div className="px-8 pt-10 pb-8 border-b border-white/5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-5 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 ring-4 ring-primary/20 shrink-0">
                      <Package className="w-10 h-10" />
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <DialogTitle className="text-xl font-semibold tracking-tight">
                        {detailPos.item || 'Item sem identificação'}
                      </DialogTitle>
                      <DialogDescription className="text-[10px] sm:text-sm text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 opacity-60">
                        {detailPos.estrutura} · COLUNA {detailPos.coluna} · NÍVEL {String(detailPos.nivel).padStart(2, '0')} · POS {String(detailPos.posicao).padStart(2, '0')}
                      </DialogDescription>
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-black px-5 py-2 rounded-2xl shadow-lg ring-4 uppercase tracking-widest border-2",
                      statusCfg.bg,
                      statusCfg.border,
                      statusCfg.color,
                      "bg-transparent"
                    )}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="p-8 space-y-8 bg-card/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Lote Fábrica', value: detailPos.lote || '—' },
                      { label: 'Lote Sistema (Final)', value: detailPos.lote_sistema || '—' },
                      { label: 'Endereço Atual', value: detailPos.endereco || '—' },
                      { label: 'Conferente Responsável', value: detailPos.conferente_entrada || '—' },
                      { label: 'Área Total (M²)', value: detailPos.m2 != null ? `${detailPos.m2}` : '—' },
                      { label: 'Largura Nominal', value: detailPos.largura != null ? `${detailPos.largura}` : '—' },
                      { label: 'Metragem Linear', value: detailPos.m_linear != null ? `${detailPos.m_linear}` : '—' },
                      { label: 'Data de Entrada', value: formatDateBR(detailPos.data_registro) },
                    ].map((f, i) => (
                      <motion.div 
                        key={f.label} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-lg group hover:border-primary/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-primary/5 hover:-translate-y-1"
                      >
                        <div className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5">{f.label}</div>
                        <div className="text-sm sm:text-base font-black text-foreground break-all tracking-tight group-hover:text-primary transition-colors">{f.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] text-center mb-4">Gerenciamento de Status</div>
                    <div className="grid grid-cols-2 gap-3">
                      {(['ocupado', 'reservado', 'bloqueado'] as const).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const isActive = detailPos.status === st;
                        const activeBg = st === 'ocupado' ? 'bg-emerald-500 shadow-emerald-500/30' 
                          : st === 'bloqueado' ? 'bg-rose-500 shadow-rose-500/30' 
                          : 'bg-amber-500 shadow-amber-500/30';
                        
                        return (
                          <Button 
                            key={st} 
                            onClick={() => handleStatusChange(detailPos, st)} 
                            variant="outline"
                            className={cn(
                              "h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 transition-all duration-300 gap-3 group relative overflow-hidden",
                              isActive 
                                ? `${activeBg} text-white border-transparent ring-4 ring-white/10 scale-105 z-10` 
                                : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20 active:scale-95"
                            )}
                          >
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all duration-500",
                              isActive ? "bg-white animate-pulse" : 
                              st === 'ocupado' ? "bg-emerald-500" : st === 'bloqueado' ? "bg-rose-500" : "bg-amber-500"
                            )} />
                            {cfg.label}
                            {isActive && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                          </Button>
                        );
                      })}
                      {!isGuest && (
                        <Button 
                          onClick={() => handleStatusChange(detailPos, 'saida')} 
                          variant="outline"
                          className="h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 border-violet-500/30 bg-violet-500/5 text-violet-500 hover:bg-violet-600 hover:text-white hover:border-transparent transition-all duration-300 active:scale-95 shadow-lg group"
                        >
                          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          Confirmar Saída
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="pt-6 border-t border-white/5">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete(detailPos)} 
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border border-transparent hover:border-rose-500/20 transition-all duration-300"
                      >
                        <Trash2 className="w-5 h-5 mr-3" />
                        Remover do Sistema Permanentemente
                      </Button>
                    </div>
                  )}

                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== STAT DETAIL DIALOG ===== */}
      <Dialog open={!!selectedStat} onOpenChange={() => setSelectedStat(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl p-0 gap-0 border-white/10 bg-card/60 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] ring-1 ring-white/10 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500 overflow-y-auto max-h-[95vh]">
          {selectedStat && (() => {
            const statItems: { label: string; value: number; percent: number; color: string; bg: string; hex: string }[] = [
              { label: 'Total', value: stats.totalSlots, percent: 100, color: 'text-foreground', bg: 'bg-white/5', hex: '#ffffff' },
              { label: 'Ocupado', value: stats.occupied, percent: stats.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10', hex: '#10b981' },
              { label: 'Reservado', value: stats.reserved, percent: stats.totalSlots ? Math.round((stats.reserved / stats.totalSlots) * 100) : 0, color: 'text-amber-500', bg: 'bg-amber-500/10', hex: '#f59e0b' },
              { label: 'Bloqueado', value: stats.blocked, percent: stats.totalSlots ? Math.round((stats.blocked / stats.totalSlots) * 100) : 0, color: 'text-rose-500', bg: 'bg-rose-500/10', hex: '#f43f5e' },
              { label: 'Livre', value: stats.free, percent: stats.totalSlots ? Math.round((stats.free / stats.totalSlots) * 100) : 0, color: 'text-primary', bg: 'bg-primary/10', hex: '#3b82f6' },
            ];
            const current = statItems.find(s => s.label.toLowerCase() === selectedStat) || statItems[0];

            const pieData = [
              { name: 'Ocupado', value: stats.occupied, color: '#10b981' },
              { name: 'Reservado', value: stats.reserved, color: '#f59e0b' },
              { name: 'Bloqueado', value: stats.blocked, color: '#f43f5e' },
              { name: 'Livre', value: stats.free, color: '#3b82f6' },
            ].filter(d => d.value > 0);

            // Per-TEC breakdown
            const tecBreakdown = Object.entries(TEC_CONFIG).map(([tec, cfg]) => {
              const label = tec;
              const tecPosicoes = allPosicoes.filter(p => (p as any).estrutura === tec);
              const totalForTec = cfg.cols.length * cfg.levels * 30;
              let val = 0;
              if (selectedStat === 'total') val = totalForTec;
              else if (selectedStat === 'livre') val = totalForTec - tecPosicoes.length;
              else val = tecPosicoes.filter(p => p.status === selectedStat).length;
              return { tec: label, value: val, total: totalForTec, percent: totalForTec ? Math.round((val / totalForTec) * 100) : 0 };
            });

            return (
              <>
                <div className="px-8 sm:px-12 pt-10 sm:pt-14 pb-8 border-b border-white/5 bg-gradient-to-br from-white/10 to-transparent">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                     <div className={cn("p-6 rounded-[2rem] shadow-2xl ring-4 ring-white/10", current.bg, current.color)}>
                        <LayoutDashboard className="w-10 h-10" />
                     </div>
                     <div className="flex-1 text-center sm:text-left">
                        <DialogTitle className="text-2xl font-semibold tracking-tight leading-none">
                           {current.label}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-[0.3em] mt-3 opacity-60">
                           {current.value} Itens · {current.percent}% da Capacidade Total do CD
                        </DialogDescription>
                     </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-10 space-y-8 sm:space-y-12 bg-card/20">
                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                    {/* General Distribution (Pie Chart) */}
                    <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-xl ring-1 ring-white/5 flex flex-col items-center">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8 self-start">Ocupação Geral do CD</h4>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={95}
                              paddingAngle={8}
                              dataKey="value"
                              animationBegin={200}
                              animationDuration={1200}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                            <ChartTooltip 
                              contentStyle={{ background: 'rgba(0,0,0,0.85)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '12px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Custom Legend */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 w-full px-4">
                        {pieData.map((d) => (
                          <div key={d.name} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{d.name}</span>
                            <span className="text-[10px] font-black ml-auto tabular-nums">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Per-TEC Breakdown (Bar Chart) */}
                    <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-xl ring-1 ring-white/5">
                      <div className="flex items-center justify-between mb-8">
                         <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Distribuição por Estrutura</h4>
                         <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-3 border-white/10 opacity-60">Status: {current.label}</Badge>
                      </div>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tecBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis 
                              dataKey="tec" 
                              fontSize={9} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 900 }} 
                            />
                            <YAxis 
                              fontSize={9} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 900 }} 
                            />
                            <ChartTooltip
                              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                              contentStyle={{ background: 'rgba(0,0,0,0.85)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '12px' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: number, _name: string, props: any) => [`${value} POSIÇÕES`, `ESTRUTURA ${props.payload.tec}`]}
                            />
                            <Bar 
                              dataKey="value" 
                              radius={[10, 10, 0, 0]} 
                              fill={current.hex === '#ffffff' ? 'hsl(var(--primary))' : current.hex}
                              minPointSize={4}
                              animationDuration={1500}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    {tecBreakdown.map((t) => (
                      <div key={t.tec} className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-lg group hover:border-primary/30 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1">
                         <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-50 group-hover:opacity-100 transition-opacity">{t.tec}</div>
                         <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter tabular-nums mb-1">{t.value}</div>
                         <div className="flex items-center gap-2">
                           <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary/40" style={{ width: `${t.percent}%` }} />
                           </div>
                           <div className="text-[9px] font-black text-primary uppercase">{t.percent}%</div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>


      {/* Confirmação Dar Saída */}
      <AlertDialog open={confirmSaida} onOpenChange={setConfirmSaida}>
        <AlertDialogContent className="border-border/40 bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
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
        <AlertDialogContent className="border-border/40 bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
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

      {/* Scan Mode Dialog */}
      <Dialog open={scanMode} onOpenChange={setScanMode}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight">Saída por Bipagem</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                  Bipe ou digite o <strong>Lote Final</strong> do tecido para dar saída
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground ml-1">Lote Final (Bipagem)</label>
              <div className="flex gap-2">
                <Input
                  ref={scanRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleScanSubmit(); }}
                  placeholder="Ex: TEC01.A.N03 PROC 12345 18,2M"
                  className="h-12 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all font-mono text-sm"
                  autoFocus
                />
                <Button
                  onClick={handleScanSubmit}
                  disabled={scanning || !scanInput.trim()}
                  className="h-12 px-6 rounded-xl font-black bg-violet-600 hover:bg-violet-700 shrink-0"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>
            </div>

            {scanResult && (
              <div className={`p-4 rounded-xl border ${
                scanResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-2 text-sm font-bold">
                  {scanResult.success ? <CheckCircle2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  {scanResult.message}
                </div>
                {scanResult.success && scanResult.item && (
                  <div className="mt-2 text-xs font-mono text-muted-foreground">
                    Lote Final: {scanResult.item.lote_sistema}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Scan Saida */}
      <AlertDialog open={!!confirmScan} onOpenChange={() => setConfirmScan(null)}>
        <AlertDialogContent className="border-border/40 bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black">Confirmar Saída por Bipagem</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground space-y-2">
              {confirmScan && (
                <>
                  <div>Tecido encontrado:</div>
                  <div className="bg-muted/20 p-3 rounded-lg space-y-1 text-foreground text-xs font-bold">
                    <div>Item: <span className="font-mono">{confirmScan.item}</span></div>
                    <div>Lote Final: <span className="font-mono text-primary">{confirmScan.lote_sistema}</span></div>
                    <div>Posição: {confirmScan.estrutura}.{confirmScan.coluna}.N{String(confirmScan.nivel).padStart(2, '0')} P{confirmScan.posicao}</div>
                    <div>M Linear: {confirmScan.m_linear}m | Largura: {confirmScan.largura}m</div>
                  </div>
                  <div>Deseja confirmar a saída deste tecido?</div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-violet-600 hover:bg-violet-700" onClick={executeScanSaida}>
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImportComplete={loadPosicoes} />
    </motion.div>
  );
}
