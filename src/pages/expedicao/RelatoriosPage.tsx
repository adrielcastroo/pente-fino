import { useMemo, useState } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileSpreadsheet, FileText, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  usePickings,
  useTransportadoras,
  type Picking,
  type PickingStatus,
} from '@/hooks/expedicao/useExpedicaoData';

const STATUS_LABEL: Record<PickingStatus, string> = {
  aguardando: 'Aguardando',
  em_separacao: 'Em separação',
  em_conferencia: 'Em conferência',
  conferido: 'Conferido',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
};

const STATUS_OPTIONS: ('todos' | PickingStatus)[] = [
  'todos',
  'aguardando',
  'em_separacao',
  'em_conferencia',
  'conferido',
  'faturado',
  'cancelado',
];

const fmtDate = (iso: string | null) =>
  iso ? format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—';

export default function RelatoriosPage() {
  const { data: pickings = [], isLoading } = usePickings();
  const { data: transportadoras = [] } = useTransportadoras();

  const [dataInicio, setDataInicio] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  );
  const [dataFim, setDataFim] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'todos' | PickingStatus>('todos');
  const [transportadoraId, setTransportadoraId] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  const filtered = useMemo<Picking[]>(() => {
    const ini = new Date(`${dataInicio}T00:00:00`).getTime();
    const fim = new Date(`${dataFim}T23:59:59`).getTime();
    const q = busca.trim().toLowerCase();

    return pickings.filter((p) => {
      const t = new Date(p.created_at).getTime();
      if (t < ini || t > fim) return false;
      if (status !== 'todos' && p.status !== status) return false;
      if (transportadoraId !== 'todas' && p.transportadora_id !== transportadoraId) return false;
      if (q) {
        const hay = `${p.numero} ${p.cliente} ${p.cidade ?? ''} ${p.regiao ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pickings, dataInicio, dataFim, status, transportadoraId, busca]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const pecas = filtered.reduce((acc, p) => acc + (p.total_pecas || 0), 0);
    const faturados = filtered.filter((p) => p.status === 'faturado').length;
    const cancelados = filtered.filter((p) => p.status === 'cancelado').length;
    return { total, pecas, faturados, cancelados };
  }, [filtered]);

  const periodoLabel = `${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(
    parseISO(dataFim),
    'dd/MM/yyyy',
  )}`;

  async function exportExcel() {
    if (filtered.length === 0) {
      toast.warning('Nenhum dado para exportar');
      return;
    }
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Pente Fino · Expedição';
    wb.created = new Date();

    const ws = wb.addWorksheet('Pickings');
    ws.columns = [
      { header: 'Número', key: 'numero', width: 16 },
      { header: 'Cliente', key: 'cliente', width: 32 },
      { header: 'Cidade', key: 'cidade', width: 20 },
      { header: 'Região', key: 'regiao', width: 12 },
      { header: 'Transportadora', key: 'transportadora', width: 24 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Peças', key: 'pecas', width: 10 },
      { header: 'Criado em', key: 'criado', width: 18 },
      { header: 'Finalizado em', key: 'finalizado', width: 18 },
      { header: 'Motivo cancelamento', key: 'motivo', width: 32 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    filtered.forEach((p) => {
      ws.addRow({
        numero: p.numero,
        cliente: p.cliente,
        cidade: p.cidade ?? '',
        regiao: p.regiao ?? '',
        transportadora: p.transportadora?.nome ?? '',
        status: STATUS_LABEL[p.status],
        pecas: p.total_pecas ?? 0,
        criado: fmtDate(p.created_at),
        finalizado: fmtDate(p.finished_at),
        motivo: p.motivo_cancelamento ?? '',
      });
    });

    // Resumo
    const wsR = wb.addWorksheet('Resumo');
    wsR.columns = [
      { header: 'Indicador', key: 'k', width: 28 },
      { header: 'Valor', key: 'v', width: 18 },
    ];
    wsR.getRow(1).font = { bold: true };
    wsR.addRows([
      { k: 'Período', v: periodoLabel },
      { k: 'Total de pickings', v: kpis.total },
      { k: 'Total de peças', v: kpis.pecas },
      { k: 'Faturados', v: kpis.faturados },
      { k: 'Cancelados', v: kpis.cancelados },
    ]);

    const buf = await wb.xlsx.writeBuffer();
    const fname = `expedicao_relatorio_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    saveAs(new Blob([buf]), fname);
    toast.success('Excel gerado');
  }

  function exportPDF() {
    if (filtered.length === 0) {
      toast.warning('Nenhum dado para exportar');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Relatório de Expedição — Pickings', 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Período: ${periodoLabel}`, 40, 58);
    doc.text(
      `Total: ${kpis.total}  ·  Peças: ${kpis.pecas}  ·  Faturados: ${kpis.faturados}  ·  Cancelados: ${kpis.cancelados}`,
      40,
      72,
    );

    autoTable(doc, {
      startY: 90,
      head: [['Número', 'Cliente', 'Cidade', 'Transportadora', 'Status', 'Peças', 'Criado em']],
      body: filtered.map((p) => [
        p.numero,
        p.cliente,
        p.cidade ?? '—',
        p.transportadora?.nome ?? '—',
        STATUS_LABEL[p.status],
        String(p.total_pecas ?? 0),
        fmtDate(p.created_at),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 40, right: 40 },
    });

    const fname = `expedicao_relatorio_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fname);
    toast.success('PDF gerado');
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Exporte pickings em Excel ou PDF com filtros por período, transportadora e status.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Início</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Transportadora</Label>
            <Select value={transportadoraId} onValueChange={setTransportadoraId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {transportadoras.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nº, cliente, cidade…"
                className="pl-7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pickings', value: kpis.total },
          { label: 'Peças', value: kpis.pecas },
          { label: 'Faturados', value: kpis.faturados },
          { label: 'Cancelados', value: kpis.cancelados },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{k.value.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={exportExcel} disabled={isLoading} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
        </Button>
        <Button onClick={exportPDF} disabled={isLoading} variant="outline" className="gap-2">
          <FileText className="w-4 h-4" /> Exportar PDF
        </Button>
        <span className="text-xs text-muted-foreground self-center ml-1">
          {filtered.length} registro(s) · {periodoLabel}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prévia</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Peças</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.numero}</TableCell>
                  <TableCell>{p.cliente}</TableCell>
                  <TableCell>{p.cidade ?? '—'}</TableCell>
                  <TableCell>{p.transportadora?.nome ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABEL[p.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.total_pecas ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(p.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                    Nenhum registro no período/filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 50 && (
            <p className="text-[11px] text-muted-foreground px-4 py-2 border-t">
              Exibindo 50 de {filtered.length}. Exporte para ver todos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
