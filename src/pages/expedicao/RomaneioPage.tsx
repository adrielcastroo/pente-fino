import { useMemo, useState, useEffect } from 'react';
import { FileText, Truck, Plus, Loader2, Upload, RefreshCw, ChevronDown, ChevronUp, Package, Search, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery } from '@tanstack/react-query';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RomaneioImportDialog from '@/components/expedicao/RomaneioImportDialog';
import ConsultaPedidos from '@/components/faturamento/ConsultaPedidos';

// ============================================================
// Types
// ============================================================

interface FaturamentoRegra {
  id: string;
  codigo_cliente: string;
  nome_cliente: string;
  modalidade_frete: string;
  valor_minimo_frete: number | null;
  transportadora_cif: string | null;
  transportadora_fob: string | null;
  frequencia_envio: string | null;
  grupo_economico: string | null;
  status: string;
  condicao_pagamento: string | null;
  limite_credito: number | null;
  observacoes: string | null;
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

interface RomaneioPreview {
  data_faturamento: string;
  cliente_codigo: string;
  cliente_nome: string;
  total_peças: number;
  transportadora: string;
  modalidade: string;
  quantidade_pecas: number;
  pecas_ids: string[];
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
  const [activeTab, setActiveTab] = useState<'romaneio' | 'regras' | 'historico' | 'consultar'>('romaneio');

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('romaneio:activeTab');
      if (savedTab === 'romaneio' || savedTab === 'regras' || savedTab === 'historico' || savedTab === 'consultar') {
        setActiveTab(savedTab);
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('romaneio:activeTab', activeTab);
    } catch (e) { /* ignore */ }
  }, [activeTab]);
  const [preview, setPreview] = useState<RomaneioPreview[]>([]);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogRomaneio | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [regras, setRegras] = useState<FaturamentoRegra[]>([]);
  const [editingRule, setEditingRule] = useState<FaturamentoRegra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [romaneios, setRomaneios] = useState<RomaneioDia[]>([]);
  const [selectedRomaneio, setSelectedRomaneio] = useState<RomaneioDia | null>(null);
  const [showRomaneioDetail, setShowRomaneioDetail] = useState(false);
  const [importedLines, setImportedLines] = useState<any[]>([]);
  const [isEditingImported, setIsEditingImported] = useState(false);
  const [lastImportedRomaneioId, setLastImportedRomaneioId] = useState<string | null>(null);

  // Estados para tabela integrada de romaneios
  const [romaneioSortColumn, setRomaneioSortColumn] = useState<string | null>(null);
  const [romaneioSortDir, setRomaneioSortDir] = useState<'asc' | 'desc'>('asc');
  const [romaneioFilterCliente, setRomaneioFilterCliente] = useState('');
  const [romaneioFilterTransportadora, setRomaneioFilterTransportadora] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [historicoRomaneios, setHistoricoRomaneios] = useState<RomaneioDia[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('romaneio:importedState');
      if (saved) {
        const state = JSON.parse(saved);
        setLastImportedRomaneioId(state.romaneioId || null);
        setImportedLines(state.lines || []);
        setIsEditingImported(state.isEditing || false);
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      if (isEditingImported && importedLines.length > 0 && lastImportedRomaneioId) {
        localStorage.setItem('romaneio:importedState', JSON.stringify({
          romaneioId: lastImportedRomaneioId,
          lines: importedLines,
          isEditing: true,
        }));
      } else {
        localStorage.removeItem('romaneio:importedState');
      }
    } catch (e) { /* ignore */ }
  }, [isEditingImported, importedLines, lastImportedRomaneioId]);

  // Função para lidar com ordenação por coluna
  const handleSort = (column: string) => {
    if (romaneioSortColumn === column) {
      setRomaneioSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setRomaneioSortColumn(column);
      setRomaneioSortDir('asc');
    }
  };

  // Dados filtrados e ordenados
  const filteredRomaneios = useMemo(() => {
    let result = romaneios;

    // Filtro por cliente
    if (romaneioFilterCliente.trim()) {
      const filter = romaneioFilterCliente.toLowerCase();
      result = result.filter(r =>
        r.linhas?.some(l =>
          l.codigo_cliente.toLowerCase().includes(filter) ||
          l.nome_cliente.toLowerCase().includes(filter)
        )
      );
    }

    // Filtro por transportadora
    if (romaneioFilterTransportadora.trim()) {
      const filter = romaneioFilterTransportadora.toLowerCase();
      result = result.filter(r =>
        r.linhas?.some(l =>
          l.transportadora?.toLowerCase().includes(filter)
        )
      );
    }

    // Ordenação
    if (romaneioSortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = '';
        let bVal = '';

        switch (romaneioSortColumn) {
          case 'data':
            aVal = a.data_romaneio;
            bVal = b.data_romaneio;
            break;
          case 'titulo':
            aVal = a.titulo;
            bVal = b.titulo;
            break;
          case 'clientes':
            aVal = String(a.linhas?.length || 0);
            bVal = String(b.linhas?.length || 0);
            break;
          default:
            return 0;
        }

        if (romaneioSortDir === 'asc') {
          return aVal.localeCompare(bVal);
        }
        return bVal.localeCompare(aVal);
      });
    }

    return result;
  }, [romaneios, romaneioSortColumn, romaneioSortDir, romaneioFilterCliente, romaneioFilterTransportadora]);

  // Buscar transportadoras únicas para filtro
  const transportadorasUnicas = useMemo(() => {
    const set = new Set<string>();
    romaneios.forEach(r => {
      r.linhas?.forEach(l => {
        if (l.transportadora) set.add(l.transportadora);
      });
    });
    return Array.from(set).sort();
  }, [romaneios]);

  // ============================================================
  // Queries
  // ============================================================

  const { data: regrasData, isLoading: isLoadingRegras, refetch: refetchRegras } = useQuery({
    queryKey: ['faturamento_regras'],
    queryFn: async () => {
      const BATCH_SIZE = 500;
      const all: FaturamentoRegra[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore && all.length < 2000) {
        const { data, error } = await supabase
          .from('faturamento_regras')
          .select('*')
          .order('nome_cliente')
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        all.push(...data);
        offset += BATCH_SIZE;
        hasMore = data.length === BATCH_SIZE;
      }

      return all;
    },
  });

  const { data: romaneiosData, isLoading: isLoadingRomaneios, refetch: refetchRomaneios } = useQuery({
    queryKey: ['romaneio_dias'],
    queryFn: async () => {
      const [diasRes, linhasRes] = await Promise.all([
        supabase.from('romaneio_dias').select('*').order('data_romaneio', { ascending: false }),
        supabase.from('romaneio_linhas').select('*, romaneio_id'),
      ]);
      if (diasRes.error) throw diasRes.error;
      if (linhasRes.error) throw linhasRes.error;

      const linhasMap = new Map<string, RomaneioLinha[]>();
      for (const linha of linhasRes.data || []) {
        const arr = linhasMap.get(linha.romaneio_id as string) || [];
        arr.push(linha as unknown as RomaneioLinha);
        linhasMap.set(linha.romaneio_id as string, arr);
      }

      return (diasRes.data || []).map((d) => ({
        ...d,
        linhas: linhasMap.get(d.id) || [],
      })) as unknown as RomaneioDia[];
    },
  });

  useEffect(() => {
    if (regrasData) setRegras(regrasData);
  }, [regrasData]);

  useEffect(() => {
    if (romaneiosData) {
      const ativos = romaneiosData.filter(r => r.status !== 'finalizado');
      const finalizados = romaneiosData.filter(r => r.status === 'finalizado');
      setRomaneios(ativos);
      setHistoricoRomaneios(finalizados);
    }
  }, [romaneiosData]);

  // Persistência do estado da aba Romaneio
  useEffect(() => {
    try {
      localStorage.setItem('romaneio:sortColumn', romaneioSortColumn || '');
      localStorage.setItem('romaneio:sortDir', romaneioSortDir);
      localStorage.setItem('romaneio:filterCliente', romaneioFilterCliente);
      localStorage.setItem('romaneio:filterTransportadora', romaneioFilterTransportadora);
    } catch (e) { /* ignore */ }
  }, [romaneioSortColumn, romaneioSortDir, romaneioFilterCliente, romaneioFilterTransportadora]);

  useEffect(() => {
    try {
      const savedColumn = localStorage.getItem('romaneio:sortColumn');
      const savedDir = localStorage.getItem('romaneio:sortDir');
      const savedFilterCliente = localStorage.getItem('romaneio:filterCliente');
      const savedFilterTransportadora = localStorage.getItem('romaneio:filterTransportadora');
      if (savedColumn) setRomaneioSortColumn(savedColumn);
      if (savedDir) setRomaneioSortDir(savedDir as 'asc' | 'desc');
      if (savedFilterCliente) setRomaneioFilterCliente(savedFilterCliente);
      if (savedFilterTransportadora) setRomaneioFilterTransportadora(savedFilterTransportadora);
    } catch (e) { /* ignore */ }
  }, []);

  // ============================================================
  // Handlers
  // ============================================================

  const handleImportRomaneio = async (romaneioId: string, _linhas: any[]) => {
    toast.success('Romaneio importado com sucesso!');
    setLastImportedRomaneioId(romaneioId);

    await refetchRomaneios();

    const { data: dbLinhas, error: linhasError } = await supabase
      .from('romaneio_linhas')
      .select('*')
      .eq('romaneio_id', romaneioId);

    if (linhasError) {
      toast.error('Erro ao carregar linhas importadas');
      return;
    }

    const mapped = (dbLinhas || []).map(l => ({
      ...l,
      volume: l.quantidade,
      regra_frete_aplicada: l.modalidade_frete,
      transportadora_sugerida: l.transportadora,
    }));

    setImportedLines(mapped);
    setIsEditingImported(true);
  };

  const handleUpdateImportedLine = async (index: number, field: string, value: string) => {
    setImportedLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveImportedChanges = async () => {
    if (!lastImportedRomaneioId) return;

    try {
      const updates = importedLines.map((linha) => ({
        id: linha.id,
        codigo_cliente: linha.codigo_cliente,
        nome_cliente: linha.nome_cliente,
        quantidade: linha.volume || 1,
        modalidade_frete: linha.regra_frete_aplicada || 'CIF',
        transportadora: linha.transportadora_sugerida || linha.transportador,
        observacoes: linha.observacao || null,
      }));

      const validUpdates = updates.filter(u => u.id);

      for (const update of validUpdates) {
        await supabase
          .from('romaneio_linhas')
          .update({
            codigo_cliente: update.codigo_cliente,
            nome_cliente: update.nome_cliente,
            quantidade: update.quantidade,
            modalidade_frete: update.modalidade_frete,
            transportadora: update.transportadora,
            observacoes: update.observacoes,
          })
          .eq('id', update.id);
      }

      toast.success('Alterações salvas!');
      setIsEditingImported(false);
      setImportedLines([]);
      setLastImportedRomaneioId(null);
      try { localStorage.removeItem('romaneio:importedState'); } catch (e) { /* ignore */ }
      setSuccessCount(importedLines.length);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1500);
      refetchRomaneios();
    } catch (error) {
      toast.error('Erro ao salvar alterações');
    }
  };

  const handleCancelImportedEdit = () => {
    setIsEditingImported(false);
    setImportedLines([]);
    setLastImportedRomaneioId(null);
    try { localStorage.removeItem('romaneio:importedState'); } catch (e) { /* ignore */ }
  };

  const handleViewRomaneio = (romaneio: RomaneioDia) => {
    setSelectedRomaneio(romaneio);
    setShowRomaneioDetail(true);
  };

  const handleEditRomaneioLinhas = async (romaneio: RomaneioDia) => {
    setLastImportedRomaneioId(romaneio.id);
    const { data: dbLinhas, error: linhasError } = await supabase
      .from('romaneio_linhas')
      .select('*')
      .eq('romaneio_id', romaneio.id);

    if (linhasError) {
      toast.error('Erro ao carregar linhas');
      return;
    }

    const mapped = (dbLinhas || []).map(l => ({
      ...l,
      volume: l.quantidade,
      regra_frete_aplicada: l.modalidade_frete,
      transportadora_sugerida: l.transportadora,
    }));

    setImportedLines(mapped);
    setIsEditingImported(true);
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

  const handleDeleteFromHistorico = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este romaneio do histórico?')) return;

    try {
      const { data: linhas, error: linhasError } = await supabase
        .from('romaneio_linhas')
        .delete()
        .eq('romaneio_id', id);

      if (linhasError) throw linhasError;

      const { error } = await supabase
        .from('romaneio_dias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Romaneio excluído do histórico');
      refetchRomaneios();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir do histórico');
    }
  };

  const handleSendToHistory = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('romaneio_dias')
        .update({ status: 'finalizado' })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Romaneio enviado para histórico');
      refetchRomaneios();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar para histórico');
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
  // Filtered data
  // ============================================================

  const filteredRegras = useMemo(() => {
    return regras.filter(r => {
      const matchesSearch = r.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.codigo_cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [regras, searchTerm, filterStatus]);

  // ============================================================
  // Stats
  // ============================================================

  const stats = useMemo(() => ({
    totalRegras: regras.length,
    ativas: regras.filter(r => r.status === 'ativo').length,
    inativas: regras.filter(r => r.status === 'inativado').length,
    comCIF: regras.filter(r => r.transportadora_cif).length,
    comFOB: regras.filter(r => r.transportadora_fob).length,
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
          variant={activeTab === 'consultar' ? 'default' : 'outline'}
          onClick={() => setActiveTab('consultar')}
          className="gap-2"
        >
          <Search className="w-4 h-4" />
          Consultar Auge
        </Button>
        <Button
          variant={activeTab === 'regras' ? 'default' : 'outline'}
          onClick={() => setActiveTab('regras')}
          className="gap-2"
        >
          <Truck className="w-4 h-4" />
          Regras de Frete
        </Button>
        <Button
          variant={activeTab === 'historico' ? 'default' : 'outline'}
          onClick={() => setActiveTab('historico')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Histórico
        </Button>
      </div>

      {/* ============================================================ */}
      {/* TAB: ROMANEIO                                                */}
      {/* ============================================================ */}
      {activeTab === 'romaneio' && (
        <div className="space-y-6">
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

          {/* Preview */}
          {preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview do Romaneio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preview.map((dayData, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">
                        {format(new Date(dayData.data_faturamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Modalidade</TableHead>
                            <TableHead>Transportadora</TableHead>
                            <TableHead className="text-right">Peças</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayData.linhas?.map((linha, lineIdx) => (
                            <TableRow key={lineIdx}>
                              <TableCell className="font-medium">{linha.cliente_nome}</TableCell>
                              <TableCell>{linha.cliente_codigo}</TableCell>
                              <TableCell>
                                <Badge className={getTransportadoraCor(linha.modalidade)}>
                                  {linha.modalidade}
                                </Badge>
                              </TableCell>
                              <TableCell>{linha.transportadora}</TableCell>
                              <TableCell className="text-right">{linha.total_peças}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

          {/* Tabela Integrada de Romaneios Importados */}
          {romaneios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Romaneios Importados
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRomaneioFilterCliente('');
                      setRomaneioFilterTransportadora('');
                      setRomaneioSortColumn(null);
                      setRomaneioSortDir('asc');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs mb-1 block">Filtrar por Cliente</Label>
                    <Input
                      value={romaneioFilterCliente}
                      onChange={(e) => setRomaneioFilterCliente(e.target.value)}
                      placeholder="Código ou nome do cliente..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs mb-1 block">Filtrar por Transportadora</Label>
                    <Select
                      value={romaneioFilterTransportadora || 'todos'}
                      onValueChange={(value) =>
                        setRomaneioFilterTransportadora(value === 'todos' ? '' : value)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {transportadorasUnicas.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tabela */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('data')}
                        >
                          <div className="flex items-center gap-1">
                            Data
                            {romaneioSortColumn === 'data' && (
                              romaneioSortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('titulo')}
                        >
                          <div className="flex items-center gap-1">
                            Romaneio
                            {romaneioSortColumn === 'titulo' && (
                              romaneioSortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Clientes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRomaneios.map((romaneio) => (
                        <TableRow key={romaneio.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {format(new Date(romaneio.data_romaneio), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{romaneio.titulo}</h3>
                              <Badge variant={romaneio.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                                {romaneio.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{romaneio.linhas?.length || 0}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {romaneio.linhas?.length || 0} clientes
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRomaneio(romaneio)}
                              >
                                Ver Detalhes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRomaneioLinhas(romaneio)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendToHistory(romaneio.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Concluir
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteRomaneio(romaneio.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando {filteredRomaneios.length} de {romaneios.length} romaneios
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela Editável de Importação Recente */}
          {isEditingImported && importedLines.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Dados Importados — Editar
                </CardTitle>
                <CardDescription>
                  Clique nos campos para editar. As alterações serão salvas ao clicar em "Salvar Alterações".
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome do Cliente</TableHead>
                        <TableHead>Transportadora</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead className="text-right">Vol.</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedLines.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              value={row.codigo_cliente || ''}
                              onChange={(e) => handleUpdateImportedLine(idx, 'codigo_cliente', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.nome_cliente || ''}
                              onChange={(e) => handleUpdateImportedLine(idx, 'nome_cliente', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.transportadora_sugerida || row.transportador || ''}
                              onChange={(e) => handleUpdateImportedLine(idx, 'transportadora_sugerida', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.regra_frete_aplicada || 'CIF'}
                              onValueChange={(val) => handleUpdateImportedLine(idx, 'regra_frete_aplicada', val)}
                            >
                              <SelectTrigger className="h-8 w-[100px] text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CIF">CIF</SelectItem>
                                <SelectItem value="FOB">FOB</SelectItem>
                                <SelectItem value="CIF_FOB">CIF_FOB</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={row.volume || 1}
                              onChange={(e) => handleUpdateImportedLine(idx, 'volume', e.target.value)}
                              className="h-8 text-sm w-[60px] text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.observacao || ''}
                              onChange={(e) => handleUpdateImportedLine(idx, 'observacao', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCancelImportedEdit}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveImportedChanges}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

      {/* ============================================================ */}
      {/* TAB: CONSULTAR PEDIDOS AUGE                                   */}
      {/* ============================================================ */}
      {activeTab === 'consultar' && (
        <ConsultaPedidos onPedidosSelecionados={(pedidos) => {
          toast.success(`${pedidos.length} pedidos selecionados`);
        }} />
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

          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-4 items-center">
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
            <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button onClick={() => setEditingRule({})} variant="outline" className="gap-2">
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
                      <TableHead>Código</TableHead>
                      <TableHead>Nome do Cliente</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Transportadora CIF</TableHead>
                      <TableHead>Transportadora FOB</TableHead>
                      <TableHead>Valor Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegras.map((regra) => (
                      <TableRow key={regra.id}>
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
                          <Badge variant={regra.status === 'ativo' ? 'default' : 'destructive'}>
                            {regra.status}
                          </Badge>
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
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: HISTÓRICO DE ROMANEIOS IMPORTADOS                       */}
      {/* ============================================================ */}

      {/* Import Dialog */}
      <RomaneioImportDialog
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImported={handleImportRomaneio}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center animate-success">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sucesso!</h2>
            <p className="text-gray-600">{successCount} romaneio(s) importado(s) com sucesso</p>
          </div>
        </div>
      )}

      {/* Romaneio Detail Dialog */}
      <Dialog open={showRomaneioDetail} onOpenChange={(open) => {
        if (!open) setShowRomaneioDetail(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalhes do Romaneio
            </DialogTitle>
            <DialogDescription>
              {selectedRomaneio && (
                <>
                  {format(new Date(selectedRomaneio.data_romaneio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {' • '}
                  {selectedRomaneio.linhas?.length || 0} clientes
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRomaneio && selectedRomaneio.linhas && selectedRomaneio.linhas.length > 0 ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Código</th>
                      <th className="px-4 py-3 text-left font-medium">Nome do Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Qtd</th>
                      <th className="px-4 py-3 text-left font-medium">Frete</th>
                      <th className="px-4 py-3 text-left font-medium">Transportadora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRomaneio.linhas.map((linha, idx) => (
                      <tr key={idx} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs">{linha.codigo_cliente}</td>
                        <td className="px-4 py-3 max-w-[250px] truncate" title={linha.nome_cliente}>{linha.nome_cliente}</td>
                        <td className="px-4 py-3 text-center">{linha.quantidade}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {linha.modalidade_frete || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{linha.transportadora || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma linha encontrada para este romaneio</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRomaneioDetail(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={showLogDetail} onOpenChange={(open) => !open && setShowLogDetail(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
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

      {/* ============================================================ */}
      {/* TAB: HISTÓRICO                                               */}
      {/* ============================================================ */}
      {activeTab === 'historico' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Romaneios Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historicoRomaneios.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum romaneio no histórico</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historicoRomaneios.map((romaneio) => (
                    <Card key={romaneio.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{romaneio.titulo}</h3>
                              <Badge variant="secondary">{romaneio.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(romaneio.data_romaneio), "dd/MM/yyyy", { locale: ptBR })}
                              {romaneio.linhas && (
                                <span className="ml-4">• {romaneio.linhas.length} clientes</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRomaneio(romaneio)}
                            >
                              Ver Detalhes
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFromHistorico(romaneio.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
