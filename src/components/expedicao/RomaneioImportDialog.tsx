import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
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
}

export default function RomaneioImportDialog({ open, onOpenChange, onImported }: RomaneioImportDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [allRows, setAllRows] = useState<PreviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
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
      
      // Read all rows as array
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });
      
      // Find header row (contains "Cód. Cliente")
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

      // Parse data rows (starting from header row + 1)
      const mapped: PreviewRow[] = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0]) continue;
        
        // Skip footer rows (SUBTOTAL, Assinatura, etc.)
        const firstCell = String(row[0]);
        if (firstCell.includes('SUBTOTAL') || firstCell.includes('Assinatura') || firstCell.includes('CPF')) {
          continue;
        }

        // Parse date (format: DD.MM.YY or DD/MM/YY)
        let date = '';
        if (row[3]) {
          const dateStr = String(row[3]);
          // Convert DD.MM.YY to YYYY-MM-DD
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
          // regra aplicada ao import (preenchido pelo dialog de regras)
          regra_frete_aplicada: null as any,
          precisa_escolha_cif_fob: false,
        });
      }

      setPreview(mapped.slice(0, 10));
      setAllRows(mapped);
      setPreviewCount(mapped.length);
      
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

  const handleImport = async () => {
    if (!arquivo) {
      toast.error('Selecione um arquivo');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Criar o cabeçalho do romaneio
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

      // 2. Inserir as linhas do romaneio
      const linhasParaInserir = allRows.map((row) => ({
        romaneio_id: romaneioData.id,
        codigo_cliente: row.codigo_cliente,
        nome_cliente: row.nome_cliente,
        quantidade: row.volume || 1,
        modalidade_frete: row.regra_frete_aplicada || 'CIF',
        transportadora: row.transportador,
        observacoes: null,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pré-visualização (primeiros 10)</Label>
                <Badge variant="secondary">{previewCount} total</Badge>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">NF</th>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Transportador</th>
                      <th className="px-3 py-2 text-right">Vol.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2 font-mono">{row.codigo_cliente}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate" title={row.nome_cliente}>{row.nome_cliente}</td>
                        <td className="px-3 py-2">{row.nf || '-'}</td>
                        <td className="px-3 py-2">{row.data || '-'}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {row.transportador || '-'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">{row.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={isLoading || !arquivo}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Importar Romaneio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
