import { useMemo, useState, useEffect, useRef } from 'react';
import { FileText, FileSpreadsheet, Truck, Plus, Loader2, Upload, RefreshCw, Calendar, ChevronDown, ChevronUp, Package, CheckCircle2, Edit, Save, X, Printer, Archive } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import apiService from '@/services/api';
import { exportRomaneioPDF, exportRomaneioExcel } from '@/lib/expedicao/exports';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RomaneioImportDialog from '@/components/expedicao/RomaneioImportDialog';
import { PreviewRow } from '@/components/expedicao/RomaneioImportDialog';

// ============================================================
// Types
// ============================================================

type PendenciaTipo = 'sem_cif' | 'sem_fob' | 'sem_minimo' | 'sem_transportadora' | 'cliente_balcão' | 'cif_mal_formatado' | 'fob_mal_formatado';

interface FaturamentoRegra {
  id: string;
  codigo_cliente: string;
  nome_cliente: string;
  modalidade_frete: string;
  valor_minimo_frete: number | null;
  transportadora_cif: string | null;
  transportadora_fob: string | null;
  frequencia_envio: string | null;
  detalhes_adicionais: string | null;
  grupo_economico: string | null;
  status: string;
  condicao_pagamento: string | null;
  limite_credito: number | null;
  observacoes: string | null;
  pendencias: PendenciaTipo[] | null;
  dados_extra: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface RomaneioDia {
  id: string;
  data_romaneio: string;
  titulo: string;
  status: string;
  criado_em: string;
  linhas?: RomaneioLinha[];
}

interface RomaneioLinha {
  id: string;
  romaneio_id: string;
  codigo_cliente: string;
  nome_cliente: string;
  quantidade: number;
  modalidade_frete: string;
  transportadora: string;
  observacoes: string | null;
}

interface LogRomaneio {
  id: string;
  criado_em: string;
  data_faturamento: string;
  status: string;
  total_linhas: number;
  transportadora_id: string | null;
  transportadora_nome: string | null;
  json_detalhes: any;
  usuario_id: string | null;
  observacao: string | null;
}

// ============================================================
// Helper Functions
// ============================================================

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function getTransportadoraCor(modalidade: string): string {
  switch (modalidade) {
    case 'CIF': return 'bg-blue-100 text-blue-800';
    case 'FOB': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// ============================================================
// Main Component
// ============================================================

export default function RomaneioPage() {
  const [activeTab, setActiveTab] = useState<'romaneio' | 'regras'>('romaneio');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<LogRomaneio[]>([]);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogRomaneio | null>(null);
  const handleViewLogDetail = (log: LogRomaneio) => setSelectedLog(log);
  const [showImportModal, setShowImportModal] = useState(false);
  const [regras, setRegras] = useState<FaturamentoRegra[]>([]);
  const [editingRule, setEditingRule] = useState<FaturamentoRegra | null>(null);
  const [selectedRegra, setSelectedRegra] = useState<FaturamentoRegra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterPendencias, setFilterPendencias] = useState<string>('todos');
  const [sortColumn, setSortColumn] = useState<keyof FaturamentoRegra>('codigo_cliente');
  const [sortAsc, setSortAsc] = useState(true);
  const [romaneios, setRomaneios] = useState<RomaneioDia[]>([]);
  const [selectedRomaneio, setSelectedRomaneio] = useState<RomaneioDia | null>(null);
  const [importedLinhas, setImportedLinhas] = useState<PreviewRow[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<PreviewRow> & { id?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // Queries
  // ============================================================

  const { data: regrasData, isLoading: isLoadingRegras, refetch: refetchRegras } = useQuery({
    queryKey: ['faturamento_regras'],
    queryFn: async () => {
      const BATCH_SIZE = 1000;
      const all: FaturamentoRegra[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore && all.length < 5000000) {
        const { data, error } = await supabase
          .from('faturamento_regras')
          .select('*')
          .order('nome_cliente')
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        all.push(...(data as unknown as FaturamentoRegra[]));
        offset += BATCH_SIZE;
        hasMore = data.length === BATCH_SIZE;
      }

      return all;
    },
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['romaneio_logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('romaneio_automatico_logs')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as LogRomaneio[];
    },
  });

  const queryClient = useQueryClient();

  const { data: romaneiosData, isLoading: isLoadingRomaneios, refetch: refetchRomaneios } = useQuery({
    queryKey: ['romaneio_dias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('romaneio_dias')
        .select('*, linhas(*)')
        .order('data_romaneio', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (regrasData) setRegras(regrasData);
  }, [regrasData]);

  useEffect(() => {
    if (logsData) setLogs(logsData);
  }, [logsData]);

  // Auto-dismiss success banner after 3 seconds
  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => setImportSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleImportRomaneio = async (linhas: PreviewRow[], dataRomaneio: string) => {
    try {
      // Decisão de frete (valor mínimo × pedidos do Auge) já calculada no diálogo
      const linhasComTransportador = linhas.map((l) => ({
        ...l,
        transportadora: l.decisao?.transportadora ?? l.transportador ?? '',
        modalidade: l.decisao?.modalidade || undefined,
      }));
      const [ay, am, ad] = dataRomaneio.split('-');

      // Save romaneio using upsert to avoid duplicate on same day/title
      const { data: romaneioData, error: romaneioError } = await supabase
        .from('romaneio_dias')
        .upsert({
          data_romaneio: dataRomaneio,
          titulo: `Romaneio ${ad}/${am}/${ay}`,
          status: 'ativo',
        }, { onConflict: 'data_romaneio,titulo' })
        .select()
        .single();

      if (romaneioError) throw romaneioError;

      // Save lines
      const linhasParaInserir = linhasComTransportador.map((l) => ({
        romaneio_id: romaneioData.id,
        codigo_cliente: l.codigo_cliente,
        nome_cliente: l.nome_cliente,
        quantidade: l.quantidade || 1,
        modalidade_frete: l.modalidade || 'CIF',
        transportadora: l.transportadora || '',
        transportadora_sugerida: l.decisao?.transportadora || null,
        valor: l.decisao?.valorPedidos ?? null,
        flag_excecao: l.decisao?.flagExcecao ?? false,
        cd_pedido: l.decisao?.pedidos.length ? l.decisao.pedidos.join(',') : null,
        observacoes: l.observacoes || null,
      }));

      const { error: linhasError } = await supabase.from('romaneio_linhas').insert(linhasParaInserir);
      if (linhasError) throw linhasError;

      toast.success(`Romaneio importado com ${linhas.length} clientes!`);
      // Mostra os dados importados na tabela dedicada
      setImportedLinhas(linhasComTransportador);
      setImportSuccess(true);
      // Force fresh fetch from server
      queryClient.invalidateQueries({ queryKey: ['romaneio_logs'] });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar romaneio');
    }
  };

  const handleViewRomaneio = (romaneio: RomaneioDia) => {
    setSelectedRomaneio(romaneio);
  };

  const handleDeleteRomaneio = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este romaneio?')) return;
    
    try {
      const { error } = await supabase
        .from('romaneio_dias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Romaneio excluído');
      refetchRomaneios();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir romaneio');
    }
  };

  const handleSaveRule = async (rule: Partial<FaturamentoRegra>) => {
    try {
      const { error } = await supabase.functions.invoke('expedicao-auto-romaneio', {
        body: { action: 'save_rule', ...rule },
      });
      if (error) throw error;
      toast.success('Regra salva com sucesso');
      setEditingRule(null);
      refetchRegras();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar regra');
    }
  };

  const handleDeleteRule = async (codigoCliente: string) => {
    if (!confirm(`Tem certeza que deseja excluir a regra do cliente ${codigoCliente}?`)) return;
    
    try {
      const { error } = await supabase.functions.invoke('expedicao-auto-romaneio', {
        body: { action: 'delete_rule', codigo_cliente: codigoCliente },
      });
      if (error) throw error;
      toast.success('Regra excluída');
      refetchRegras();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir regra');
    }
  };

  // ============================================================
  // Archive
  // ============================================================
  const handleArchiveRomaneio = async () => {
    if (importedLinhas.length === 0) {
      toast.warning('Nenhum romaneio para arquivar');
      return;
    }
    try {
      const { error } = await supabase
        .from('romaneio_automatico_logs')
        .insert({
          referencia: `Romaneio ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`,
          total_linhas: importedLinhas.length,
          rows: JSON.stringify(importedLinhas),
          origem: 'importacao_manual',
          status: 'arquivado',
        });
      if (error) throw error;
      setImportedLinhas([]);
      setImportSuccess(false);
      toast.success('Romaneio arquivado no histórico');
      refetchRomaneios();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar romaneio');
    }
  };

  // ============================================================
  // Filtered data
  // ============================================================

  // Mapeamento de labels para as pendências
  const PENDENCIAS_LABELS: Record<string, string> = {
    'sem_cif': 'Sem CIF',
    'sem_fob': 'Sem FOB',
    'sem_minimo': 'Sem Mínimo',
    'sem_transportadora': 'Sem Transportadora',
    'cliente_balcão': 'Cliente Balcão',
    'cif_mal_formatado': 'CIF Mal Formatado',
    'fob_mal_formatado': 'FOB Mal Formatado',
  };

  const PENDENCIAS_CORES: Record<string, string> = {
    'sem_cif': 'bg-red-100 text-red-800 border-red-200',
    'sem_fob': 'bg-orange-100 text-orange-800 border-orange-200',
    'sem_minimo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'sem_transportadora': 'bg-purple-100 text-purple-800 border-purple-200',
    'cliente_balcão': 'bg-blue-100 text-blue-800 border-blue-200',
    'cif_mal_formatado': 'bg-pink-100 text-pink-800 border-pink-200',
    'fob_mal_formatado': 'bg-teal-100 text-teal-800 border-teal-200',
  };

  const filteredRegras = useMemo(() => {
    let result = regras.filter(r => {
      const matchesSearch = r.nome_cliente.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           r.codigo_cliente.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || r.status === filterStatus;
      const matchesPendencias = filterPendencias === 'todos' ||
        (r.pendencias || []).includes(filterPendencias);
      return matchesSearch && matchesStatus && matchesPendencias;
    });
    result.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'pt-BR');
      }
      return sortAsc ? comparison : -comparison;
    });
    return result;
  }, [regras, debouncedSearch, filterStatus, filterPendencias, sortColumn, sortAsc]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRegras.length / PAGE_SIZE));
  const paginatedRegras = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRegras.slice(start, start + PAGE_SIZE);
  }, [filteredRegras, currentPage]);

  // ============================================================
  // Sort handlers
  // ============================================================

  const handleSort = (column: keyof FaturamentoRegra) => {
    if (sortColumn === column) {
      setSortAsc(prev => !prev);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  const SortIndicator = ({ column }: { column: keyof FaturamentoRegra }) => {
    if (sortColumn !== column) return <ChevronDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50" />;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 ml-1" />
      : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  // ============================================================
  // Stats
  // ============================================================

  const stats = useMemo(() => ({
    totalRegras: regras.length,
    ativas: regras.filter(r => r.status === 'ativo').length,
    inativas: regras.filter(r => r.status === 'inativado').length,
    comCIF: regras.filter(r => r.transportadora_cif).length,
    comFOB: regras.filter(r => r.transportadora_fob).length,
    comPendencias: regras.filter(r => (r.pendencias || []).length > 0).length,
    clienteBalcao: regras.filter(r => (r.pendencias || []).includes('cliente_balcão')).length,
  }), [regras]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <PageShell>
      <PageHeader
        title="Romaneio & Faturamento"
        subtitle="Gestão de romaneios e regras de frete dos clientes"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'romaneio' ? 'default' : 'outline'}
          onClick={() => setActiveTab('romaneio')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Romaneio
        </Button>
        <Button
          variant={activeTab === 'regras' ? 'default' : 'outline'}
          onClick={() => setActiveTab('regras')}
          className="gap-2"
        >
          <Truck className="w-4 h-4" />
          Regras de Frete
        </Button>
      </div>

      {/* ============================================================ */}
      {/* TAB: ROMANEIO                                                */}
      {/* ============================================================ */}
      {activeTab === 'romaneio' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {importSuccess && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Romaneio importado com sucesso!</span>
              </div>
            </div>
          )}

          {/* Import Button */}
          <Card>
            <CardHeader>
              <CardTitle>Importar Romaneio Manual</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowImportModal(true)} 
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar Planilha Excel
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Importe uma planilha com os clientes do romaneio de hoje
              </p>
            </CardContent>
          </Card>

          {/* Dados Importados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dados Importados ({importedLinhas.length})</CardTitle>
                {importedLinhas.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        exportRomaneioExcel(importedLinhas);
                      }}
                      className="gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      Imprimir
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleArchiveRomaneio}
                      className="gap-1"
                    >
                      <Archive className="w-3 h-3" />
                      Arquivar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {importedLinhas.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="Nenhum dado importado ainda"
                  description="Importe uma planilha para ver os dados aqui"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Transportador</TableHead>
                      <TableHead className="text-right">Vol.</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedLinhas.map((row, idx) => (
                      <TableRow key={idx}>
                        <td className="font-mono text-xs">{row.codigo_cliente}</td>
                        <td className="text-xs">{row.nome_cliente}</td>
                        <td className="text-xs">{row.nf || '-'}</td>
                        <td className="text-xs">{row.data || '-'}</td>
                        <td className="text-xs"><Badge variant="outline" className="text-[10px]">{row.transportador || '-'}</Badge></td>
                        <td className="text-xs text-right">{row.volume}</td>
                        <td className="text-xs">{row.observacoes || '-'}</td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Gerações</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nenhum romaneio gerado ainda"
                  description="Clique em 'Gerar Romaneio' para criar um"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Geração</TableHead>
                      <TableHead>Data Faturamento</TableHead>
                      <TableHead>Linhas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="cursor-pointer" onClick={() => handleViewLogDetail(log)}>
                        <TableCell>{new Date(log.criado_em).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{new Date(log.data_faturamento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{log.total_linhas}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'gerado' ? 'default' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Ver Detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: REGRAS DE FRETE                                         */}
      {/* ============================================================ */}
      {activeTab === 'regras' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalRegras}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.inativas}</div>
                <div className="text-sm text-muted-foreground">Inativas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.comCIF}</div>
                <div className="text-sm text-muted-foreground">Com CIF</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{stats.comFOB}</div>
                <div className="text-sm text-muted-foreground">Com FOB</div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards com Pendências */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.comPendencias}</div>
                <div className="text-sm text-muted-foreground">Com Pendências</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.clienteBalcao}</div>
                <div className="text-sm text-muted-foreground">Clientes Balcão</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{regras.filter(r => (r.pendencias || []).includes('sem_cif')).length}</div>
                <div className="text-sm text-muted-foreground">Sem CIF</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{regras.filter(r => (r.pendencias || []).includes('sem_fob')).length}</div>
                <div className="text-sm text-muted-foreground">Sem FOB</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativado">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPendencias} onValueChange={setFilterPendencias}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Pendências</SelectItem>
                <SelectItem value="sem_cif">Sem CIF</SelectItem>
                <SelectItem value="sem_fob">Sem FOB</SelectItem>
                <SelectItem value="sem_minimo">Sem Mínimo</SelectItem>
                <SelectItem value="cliente_balcão">Cliente Balcão</SelectItem>
                <SelectItem value="cif_mal_formatado">CIF Mal Formatado</SelectItem>
                <SelectItem value="fob_mal_formatado">FOB Mal Formatado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button onClick={() => setEditingRule({} as FaturamentoRegra)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Regra
            </Button>
          </div>

          {/* Rules Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoadingRegras ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredRegras.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="Nenhuma regra encontrada"
                  description="Clique em 'Nova Regra' ou importe um arquivo Excel"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="group cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleSort('codigo_cliente')}>
                        <span className="flex items-center">Código<SortIndicator column="codigo_cliente" /></span>
                      </TableHead>
                      <TableHead className="group cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleSort('nome_cliente')}>
                        <span className="flex items-center">Nome do Cliente<SortIndicator column="nome_cliente" /></span>
                      </TableHead>
                      <TableHead className="group cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleSort('modalidade_frete')}>
                        <span className="flex items-center">Modalidade<SortIndicator column="modalidade_frete" /></span>
                      </TableHead>
                      <TableHead className="group cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleSort('transportadora_cif')}>
                        <span className="flex items-center">Transportadora CIF<SortIndicator column="transportadora_cif" /></span>
                      </TableHead>
                      <TableHead className="group cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleSort('transportadora_fob')}>
                        <span className="flex items-center">Transportadora FOB<SortIndicator column="transportadora_fob" /></span>
                      </TableHead>
                      <TableHead className="group cursor-pointer hover:bg-muted/50 text-right" onDoubleClick={() => handleSort('valor_minimo_frete')}>
                        <span className="flex items-center justify-end">Valor Mínimo<SortIndicator column="valor_minimo_frete" /></span>
                      </TableHead>
                      <TableHead className="group cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleSort('frequencia_envio')}>
                        <span className="flex items-center">Frequência<SortIndicator column="frequencia_envio" /></span>
                      </TableHead>
                      <TableHead>Tags/Pendências</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegras.map((regra) => (
                      <TableRow
                        key={regra.id}
                        className={
                          'group cursor-pointer hover:bg-muted/50 ' +
                          (regra.pendencias && regra.pendencias.length > 0
                            ? 'bg-yellow-50 dark:bg-yellow-950/20'
                            : '')
                        }
                        onClick={() => setSelectedRegra(regra)}
                      >
                        <TableCell className="font-mono">{regra.codigo_cliente}</TableCell>
                        <TableCell className="font-medium">{regra.nome_cliente}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{regra.modalidade_frete}</Badge>
                        </TableCell>
                        <TableCell>{regra.transportadora_cif || '-'}</TableCell>
                        <TableCell>{regra.transportadora_fob || '-'}</TableCell>
                        <TableCell>
                          {regra.valor_minimo_frete
                            ? formatarMoeda(regra.valor_minimo_frete)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {regra.frequencia_envio || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {regra.pendencias && regra.pendencias.length > 0 ? (
                              regra.pendencias.map((p) => (
                                <Badge
                                  key={p}
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${PENDENCIAS_CORES[p] || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {PENDENCIAS_LABELS[p] || p}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRule(regra)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(regra.codigo_cliente)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {filteredRegras.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredRegras.length)} de {filteredRegras.length} clientes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Import Dialog */}
      <RomaneioImportDialog
        open={showImportModal}
        onOpenChange={setShowImportModal}
        regras={regras}
        onImported={handleImportRomaneio}
      />

      {/* Regra Detail Dialog */}
      <Dialog open={!!selectedRegra} onOpenChange={(open) => !open && setSelectedRegra(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRegra ? `Detalhes - ${selectedRegra.codigo_cliente}` : ''}
            </DialogTitle>
            <DialogDescription>
              Informações completas do cliente e regras de frete.
            </DialogDescription>
          </DialogHeader>
          {selectedRegra && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código do Cliente</Label>
                  <p className="font-mono text-sm">{selectedRegra.codigo_cliente}</p>
                </div>
                <div>
                  <Label>Nome do Cliente</Label>
                  <p className="font-medium text-sm">{selectedRegra.nome_cliente}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modalidade de Frete</Label>
                  <Badge variant="outline">{selectedRegra.modalidade_frete}</Badge>
                </div>
                <div>
                  <Label>Frequência de Envio</Label>
                  <p className="text-sm">{selectedRegra.frequencia_envio || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transportadora CIF</Label>
                  <p className="text-sm">{selectedRegra.transportadora_cif || '-'}</p>
                </div>
                <div>
                  <Label>Transportadora FOB</Label>
                  <p className="text-sm">{selectedRegra.transportadora_fob || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Mínimo</Label>
                  <p className="text-sm">
                    {selectedRegra.valor_minimo_frete
                      ? formatarMoeda(selectedRegra.valor_minimo_frete)
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedRegra.status === 'ativo' ? 'default' : 'secondary'}>
                    {selectedRegra.status}
                  </Badge>
                </div>
              </div>
              {selectedRegra.pendencias && selectedRegra.pendencias.length > 0 && (
                <div>
                  <Label>Pendências</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRegra.pendencias.map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${PENDENCIAS_CORES[p] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {PENDENCIAS_LABELS[p] || p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedRegra.detalhes_adicionais && (
                <div>
                  <Label>Detalhes Adicionais</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">{selectedRegra.detalhes_adicionais}</p>
                </div>
              )}
              {selectedRegra.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">{selectedRegra.observacoes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRegra(null)}>
              Fechar
            </Button>
            {selectedRegra && (
              <Button onClick={() => { setEditingRule(selectedRegra); setSelectedRegra(null); }}>
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={showLogDetail} onOpenChange={(open) => !open && setShowLogDetail(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Romaneio</DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.criado_em).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Faturamento</Label>
                  <p className="font-medium">
                    {new Date(selectedLog.data_faturamento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label>Total de Linhas</Label>
                  <p className="font-medium">{selectedLog.total_linhas}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedLog.status === 'gerado' ? 'default' : 'secondary'}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label>Transportadora</Label>
                  <p className="font-medium">{selectedLog.transportadora_nome || '-'}</p>
                </div>
              </div>
              {selectedLog.observacao && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm mt-1">{selectedLog.observacao}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDetail(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}

      {/* Edit/Create Rule Modal */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra de Frete' : 'Nova Regra de Frete'}
            </DialogTitle>
            <DialogDescription>
              Configure as regras de faturamento e transporte para o cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_cliente">Código do Cliente</Label>
                <Input
                  id="codigo_cliente"
                  value={editingRule?.codigo_cliente || ''}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, codigo_cliente: e.target.value } : null)}
                  placeholder="C1739"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                <Input
                  id="nome_cliente"
                  value={editingRule?.nome_cliente || ''}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, nome_cliente: e.target.value } : null)}
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modalidade_frete">Modalidade de Frete</Label>
                <Select 
                  value={editingRule?.modalidade_frete || 'CIF'}
                  onValueChange={(val) => setEditingRule(prev => prev ? { ...prev, modalidade_frete: val } : null)}
                >
                  <SelectTrigger id="modalidade_frete">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF_FOB">CIF + FOB</SelectItem>
                    <SelectItem value="FOB_SEMPRE">FOB Sempre</SelectItem>
                    <SelectItem value="CIF_SEMPRE">CIF Sempre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_minimo">Valor Mínimo (R$)</Label>
                <Input
                  id="valor_minimo"
                  type="number"
                  value={editingRule?.valor_minimo_frete || ''}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, valor_minimo_frete: e.target.value ? parseFloat(e.target.value) : null } : null)}
                  placeholder="1500.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transportadora_cif">Transportadora CIF</Label>
                <Input
                  id="transportadora_cif"
                  value={editingRule?.transportadora_cif || ''}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, transportadora_cif: e.target.value } : null)}
                  placeholder="Expresso São Miguel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportadora_fob">Transportadora FOB</Label>
                <Input
                  id="transportadora_fob"
                  value={editingRule?.transportadora_fob || ''}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, transportadora_fob: e.target.value } : null)}
                  placeholder="Rodonaves"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequencia">Frequência de Envio</Label>
              <Input
                id="frequencia"
                value={editingRule?.frequencia_envio || ''}
                onChange={(e) => setEditingRule(prev => prev ? { ...prev, frequencia_envio: e.target.value } : null)}
                placeholder="1x por semana"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={editingRule?.observacoes || ''}
                onChange={(e) => setEditingRule(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={editingRule?.status || 'ativo'}
                onValueChange={(val) => setEditingRule(prev => prev ? { ...prev, status: val } : null)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (editingRule) {
                handleSaveRule(editingRule);
              }
            }}>
              Salvar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
