import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
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
  v === null ? '-' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
      // Só aplica a regra se o cliente tiver valor mínimo configurado
      const temMinimo = Number(regra?.valor_minimo_frete ?? 0) > 0;
      const decisao = decidirFrete({ codigoCliente: l.codigo_cliente, nomeCliente: l.nome_cliente, transportadorPlanilha: l.transportador, regra: temMinimo ? regra : undefined, pedidos });
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
      const norm = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(30, jsonData.length); i++) {
        const cells = (jsonData[i] ?? []).map(norm);
        if (cells.some((c: string) => /^(cod|codigo)\b|cod\.? ?cliente|cardcode/.test(c)) && cells.some((c: string) => /cliente|nome|razao/.test(c))) {
          headerRowIndex = i;
          break;
        }
      }
      if (headerRowIndex === -1) {
              // Tenta novamente com padrões mais flexíveis
              // Procura por qualquer célula que contenha "codigo", "cliente", "nome" ou "produto" em quaisquer posições
              for (let i = 0; i < Math.min(30, jsonData.length); i++) {
                const row = jsonData[i] ?? [];
                const rowStr = String(row).toLowerCase();
                if (/cód|codigo|cliente|nome|produto/.test(rowStr) && row.length > 0) {
                  // Encontrou linhas com indicadores de cabeçalho - ignora e continua
                }
              }
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
      // onImported agora é chamado apenas ao clicar "Confirmar Importação" no DialogFooter
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Romaneio de Carga
          </DialogTitle>
          <DialogDescription>
            Importe uma planilha Excel com os clientes do romaneio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Planilha Excel</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
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
                <div className="space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                  <p className="font-medium">{arquivo.name}</p>
                  <p className="text-sm text-muted-foreground">{previewCount} clientes encontrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">Clique para selecionar a planilha</p>
                  <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls</p>
                </div>
              )}
            </div>
          </div>
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pré-visualização · romaneio de {dataRomaneio.split('-').reverse().join('/')}</Label>
                <div className="flex gap-2">
                  {fonte && <Badge variant="outline">Pedidos: {fonte === 'auge' ? 'Auge ao vivo' : 'cópia local'}</Badge>}
                  <Badge variant="secondary">{previewCount} total</Badge>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-[50vh]">
                <table className="w-full min-w-[1100px] text-sm table-fixed border-collapse">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="w-[80px] px-3 py-2 text-left font-medium">Código</th>
                      <th className="w-[180px] px-3 py-2 text-left font-medium">Nome</th>
                      <th className="w-[80px] px-3 py-2 text-left font-medium">NF</th>
                      <th className="w-[100px] px-3 py-2 text-left font-medium">Data</th>
                      <th className="w-[120px] px-3 py-2 text-left font-medium">Planilha</th>
                      <th className="w-[60px] px-3 py-2 text-right font-medium">Vol.</th>
                      <th className="w-[110px] px-3 py-2 text-right font-medium">Valor pedidos</th>
                      <th className="w-[100px] px-3 py-2 text-right font-medium">Mínimo</th>
                      <th className="w-[130px] px-3 py-2 text-left font-medium">Situação</th>
                      <th className="w-[140px] px-3 py-2 text-left font-medium">Transportadora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t hover:bg-muted/50">
                        <td className="px-3 py-2 font-mono text-xs break-all">{row.codigo_cliente}</td>
                        <td className="px-3 py-2 text-xs break-words">{row.nome_cliente}</td>
                        <td className="px-3 py-2 text-xs">{row.nf || '-'}</td>
                        <td className="px-3 py-2 text-xs">{row.data || '-'}</td>
                        <td className="px-3 py-2 text-xs"><Badge variant="outline" className="text-[10px]">{row.transportador || '-'}</Badge></td>
                        <td className="px-3 py-2 text-xs text-right">{row.volume}</td>
                        <td className="px-3 py-2 text-xs text-right" title={row.decisao?.pedidos.join(', ')}>
                          {moeda(row.decisao?.valorPedidos ?? null)}{row.decisao?.qtdPedidos ? ` (${row.decisao.qtdPedidos})` : ''}
                        </td>
                        <td className="px-3 py-2 text-xs text-right">{moeda(row.decisao?.valorMinimo ?? null)}</td>
                        <td className="px-3 py-2 text-xs">
                          {row.decisao && (
                            <Badge variant={row.decisao.situacao === 'atingido' ? 'default' : row.decisao.flagExcecao ? 'destructive' : 'secondary'} className="text-[10px]">
                              {SITUACAO_LABEL[row.decisao.situacao]}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium break-words">
                          {row.decisao?.transportadora || '-'}{row.decisao?.modalidade ? ` · ${row.decisao.modalidade}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCloseDialog} disabled={isLoading || isImporting}>Cancelar</Button>
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
              className="gap-2"
            >
              {isImporting ? (
                <>Importando...</>
              ) : (
                <>
                  Confirmar Importação
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
