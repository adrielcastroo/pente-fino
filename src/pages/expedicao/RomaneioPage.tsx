import { useMemo, useState, useEffect } from 'react';
import { FileText, Truck, Plus, Loader2, Upload, RefreshCw, Calendar, ChevronDown, ChevronUp, Package, Search } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [activeTab, setActiveTab] = useState<'romaneio' | 'regras' | 'historico'>('romaneio');
  const [daysAhead, setDaysAhead] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<RomaneioPreview[]>([]);
  const [logs, setLogs] = useState<LogRomaneio[]>([]);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogRomaneio | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [regras, setRegras] = useState<FaturamentoRegra[]>([]);
  const [editingRule, setEditingRule] = useState<FaturamentoRegra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [romaneios, setRomaneios] = useState<RomaneioDia[]>([]);
  const [selectedRomaneio, setSelectedRomaneio] = useState<RomaneioDia | null>(null);

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

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['romaneio_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('romaneio_automatico_logs')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

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

  useEffect(() => {
    if (romaneiosData) setRomaneios(romaneiosData);
  }, [romaneiosData]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleGenerateRomaneio = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('expedicao-auto-romaneio', {
        body: { action: 'generate', daysAhead },
      });

      if (error) throw error;
      
      setPreview(data.results || []);
      toast.success(`Romaneios gerados para ${daysAhead} dia(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar romaneio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportRomaneio = async (romaneioId: string, linhas: any[]) => {
    try {
      // Save romaneio
      const { data: romaneioData, error: romaneioError } = await supabase
        .from('romaneio_dias')
        .insert({
          data_romaneio: new Date().toISOString().split('T')[0],
          titulo: `Romaneio ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`,
          status: 'ativo',
        })
        .select()
        .single();

      if (romaneioError) throw romaneioError;

      // Save lines
      const linhasParaInserir = linhas.map((l: any) => ({
        romaneio_id: romaneioData.id,
        codigo_cliente: l.codigo_cliente,
        nome_cliente: l.nome_cliente,
        quantidade: l.quantidade || 1,
        modalidade_frete: l.modalidade || 'CIF',
        transportadora: l.transportadora || '',
        observacoes: l.observacoes || null,
      }));

      const { error: linhasError } = await supabase
        .from('romaneio_linhas')
        .insert(linhasParaInserir);

      if (linhasError) throw linhasError;

      toast.success(`Romaneio importado com ${linhas.length} clientes!`);
      refetchRomaneios();
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
          <Package className="w-4 h-4" />
          Romaneios Importados
        </Button>
      </div>

      {/* ============================================================ */}
      {/* TAB: ROMANEIO                                                */}
      {/* ============================================================ */}
      {activeTab === 'romaneio' && (
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Gerar Romaneio Automático</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daysAhead">Dias a frente</Label>
                  <Input
                    id="daysAhead"
                    type="number"
                    min={1}
                    max={7}
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(parseInt(e.target.value) || 3)}
                    className="w-24"
                  />
                </div>
                <Button 
                  onClick={handleGenerateRomaneio} 
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Gerar Romaneio
                </Button>
              </div>
            </CardContent>
          </Card>

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

          {/* Logs */}
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
      {activeTab === 'historico' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Romaneios Importados</h2>
            <Button onClick={() => refetchRomaneios()} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>

          {isLoadingRomaneios ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : romaneios.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={Package}
                  title="Nenhum romaneio importado"
                  description="Vá para a aba 'Romaneio' e importe uma planilha"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {romaneios.map((romaneio) => (
                <Card key={romaneio.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-lg">{romaneio.titulo}</h3>
                          <Badge variant={romaneio.status === 'ativo' ? 'default' : 'secondary'}>
                            {romaneio.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(romaneio.data_romaneio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                          onClick={() => handleDeleteRomaneio(romaneio.id)}
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
        </div>
      )}

      {/* Import Dialog */}
      <RomaneioImportDialog
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImported={handleImportRomaneio}
      />

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
