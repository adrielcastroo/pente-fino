import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Loader2, Truck, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { decidirFrete, dataPredominante, SITUACAO_LABEL, type DecisaoFrete, type PedidoAugeMin } from '@/lib/expedicao/regraFrete';

interface FaturamentoRegra {
  id: string;
  codigo_cliente: string;
  nome_cliente: string;
  modalidade_frete: string;
  valor_minimo_frete: number | null;
  transportadora_cif: string | null;
  transportadora_fob: string | null;
  status: string;
  dados_extra?: Record<string, any>;
}

interface RomaneioImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (linhas: PreviewRow[], dataRomaneio: string) => Promise<void> | void;
  regras: FaturamentoRegra[];
}

export interface PreviewRow {
  codigo_cliente: string;
  nome_cliente: string;
  nf?: string;
  data?: string;
  transportador: string;
  volume?: number;
  quantidade?: number;
  observacoes?: string | null;
  decisao?: DecisaoFrete;
}

const moeda = (v: number | null) =>
  v == null || v === 0 ? '-' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Consulta pedidos do Auge na data e aplica a regra de frete em cada linha. */
async function aplicarRegras(linhas: PreviewRow[], regras: FaturamentoRegra[]): Promise<{ linhas: PreviewRow[]; data: string; fonte: string | null }> {
  const data = dataPredominante(linhas.map((l) => l.data));
  // Compara códigos sem espaços/pontuação/zeros à esquerda (ex.: "C 001" = "C1")
  const chave = (v: string) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^([A-Z]*)0+(?=\d)/, '$1');
  const regraDe = (cod: string) => regras.find((r) => chave(r.codigo_cliente) === chave(cod));
  // Consulta sempre o Auge para alimentar a lógica de freight
  let pedidos: PedidoAugeMin[] | null = null;
  let fonte: string | null = null;
  try {
    const { data: resp, error } = await supabase.functions.invoke('auge-sync?action=romaneio_valor_minimo', { body: { data } });
    if (error || !resp?.ok) throw new Error(resp?.error || error?.message || 'Falha na consulta');
    pedidos = resp.pedidos as PedidoAugeMin[];
    fonte = resp.fonte;
  } catch (e) {
    console.warn('[RomaneioImport] Falha na consulta Auge:', e);
  }
  return {
    data, fonte,
    linhas: linhas.map((l) => {
      const regra = regraDe(l.codigo_cliente);
      const decisao = decidirFrete({ codigoCliente: l.codigo_cliente, nomeCliente: l.nome_cliente, transportadorPlanilha: l.transportador, regra, pedidos });
      return { ...l, decisao };
    }),
  };
}

export default function RomaneioImportDialog({ open, onOpenChange, onImported, regras }: RomaneioImportDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dataRomaneio, setDataRomaneio] = useState('');
  const [fonte, setFonte] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });
      // Localiza o cabeçalho em qualquer coluna das primeiras 30 linhas
      const norm = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(30, jsonData.length); i++) {
        const cells = (jsonData[i] ?? []).map(norm);
        if (cells.some((c: string) => /^(cod|codigo)\b|cod\.? ?cliente|cardcode/.test(c)) && cells.some((c: string) => /cliente|nome|razao/.test(c))) {
          headerRowIndex = i;
          break;
        }
      }
      if (headerRowIndex === -1) {
        toast.error('Não encontrei o cabeçalho da planilha. Verifique se a coluna "Cód." ou "Código" está presente.');
        return;
      }
      const header: string[] = (jsonData[headerRowIndex] ?? []).map(norm);
      const col = (re: RegExp, fb: number) => { const i = header.findIndex((h) => re.test(h)); return i >= 0 ? i : fb; };
      const cCod = col(/^cod|^codigo|código|cardcode/i, 0);
      const cNome = col(/nome|razao|cliente/i, 1);
      const cNf = col(/^nf|nota/i, 2);
      const cData = col(/data|dt/i, 3);
      const cTransp = col(/transp|transport/i, 4);
      const cVol = col(/vol|qtd|quant/i, 5);
      const cObs = col(/obs|observacoes/i, 6);
      const toIso = (v: unknown): string => {
        if (typeof v === 'number') {
          const d = XLSX.SSF.parse_date_code(v);
          return d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : '';
        }
        const m = String(v ?? '').trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
        if (!m) return /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : '';
        const y = m[3].length === 2 ? `20${m[3]}` : m[3];
        return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      };
      const mapped: PreviewRow[] = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        const cod = String(row[cCod] ?? '').trim();
        if (!cod) continue;
        if (/subtotal|total|assinatura|cpf/i.test(cod)) continue;
        const vol = parseInt(String(row[cVol] ?? '')) || 1;
        mapped.push({
          codigo_cliente: cod,
          nome_cliente: String(row[cNome] ?? '').trim(),
          nf: row[cNf] ? String(row[cNf]) : undefined,
          data: toIso(row[cData]),
          transportador: String(row[cTransp] ?? '').trim(),
          volume: vol,
          quantidade: vol,
          observacoes: row[cObs] ? String(row[cObs]).trim() : null,
        });
      }
      const r = await aplicarRegras(mapped, regras);
      setDataRomaneio(r.data);
      setFonte(r.fonte);
      setPreview(r.linhas);
      setPreviewCount(r.linhas.length);
      if (mapped.length === 0) {
        toast.error('Nenhuma linha de dados encontrada na planilha');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao ler arquivo Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setArquivo(null);
    setPreview([]);
    setPreviewCount(0);
    setDataRomaneio('');
    setFonte(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseDialog = () => {
    handleClose();
    onOpenChange(false);
  };

  // Stats
  const atingidos = preview.filter(r => r.decisao?.situacao === 'atingido').length;
  const naoAtigidos = preview.filter(r => r.decisao?.situacao !== 'atingido').length;
  const comExcecao = preview.filter(r => r.decisao?.flagExcecao).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader className="px-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Romaneio de Carga
            </DialogTitle>
            <DialogDescription>
              Importe uma planilha Excel com os clientes do romaneio. O sistema aplicará automaticamente as regras de frete.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Upload Area */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Planilha Excel</Label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              {arquivo ? (
                isLoading ? (
                  <div className="space-y-3 py-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{arquivo.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">Consultando Auge e aplicando regras de frete...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{arquivo.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{previewCount} clientes encontrados</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Clique para selecionar a planilha</p>
                    <p className="text-sm text-muted-foreground mt-1">Formatos aceitos: .xlsx, .xls</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {preview.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{previewCount}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{atingidos}</p>
                        <p className="text-xs text-muted-foreground">Atingido</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{naoAtigidos}</p>
                        <p className="text-xs text-muted-foreground">Não Atingido</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{preview.filter(r => r.decisao?.transportadora).length}</p>
                        <p className="text-xs text-muted-foreground">Transportadora</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-sm font-medium">Pré-visualização</Label>
                  <p className="text-xs text-muted-foreground">Romaneio de {dataRomaneio.split('-').reverse().join('/')}</p>
                </div>
                <div className="flex gap-2">
                  {fonte && (
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="w-3 h-3" />
                      Pedidos: {fonte === 'auge' ? 'Auge ao vivo' : 'cópia local'}
                    </Badge>
                  )}
                  <Badge variant="secondary">{previewCount} total</Badge>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium w-[80px]">Código</th>
                        <th className="px-3 py-2.5 text-left font-medium min-w-[200px]">Nome</th>
                        <th className="px-3 py-2.5 text-left font-medium w-[80px]">NF</th>
                        <th className="px-3 py-2.5 text-left font-medium w-[90px]">Data</th>
                        <th className="px-3 py-2.5 text-left font-medium w-[100px]">Transportador</th>
                        <th className="px-3 py-2.5 text-right font-medium w-[60px]">Vol.</th>
                        <th className="px-3 py-2.5 text-right font-medium w-[110px]">Valor Pedidos</th>
                        <th className="px-3 py-2.5 text-right font-medium w-[100px]">Mínimo</th>
                        <th className="px-3 py-2.5 text-left font-medium w-[110px]">Situação</th>
                        <th className="px-3 py-2.5 text-left font-medium w-[140px]">Transportadora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 font-mono text-xs">{row.codigo_cliente}</td>
                          <td className="px-3 py-2 text-xs max-w-[200px] truncate" title={row.nome_cliente}>{row.nome_cliente}</td>
                          <td className="px-3 py-2 text-xs">{row.nf || '-'}</td>
                          <td className="px-3 py-2 text-xs">{row.data || '-'}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-[10px]">{row.transportador || '-'}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-right">{row.volume}</td>
                          <td className="px-3 py-2 text-xs text-right" title={row.decisao?.pedidos?.join(', ')}>
                            {moeda(row.decisao?.valorPedidos ?? null)}
                            {row.decisao?.qtdPedidos ? ` <span className="text-muted-foreground">(${row.decisao.qtdPedidos})</span>` : ''}
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-medium">{moeda(row.decisao?.valorMinimo ?? null)}</td>
                          <td className="px-3 py-2">
                            {row.decisao && (
                              <Badge
                                variant={row.decisao.situacao === 'atingido' ? 'default' : row.decisao.flagExcecao ? 'destructive' : 'secondary'}
                                className="text-[10px]"
                              >
                                {SITUACAO_LABEL[row.decisao.situacao]}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-medium">
                            {row.decisao?.transportadora || '-'}{row.decisao?.modalidade ? ` <span className="text-muted-foreground">· {row.decisao.modalidade}</span>` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <Button variant="outline" onClick={handleCloseDialog} disabled={isLoading || isImporting}>
            Cancelar
          </Button>
          {preview.length > 0 && !isImporting && !isLoading && (
            <Button
              onClick={async () => {
                setIsImporting(true);
                try {
                  await onImported(preview, dataRomaneio);
                  toast.success(`Romaneio com ${preview.length} clientes importado!`);
                  handleCloseDialog();
                } catch (error: any) {
                  toast.error(error.message || 'Erro ao importar romaneio');
                } finally {
                  setIsImporting(false);
                }
              }}
              disabled={isImporting}
              className="gap-2 min-w-[180px]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  Confirmar Importação
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
