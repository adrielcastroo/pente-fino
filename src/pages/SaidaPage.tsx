import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Search, Archive, Calendar, User, Clock, FileText, ScanBarcode, Loader2, CheckCircle2, Truck, PackageMinus, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePerformance } from '@/hooks/use-performance';
import { formatDateBR } from '@/lib/app-utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AugeSaidasTab from '@/components/auge/AugeSaidasTab';

interface SaidaRegistro {
  id: string;
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
  data_registro: string;
  data_saida: string;
  estrutura: string;
  coluna: string;
  nivel: number;
  posicao: number;
  observacoes?: string;
}

type Periodo = 'todos' | '7' | '30' | '90';

export default function SaidaPage() {
  const [saidas, setSaidas] = useState<SaidaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [pageSize, setPageSize] = useState(20);
  const { isLow } = usePerformance();

  // Barcode scanning state
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ item: any; success: boolean; message: string } | null>(null);
  const [confirmScan, setConfirmScan] = useState<any>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const [observacoes, setObservacoes] = useState('');
  const [destino, setDestino] = useState('');
  const conferente = useAppStore(s => s.conferente);
  const [tab, setTab] = useState<'interno' | 'auge'>('interno');
  useDocumentTitle('Saídas');

  const loadSaidas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estoque_saidas')
        .select('*')
        .order('data_saida', { ascending: false });
      
      if (error) throw error;
      setSaidas((data as any[]) || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar histórico de saídas');
    } finally {
      setLoading(false);
    }
  };

  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    loadSaidas();
    setFormData({ activeTab: 'saida' });
  }, [setFormData]);

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
      // Search for item in estoque_posicoes matching lote_sistema (case-insensitive)
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

    // Fase 0.4 — validações de negócio
    const destinoTrim = destino.trim();
    const responsavel = (conferente || '').trim();
    if (!responsavel) {
      toast.error('Informe o conferente responsável antes de dar saída.');
      return;
    }
    if (!destinoTrim) {
      toast.error('Informe o destino da saída.');
      return;
    }
    const m2 = Number(pos.m2);
    const mLinear = Number(pos.m_linear);
    if (!Number.isFinite(m2) || m2 <= 0 || !Number.isFinite(mLinear) || mLinear <= 0) {
      toast.error('Quantidades inválidas: m² e metro linear devem ser maiores que zero.');
      return;
    }

    const observacoesFinal = [`Destino: ${destinoTrim}`, observacoes.trim()].filter(Boolean).join(' | ');

    try {
      // Insert into estoque_saidas
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
        conferente_saida: responsavel,
        data_registro: pos.data_registro,
        data_saida: new Date().toISOString(),
        observacoes: observacoesFinal,
      });
      if (saError) throw saError;

      // Delete from estoque_posicoes
      const { error: delError } = await supabase.from('estoque_posicoes').delete().eq('id', pos.id);
      if (delError) throw delError;

      setScanResult({
        item: pos,
        success: true,
        message: `Saída realizada! Item "${pos.item}" removido de ${pos.estrutura}.${pos.coluna}.N${String(pos.nivel).padStart(2, '0')}`
      });
      setConfirmScan(null);
      setObservacoes('');
      setDestino('');
      setScanInput('');
      loadSaidas();
    } catch (e: any) {
      toast.error('Erro ao dar saída: ' + (e.message || ''));
    }
  };

  const filteredSaidas = useMemo(() => {
    const q = search.toLowerCase().trim();
    const now = Date.now();
    const cutoff = periodo === 'todos' ? 0 : now - Number(periodo) * 24 * 60 * 60 * 1000;
    return saidas.filter(s => {
      if (cutoff && new Date(s.data_saida).getTime() < cutoff) return false;
      if (!q) return true;
      return (
        s.item.toLowerCase().includes(q) ||
        (s.proc || '').toLowerCase().includes(q) ||
        (s.lote || '').toLowerCase().includes(q) ||
        (s.lote_sistema || '').toLowerCase().includes(q) ||
        (s.conferente_saida || '').toLowerCase().includes(q) ||
        (s.conferente_entrada || '').toLowerCase().includes(q)
      );
    });
  }, [saidas, search, periodo]);

  const visibleSaidas = useMemo(() => filteredSaidas.slice(0, pageSize), [filteredSaidas, pageSize]);

  useEffect(() => { setPageSize(20); }, [search, periodo]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-4 sm:p-8 space-y-4 flex-shrink-0">
        <PageHeader
          title="Saídas"
          className="lg:items-center"
          actions={
            tab === 'interno' ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  onClick={() => setScanMode(true)}
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-6 font-semibold rounded-md border-primary/30 text-primary hover:bg-primary/10 transition-all active:scale-95 text-base shrink-0"
                >
                  <span>Dar saída</span>
                </Button>

                <div className="relative group w-full sm:flex-1 lg:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filtrar item, PROC, conferente..."
                    className="pl-10 h-11 sm:h-12 rounded-md border-border/40 bg-card/40 focus:bg-background transition-all font-bold text-xs sm:text-sm w-full"
                  />
                </div>

                <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
                  <SelectTrigger className="w-full sm:w-[160px] h-11 sm:h-12 rounded-md border-border/40 font-bold text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="todos">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null
          }
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'interno' | 'auge')} className="w-full">
          <TabsList className="bg-card/40 border border-border/40 rounded-md">
            <TabsTrigger value="interno" className="text-xs font-bold uppercase tracking-wider">Interno (Tecidos)</TabsTrigger>
            <TabsTrigger value="auge" className="text-xs font-bold uppercase tracking-wider">Auge (ERP)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 custom-scrollbar">
        {tab === 'auge' ? (
          <div className="max-w-[1400px] mx-auto">
            <AugeSaidasTab />
          </div>
        ) : (
          <>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-muted-foreground animate-pulse uppercase tracking-widest text-xs">Carregando saídas...</p>
          </div>
        ) : filteredSaidas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-md bg-muted/30 flex items-center justify-center">
              <Archive className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhuma saída encontrada{search ? ' para a busca.' : '.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-w-[1400px] mx-auto">
            {visibleSaidas.map((saida) => (
              <div key={saida.id} className="bg-card/60 border border-border/40 rounded-md p-4 sm:p-5 hover:border-border/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg tracking-tight truncate">{saida.item}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] sm:text-[9px] font-bold uppercase tracking-wider border-primary/20 bg-primary/5 text-primary rounded-lg px-2 py-0.5">
                        {saida.proc || 'Sem PROC'}
                      </Badge>
                      <span className="text-xs sm:text-[10px] font-mono font-bold text-muted-foreground/60">
                        {saida.estrutura}.{saida.coluna}.N{String(saida.nivel).padStart(2, '0')} P{saida.posicao}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Saída
                    </p>
                    <p className="text-xs font-bold tracking-tight">{formatDateBR(saida.data_saida)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Saída por:
                    </p>
                    <p className="text-xs font-bold truncate tracking-tight">{saida.conferente_saida || '—'}</p>
                    {saida.observacoes && (
                      <p className="text-[10px] font-bold text-muted-foreground/80 leading-tight mt-1 italic">
                        Obs: {saida.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Entrada
                    </p>
                    <p className="text-xs font-bold tracking-tight text-muted-foreground/60">{formatDateBR(saida.data_registro)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Entrada por
                    </p>
                    <p className="text-xs font-bold truncate tracking-tight text-muted-foreground/60">{saida.conferente_entrada || '—'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Lote</span>
                    <span className="text-xs font-bold font-mono">{saida.lote || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">M²</span>
                    <span className="text-xs font-bold">{saida.m2 > 0 ? saida.m2 : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">M Lin.</span>
                    <span className="text-xs font-bold">{saida.m_linear > 0 ? `${saida.m_linear}m` : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg flex-1 min-w-0">
                    <FileText className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/70 truncate">{saida.lote_sistema || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredSaidas.length > visibleSaidas.length && (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Exibindo {visibleSaidas.length} de {filteredSaidas.length}
                </p>
                <Button variant="outline" onClick={() => setPageSize(p => p + 20)} className="rounded-md font-semibold text-xs uppercase tracking-wider h-10 px-6">
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan Mode Dialog */}
      <Dialog open={scanMode} onOpenChange={setScanMode}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-500">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">Dar saída</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                  Bipe ou digite o <strong>Lote Final</strong> do tecido para dar saída
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground ml-1">Lote Final (Bipagem)</label>
              <div className="flex gap-2">
                <Input
                  ref={scanRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleScanSubmit(); }}
                  placeholder="Ex: TEC01.A.N03 PROC 12345 18,2M"
                  className="h-14 rounded-md border-border/50 bg-muted/20 font-bold focus:bg-background transition-all font-mono text-lg"
                  autoFocus
                />
                <Button
                  onClick={handleScanSubmit}
                  disabled={scanning || !scanInput.trim()}
                  className="h-14 px-6 rounded-md font-semibold bg-violet-600 hover:bg-violet-700 shrink-0 text-base"
                >
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </Button>
              </div>
            </div>

            {scanResult && (
              <div className={`p-4 rounded-md border ${
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
      <AlertDialog open={!!confirmScan} onOpenChange={(open) => {
        if (!open) {
          setConfirmScan(null);
          setObservacoes('');
          setDestino('');
        }
      }}>
        <AlertDialogContent className="border-border/40 bg-card rounded-md max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground space-y-4">
              {confirmScan && (
                <>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tecido encontrado:</div>
                    <div className="bg-muted/20 p-3 rounded-lg space-y-1 text-foreground text-xs font-bold border border-border/20">
                      <div>Item: <span className="font-mono">{confirmScan.item}</span></div>
                      <div>Lote Final: <span className="font-mono text-primary">{confirmScan.lote_sistema}</span></div>
                      <div>Posição: {confirmScan.estrutura}.{confirmScan.coluna}.N{String(confirmScan.nivel).padStart(2, '0')} P{confirmScan.posicao}</div>
                      <div>M Linear: {confirmScan.m_linear}m | Largura: {confirmScan.largura}m</div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-muted/10 p-4 rounded-md border border-border/20">
                    <label className="text-xs font-semibold uppercase tracking-widest text-violet-500 flex items-center gap-2 mb-1">
                      <Truck className="w-3.5 h-3.5" />
                      Destino <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      placeholder="Ex: Produção - Linha 2, Cliente XPTO, Sala de corte..."
                      className="h-10 rounded-lg border-border/50 bg-background/50 focus:bg-background font-bold text-xs"
                      required
                    />
                    <label className="text-xs font-semibold uppercase tracking-widest text-violet-500 flex items-center gap-2 mt-3 mb-1">
                      <User className="w-3.5 h-3.5" />
                      Saída por {conferente || <span className="text-red-400">— defina o conferente</span>}
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações adicionais (opcional)..."
                      className="w-full min-h-[60px] p-3 rounded-lg border border-border/50 bg-background/50 focus:bg-background transition-all text-xs font-medium text-foreground resize-none focus:ring-1 focus:ring-violet-500/50 outline-none"
                    />
                  </div>

                  <div className="pt-2 font-bold text-foreground">Deseja confirmar a saída deste tecido?</div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-md font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-md bg-violet-600 hover:bg-violet-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!destino.trim() || !(conferente || '').trim()}
              onClick={executeScanSaida}
            >
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
