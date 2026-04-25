import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Package, MapPin, Layers, ArrowRightLeft, Trash2, ChevronRight, Box, Grid3X3, Info, LogOut, Upload, ScanBarcode, Loader2, CheckCircle2, Archive, Calendar, TreePine, Waves, FileText, Scale, Ruler, Truck, Palette, DollarSign, History, Tag, Edit, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import MadeiraEstoque from '@/components/estoque/MadeiraEstoque';
import { Card, CardContent } from '@/components/ui/card';
import { StatDetailModal } from '@/components/dashboard/StatDetailModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePerformance } from '@/hooks/use-performance';
import ImportDialog from '@/components/estoque/ImportDialog';
import MadeiraImportDialog from '@/components/estoque/MadeiraImportDialog';
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
  conferente_saida: string;
  data_registro: string | null;
  data_saida: string | null;
  registro_id: string | null;
  avaria_foto_url?: string | null;
  composicao?: string;
  gramatura?: number;
  largura_util?: number;
  fornecedor?: string;
  codigo_cor?: string;
  preco_metro?: number;
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

// Constant: total physical slots across all TECs (computed once)
const TOTAL_SLOTS = Object.values(TEC_CONFIG).reduce((acc, { cols, levels }) => acc + (cols.length * levels * 30), 0);

// Reuse centralized formatter
import { formatDateBR } from '@/lib/app-utils';

export default function EstoquePage() {
  const { isGuest } = useAuth();
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
  const [madeiraImportOpen, setMadeiraImportOpen] = useState(false);
  const [madeiraVersion, setMadeiraVersion] = useState(0);
  const [statModal, setStatModal] = useState<{ isOpen: boolean; title: string; value: string | number; type: string; stats?: any[] } | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ item: any; success: boolean; message: string } | null>(null);
  const [confirmScan, setConfirmScan] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Posicao>>({});
  const scanRef = useRef<HTMLInputElement>(null);
  const { isLow } = usePerformance();

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const [posicoesForActiveTec, setPosicoesForActiveTec] = useState<Posicao[]>([]);

  const loadStats = useCallback(async () => {
    try {
      // Fetch id, status and estrutura to allow filtering and optimistic updates
      const { data, error } = await supabase.from('estoque_posicoes').select('id, status, estrutura, m2, m_linear, data_registro, item, estoque_minimo, gramatura, largura_util');
      if (error) throw error;
      setAllPosicoes((data as any[]) || []);
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
    }
  }, []);

  const loadPosicoes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estoque_posicoes')
        .select('*, registros(avaria_foto_url)')
        .eq('estrutura', activeTec);
      
      if (error) throw error;
      
      // Flatten the join result
      const flattened = (data as any[]).map(p => ({
        ...p,
        avaria_foto_url: p.registros?.avaria_foto_url
      }));
      
      setPosicoesForActiveTec(flattened as Posicao[]);
    } catch (e) {
      console.error('Erro ao carregar estoque:', e);
      toast.error('Erro ao carregar dados do estoque');
    }
    setLoading(false);
  }, [activeTec]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadPosicoes(); }, [loadPosicoes]);

  const posicoes = posicoesForActiveTec;
  
  const stats = useMemo(() => {
    // Global stats across all structures
    const allItems = allPosicoes;
    const totalPhysicalSlotsAcrossAll = TOTAL_SLOTS;
    const globalOccupied = allItems.filter((p: any) => p.status === 'ocupado').length;
    const globalOccupancyRate = totalPhysicalSlotsAcrossAll ? (globalOccupied / totalPhysicalSlotsAcrossAll) * 100 : 0;

    // Stats for active TEC
    const currentStructureItems = allItems.filter((p: any) => p.estrutura === activeTec);
    const currentConfig = TEC_CONFIG[activeTec];
    const structureSlots = currentConfig ? currentConfig.cols.length * currentConfig.levels * 30 : 0;

    let occupied = 0, blocked = 0, reserved = 0, exited = 0;
    let totalM2 = 0, totalMLinear = 0, totalWeight = 0;
    let criticalItems = 0;
    let stagnantItems = 0;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    for (let i = 0, len = currentStructureItems.length; i < len; i++) {
      const p = currentStructureItems[i] as any;
      const s = p.status;
      if (s === 'ocupado') {
        occupied++;
        totalM2 += p.m2 || 0;
        totalMLinear += p.m_linear || 0;
        if (p.gramatura && p.largura_util && p.m_linear) {
          totalWeight += (p.gramatura / 1000) * p.largura_util * p.m_linear;
        }
        if (p.m_linear < (p.estoque_minimo || 5)) criticalItems++;
        if (p.data_registro && new Date(p.data_registro) < ninetyDaysAgo) stagnantItems++;
      }
      else if (s === 'bloqueado') blocked++;
      else if (s === 'reservado') reserved++;
      else if (s === 'saida') exited++;
    }
    
    const free = Math.max(0, structureSlots - occupied - blocked - reserved - exited);
    
    const tecBreakdown = Object.keys(TEC_CONFIG).map(tec => {
      const tecItems = allItems.filter((p: any) => p.estrutura === tec);
      const tecCfg = TEC_CONFIG[tec];
      const tecSlots = tecCfg.cols.length * tecCfg.levels * 30;
      const tecOccupied = tecItems.filter((p: any) => p.status === 'ocupado').length;
      const tecM2 = tecItems.filter((p: any) => p.status === 'ocupado').reduce((acc, p: any) => acc + (p.m2 || 0), 0);
      return { name: tec, occupied: tecOccupied, total: tecSlots, percent: tecSlots ? Math.round((tecOccupied / tecSlots) * 100) : 0, m2: tecM2 };
    });

    return { 
      totalSlots: structureSlots, occupied, blocked, reserved, exited, free,
      totalM2, totalMLinear, totalWeight, criticalItems, stagnantItems,
      globalOccupancyRate, tecBreakdown
    };
  }, [allPosicoes, activeTec]);

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
    loadStats();
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
      loadStats();
      toast.success('Item excluído');
    }
  };

  const handleSaveDetails = async () => {
    if (!detailPos) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('estoque_posicoes')
        .update(editForm as any)
        .eq('id', detailPos.id);

      if (error) throw error;

      toast.success('Informações atualizadas com sucesso');
      setIsEditing(false);
      loadPosicoes();
      setDetailPos(prev => prev ? { ...prev, ...editForm } : null);
    } catch (e: any) {
      console.error('Erro ao salvar detalhes:', e);
      toast.error('Erro ao salvar: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!detailPos) return;
    setEditForm({
      item: detailPos.item,
      composicao: detailPos.composicao || '',
      gramatura: detailPos.gramatura || 0,
      largura_util: detailPos.largura_util || 0,
      fornecedor: detailPos.fornecedor || '',
      codigo_cor: detailPos.codigo_cor || '',
      preco_metro: detailPos.preco_metro || 0,
      m_linear: detailPos.m_linear || 0,
      estoque_minimo: detailPos.estoque_minimo || 5,
    });
    setIsEditing(true);
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
    <>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">Estoque</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            onClick={() => category === 'madeira' ? setMadeiraImportOpen(true) : setImportOpen(true)} 
            variant="outline" 
            className="flex-1 sm:flex-none h-10 sm:h-11 px-4 font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Importar</span>
          </Button>
        </div>
      </div>

      {/* Categoria Tabs: Tecido / Madeira */}
      <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/30 max-w-md">
        {([
          { key: 'tecido', label: 'Tecido', Icon: Waves },
          { key: 'madeira', label: 'Madeira', Icon: TreePine },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              category === key
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {category === 'madeira' ? (
        <MadeiraEstoque key={madeiraVersion} />
      ) : (
        <>
      {/* Redesigned Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nível de Ocupação */}
        <Card className="border-border/30 bg-card/40 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                Capacidade
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black tabular-nums tracking-tight">
                {Math.round(stats.globalOccupancyRate)}<span className="text-sm font-bold text-muted-foreground ml-0.5">%</span>
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ocupação do Armazém</div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                  style={{ width: `${stats.globalOccupancyRate}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground/80">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {activeTec}: {Math.round((stats.occupied / stats.totalSlots) * 100)}%
                </span>
                <span>{stats.occupied}/{stats.totalSlots} slots</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume & Peso - Reformulado */}
        <Card className="border-border/30 bg-card/40 shadow-none group hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Box className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  2.4%
                </div>
                <Badge variant="outline" className="text-[10px] font-black border-blue-500/30 text-blue-500 bg-blue-500/5">
                  Volumetria
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-3xl font-black tabular-nums tracking-tight">
                {stats.totalM2.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<span className="text-sm font-bold text-muted-foreground ml-0.5">m²</span>
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Densidade de Volume Total</div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2 rounded-lg bg-muted/20 border border-border/10 space-y-0.5">
                <div className="text-sm font-black tabular-nums">{Math.round(stats.totalWeight).toLocaleString('pt-BR')} kg</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase">Peso Estimado</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 border border-border/10 space-y-0.5">
                <div className="text-sm font-black tabular-nums">{stats.totalMLinear.toLocaleString('pt-BR')} m</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase">M Lineares</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                <span className="text-muted-foreground">Distribuição</span>
                <span className="text-blue-500">Ocupado vs Livre</span>
              </div>
              <div className="h-1.5 w-full bg-muted/30 rounded-full flex overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${stats.globalOccupancyRate}%` }} />
                <div className="h-full bg-blue-500/20" style={{ width: `${100 - stats.globalOccupancyRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Desempenho */}
        <Card className="border-border/30 bg-card/40 shadow-none group hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-amber-500/30 text-amber-500 bg-amber-500/5">
                Performance
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Giro de Estoque</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black">2.4x</span>
                  <span className="text-[8px] font-bold text-emerald-500">+12%</span>
                </div>
              </div>
              <div className="flex items-center justify-between group/item cursor-pointer" onClick={() => setSelectedStat(selectedStat === 'critico' ? null : 'critico')}>
                <span className={`text-[10px] font-bold uppercase transition-colors ${selectedStat === 'critico' ? 'text-red-500' : 'text-muted-foreground group-hover/item:text-red-500'}`}>Itens Críticos</span>
                <Badge className={`h-5 px-1.5 border-red-500/20 text-[9px] font-black ring-offset-background group-hover/item:ring-1 ring-red-500/50 transition-all ${selectedStat === 'critico' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500'}`}>{stats.criticalItems}</Badge>
              </div>
              <div className="flex items-center justify-between group/item cursor-pointer" onClick={() => setSelectedStat(selectedStat === 'parado' ? null : 'parado')}>
                <span className={`text-[10px] font-bold uppercase transition-colors ${selectedStat === 'parado' ? 'text-slate-400' : 'text-muted-foreground group-hover/item:text-slate-400'}`}>Estoque Parado (+90d)</span>
                <Badge className={`h-5 px-1.5 border-slate-500/20 text-[9px] font-black ring-offset-background group-hover/item:ring-1 ring-slate-500/50 transition-all ${selectedStat === 'parado' ? 'bg-slate-500 text-white' : 'bg-slate-500/10 text-slate-500'}`}>{stats.stagnantItems}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo por Estrutura */}
        <Card className="border-border/30 bg-card/40 shadow-none">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Grid3X3 className="w-3 h-3" /> Resumo Estrutura
              </div>
              <span className="text-[9px] font-bold text-muted-foreground/60">{stats.tecBreakdown.length} TECs</span>
            </div>
            <div className="space-y-2 max-h-[110px] overflow-y-auto custom-scrollbar pr-1.5">
              {stats.tecBreakdown.map(tec => (
                <div 
                  key={tec.name} 
                  className={`flex items-center justify-between p-1.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all cursor-pointer ${activeTec === tec.name ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => setActiveTec(tec.name)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-black w-9">{tec.name}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          tec.percent > 90 ? 'bg-red-500' : tec.percent > 70 ? 'bg-amber-500' : 'bg-primary/80'
                        }`}
                        style={{ width: `${tec.percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-[10px] font-black tabular-nums">{tec.percent}%</div>
                    <div className="text-[7px] font-bold text-muted-foreground uppercase">{tec.m2.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m²</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                  const filteredItems = selectedStat === 'critico' 
                    ? items.filter(i => i.m_linear < (i.estoque_minimo || 5))
                    : selectedStat === 'parado'
                    ? items.filter(i => i.data_registro && new Date(i.data_registro) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
                    : selectedStat && selectedStat !== 'total' && selectedStat !== 'livre' 
                    ? items.filter(i => i.status === selectedStat)
                    : items;
                  
                  const fillPercent = Math.round((items.length / 30) * 100);
                  const hasItems = items.length > 0;
                  const matchesFilter = !selectedStat || selectedStat === 'total' || 
                                      (selectedStat === 'livre' && items.length < 30) ||
                                      (selectedStat === 'critico' && items.some(i => i.m_linear < (i.estoque_minimo || 5))) ||
                                      (selectedStat === 'parado' && items.some(i => i.data_registro && new Date(i.data_registro) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))) ||
                                      items.some(i => i.status === selectedStat);

                  return (
                    <div 
                      key={col} 
                      onClick={() => setSelectedCell({ col, nivel })} 
                      className={`flex-1 min-w-0 h-12 sm:h-16 md:h-[4.5rem] rounded-lg sm:rounded-xl cursor-pointer p-1.5 sm:p-2 md:p-2.5 transition-colors duration-150 group relative overflow-hidden border ${
                        !matchesFilter ? 'opacity-30' : ''
                      } ${
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
        </>
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
                  <div 
                    style={{ width: `${(occupiedCount/30)*100}%` }}
                    className={`h-full rounded-full transition-all ${
                      occupiedCount >= 25 ? 'bg-red-500' : occupiedCount >= 15 ? 'bg-amber-500' : 'bg-primary'
                    }`} 
                  />
                </div>
              </div>

              {/* Positions List/Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {occupiedCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-border/20 rounded-2xl bg-muted/5">
                    <Box className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Nenhum item nesta célula</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCellItems.sort((a, b) => a.posicao - b.posicao).map(item => {
                      const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.livre;
                      const isOutOfStock = item.m_linear <= 0;
                      const isLowStock = item.m_linear > 0 && item.m_linear < (item.estoque_minimo || 5);
                      const isReserved = item.status === 'reservado';

                      return (
                        <div key={item.id} className="bg-card border border-border/40 rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-0 group hover:border-primary/40 hover:shadow-lg transition-all duration-300 relative">
                          {/* Left Accent Status Bar */}
                          <div className={`w-1 shrink-0 ${
                            isOutOfStock ? 'bg-destructive' :
                            isLowStock ? 'bg-amber-500' :
                            isReserved ? 'bg-amber-400' :
                            'bg-emerald-500'
                          }`} />

                          {item.avaria_foto_url && (
                            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 border-b sm:border-b-0 sm:border-r border-border/10 relative overflow-hidden group/img">
                              <img 
                                src={item.avaria_foto_url} 
                                alt={item.item} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.avaria_foto_url!, '_blank');
                                }}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <ScanBarcode className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          )}

                          <div className="flex-1 p-5 flex flex-col gap-4">
                            {/* Top row: Status & Lote */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-sm ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} bg-white dark:bg-zinc-900`}>
                                  POS {String(item.posicao).padStart(2, '0')} · {statusCfg.label}
                                </Badge>
                                
                                {isOutOfStock && (
                                  <Badge variant="destructive" className="text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> ESGOTADO
                                  </Badge>
                                )}
                                
                                {isLowStock && (
                                  <Badge className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white border-none">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> ESTOQUE BAIXO
                                  </Badge>
                                )}

                                {isReserved && (
                                  <Badge className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 border-none">
                                    <Package className="w-3 h-3 mr-1" /> RESERVADO P/ PROD.
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-muted-foreground/40 font-mono tracking-tighter bg-muted/30 px-2 py-0.5 rounded">
                                {item.lote_sistema || 'S/ LOTE'}
                              </span>
                            </div>

                            {/* Main Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              <div className="md:col-span-8 space-y-1">
                                <h3 className="font-black text-foreground text-lg sm:text-xl tracking-tight leading-tight group-hover:text-primary transition-colors">
                                  {item.item || 'Tecido sem identificação'}
                                </h3>
                                <p className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-primary/60" />
                                  {item.composicao || 'Composição não informada'}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 pt-3 border-t border-border/5">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Fornecedor</span>
                                    <span className="text-xs font-black flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-primary/40" /> {item.fornecedor || '—'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Cor/Lote</span>
                                    <span className="text-xs font-black flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-primary/40" /> {item.codigo_cor || '—'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Gramatura</span>
                                    <span className="text-xs font-black flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-primary/40" /> {item.gramatura ? `${item.gramatura} g/m²` : '—'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Largura Útil</span>
                                    <span className="text-xs font-black flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5 text-primary/40" /> {item.largura_util ? `${item.largura_util}m` : (item.largura ? `${item.largura}m` : '—')}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Available Yardage Spotlight */}
                              <div className="md:col-span-4 flex flex-col items-center md:items-end justify-center bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Disponível</span>
                                <div className="flex items-baseline gap-1">
                                  <span className={`text-3xl font-black tabular-nums tracking-tighter ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-amber-500' : 'text-primary'}`}>
                                    {item.m_linear}
                                  </span>
                                  <span className="text-sm font-black text-muted-foreground/60 uppercase">m</span>
                                </div>
                                <div className="text-[10px] font-bold text-muted-foreground/50 mt-1 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  R$ {item.preco_metro || '0,00'}/m
                                </div>
                              </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between mt-1 pt-4 border-t border-border/10">
                              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDateBR(item.data_registro)}</span>
                                <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {item.proc || 'Geral'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                      <History className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Histórico</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                      <Tag className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Gerar Etiqueta</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => setDetailPos(item)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar Saldo / Info</TooltipContent>
                                </Tooltip>

                                {!isGuest && (
                                  <Button
                                    onClick={() => {
                                      setDetailPos(item);
                                      handleStatusChange(item, 'saida');
                                    }}
                                    size="sm"
                                    className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider bg-zinc-900 dark:bg-white dark:text-zinc-950 hover:opacity-90 text-white gap-2 shadow-lg shadow-black/10 ml-2"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Saída
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Grid View Toggle or Helper */}
                <div className="mt-6 pt-4 border-t border-border/15 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{occupiedCount} Itens encontrados</span>
                  </div>
                  <p className="text-[9px] font-medium text-muted-foreground/40 italic">* Somente posições ocupadas são exibidas</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={!!detailPos} onOpenChange={() => { setDetailPos(null); setIsEditing(false); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
          {detailPos && (() => {
            const statusCfg = STATUS_CONFIG[detailPos.status] || STATUS_CONFIG.livre;
            const isOutOfStock = detailPos.m_linear <= 0;
            const isLowStock = detailPos.m_linear > 0 && detailPos.m_linear < (detailPos.estoque_minimo || 5);

            return (
              <>
                {/* Detail Header */}
                <div className="px-5 sm:px-8 pt-6 pb-5 border-b border-border/20 bg-muted/20 shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-sm">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-lg sm:text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                          {detailPos.item || 'Item sem identificação'}
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} bg-white dark:bg-zinc-900`}>
                            POS {String(detailPos.posicao).padStart(2, '0')} · {statusCfg.label}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground/60">
                            {detailPos.estrutura} · {detailPos.coluna} · N{String(detailPos.nivel).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl sm:text-3xl font-black tracking-tighter tabular-nums ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-amber-500' : 'text-primary'}`}>
                          {detailPos.m_linear}
                        </span>
                        <span className="text-[10px] font-black text-muted-foreground/50 uppercase">metros</span>
                      </div>
                      {isLowStock && (
                        <Badge className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white border-none animate-pulse">
                          ESTOQUE BAIXO
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <div className="p-5 sm:p-8 space-y-8">
                    {isEditing ? (
                      /* EDITING FORM */
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Tecido</label>
                            <Input 
                              value={editForm.item || ''} 
                              onChange={e => setEditForm({ ...editForm, item: e.target.value })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Composição</label>
                            <Input 
                              value={editForm.composicao || ''} 
                              onChange={e => setEditForm({ ...editForm, composicao: e.target.value })}
                              placeholder="Ex: 100% Algodão"
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gramatura (g/m²)</label>
                            <Input 
                              type="number"
                              value={editForm.gramatura || ''} 
                              onChange={e => setEditForm({ ...editForm, gramatura: Number(e.target.value) })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Largura Útil (m)</label>
                            <Input 
                              type="number"
                              step="0.01"
                              value={editForm.largura_util || ''} 
                              onChange={e => setEditForm({ ...editForm, largura_util: Number(e.target.value) })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fornecedor</label>
                            <Input 
                              value={editForm.fornecedor || ''} 
                              onChange={e => setEditForm({ ...editForm, fornecedor: e.target.value })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cor / Lote</label>
                            <Input 
                              value={editForm.codigo_cor || ''} 
                              onChange={e => setEditForm({ ...editForm, codigo_cor: e.target.value })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Preço por Metro (R$)</label>
                            <Input 
                              type="number"
                              step="0.01"
                              value={editForm.preco_metro || ''} 
                              onChange={e => setEditForm({ ...editForm, preco_metro: Number(e.target.value) })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ponto de Pedido (Mínimo)</label>
                            <Input 
                              type="number"
                              value={editForm.estoque_minimo || ''} 
                              onChange={e => setEditForm({ ...editForm, estoque_minimo: Number(e.target.value) })}
                              className="h-11 rounded-xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            className="flex-1 h-12 rounded-xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            onClick={handleSaveDetails}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                            Salvar Alterações
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-12 px-6 rounded-xl font-black border-border/50"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* VIEW MODE */
                      <>
                        {/* Technical Specs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { label: 'Composição', value: detailPos.composicao || 'Não informada', icon: Layers },
                            { label: 'Fornecedor', value: detailPos.fornecedor || 'Não informado', icon: Truck },
                            { label: 'Lote / Cor', value: detailPos.codigo_cor || 'Não informado', icon: Palette },
                            { label: 'Gramatura', value: detailPos.gramatura ? `${detailPos.gramatura} g/m²` : 'Não informada', icon: Scale },
                            { label: 'Largura Útil', value: detailPos.largura_util ? `${detailPos.largura_util}m` : (detailPos.largura ? `${detailPos.largura}m` : 'Não informada'), icon: Ruler },
                            { label: 'Preço/m', value: detailPos.preco_metro ? `R$ ${detailPos.preco_metro.toFixed(2)}` : 'Não informado', icon: DollarSign },
                            { label: 'Lote Sistema', value: detailPos.lote_sistema || 'S/ Lote', icon: ScanBarcode },
                            { label: 'Lote Origem', value: detailPos.lote || 'S/ Lote', icon: Tag },
                            { label: 'Entrada', value: formatDateBR(detailPos.data_registro), icon: Calendar },
                          ].map((f, idx) => (
                            <div key={idx} className="bg-muted/10 border border-border/10 rounded-2xl p-4 flex flex-col gap-1.5 hover:bg-muted/15 transition-colors group/item">
                              <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
                                <f.icon className="w-3.5 h-3.5 text-primary/40 group-hover/item:text-primary transition-colors" />
                                {f.label}
                              </div>
                              <div className="text-sm font-black text-foreground/90 truncate">{f.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Image & Photo Section */}
                        {detailPos.avaria_foto_url && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Registro Fotográfico</label>
                              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-wider" onClick={() => window.open(detailPos.avaria_foto_url!, '_blank')}>
                                Ver em Tela Cheia
                              </Button>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-border/20 bg-muted/5 group/photo relative cursor-zoom-in">
                              <img 
                                src={detailPos.avaria_foto_url} 
                                alt={detailPos.item} 
                                className="w-full h-auto max-h-72 object-contain transition-transform duration-700 group-hover/photo:scale-105"
                                onClick={() => window.open(detailPos.avaria_foto_url!, '_blank')}
                              />
                            </div>
                          </div>
                        )}

                        {/* Status Management */}
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border/20" />
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Gestão de Status</span>
                            <div className="h-px flex-1 bg-border/20" />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(['ocupado', 'reservado', 'bloqueado'] as const).map(st => {
                              const cfg = STATUS_CONFIG[st];
                              const isActive = detailPos.status === st;
                              const theme = 
                                st === 'ocupado' ? { border: 'border-emerald-500/20', active: 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20', hover: 'hover:border-emerald-500/40 text-emerald-600' } :
                                st === 'bloqueado' ? { border: 'border-red-500/20', active: 'bg-red-500 text-white border-red-500 shadow-red-500/20', hover: 'hover:border-red-500/40 text-red-600' } :
                                { border: 'border-amber-400/20', active: 'bg-amber-400 text-amber-950 border-amber-400 shadow-amber-400/20', hover: 'hover:border-amber-400/40 text-amber-600' };

                              return (
                                <Button 
                                  key={st} 
                                  onClick={() => handleStatusChange(detailPos, st)} 
                                  variant="outline"
                                  className={`h-11 text-[10px] font-black rounded-xl border-2 transition-all duration-300 uppercase tracking-wider ${
                                    isActive 
                                      ? `${theme.active} shadow-lg pointer-events-none` 
                                      : `bg-transparent border-border/20 text-muted-foreground ${theme.hover}`
                                  }`}
                                >
                                  {cfg.label}
                                </Button>
                              );
                            })}
                            {!isGuest && (
                              <Button 
                                onClick={() => handleStatusChange(detailPos, 'saida')} 
                                variant="outline"
                                className="h-11 text-[10px] font-black rounded-xl border-2 border-violet-500/20 bg-transparent text-violet-600 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all duration-300 uppercase tracking-wider shadow-sm"
                              >
                                <LogOut className="w-3.5 h-3.5 mr-2" />
                                Saída
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="flex items-center gap-3 pt-6 border-t border-border/10">
                          <Button 
                            className="flex-1 h-12 rounded-xl font-black bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform"
                            onClick={startEditing}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Informações
                          </Button>
                          {!isGuest && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  onClick={() => handleDelete(detailPos)} 
                                  className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir Registro</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </>
                    )}
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

      {/* Scan Mode Dialog */}
      <Dialog open={scanMode} onOpenChange={setScanMode}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">Saída por Bipagem</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                  Bipe ou digite o <strong>Lote Final</strong> do tecido para dar saída
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote Final (Bipagem)</label>
              <div className="flex gap-2">
                <Input
                  ref={scanRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleScanSubmit(); }}
                  placeholder={category === 'madeira' ? "Ex: MAD01.A.N01 PROC 12345" : "Ex: TEC01.A.N03 PROC 12345 18,2M"}
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
        <AlertDialogContent className="border-border/40 bg-card rounded-2xl">
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

      {/* Import Dialogs */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImportComplete={loadPosicoes} />
      <MadeiraImportDialog 
        open={madeiraImportOpen} 
        onOpenChange={setMadeiraImportOpen} 
        onImportComplete={() => setMadeiraVersion(v => v + 1)} 
      />
    </div>
    
      {statModal && (
        <StatDetailModal 
          isOpen={statModal.isOpen}
          onClose={() => setStatModal(null)}
          title={statModal.title}
          value={statModal.value}
          type={statModal.type}
          stats={statModal.stats}
          complementaryInfo={`Análise detalhada do estoque na estrutura ${activeTec}. As estatísticas refletem o estado atual das posições físicas.`}
        />
      )}
    </>
  );
}
