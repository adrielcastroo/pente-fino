import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TreePine, AlertTriangle, MapPin, Loader2, Package, Layers, Settings2, Box, ArrowRightLeft, Pencil, Save, X, Camera, LayoutGrid, List, Upload, BarChart3, Info } from 'lucide-react';
import MadeiraImportDialog from './MadeiraImportDialog';
import { lotesMestresService, type LoteMestre } from '@/services/lotesMestresService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell as RechartsCell } from 'recharts';
import { formatDateBR } from '@/lib/app-utils';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { MadeiraCard } from '../madeira/MadeiraCard';


interface MadeiraRow {
  id: string;
  item: string;
  nf: string;
  endereco: string | null;
  lote: string | null;
  lote_sistema: string | null;
  largura: number | null;
  m_linear: number | null;
  m2: number | null;
  tipo_tecido: string | null;
  lote_mestre_id: string | null;
  avaria_tipo: string | null;
  avaria_descricao: string | null;
  avaria_foto_url: string | null;
  created_at: string;
  edited_by: string | null;
}

interface Quadrante {
  id?: string;
  estrutura: string;
  coluna: string;
  nivel: number;
  tipo_ocupacao: 'lamina' | 'base';
  capacidade: number;
}

const AVARIA_LABELS: Record<string, string> = {
  riscado: 'Riscado',
  manchado: 'Manchado',
  quebrado: 'Quebrado',
  tonalidade: 'Tonalidade',
  outro: 'Outro',
};

const AVARIA_OPTIONS: { value: string; label: string }[] = [
  { value: 'manchado', label: 'Manchado' },
  { value: 'quebrado', label: 'Quebrado' },
  { value: 'tonalidade', label: 'Tonalidade' },
  { value: 'riscado', label: 'Riscado' },
  { value: 'outro', label: 'Outro (descreva)' },
];

const ESTRUTURA = 'MAD01';
const COLUNAS = ['A', 'B', 'C'];
const NIVEIS = 11;
const CAPACIDADE_LAMINA = 24;
const CAPACIDADE_BASE = 18;

// Build endereço string compatible with registros: MAD01.A.N01
const buildEnderecoPrefix = (col: string, nivel: number) =>
  `${ESTRUTURA}.${col}.N${String(nivel).padStart(2, '0')}`;

export default function MadeiraEstoque() {
  const conferente = useAppStore(s => s.conferente);
  const [rows, setRows] = useState<MadeiraRow[]>([]);
  const [lotes, setLotes] = useState<LoteMestre[]>([]);
  const [quadrantes, setQuadrantes] = useState<Record<string, Quadrante>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ col: string; nivel: number } | null>(null);
  const [detail, setDetail] = useState<MadeiraRow | null>(null);
  const [configCell, setConfigCell] = useState<{ col: string; nivel: number } | null>(null);
  const [confirmChange, setConfirmChange] = useState<{ col: string; nivel: number; newTipo: 'lamina' | 'base' } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const [editForm, setEditForm] = useState<{
    item: string;
    endereco: string;
    lote: string;
    lote_sistema: string;
    largura: string;
    m_linear: string;
    nf: string;
    lote_mestre_id: string | null;
    avaria_enabled: boolean;
    avaria_tipo: string | null;
    avaria_descricao: string;
    avaria_foto_url: string | null;
  }>({
    item: '', endereco: '', lote: '', lote_sistema: '', largura: '', m_linear: '', nf: '',
    lote_mestre_id: null, avaria_enabled: false, avaria_tipo: null, avaria_descricao: '', avaria_foto_url: null,
  });
  const [savingDetail, setSavingDetail] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [registrosRes, lotesData, quadrantesRes] = await Promise.all([
        supabase
          .from('registros')
          .select('id, item, nf, endereco, lote, lote_sistema, largura, m_linear, m2, tipo_tecido, lote_mestre_id, avaria_tipo, avaria_descricao, avaria_foto_url, created_at, edited_by')
          .eq('modo_origem', 'madeira')
          .order('created_at', { ascending: false }),
        lotesMestresService.list().catch(() => []),
        supabase.from('madeira_quadrantes').select('*').eq('estrutura', ESTRUTURA),
      ]);
      if (registrosRes.error) throw registrosRes.error;
      setRows((registrosRes.data as any[] as MadeiraRow[]) || []);
      setLotes(lotesData);
      const qMap: Record<string, Quadrante> = {};
      ((quadrantesRes.data as any[]) || []).forEach((q: any) => {
        qMap[`${q.coluna}-${q.nivel}`] = q;
      });
      setQuadrantes(qMap);
    } catch (e: any) {
      toast.error('Erro ao carregar madeira: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const lotesById = useMemo(() => {
    const m: Record<string, LoteMestre> = {};
    lotes.forEach(l => { m[l.id] = l; });
    return m;
  }, [lotes]);

  // Group registros by cell (col-nivel) using endereço prefix
  const cellMap = useMemo(() => {
    const map: Record<string, MadeiraRow[]> = {};
    for (const r of rows) {
      if (!r.endereco) continue;
      // Match MAD01.X.N0Y or just X.N0Y
      const match = r.endereco.match(/(?:MAD01\.)?([A-C])\.N0?(\d{1,2})/i);
      if (!match) continue;
      const col = match[1].toUpperCase();
      const nivel = parseInt(match[2], 10);
      if (!COLUNAS.includes(col) || nivel < 1 || nivel > NIVEIS) continue;
      const key = `${col}-${nivel}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [rows]);

  const getQuadrante = (col: string, nivel: number): Quadrante => {
    const existing = quadrantes[`${col}-${nivel}`];
    if (existing) return existing;
    return { estrutura: ESTRUTURA, coluna: col, nivel, tipo_ocupacao: 'lamina', capacidade: CAPACIDADE_LAMINA };
  };

  const stats = useMemo(() => {
    let totalCap = 0;
    let totalOcc = 0;
    let laminasCells = 0;
    let basesCells = 0;
    const totalCells = COLUNAS.length * NIVEIS;

    for (const col of COLUNAS) {
      for (let nivel = 1; nivel <= NIVEIS; nivel++) {
        const q = getQuadrante(col, nivel);
        totalCap += q.capacidade;
        totalOcc += (cellMap[`${col}-${nivel}`] || []).length;
        if (q.tipo_ocupacao === 'lamina') laminasCells++;
        else basesCells++;
      }
    }
    
    const avariasCount = rows.filter(r => r.avaria_tipo).length;

    return {
      totalItens: rows.length,
      avarias: avariasCount,
      capacidade: totalCap,
      ocupacao: totalOcc,
      laminasCells,
      basesCells,
      totalCells,
      percentOcupacao: totalCap ? Math.round((totalOcc / totalCap) * 100) : 0,
      percentLaminas: totalCells ? Math.round((laminasCells / totalCells) * 100) : 0,
      percentBases: totalCells ? Math.round((basesCells / totalCells) * 100) : 0,
      percentAvarias: rows.length ? Math.round((avariasCount / rows.length) * 100) : 0,
    };
  }, [cellMap, quadrantes, rows]);

  const saveQuadrante = async (col: string, nivel: number, novoTipo: 'lamina' | 'base') => {
    const novaCap = novoTipo === 'lamina' ? CAPACIDADE_LAMINA : CAPACIDADE_BASE;
    const itensAtuais = (cellMap[`${col}-${nivel}`] || []).length;

    if (itensAtuais > novaCap) {
      toast.error(`Não é possível alterar: já existem ${itensAtuais} itens (capacidade ${novoTipo} = ${novaCap})`);
      return;
    }

    const payload = {
      estrutura: ESTRUTURA,
      coluna: col,
      nivel,
      tipo_ocupacao: novoTipo,
      capacidade: novaCap,
      updated_by: conferente || 'Sistema',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('madeira_quadrantes' as any)
      .upsert(payload, { onConflict: 'estrutura,coluna,nivel' });

    if (error) {
      toast.error('Erro ao salvar configuração: ' + error.message);
      return;
    }

    setQuadrantes(prev => ({
      ...prev,
      [`${col}-${nivel}`]: { ...payload } as Quadrante,
    }));
    toast.success(`Quadrante ${col}.N${String(nivel).padStart(2, '0')} → ${novoTipo === 'lamina' ? 'Lâmina (24)' : 'Base (18)'}`);
    setConfirmChange(null);
    setConfigCell(null);
  };

  const handleTipoClick = (col: string, nivel: number, novoTipo: 'lamina' | 'base') => {
    const atual = getQuadrante(col, nivel);
    if (atual.tipo_ocupacao === novoTipo) {
      // First time configuration with no real change → just persist
      saveQuadrante(col, nivel, novoTipo);
      return;
    }
    // Different type → ask confirmation
    setConfirmChange({ col, nivel, newTipo: novoTipo });
  };

  const selectedCellItems = selectedCell ? (cellMap[`${selectedCell.col}-${selectedCell.nivel}`] || []) : [];
  const selectedQuadrante = selectedCell ? getQuadrante(selectedCell.col, selectedCell.nivel) : null;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'total', label: 'Itens', value: stats.totalItens, percent: 100, color: 'text-foreground', bg: 'bg-card/40', border: 'border-border/30' },
          { key: 'capacidade', label: 'Capacidade', value: stats.capacidade, percent: 100, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
          { key: 'ocupacao', label: 'Ocupação', value: stats.ocupacao, percent: stats.percentOcupacao, color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
          { key: 'lamina', label: 'Lâmina', value: stats.laminasCells, percent: stats.percentLaminas, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
          { key: 'base', label: 'Base', value: stats.basesCells, percent: stats.percentBases, color: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-violet-500/20' },
          { key: 'avarias', label: 'Avarias', value: stats.avarias, percent: stats.percentAvarias, color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' },
        ].map(s => (
          <Card 
            key={s.label} 
            onClick={() => setSelectedStat(prev => prev === s.key ? null : s.key)}
            className={`border ${s.border} ${s.bg} shadow-none hover:scale-[1.02] transition-all duration-150 cursor-pointer hover:shadow-md ${
              selectedStat === s.key ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background' : ''
            }`}
          >
            <CardContent className="p-4 text-center space-y-1">
              <div className={`text-2xl sm:text-3xl font-black tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{s.label}</div>
              <div className="text-[10px] font-semibold text-muted-foreground/70">{s.percent}%</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estrutura tab & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/30 w-full sm:w-auto">
          <button className="flex-1 px-6 py-2.5 rounded-lg text-xs font-black tracking-wide bg-primary text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center gap-2 min-w-[120px]">
            <TreePine className="w-4 h-4" />
            {ESTRUTURA}
          </button>
        </div>

        <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/30 w-full sm:w-auto">
          <button 
            onClick={() => setViewMode('map')}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              viewMode === 'map' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Mapa
          </button>
          <button 
            onClick={() => setViewMode('cards')}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              viewMode === 'cards' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-4 h-4" />
            Cards
          </button>
        </div>
      </div>


      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border/30 bg-muted/20 text-[11px]">
        <span className="font-black uppercase tracking-widest text-muted-foreground">Legenda:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
          Lâmina (24)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-violet-500/30 border border-violet-500/50" />
          Base (18)
        </span>
        <span className="text-muted-foreground/70 ml-auto hidden sm:inline">Clique no quadrante para ver itens · ⚙ para configurar</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Carregando madeira...</span>
        </div>
      ) : viewMode === 'map' ? (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-full space-y-1.5">
            {/* Column headers */}
            <div className="flex gap-1.5">
              <div className="w-10 sm:w-14 shrink-0" />
              {COLUNAS.map(col => (
                <div key={col} className="flex-1 text-center text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest py-1">
                  {col}
                </div>
              ))}
            </div>
            {Array.from({ length: NIVEIS }, (_, i) => NIVEIS - i).map(nivel => (
              <div key={nivel} className="flex gap-1.5">
                <div className="w-10 sm:w-14 text-[8px] sm:text-[10px] font-black text-muted-foreground flex items-center justify-center bg-muted/40 dark:bg-muted/20 rounded-lg shrink-0 border border-border/40">
                  N{String(nivel).padStart(2, '0')}
                </div>
                {COLUNAS.map(col => {
                  const q = getQuadrante(col, nivel);
                  const items = cellMap[`${col}-${nivel}`] || [];
                  const filteredItems = selectedStat === 'avarias' 
                    ? items.filter(r => r.avaria_tipo)
                    : items;
                  
                  const isLamina = q.tipo_ocupacao === 'lamina';
                  const isBase = q.tipo_ocupacao === 'base';
                  
                  const isDimmed = (selectedStat === 'lamina' && !isLamina) || (selectedStat === 'base' && !isBase);

                  const fillPercent = Math.min(100, Math.round((filteredItems.length / q.capacidade) * 100));
                  const colorBase = isLamina
                    ? 'bg-emerald-500/8 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/15'
                    : 'bg-violet-500/8 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/15';
                  const fillBar = isLamina ? 'bg-emerald-500/20' : 'bg-violet-500/20';

                  return (
                    <div
                      key={col}
                      className={`flex-1 min-w-0 h-16 sm:h-20 rounded-xl cursor-pointer p-2 sm:p-2.5 transition-all duration-150 group relative overflow-hidden border ${colorBase} ${isDimmed ? 'opacity-20 grayscale scale-[0.98]' : ''} ${selectedStat === 'avarias' && filteredItems.length > 0 ? 'ring-2 ring-red-500/50' : ''}`}
                      onClick={() => setSelectedCell({ col, nivel })}
                    >
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${fillBar}`}
                        style={{ height: `${fillPercent}%` }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfigCell({ col, nivel }); }}
                        className="absolute top-1 right-1 z-20 p-1 rounded-md bg-background/60 border border-border/40 opacity-60 hover:opacity-100 hover:bg-background transition"
                        title="Configurar quadrante"
                      >
                        <Settings2 className="w-3 h-3" />
                      </button>
                      <div className="relative z-10">
                        <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight text-muted-foreground/80">
                          {col}-N{nivel}
                        </div>
                        <div className="text-sm sm:text-base font-black text-foreground mt-0.5 tabular-nums">
                          {selectedStat === 'avarias' ? filteredItems.length : items.length}
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-semibold ml-0.5">/{q.capacidade}</span>
                        </div>
                        <div className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider mt-0.5 ${isLamina ? 'text-emerald-500' : 'text-violet-500'}`}>
                          {isLamina ? 'Lâmina' : 'Base'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.filter(r => {
            if (selectedStat === 'avarias') return !!r.avaria_tipo;
            return true;
          }).map(r => (
            <MadeiraCard
              key={r.id}
              item={r}
              loteMestre={r.lote_mestre_id ? lotesById[r.lote_mestre_id] : undefined}
              onClick={() => setDetail(r)}
            />
          ))}
          {rows.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border/30 rounded-2xl bg-muted/10">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Nenhum item encontrado</p>
            </div>
          )}
        </div>
      )}


      {/* ===== CELL ITEMS DIALOG ===== */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl">
          {selectedCell && selectedQuadrante && (
            <>
              <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/20 bg-muted/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${selectedQuadrante.tipo_ocupacao === 'lamina' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-violet-500/10 border-violet-500/30 text-violet-500'}`}>
                      <TreePine className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-lg sm:text-xl font-black tracking-tight">
                        {ESTRUTURA} · Coluna {selectedCell.col} · N{String(selectedCell.nivel).padStart(2, '0')}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                        {selectedCellItems.length} de {selectedQuadrante.capacidade} ({selectedQuadrante.tipo_ocupacao === 'lamina' ? 'Lâmina' : 'Base'})
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setConfigCell(selectedCell); }}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 mr-12 shrink-0"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Configurar</span>
                  </Button>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    style={{ width: `${(selectedCellItems.length / selectedQuadrante.capacidade) * 100}%` }}
                    className={`h-full rounded-full transition-all ${selectedQuadrante.tipo_ocupacao === 'lamina' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {selectedCellItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-border/20 rounded-2xl bg-muted/5">
                    <Box className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">Quadrante vazio</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Distribution Summary Chart */}
                    <div className="p-4 rounded-xl border border-border/30 bg-muted/5">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Distribuição de M Linear</h4>
                      </div>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedCellItems.map(r => ({ name: r.item.slice(0, 10), m_linear: r.m_linear || 0 }))}>
                            <CartGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <ChartTooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="m_linear" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedCellItems.map(r => (
                        <MadeiraCard
                          key={r.id}
                          item={r}
                          loteMestre={r.lote_mestre_id ? lotesById[r.lote_mestre_id] : undefined}
                          onClick={() => { setSelectedCell(null); setDetail(r); }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CONFIG QUADRANTE DIALOG ===== */}
      <Dialog open={!!configCell} onOpenChange={(o) => !o && setConfigCell(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Configurar Quadrante
            </DialogTitle>
            <DialogDescription>
              {configCell && `${ESTRUTURA}.${configCell.col}.N${String(configCell.nivel).padStart(2, '0')} — escolha o tipo de ocupação`}
            </DialogDescription>
          </DialogHeader>
          {configCell && (() => {
            const q = getQuadrante(configCell.col, configCell.nivel);
            const itens = (cellMap[`${configCell.col}-${configCell.nivel}`] || []).length;
            return (
              <div className="space-y-3">
                <div className="text-[11px] text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border/30">
                  Atualmente: <strong className="text-foreground">{q.tipo_ocupacao === 'lamina' ? 'Lâmina' : 'Base'}</strong> ({itens}/{q.capacidade} ocupado)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTipoClick(configCell.col, configCell.nivel, 'lamina')}
                    className={`p-4 rounded-xl border-2 transition text-left space-y-1 ${
                      q.tipo_ocupacao === 'lamina'
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-border/40 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                    }`}
                  >
                    <Layers className="w-5 h-5 text-emerald-500" />
                    <div className="text-sm font-black">Lâmina</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">Capacidade: 24 cxs</div>
                  </button>
                  <button
                    onClick={() => handleTipoClick(configCell.col, configCell.nivel, 'base')}
                    className={`p-4 rounded-xl border-2 transition text-left space-y-1 ${
                      q.tipo_ocupacao === 'base'
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5'
                    }`}
                  >
                    <Package className="w-5 h-5 text-violet-500" />
                    <div className="text-sm font-black">Base</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">Capacidade: 18 cxs</div>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/70 text-center">
                  Você pode alterar o tipo de ocupação a qualquer momento.
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== CONFIRM CHANGE ===== */}
      <AlertDialog open={!!confirmChange} onOpenChange={(o) => !o && setConfirmChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              Confirmar alteração de tipo
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmChange && (() => {
                const q = getQuadrante(confirmChange.col, confirmChange.nivel);
                const itens = (cellMap[`${confirmChange.col}-${confirmChange.nivel}`] || []).length;
                const novaCap = confirmChange.newTipo === 'lamina' ? CAPACIDADE_LAMINA : CAPACIDADE_BASE;
                return (
                  <>
                    Alterar quadrante <strong>{ESTRUTURA}.{confirmChange.col}.N{String(confirmChange.nivel).padStart(2, '0')}</strong> de{' '}
                    <strong>{q.tipo_ocupacao === 'lamina' ? 'Lâmina (24)' : 'Base (18)'}</strong> para{' '}
                    <strong>{confirmChange.newTipo === 'lamina' ? 'Lâmina (24)' : 'Base (18)'}</strong>?
                    {itens > 0 && (
                      <div className="mt-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                        ⚠ Existem {itens} item(s) neste quadrante. {itens > novaCap && `A nova capacidade (${novaCap}) é menor — alteração será bloqueada.`}
                      </div>
                    )}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmChange && saveQuadrante(confirmChange.col, confirmChange.nivel, confirmChange.newTipo)}
            >
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== ITEM DETAIL ===== */}
      <Dialog open={!!detail} onOpenChange={o => { if (!o) { setDetail(null); setEditMode(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-emerald-400" />
                  {detail?.item || 'Item Madeira'}
                </DialogTitle>
                <DialogDescription>{editMode ? 'Editando registro' : 'Detalhes do registro de madeira'}</DialogDescription>
              </div>
              {detail && !editMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditForm({
                      item: detail.item || '', endereco: detail.endereco || '', lote: detail.lote || '',
                      lote_sistema: detail.lote_sistema || '', largura: detail.largura?.toString() || '',
                      m_linear: detail.m_linear?.toString() || '', nf: detail.nf || '',
                      lote_mestre_id: detail.lote_mestre_id, avaria_enabled: !!detail.avaria_tipo,
                      avaria_tipo: detail.avaria_tipo, avaria_descricao: detail.avaria_descricao || '',
                      avaria_foto_url: detail.avaria_foto_url,
                    });
                    setEditMode(true);
                  }}
                  className="h-8 mr-8 gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              )}
            </div>
          </DialogHeader>
          {detail && !editMode && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Endereço" value={detail.endereco || '—'} mono />
                <Field label="Tipo" value={detail.tipo_tecido || '—'} />
                <Field label="NF" value={detail.nf || '—'} />
                <Field label="Lote" value={detail.lote || '—'} />
                <Field label="Largura" value={detail.largura ? `${detail.largura} m` : '—'} />
                <Field label="M Linear" value={detail.m_linear ? `${detail.m_linear} m` : '—'} />
                <Field label="Conferente" value={detail.edited_by || '—'} />
                <Field label="Data" value={formatDateBR(detail.created_at)} />
              </div>
              {detail.lote_mestre_id && lotesById[detail.lote_mestre_id] && (
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-border/50" style={{ background: lotesById[detail.lote_mestre_id].cor_hex }} />
                  <span className="text-sm font-semibold">{lotesById[detail.lote_mestre_id].nome}</span>
                </div>
              )}
              {detail.avaria_tipo && (
                <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-bold text-destructive">
                      Avaria: {AVARIA_LABELS[detail.avaria_tipo] || detail.avaria_tipo}
                    </span>
                  </div>
                  {detail.avaria_descricao && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detail.avaria_descricao}</p>
                  )}
                  {detail.avaria_foto_url && (
                    <a href={detail.avaria_foto_url} target="_blank" rel="noreferrer" className="block">
                      <img src={detail.avaria_foto_url} alt="Avaria" className="w-full h-40 object-cover rounded-md border border-border/40" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          {detail && editMode && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Item</Label>
                  <Input value={editForm.item} onChange={e => setEditForm(f => ({ ...f, item: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Endereço</Label>
                  <Input value={editForm.endereco} onChange={e => setEditForm(f => ({ ...f, endereco: e.target.value }))} className="h-9 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">NF</Label>
                  <Input value={editForm.nf} onChange={e => setEditForm(f => ({ ...f, nf: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Lote</Label>
                  <Input value={editForm.lote} onChange={e => setEditForm(f => ({ ...f, lote: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Lote Sistema</Label>
                  <Input value={editForm.lote_sistema} onChange={e => setEditForm(f => ({ ...f, lote_sistema: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Largura (m)</Label>
                  <Input type="number" step="0.01" value={editForm.largura} onChange={e => setEditForm(f => ({ ...f, largura: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">M Linear</Label>
                  <Input type="number" step="0.01" value={editForm.m_linear} onChange={e => setEditForm(f => ({ ...f, m_linear: e.target.value }))} className="h-9" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Tonalidade (Lote Mestre)</Label>
                  <Select value={editForm.lote_mestre_id || 'none'} onValueChange={(v) => setEditForm(f => ({ ...f, lote_mestre_id: v === 'none' ? null : v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar tonalidade…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem tonalidade</SelectItem>
                      {lotes.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-border/50" style={{ background: l.cor_hex }} />
                            {l.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/10 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${editForm.avaria_enabled ? 'text-amber-500' : 'text-muted-foreground/60'}`} />
                    Reportar Avaria
                  </Label>
                  <button type="button" onClick={() => setEditForm(f => ({ ...f, avaria_enabled: !f.avaria_enabled }))}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition ${editForm.avaria_enabled ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' : 'border-border/40 text-muted-foreground'}`}>
                    {editForm.avaria_enabled ? 'Ativada' : 'Desativada'}
                  </button>
                </div>
                {editForm.avaria_enabled && (
                  <>
                    <Select value={editForm.avaria_tipo || ''} onValueChange={(v) => setEditForm(f => ({ ...f, avaria_tipo: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar tipo…" /></SelectTrigger>
                      <SelectContent>
                        {AVARIA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Descreva a avaria…" rows={2} value={editForm.avaria_descricao}
                      onChange={e => setEditForm(f => ({ ...f, avaria_descricao: e.target.value }))} className="text-sm resize-none" />
                    {editForm.avaria_foto_url ? (
                      <div className="relative rounded-lg overflow-hidden border border-border/50">
                        <img src={editForm.avaria_foto_url} alt="Avaria" className="w-full h-32 object-cover" />
                        <button type="button" onClick={() => setEditForm(f => ({ ...f, avaria_foto_url: null }))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 h-10 text-xs font-bold rounded-md border border-dashed border-border/50 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition">
                        {uploadingFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        {uploadingFoto ? 'Enviando…' : 'Adicionar foto'}
                        <input type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            setUploadingFoto(true);
                            try {
                              const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                              const url = await lotesMestresService.uploadAvariaPhoto(file, ext);
                              setEditForm(f => ({ ...f, avaria_foto_url: url }));
                              toast.success('Foto enviada');
                            } catch (err: any) { toast.error(err?.message || 'Falha ao enviar foto'); }
                            finally { setUploadingFoto(false); e.target.value = ''; }
                          }} />
                      </label>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setEditMode(false)} disabled={savingDetail}>
                  <X className="w-4 h-4 mr-1.5" /> Cancelar
                </Button>
                <Button className="flex-1 h-10" disabled={savingDetail}
                  onClick={async () => {
                    if (!detail) return;
                    if (!editForm.item.trim()) { toast.error('Item obrigatório'); return; }
                    if (editForm.avaria_enabled && !editForm.avaria_tipo) { toast.error('Selecione o tipo de avaria'); return; }
                    setSavingDetail(true);
                    try {
                      const patch: any = {
                        item: editForm.item.trim(), endereco: editForm.endereco.trim(), nf: editForm.nf.trim(),
                        lote: editForm.lote.trim(), lote_sistema: editForm.lote_sistema.trim(),
                        largura: parseFloat(editForm.largura) || 0, m_linear: parseFloat(editForm.m_linear) || 0,
                        lote_mestre_id: editForm.lote_mestre_id,
                        avaria_tipo: editForm.avaria_enabled ? editForm.avaria_tipo : null,
                        avaria_descricao: editForm.avaria_enabled ? (editForm.avaria_descricao.trim() || null) : null,
                        avaria_foto_url: editForm.avaria_enabled ? editForm.avaria_foto_url : null,
                        was_edited: true, edited_by: conferente || 'Sistema', edited_at: new Date().toISOString(),
                      };
                      const { error } = await supabase.from('registros').update(patch).eq('id', detail.id);
                      if (error) throw error;
                      const updated: MadeiraRow = { ...detail, ...patch };
                      setRows(prev => prev.map(r => r.id === detail.id ? updated : r));
                      setDetail(updated); setEditMode(false);
                      toast.success('Registro atualizado');
                    } catch (e: any) { toast.error('Erro ao salvar: ' + (e.message || '')); }
                    finally { setSavingDetail(false); }
                  }}>
                  {savingDetail ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold break-words ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
