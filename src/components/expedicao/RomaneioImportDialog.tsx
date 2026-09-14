import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface RomaneioImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (romaneioId: string, linhas: any[]) => void;
}

interface PreviewRow {
  codigo_cliente: string;
  nome_cliente: string;
  nf?: string;
  data?: string;
  transportador: string;
  volume?: number;
  regra_frete_aplicada?: string | null;
  precisa_escolha_cif_fob?: boolean;
  regra_encontrada?: boolean;
  transportadora_sugerida?: string;
  valor_total_pedido?: number;
  valor_minimo?: number;
  observacao?: string;
}

interface FaturamentoRegra {
  codigo_cliente: string;
  nome_cliente: string;
  modalidade_frete: string;
  valor_minimo_frete: number | null;
  transportadora_cif: string | null;
  transportadora_fob: string | null;
}

export default function RomaneioImportDialog({ open, onOpenChange, onImported }: RomaneioImportDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [allRows, setAllRows] = useState<PreviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [isProcessingRules, setIsProcessingRules] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar regras de frete
  const fetchRegras = async (): Promise<FaturamentoRegra[]> => {
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

      all.push(...data as FaturamentoRegra[]);
      offset += BATCH_SIZE;
      hasMore = data.length === BATCH_SIZE;
    }

    return all;
  };

  // Buscar pedidos do Auge por nome do cliente e data de expedição
  const fetchPedidosPorCliente = async (nomeCliente: string, dataRomaneio: string): Promise<{ total: number; count: number }> => {
    const BATCH_SIZE = 500;
    let offset = 0;
    let hasMore = true;
    let totalValor = 0;
    let totalCount = 0;

    while (hasMore && totalCount < 5000) {
      const { data, error } = await supabase
        .from('auge_pedidos')
        .select('vl_total, dt_entrega_prevista')
        .ilike('nome_cliente', `%${nomeCliente}%`)
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      data.forEach(p => {
        // Verificar se a data de expedição (dt_entrega_prevista) corresponde à data do romaneio
        if (p.dt_entrega_prevista && dataRomaneio) {
          const dataPedido = String(p.dt_entrega_prevista).slice(0, 10);
          const dataRomaneioFormatada = String(dataRomaneio).slice(0, 10);
          if (dataPedido === dataRomaneioFormatada) {
            totalValor += p.vl_total || 0;
            totalCount++;
          }
        }
      });

      offset += BATCH_SIZE;
      hasMore = data.length === BATCH_SIZE;
    }

    return { total: totalValor, count: totalCount };
  };

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

      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row[0] && String(row[0]).includes('Cód.')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        toast.error('Formato não reconhecido: não foi possível encontrar o cabeçalho');
        return;
      }

      const mapped: PreviewRow[] = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0]) continue;

        const firstCell = String(row[0]);
        if (firstCell.includes('SUBTOTAL') || firstCell.includes('Assinatura') || firstCell.includes('CPF')) {
          continue;
        }

        let date = '';
        if (row[3]) {
          const dateStr = String(row[3]);
          if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
              date = `${year}-${month}-${day}`;
            }
          } else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
              date = `${year}-${month}-${day}`;
            }
          }
        }

        mapped.push({
          codigo_cliente: String(row[0] || '').trim(),
          nome_cliente: String(row[1] || '').trim(),
          nf: row[2] ? String(row[2]) : undefined,
          data: date,
          transportador: String(row[4] || '').trim(),
          volume: row[5] ? parseInt(row[5]) || 1 : 1,
          regra_frete_aplicada: null as any,
          precisa_escolha_cif_fob: false,
          regra_encontrada: false,
          transportadora_sugerida: '',
          valor_total_pedido: 0,
          valor_minimo: 0,
          observacao: '',
        });
      }

      setPreview(mapped.slice(0, 10));
      setAllRows(mapped);
      setPreviewCount(mapped.length);

      if (mapped.length === 0) {
        toast.error('Nenhuma linha de dados encontrada na planilha');
      } else {
        toast.info(`Encontrados ${mapped.length} clientes. Buscando regras de frete...`);
        await processarRegras(mapped);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao ler arquivo Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const processarRegras = async (rows: PreviewRow[]) => {
    setIsProcessingRules(true);
    try {
      // Determinar a data do romaneio a partir da primeira linha com data válida
      const dataRomaneio = rows.find(r => r.data)?.data || new Date().toISOString().split('T')[0];

      const regras = await fetchRegras();
      const regrasMap = new Map<string, FaturamentoRegra>();
      for (const regra of regras) {
        regrasMap.set(regra.codigo_cliente, regra);
        regrasMap.set(regra.nome_cliente, regra);
      }

      const updatedRows = rows.map(async (row) => {
        const regra = regrasMap.get(row.codigo_cliente) || regrasMap.get(row.nome_cliente);

        if (!regra) {
          return { ...row, observacao: 'Regra não encontrada' };
        }

        const updatedRow = {
          ...row,
          regra_frete_aplicada: regra.modalidade_frete,
          regra_encontrada: true,
          valor_minimo: regra.valor_minimo_frete,
          transportadora_cif: regra.transportadora_cif,
          transportadora_fob: regra.transportadora_fob,
        };

        if (regra.modalidade_frete === 'CIF_FOB' && regra.valor_minimo_frete) {
          const pedidosInfo = await fetchPedidosPorCliente(row.nome_cliente, dataRomaneio);
          const valorTotal = pedidosInfo.total;

          updatedRow.valor_total_pedido = valorTotal;

          if (valorTotal >= regra.valor_minimo_frete) {
            updatedRow.transportadora_sugerida = regra.transportadora_cif || '';
            updatedRow.regra_frete_aplicada = 'CIF';
            updatedRow.observacao = `Valor total: ${valorTotal.toFixed(2)} >= Mínimo: ${regra.valor_minimo_frete.toFixed(2)}`;
          } else {
            updatedRow.transportadora_sugerida = regra.transportadora_fob || '';
            updatedRow.regra_frete_aplicada = 'FOB';
            updatedRow.observacao = `Valor total: ${valorTotal.toFixed(2)} < Mínimo: ${regra.valor_minimo_frete.toFixed(2)}`;
          }
        } else if (regra.modalidade_frete === 'CIF') {
          updatedRow.transportadora_sugerida = regra.transportadora_cif || '';
          updatedRow.regra_frete_aplicada = 'CIF';
        } else if (regra.modalidade_frete === 'FOB') {
          updatedRow.transportadora_sugerida = regra.transportadora_fob || '';
          updatedRow.regra_frete_aplicada = 'FOB';
        } else if (regra.modalidade_frete === 'FOB_SEMPRE') {
          updatedRow.transportadora_sugerida = regra.transportadora_fob || '';
          updatedRow.regra_frete_aplicada = 'FOB';
        }

        return updatedRow;
      });

      const results = await Promise.all(updatedRows);
      const finalRows = results as PreviewRow[];

      setPreview(finalRows.slice(0, 10));
      setAllRows(finalRows);

      const semRegra = finalRows.filter(r => !r.regra_encontrada).length;
      if (semRegra > 0) {
        toast.warning(`${semRegra} cliente(s) sem regra de frete definida`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar regras de frete');
    } finally {
      setIsProcessingRules(false);
    }
  };

  const handleImport = async () => {
    if (!arquivo) {
      toast.error('Selecione um arquivo');
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: romaneioData, error: romaneioError } = await (supabase as any)
        .from('romaneio_dias')
        .insert({
          titulo: `Importação ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          data_romaneio: today,
          status: 'ativo',
        })
        .select()
        .single();

      if (romaneioError) throw romaneioError;

      const linhasParaInserir = allRows.map((row) => ({
        romaneio_id: romaneioData.id,
        codigo_cliente: row.codigo_cliente,
        nome_cliente: row.nome_cliente,
        quantidade: row.volume || 1,
        modalidade_frete: row.regra_frete_aplicada || 'CIF',
        transportadora: row.transportadora_sugerida || row.transportador,
        observacoes: row.observacao || null,
      }));

      const { error: linhasError } = await (supabase as any)
        .from('romaneio_linhas')
        .insert(linhasParaInserir);

      if (linhasError) throw linhasError;

      toast.success(`Importado ${previewCount} clientes com sucesso!`);
      onImported(romaneioData.id, allRows);
      handleClose();
    } catch (error) {
      toast.error('Erro ao importar romaneio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setArquivo(null);
    setPreview([]);
    setAllRows([]);
    setPreviewCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleClose();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Romaneio de Carga
          </DialogTitle>
          <DialogDescription>
            Importe uma planilha Excel com os clientes do romaneio. O sistema buscará automaticamente as regras de frete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
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

          {/* Processing indicator */}
          {isProcessingRules && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-spin">⟳</span>
              Processando regras de frete...
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pré-visualização</Label>
                <Badge variant="secondary">{previewCount} total</Badge>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs">Código</th>
                      <th className="px-2 py-2 text-left text-xs hidden sm:table-cell">Nome</th>
                      <th className="px-2 py-2 text-left text-xs hidden md:table-cell">NF</th>
                      <th className="px-2 py-2 text-left text-xs hidden md:table-cell">Data</th>
                      <th className="px-2 py-2 text-left text-xs hidden lg:table-cell">Transportadora</th>
                      <th className="px-2 py-2 text-left text-xs hidden lg:table-cell">Modalidade</th>
                      <th className="px-2 py-2 text-right text-xs">Vol.</th>
                      <th className="px-2 py-2 text-left text-xs hidden xl:table-cell">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t hover:bg-muted/50">
                        <td className="px-2 py-2 font-mono text-xs">{row.codigo_cliente}</td>
                        <td className="px-2 py-2 max-w-[150px] truncate hidden sm:table-cell" title={row.nome_cliente}>{row.nome_cliente}</td>
                        <td className="px-2 py-2 text-xs hidden md:table-cell">{row.nf || '-'}</td>
                        <td className="px-2 py-2 text-xs hidden md:table-cell">{row.data || '-'}</td>
                        <td className="px-2 py-2 hidden lg:table-cell">
                          {row.transportadora_sugerida ? (
                            <Badge variant="default" className="text-xs">{row.transportadora_sugerida}</Badge>
                          ) : row.transportador ? (
                            <Badge variant="outline" className="text-xs">{row.transportador}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 hidden lg:table-cell">
                          {row.regra_frete_aplicada ? (
                            <Badge variant={row.regra_frete_aplicada === 'CIF_FOB' ? 'secondary' : 'default'} className="text-xs">
                              {row.regra_frete_aplicada}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right text-xs">{row.volume}</td>
                        <td className="px-2 py-2 text-xs text-muted-foreground max-w-[200px] truncate hidden xl:table-cell" title={row.observacao}>
                          {row.observacao || (row.regra_encontrada ? 'Regra aplicada' : 'Sem regra')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length < allRows.length && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando {preview.length} de {allRows.length} registros
                </p>
              )}
            </div>
          )}

          {/* Info box */}
          {preview.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="text-muted-foreground">
                <p>• Regras de frete são buscadas automaticamente pela tabela <code>faturamento_regras</code></p>
                <p>• Para clientes CIF_FOB com valor mínimo, o sistema consulta pedidos do Auge para decidir entre CIF/FOB</p>
                <p>• Se não houver regra, a transportadora original da planilha é mantida</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={isLoading || !arquivo || isProcessingRules}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Importar Romaneio ({previewCount} clientes)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
