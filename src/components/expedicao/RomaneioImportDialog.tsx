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
  onImported: (linhas: any[]) => Promise<void> | void;
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
}

export default function RomaneioImportDialog({ open, onOpenChange, onImported, regras }: RomaneioImportDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
        if (firstCell.includes('SUBTOTAL') || firstCell.includes('Assinatura') || firstCell.includes('CPF')) continue;
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
          quantidade: row[5] ? parseInt(row[5]) || 1 : 1,
          observacoes: row[6] ? String(row[6]).trim() : null,
        });
      }
      setPreview(mapped);
      setPreviewCount(mapped.length);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); onOpenChange(o); }}>
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
                <Label>Pré-visualização (primeiros 10)</Label>
                <Badge variant="secondary">{previewCount} total</Badge>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-[50vh]">
                <table className="w-full text-sm table-fixed border-collapse">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="w-[80px] px-3 py-2 text-left font-medium">Código</th>
                      <th className="w-[180px] px-3 py-2 text-left font-medium">Nome</th>
                      <th className="w-[80px] px-3 py-2 text-left font-medium">NF</th>
                      <th className="w-[100px] px-3 py-2 text-left font-medium">Data</th>
                      <th className="w-[120px] px-3 py-2 text-left font-medium">Transportador</th>
                      <th className="w-[80px] px-3 py-2 text-right font-medium">Vol.</th>
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
          <Button variant="outline" onClick={handleClose} disabled={isLoading || isImporting}>Cancelar</Button>
          {preview.length > 0 && !isImporting && !isLoading && (
            <Button
              onClick={async () => {
                setIsImporting(true);
                try {
                  await onImported(preview);
                  toast.success(`Romaneio com ${preview.length} clientes importado!`);
                  handleClose();
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
