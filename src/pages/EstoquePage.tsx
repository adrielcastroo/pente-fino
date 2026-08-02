import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Package, MapPin, Layers, ArrowRightLeft, Trash2, ChevronRight, Box, Grid3X3, Info, LogOut, Upload, ScanBarcode, Loader2, CheckCircle2, Archive, Calendar, ArrowLeft, LayoutDashboard, Barcode, Warehouse, TrendingUp, TrendingDown } from 'lucide-react';
import { UltimasSaidasDialog } from '@/components/estoque/UltimasSaidasDialog';
import { TopTecidosBlocks } from '@/components/estoque/TopTecidosBlocks';

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
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { normalizarCodigo } from '@/lib/codigoFornecedor';
import { PageHeader } from '@/components/ui/page-header';


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
  deposito_atual?: string | null;
  m_linear_atual?: number | null;
  m2_atual?: number | null;
  auge_cd_item?: string | null;
}

const TEC_CONFIG: Record<string, { cols: string[]; levels: number }> = {
  TEC00: { cols: ['A', 'B'], levels: 10 },
  TEC01: { cols: ['A', 'B', 'C', 'D', 'E', 'F'], levels: 6 },
  TEC02: { cols: ['A', 'B'], levels: 4 },
  TEC03: { cols: ['A', 'B'], levels: 9 },
  TEC04: { cols: ['A', 'B', 'C'], levels: 5 },
  TEC05: { cols: ['A', 'B', 'C'], levels: 5 },
  'CHÃO': { cols: ['G'], levels: 1 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ocupado: { label: 'Ocupado', color: 'text-success', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  bloqueado: { label: 'Bloqueado', color: 'text-destructive', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  reservado: { label: 'Reservado', color: 'text-warning', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  transferido: { label: 'Em outro depósito', color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
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
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detailPos, setDetailPos] = useState<Posicao | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  // Drill-down dentro do dialog de estatísticas: estrutura selecionada no "Resumo por estrutura".
  const [drillTec, setDrillTec] = useState<string | null>(null);
  const [saidasOpen, setSaidasOpen] = useState(false);

  const [confirmSaida, setConfirmSaida] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ item: Posicao | null; success: boolean; message: string } | null>(null);
  const [confirmScan, setConfirmScan] = useState<Posicao | null>(null);
  const [recentSaidas, setRecentSaidas] = useState<Array<{ id: string; item: string; lote: string | null; endereco: string | null; m_linear: number | null; conferente_saida: string | null; data_saida: string | null }>>([]);
  const scanRef = useRef<HTMLInputElement>(null);
  const [locateQuery, setLocateQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isLow } = usePerformance();

  const config = TEC_CONFIG[activeTec] || { cols: [], levels: 0 };

  const [posicoesForActiveTec, setPosicoesForActiveTec] = useState<Posicao[]>([]);

  // Mapa de códigos (interno + fornecedor normalizado) → { codigo_interno, descricao }
  // Usado para exibir a DESCRIÇÃO do item cadastrado em vez do código do fornecedor,
  // facilitando a localização visual dos tecidos no estoque.
  const [itensMap, setItensMap] = useState<Map<string, { codigo_interno: string; descricao: string }>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('itens_cadastro')
          .select('codigo_interno, descricao, codigos_fornecedor_normalizado');
        if (error) throw error;
        if (cancelled) return;
        const map = new Map<string, { codigo_interno: string; descricao: string }>();
        for (const row of (data as any[]) || []) {
          const entry = { codigo_interno: row.codigo_interno, descricao: row.descricao || '' };
          const internoNorm = normalizarCodigo(row.codigo_interno);
          if (internoNorm) map.set(internoNorm, entry);
          for (const n of (row.codigos_fornecedor_normalizado || []) as string[]) {
            if (n && !map.has(n)) map.set(n, entry);
          }
        }
        setItensMap(map);
      } catch (e) {
        console.warn('Falha ao carregar itens_cadastro:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const resolveItemInfo = useCallback((raw: string | null | undefined) => {
    const norm = normalizarCodigo(raw || '');
    if (!norm) return null;
    return itensMap.get(norm) || null;
  }, [itensMap]);

  const describeItem = useCallback((raw: string | null | undefined): string => {
    const info = resolveItemInfo(raw);
    if (info?.descricao) return info.descricao;
    return (raw || '').trim();
  }, [resolveItemInfo]);

  const loadStats = useCallback(async () => {
    try {
      // Fetch status + estrutura + campos usados na busca global (cross-TEC).
      // Paginação obrigatória: o Data API do Supabase limita cada request a 1000 linhas,
      // então precisamos iterar em ranges até esgotar o resultado.
      const PAGE = 1000;
      let offset = 0;
      const all: any[] = [];
      // hard stop em 50 páginas (50k linhas) só como salvaguarda
      for (let i = 0; i < 50; i++) {
        const { data, error } = await supabase
          .from('estoque_posicoes')
          .select('id, status, estrutura, coluna, nivel, item, lote, lote_sistema, proc, endereco')
          .range(offset, offset + PAGE - 1);
        if (error) throw error;
        const batch = (data as any[]) || [];
        all.push(...batch);
        if (batch.length < PAGE) break;
        offset += PAGE;
      }
      setAllPosicoes(all);
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

  // Últimas saídas de lotes/tecidos — alimenta o card do dashboard do mapa.
  const loadRecentSaidas = useCallback(async () => {
    const { data, error } = await supabase
      .from('estoque_saidas')
      .select('id,item,lote,endereco,m_linear,conferente_saida,data_saida')
      .order('data_saida', { ascending: false, nullsFirst: false })
      .limit(8);
    if (!error && data) setRecentSaidas(data as any);
  }, []);

  useEffect(() => {
    loadRecentSaidas();
    const ch = supabase
      .channel('estoque-saidas-recent')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque_saidas' }, () => loadRecentSaidas())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadRecentSaidas]);

  // Atalho "/" para focar a busca (ignora quando já está em input/textarea).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t as any)?.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const posicoes = posicoesForActiveTec;
  // totalSlots is constant — compute once at module scope below
  const totalSlots = TOTAL_SLOTS;

  const stats = useMemo(() => {
    let occupied = 0, blocked = 0, reserved = 0, exited = 0, chao = 0;

    // `totalSlots` (TOTAL_SLOTS) representa apenas as posições do mapa 2D
    // (estruturas TECxx). Posições em "CHÃO" são área livre e ilimitada — se
    // entrarem na contagem, o ocupado fica maior que a capacidade real e as
    // porcentagens divergem do gráfico do dashboard.
    for (let i = 0, len = allPosicoes.length; i < len; i++) {
      const p = allPosicoes[i] as any;
      const estrutura = String(p.estrutura ?? '').trim().toUpperCase();
      if (!estrutura.startsWith('TEC')) {
        if (p.status === 'ocupado') chao++;
        continue;
      }
      const s = p.status;
      if (s === 'ocupado') occupied++;
      else if (s === 'bloqueado') blocked++;
      else if (s === 'reservado') reserved++;
      else if (s === 'saida') exited++;
    }

    const free = totalSlots - occupied - blocked - reserved; // Exited items are removed from DB, so they don't count against capacity
    return { totalSlots, occupied, blocked, reserved, exited, chao, free };
  }, [allPosicoes, totalSlots]);

  // Variação (entrada/saída) desde a última atualização dos dados — alimenta as setas dos cards.
  const prevStatsRef = useRef<{ occupied: number; free: number } | null>(null);
  const [deltas, setDeltas] = useState<{ occupied: number; free: number }>({ occupied: 0, free: 0 });
  useEffect(() => {
    if (!allPosicoes.length) return;
    const prev = prevStatsRef.current;
    if (prev) {
      const d = { occupied: stats.occupied - prev.occupied, free: stats.free - prev.free };
      if (d.occupied !== 0 || d.free !== 0) setDeltas(d);
    }
    prevStatsRef.current = { occupied: stats.occupied, free: stats.free };
  }, [stats.occupied, stats.free, allPosicoes.length]);




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

  // Normaliza: remove acentos, colapsa não-alfanuméricos em espaço, lowercase.
  const normalizeSearch = useCallback((s: string) => {
    return (s || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }, []);

  // Busca cross-TEC: retorna posições que casam com TODOS os tokens.
  // Considera item, descrição do cadastro, código interno, lote, lote_sistema,
  // processo, endereço e a própria estrutura (TEC).
  const searchMatches = useMemo(() => {
    const raw = locateQuery.trim();
    if (!raw) return null;
    const tokens = normalizeSearch(raw).split(' ').filter(Boolean);
    if (!tokens.length) return null;
    const out: Array<Posicao & { _desc: string; _interno: string }> = [];
    for (const p of allPosicoes as any[]) {
      const info = resolveItemInfo(p.item);
      const desc = info?.descricao || '';
      const interno = info?.codigo_interno || '';
      const hay = normalizeSearch(
        `${p.item ?? ''} ${desc} ${interno} ${p.lote ?? ''} ${p.lote_sistema ?? ''} ${p.proc ?? ''} ${p.endereco ?? ''} ${p.estrutura ?? ''} ${p.coluna ?? ''} N${String(p.nivel ?? '').padStart(2, '0')}`
      );
      if (tokens.every(t => hay.includes(t))) {
        out.push({ ...(p as Posicao), _desc: desc, _interno: interno });
      }
    }
    return out;
  }, [locateQuery, allPosicoes, resolveItemInfo, normalizeSearch]);

  // Células destacadas no TEC ativo.
  const matchingCells = useMemo(() => {
    if (!searchMatches) return null;
    const set = new Set<string>();
    for (const p of searchMatches) {
      if (p.estrutura === activeTec) set.add(`${p.coluna}-${p.nivel}`);
    }
    return set;
  }, [searchMatches, activeTec]);

  // Agrupa resultados por TEC para o dropdown.
  const searchByTec = useMemo(() => {
    if (!searchMatches) return null;
    const map = new Map<string, typeof searchMatches>();
    for (const p of searchMatches) {
      const arr = map.get(p.estrutura) || [];
      arr.push(p);
      map.set(p.estrutura, arr);
    }
    return map;
  }, [searchMatches]);



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
      className="max-w-full mx-auto space-y-4 pb-20 overflow-x-hidden min-w-0"
    >
      {/* Header */}
      <PageHeader title="Gestão de estoque" />


      {/* Stats Cards */}
      <div className="w-full pb-4 px-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 tablet-portrait:grid-cols-5 gap-3 sm:gap-4 tablet-portrait:gap-2">
          {[
            { key: 'total', label: 'Capacidade Total', value: stats.totalSlots, percent: 100, config: { color: 'text-foreground', bg: 'bg-card/40 shadow-2xl ring-1 ring-white/10', border: 'border-white/5' } },
            { key: 'ocupado', label: 'Ocupação Atual', value: stats.occupied, percent: stats.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0, config: { ...STATUS_CONFIG.ocupado, bg: 'bg-emerald-500/10 shadow-emerald-500/5', border: 'border-emerald-500/20' } },
            { key: 'livre', label: 'Posições Livres', value: stats.free, percent: stats.totalSlots ? Math.round((stats.free / stats.totalSlots) * 100) : 0, config: { color: 'text-primary', bg: 'bg-primary/5 shadow-primary/5', border: 'border-primary/20' } },
            { key: 'bloqueado', label: 'Bloqueado', value: stats.blocked, percent: stats.totalSlots ? Math.round((stats.blocked / stats.totalSlots) * 100) : 0, config: { ...STATUS_CONFIG.bloqueado, bg: 'bg-red-500/10 shadow-red-500/5', border: 'border-red-500/20' } },
            
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
              whileHover={{ y: -2 }}
            >
              <Card
                onClick={() => setSelectedStat(prev => prev === s.key ? null : s.key)}
                className={cn(
                  'rounded-lg border transition-all duration-200 cursor-pointer relative overflow-hidden group',
                  'shadow-sm hover:shadow-md hover:border-primary/40',
                  s.config.border,
                  s.config.bg,
                  selectedStat === s.key ? 'ring-2 ring-primary/60 border-primary/50' : '',
                  s.key === 'total' ? 'col-span-2 sm:col-span-1 tablet-portrait:col-span-1' : '',
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-4 sm:p-5 tablet-portrait:p-2 text-center space-y-1.5 sm:space-y-2 tablet-portrait:space-y-0.5 relative z-10">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={cn('text-xl sm:text-2xl lg:text-[26px] tablet-portrait:text-lg font-semibold tabular-nums tracking-tight leading-none', s.config.color)}>{s.value}</div>
                    {(s.key === 'ocupado' || s.key === 'livre') && (() => {
                      const d = s.key === 'ocupado' ? deltas.occupied : deltas.free;
                      if (!d) return null;
                      const Icon = d > 0 ? TrendingUp : TrendingDown;
                      return (
                        <span
                          className={cn('flex items-center gap-0.5 text-[10px] font-semibold tabular-nums', d > 0 ? 'text-emerald-500' : 'text-rose-500')}
                          title={d > 0 ? 'Aumentou desde a última atualização' : 'Diminuiu desde a última atualização'}
                        >
                          <Icon className="w-3 h-3" strokeWidth={2} />
                          {d > 0 ? `+${d}` : d}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-[9px] tablet-portrait:text-[8px] font-semibold text-muted-foreground uppercase tracking-[0.18em] opacity-70 group-hover:opacity-100 transition-opacity">{s.label}</div>

                  <div className="flex items-center justify-center gap-1.5 pt-1.5">
                    <div className="h-1 w-10 bg-muted-foreground/15 rounded-full overflow-hidden">
                       <div className={cn('h-full transition-all duration-500 ease-out', s.config.color.replace('text', 'bg'))} style={{ width: `${s.percent}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground/80 tabular-nums">{s.percent}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Últimas Saídas — substitui o antigo card "Reservado" */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2, ease: 'easeOut' }}
          >
            <Card
              onClick={() => setSaidasOpen(true)}
              className="rounded-lg border border-border/40 bg-card hover:bg-muted/40 transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md h-full"
            >
              <CardContent className="p-3 tablet-portrait:p-2 relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <LogOut className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.75} />
                    <span className="text-[9px] tablet-portrait:text-[8px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Últimas Saídas</span>
                  </div>
                  <span className="text-[10px] font-medium text-primary tabular-nums shrink-0">{recentSaidas.length}</span>
                </div>
                {recentSaidas.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground/60 italic">
                    Sem saídas recentes
                  </div>
                ) : (
                  <ul className="flex-1 space-y-1 overflow-hidden">
                    {recentSaidas.slice(0, 4).map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 text-[10px] leading-tight min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground" title={s.item || ''}>
                            {s.item || '—'}
                          </div>
                          <div className="truncate text-muted-foreground/70 tabular-nums">
                            {s.lote || s.endereco || '—'}
                            {s.m_linear ? ` · ${Number(s.m_linear).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}m` : ''}
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 tabular-nums shrink-0">
                          {s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Locate search — busca global cross-TEC */}
      <div className="relative">
        <div className="relative">
          <Input
            ref={searchInputRef}
            value={locateQuery}
            onChange={(e) => { setLocateQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (locateQuery) { setLocateQuery(''); setSearchOpen(false); }
                else { searchInputRef.current?.blur(); setSearchOpen(false); }
              } else if (e.key === 'Enter' && searchMatches && searchMatches.length > 0) {
                e.preventDefault();
                const first = searchMatches[0];
                if (first.estrutura !== activeTec) setActiveTec(first.estrutura);
                setTimeout(() => setSelectedCell({ col: first.coluna, nivel: first.nivel }), first.estrutura !== activeTec ? 120 : 0);
                setSearchOpen(false);
              }
            }}
            placeholder="Buscar em todos os TECs: item, descrição, código interno, lote, processo, endereço…  ( / )"
            className="h-11 sm:h-12 rounded-md bg-card/40 backdrop-blur-xl border-white/10 pl-4 pr-40 text-xs sm:text-sm"
          />
          {locateQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                {searchMatches?.length ?? 0} itens · {matchingCells?.size ?? 0} céls
              </Badge>
              <button
                type="button"
                onClick={() => { setLocateQuery(''); setSearchOpen(false); searchInputRef.current?.focus(); }}
                className="text-muted-foreground hover:text-foreground text-sm leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-white/5"
                aria-label="Limpar busca"
              >×</button>
            </div>
          )}
        </div>

        {/* Dropdown de resultados */}
        {searchOpen && locateQuery && searchMatches && (
          <div className="absolute z-30 mt-1 w-full rounded-md border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 max-h-[420px] overflow-y-auto">
            {searchMatches.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground text-center">
                Nada encontrado para <span className="text-foreground font-semibold">"{locateQuery}"</span>.
              </div>
            ) : (
              <>
                {Array.from(searchByTec!.entries())
                  .sort(([a], [b]) => (a === activeTec ? -1 : b === activeTec ? 1 : a.localeCompare(b)))
                  .map(([tec, items]) => (
                    <div key={tec} className="border-b border-white/5 last:border-b-0">
                      <div className="px-3 py-1.5 flex items-center justify-between bg-white/[0.02] sticky top-0">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">{tec}</span>
                        <span className="text-[10px] text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                      </div>
                      {items.slice(0, 25).map((p) => {
                        const label = p._desc || p.item || '—';
                        const addr = p.endereco || `${p.estrutura}.${p.coluna}.N${String(p.nivel).padStart(2, '0')}`;
                        const stCfg = STATUS_CONFIG[p.status];
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (p.estrutura !== activeTec) setActiveTec(p.estrutura);
                              setTimeout(() => setSelectedCell({ col: p.coluna, nivel: p.nivel }), p.estrutura !== activeTec ? 120 : 0);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-primary/10 flex items-center gap-3 border-t border-white/[0.03]"
                          >
                            <span className={cn('w-1.5 h-8 rounded-full shrink-0', stCfg?.bg || 'bg-muted/30')} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">{label}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                <span className="font-mono">{addr}</span>
                                {p._interno && p._interno !== label ? <> · cod. <span className="font-mono">{p._interno}</span></> : null}
                                {p.lote ? <> · lote {p.lote}</> : null}
                                {p.proc ? <> · {p.proc}</> : null}
                              </div>
                            </div>
                            <Badge variant="outline" className={cn('text-[9px] uppercase tracking-wider shrink-0', stCfg?.color)}>{stCfg?.label || p.status}</Badge>
                          </button>
                        );
                      })}
                      {items.length > 25 && (
                        <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-center bg-white/[0.02]">
                          +{items.length - 25} outros neste TEC — refine a busca
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
        {searchOpen && locateQuery && (
          <div className="fixed inset-0 z-20" onClick={() => setSearchOpen(false)} />
        )}
      </div>


      {/* TEC Tabs */}
      <div className="tec-tabs flex bg-card/60 rounded-md p-1 gap-1 border border-border/40 shadow-sm flex-wrap sm:flex-nowrap">
        {Object.keys(TEC_CONFIG).map(tec => {
          const isActive = activeTec === tec;
          return (
            <button
              key={tec}
              onClick={() => setActiveTec(tec)}
              aria-pressed={isActive}
              className={cn(
                'touch-target flex-1 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] py-2.5 sm:py-3 rounded-md text-[10px] sm:text-xs font-semibold tracking-widest uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {tec}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card/60 rounded-lg border border-border/40 shadow-sm">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
          </div>
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">Sincronizando grade…</span>
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
                <div key={col} className="flex-1 text-center text-[8px] sm:text-[10px] md:text-xs font-semibold text-primary uppercase tracking-[0.3em] py-2 bg-primary/5 rounded-md border border-primary/10 mb-2">
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
                <div className="w-10 sm:w-12 md:w-16 text-[8px] sm:text-[10px] md:text-xs font-semibold text-muted-foreground flex items-center justify-center bg-card/40 backdrop-blur-xl rounded-md shrink-0 border border-white/10 shadow-lg ring-1 ring-white/5">
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
                      className={`touch-cell flex-1 min-w-0 h-14 sm:h-20 md:h-24 rounded-md sm:rounded-md cursor-pointer p-2 sm:p-4 transition-all duration-300 group relative overflow-hidden border backdrop-blur-xl shadow-lg hover:shadow-primary/10 ${fillTone.bg} ${fillTone.border} ${
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
                         {items.length > 3 && <div className="text-[6px] font-semibold text-muted-foreground/50">+</div>}
                      </div>

                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">
                          {col}N{nivel}
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-lg sm:text-2xl font-semibold text-foreground tracking-tighter leading-none">
                            {items.length}
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground/40 font-semibold uppercase mb-0.5">/30</span>
                        </div>
                      </div>
                    </motion.div>
                      </HoverCardTrigger>
                      {hasItems && (
                        <HoverCardContent side="top" align="center" className="hidden lg:block w-72 p-0 border-white/10 bg-card/95 backdrop-blur-2xl rounded-md shadow-2xl">
                          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{activeTec}.{col}.N{String(nivel).padStart(2,'0')}</div>
                            <div className="text-[10px] font-semibold text-muted-foreground">{items.length}/30 · {fillPercent}%</div>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                            {items.slice(0, 6).sort((a,b) => a.posicao - b.posicao).map((it) => {
                              const statusColor = it.status === 'bloqueado' ? 'bg-red-500' : it.status === 'reservado' ? 'bg-amber-500' : 'bg-emerald-500';
                              return (
                                <div key={it.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
                                  <div className="text-[10px] font-semibold text-muted-foreground/70 shrink-0 w-7">P{String(it.posicao).padStart(2,'0')}</div>
                                  <div className="text-xs font-bold text-foreground truncate flex-1" title={it.item || ''}>{describeItem(it.item) || it.item || '—'}</div>
                                </div>
                              );
                            })}
                            {items.length > 6 && (
                              <div className="text-[10px] font-semibold text-muted-foreground/60 text-center py-1">+ {items.length - 6} itens</div>
                            )}
                          </div>
                          <div className="px-4 py-2 border-t border-white/5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 text-center">
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

      {/* ===== POSITIONS GRID DIALOG ===== */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border border-border bg-card overflow-hidden rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          {selectedCell && (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                      <Grid3X3 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-base font-semibold text-foreground truncate">
                        Célula {activeTec} · {selectedCell.col}N{String(selectedCell.nivel).padStart(2, '0')}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        {occupiedCount} de 30 posições ocupadas
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded shrink-0",
                    occupiedCount === 0 ? "border-border text-muted-foreground" :
                    occupiedCount >= 25 ? "border-destructive/40 text-destructive bg-destructive/5" :
                    "border-success/40 text-success bg-success/5"
                  )}>
                    {occupiedCount === 0 ? 'Vazia' : occupiedCount >= 25 ? 'Capacidade crítica' : `${Math.round((occupiedCount/30)*100)}% ocupado`}
                  </Badge>
                </div>
                {/* Occupation bar */}
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      occupiedCount >= 25 ? 'bg-destructive' : occupiedCount >= 15 ? 'bg-warning' : 'bg-primary'
                    )}
                    style={{ width: `${(occupiedCount/30)*100}%` }}
                  />
                </div>
              </div>

              {/* Positions List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 min-h-0">
                {occupiedCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 border border-dashed border-border rounded-md">
                    <Box className="w-6 h-6 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Nenhuma posição ocupada</p>
                  </div>
                ) : (
                  selectedCellItems.sort((a, b) => a.posicao - b.posicao).map((item) => {
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.livre;
                    const info = resolveItemInfo(item.item);
                    const titulo = info?.descricao || item.item || 'Item sem identificação';
                    const subCodigo = info?.codigo_interno || item.item;
                    return (
                      <div
                        key={item.id}
                        className="border border-border rounded-md p-3 sm:p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", statusCfg.color, statusCfg.border)}>
                                Pos {String(item.posicao).padStart(2, '0')} · {statusCfg.label}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                <Barcode className="w-3 h-3" />
                                {item.lote_sistema || 'S/ LOTE'}
                              </span>
                            </div>
                            <h3 className="font-medium text-sm text-foreground truncate" title={titulo}>{titulo}</h3>
                            {subCodigo && info?.descricao && (
                              <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">{subCodigo}</div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {item.proc || '—'}</span>
                              <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {item.m_linear}m × {item.largura}m</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateBR(item.data_registro)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button onClick={() => setDetailPos(item)} variant="outline" size="sm" className="h-8 text-xs">
                              Detalhes
                            </Button>
                            {!isGuest && (
                              <Button
                                onClick={() => { setDetailPos(item); handleStatusChange(item, 'saida'); }}
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                Dar saída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={!!detailPos} onOpenChange={() => setDetailPos(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border border-border bg-card overflow-hidden rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          {detailPos && (() => {
            const statusCfg = STATUS_CONFIG[detailPos.status] || STATUS_CONFIG.livre;
            const info = resolveItemInfo(detailPos.item);
            const titulo = info?.descricao || detailPos.item || 'Item sem identificação';
            const subCodigo = info?.codigo_interno || detailPos.item;
            return (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-base font-semibold text-foreground truncate" title={titulo}>{titulo}</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {subCodigo && info?.descricao ? `${subCodigo} · ` : ''}
                          {detailPos.estrutura}·{detailPos.coluna}·N{String(detailPos.nivel).padStart(2, '0')}·P{String(detailPos.posicao).padStart(2, '0')}
                        </DialogDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-1 rounded shrink-0", statusCfg.color, statusCfg.border)}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-md overflow-hidden">
                    {(() => {
                      const depAtual = detailPos.deposito_atual || null;
                      const depNome = depAtual === '01' ? '01 · Central'
                        : depAtual === '11' ? '11 · Central Provisório'
                        : depAtual ? `Depósito ${depAtual}` : '—';
                      const mlAtual = detailPos.m_linear_atual;
                      const mlOrig = detailPos.m_linear;
                      const mostraDiff = mlAtual != null && mlOrig != null && Math.abs((mlAtual as number) - (mlOrig as number)) > 0.01;
                      return [
                      { label: 'Lote Fábrica', value: detailPos.lote || '—' },
                      { label: 'Lote Sistema', value: detailPos.lote_sistema || '—' },
                      { label: 'Endereço', value: detailPos.endereco || '—' },
                      { label: 'Depósito Auge', value: depNome },
                      { label: 'Conferente', value: detailPos.conferente_entrada || '—' },
                      { label: 'Largura', value: detailPos.largura != null ? `${detailPos.largura} m` : '—' },
                      { label: 'Metragem Original', value: mlOrig != null ? `${mlOrig} m` : '—' },
                      { label: 'Metragem Atual', value: mlAtual != null ? `${mlAtual} m${mostraDiff ? ' ⚠' : ''}` : (mlOrig != null ? `${mlOrig} m` : '—'), highlight: mostraDiff },
                      { label: 'Área Total (m²)', value: (detailPos.m2_atual ?? detailPos.m2) != null ? `${detailPos.m2_atual ?? detailPos.m2}` : '—' },
                      { label: 'Data de Entrada', value: formatDateBR(detailPos.data_registro) },
                    ]; })().map((f) => (
                      <div key={f.label} className="bg-card p-3">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">{f.label}</div>
                        <div className={cn("text-sm font-medium break-words", (f as any).highlight ? "text-warning" : "text-foreground")}>{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Alterar status</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['ocupado', 'reservado', 'bloqueado'] as const).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const isActive = detailPos.status === st;
                        return (
                          <Button
                            key={st}
                            onClick={() => handleStatusChange(detailPos, st)}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className="h-9 text-xs gap-2 justify-start"
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              st === 'ocupado' ? "bg-success" : st === 'bloqueado' ? "bg-destructive" : "bg-warning"
                            )} />
                            {cfg.label}
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                          </Button>
                        );
                      })}
                      {!isGuest && (
                        <Button
                          onClick={() => handleStatusChange(detailPos, 'saida')}
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs gap-2 justify-start col-span-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Confirmar Saída
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(detailPos)}
                        className="w-full h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover permanentemente
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
      <Dialog open={!!selectedStat} onOpenChange={(o) => { if (!o) { setSelectedStat(null); setDrillTec(null); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl p-0 gap-0 border border-border bg-card overflow-hidden rounded-lg shadow-xl max-h-[90vh] flex flex-col relative">

          {selectedStat && (() => {
            const statItems: { label: string; value: number; percent: number; color: string; bg: string; hex: string }[] = [
              { label: 'Total', value: stats.totalSlots, percent: 100, color: 'text-foreground', bg: 'bg-muted', hex: 'hsl(var(--primary))' },
              { label: 'Ocupado', value: stats.occupied, percent: stats.totalSlots ? Math.round((stats.occupied / stats.totalSlots) * 100) : 0, color: 'text-success', bg: 'bg-emerald-500/10', hex: '#10b981' },
              { label: 'Reservado', value: stats.reserved, percent: stats.totalSlots ? Math.round((stats.reserved / stats.totalSlots) * 100) : 0, color: 'text-warning', bg: 'bg-amber-500/10', hex: '#f59e0b' },
              { label: 'Bloqueado', value: stats.blocked, percent: stats.totalSlots ? Math.round((stats.blocked / stats.totalSlots) * 100) : 0, color: 'text-destructive', bg: 'bg-rose-500/10', hex: '#f43f5e' },
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
                {/* Header ERP: título + subtítulo + ícone contido */}
                <div className="px-5 sm:px-6 py-4 border-b border-border bg-card">
                  <div className="flex items-center gap-3 pr-10">
                    <div className={cn("p-2 rounded-md", current.color)}>
                      <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight leading-tight">
                        {current.label}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        <span className="tabular-nums font-medium text-foreground">{current.value.toLocaleString('pt-BR')}</span> itens · {current.percent}% da capacidade total do CD
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-background/40">
                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Pie */}
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-foreground">Ocupação geral do CD</h4>
                        <Badge variant="outline" className="text-[10px] font-medium">Total {stats.totalSlots.toLocaleString('pt-BR')}</Badge>
                      </div>
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={62}
                              outerRadius={92}
                              paddingAngle={2}
                              dataKey="value"
                              animationBegin={100}
                              animationDuration={600}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--popover-foreground))', fontSize: '12px', padding: '6px 10px' }}
                              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-border/60">
                        {pieData.map((d) => (
                          <div key={d.name} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-muted-foreground">{d.name}</span>
                            <span className="ml-auto font-medium tabular-nums text-foreground">{d.value.toLocaleString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-foreground">Distribuição por estrutura</h4>
                        <Badge variant="outline" className="text-[10px] font-medium">
                          Status: <span className="ml-1 font-semibold">{current.label}</span>
                        </Badge>
                      </div>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tecBreakdown} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                            <XAxis
                              dataKey="tec"
                              fontSize={11}
                              axisLine={{ stroke: 'hsl(var(--border))' }}
                              tickLine={false}
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                              fontSize={11}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <ChartTooltip
                              cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--popover-foreground))', fontSize: '12px', padding: '6px 10px' }}
                              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                              formatter={(value: number, _name: string, props: any) => [`${value} posições`, `Estrutura ${props.payload.tec}`]}
                            />
                            <Bar
                              dataKey="value"
                              radius={[3, 3, 0, 0]}
                              fill={current.hex === 'hsl(var(--primary))' ? 'hsl(var(--primary))' : current.hex}
                              minPointSize={2}
                              animationDuration={700}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Analytics de tecidos — top ocupação e giro */}
                  {selectedStat === 'ocupado' && (
                    <TopTecidosBlocks posicoes={allPosicoes as any} describeItem={describeItem} />
                  )}

                  {/* Detailed Summary Cards */}
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">Resumo por estrutura</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {tecBreakdown.map((t) => (
                        <button
                          key={t.tec}
                          type="button"
                          onClick={() => setDrillTec(t.tec)}
                          className="text-left bg-card border border-border rounded-md p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium text-muted-foreground">{t.tec}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xl font-semibold text-foreground tabular-nums leading-none mb-2">{t.value.toLocaleString('pt-BR')}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${t.percent}%` }} />
                            </div>
                            <div className="text-[10px] font-medium text-muted-foreground tabular-nums">{t.percent}%</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* ===== DRILL-DOWN: itens da estrutura selecionada ===== */}
          {drillTec && (() => {
            const itens = (allPosicoes as any[])
              .filter(p => p.estrutura === drillTec && p.status !== 'saida' && (p.item || '').trim())
              .sort((a, b) => `${a.coluna}${a.nivel}`.localeCompare(`${b.coluna}${b.nivel}`));
            return (
              <div className="absolute inset-0 z-20 bg-card flex flex-col">
                <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center gap-3 pr-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setDrillTec(null)}
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold tracking-tight leading-tight">Estrutura {drillTec}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <span className="tabular-nums font-medium text-foreground">{itens.length}</span> tecidos posicionados
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-background/40">
                  {itens.length === 0 ? (
                    <div className="py-16 text-center text-xs text-muted-foreground">Nenhum tecido nesta estrutura.</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-card border-b border-border">
                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          <th className="text-left font-semibold px-4 py-2">Tecido</th>
                          <th className="text-left font-semibold px-4 py-2">Lote</th>
                          <th className="text-left font-semibold px-4 py-2 hidden sm:table-cell">Endereço</th>
                          <th className="text-right font-semibold px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((p) => {
                          const stCfg = STATUS_CONFIG[p.status];
                          return (
                            <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="px-4 py-2 max-w-[240px]">
                                <div className="font-medium text-foreground truncate">{describeItem(p.item) || p.item}</div>
                                {describeItem(p.item) !== p.item && (
                                  <div className="font-mono text-[10px] text-muted-foreground truncate">{p.item}</div>
                                )}
                              </td>
                              <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">{p.lote || p.lote_sistema || '—'}</td>
                              <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                                {p.endereco || `${p.estrutura}.${p.coluna}.N${String(p.nivel).padStart(2, '0')}`}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <Badge variant="outline" className={cn('text-[9px] uppercase tracking-wider', stCfg?.color)}>
                                  {stCfg?.label || p.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>



      {/* Confirmação Dar Saída */}
      <AlertDialog open={confirmSaida} onOpenChange={setConfirmSaida}>
        <AlertDialogContent className="border-border/40 bg-card rounded-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Confirmar Saída</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Isso removerá o item do estoque e arquivará o registro. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-md bg-violet-600 hover:bg-violet-700" onClick={() => { if (detailPos) executeSaida(detailPos); }}>
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação Excluir */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-border/40 bg-card rounded-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Excluir Item</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Deseja excluir este item do espaço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-md bg-destructive hover:bg-destructive/90" onClick={() => { if (detailPos) executeDelete(detailPos); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scan Mode Dialog */}
      <Dialog open={scanMode} onOpenChange={setScanMode}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-500">
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
                  className="h-12 rounded-md border-border/50 bg-muted/20 font-bold focus:bg-background transition-all font-mono text-sm"
                  autoFocus
                />
                <Button
                  onClick={handleScanSubmit}
                  disabled={scanning || !scanInput.trim()}
                  className="h-12 px-6 rounded-md font-semibold bg-violet-600 hover:bg-violet-700 shrink-0"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>
            </div>

            {scanResult && (
              <div className={`p-4 rounded-md border ${
                scanResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-success' 
                  : 'bg-red-500/10 border-red-500/20 text-destructive'
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
        <AlertDialogContent className="border-border/40 bg-card rounded-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Confirmar Saída por Bipagem</AlertDialogTitle>
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
            <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-md bg-violet-600 hover:bg-violet-700" onClick={executeScanSaida}>
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Últimas saídas — 15 baixas mais recentes */}
      <UltimasSaidasDialog open={saidasOpen} onOpenChange={setSaidasOpen} describeItem={describeItem} />

    </motion.div>
  );
}
