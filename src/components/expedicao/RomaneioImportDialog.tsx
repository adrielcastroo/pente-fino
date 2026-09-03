import { useState, useRef } from 'react';
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
  quantidade?: number;
  modalidade?: string;
  transportadora?: string;
  observacoes?: string;
}

export default function RomaneioImportDialog({ open, onOpenChange, onImported }: RomaneioImportDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [dataRomaneio, setDataRomaneio] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
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
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

      // Map columns - adjust based on your actual column names
      const mapped: PreviewRow[] = jsonData.map((row: any) => ({
        codigo_cliente: row['Código'] || row['codigo_cliente'] || row['CODIGO'] || '',
        nome_cliente: row['Nome'] || row['nome_cliente'] || row['NOME'] || row['Razão Social'] || '',
        quantidade: row['Quantidade'] || row['qtd'] || row['QTD'] || 1,
        modalidade: row['Modalidade'] || row['modalidade_frete'] || 'CIF',
        transportadora: row['Transportadora'] || row['transportadora'] || '',
        observacoes: row['Observações'] || row['observacoes'] || '',
      })).filter(r => r.codigo_cliente);

      setPreview(mapped.slice(0, 10));
      setPreviewCount(mapped.length);
    } catch (error) {
      toast.error('Erro ao ler arquivo Excel');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!arquivo || !titulo) {
      toast.error('Preencha o título e selecione um arquivo');
      return;
    }

    setIsLoading(true);
    try {
      // Here you would call the API to save the romaneio
      // For now, we'll just show success
      toast.success(`Romaneio "${titulo}" importado com ${previewCount} clientes!`);
      onImported('mock-id', preview);
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
    setPreviewCount(0);
    setTitulo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleClose();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Romaneio Diário
          </DialogTitle>
          <DialogDescription>
            Importe uma planilha Excel com os clientes do romaneio de hoje.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Romaneio</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Romaneio 03/09/2025"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="data">Data do Romaneio</Label>
            <Input
              id="data"
              type="date"
              value={dataRomaneio}
              onChange={(e) => setDataRomaneio(e.target.value)}
            />
          </div>

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
                      <th className="px-3 py-2 text-left">Modalidade</th>
                      <th className="px-3 py-2 text-right">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2 font-mono">{row.codigo_cliente}</td>
                        <td className="px-3 py-2">{row.nome_cliente}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {row.modalidade || '-'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">{row.quantidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">📋 Formato esperado da planilha:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Código</strong> ou <strong>código_cliente</strong> - Código do cliente (ex: C1739)</li>
              <li><strong>Nome</strong> ou <strong>nome_cliente</strong> - Nome do cliente</li>
              <li><strong>Quantidade</strong> ou <strong>qtd</strong> - Quantidade (opcional, padrão 1)</li>
              <li><strong>Modalidade</strong> - CIF, FOB ou CIF_FOB</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || !arquivo || !titulo}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
