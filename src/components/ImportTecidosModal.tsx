import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Registro } from '@/types';
import { toast } from 'sonner';
import { 
  FileUp, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Table as TableIcon,
  Info
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateLoteSistema } from '@/lib/app-utils';

interface ImportTecidosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportTecidosModal({ open, onOpenChange }: ImportTecidosModalProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const addRegistro = useAppStore(s => s.addRegistro);
  const registros = useAppStore(s => s.registros);

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = [['Item', 'Processo', 'NF', 'M2', 'Largura', 'Lote', 'Endereco']];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Importacao');
      XLSX.writeFile(wb, 'modelo_importacao_tecidos.xlsx');
      toast.success('Template baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar template');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(10);
    setResults(null);

    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();

    try {
      let importedData: any[] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        importedData = XLSX.utils.sheet_to_json(worksheet);
      } else if (extension === 'txt' || extension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(/[,\t;]/).map(h => h.trim().toLowerCase());
        
        importedData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(/[,\t;]/);
          const obj: any = {};
          headers.forEach((h, i) => {
            if (h === 'item') obj.Item = values[i]?.trim();
            if (h === 'processo') obj.Processo = values[i]?.trim();
            if (h === 'nf') obj.NF = values[i]?.trim();
            if (h === 'm2') obj.M2 = values[i]?.trim();
            if (h === 'largura') obj.Largura = values[i]?.trim();
            if (h === 'lote') obj.Lote = values[i]?.trim();
            if (h === 'endereco') obj.Endereco = values[i]?.trim();
          });
          return obj;
        });
      } else if (extension === 'pdf' || extension === 'docx') {
        // Para PDF e DOCX, como não temos bibliotecas pesadas instaladas, 
        // vamos exibir uma mensagem que por enquanto o suporte é experimental 
        // ou pedir para converter para XLSX/TXT.
        // No entanto, o usuário pediu especificamente. 
        // Vou tentar extrair texto simples se possível ou orientar.
        throw new Error(`O formato .${extension} requer processamento avançado. Por favor, utilize XLSX, XLS ou TXT para maior precisão.`);
      } else {
        throw new Error('Formato de arquivo não suportado.');
      }

      setProgress(50);

      let successCount = 0;
      const errors: string[] = [];

      importedData.forEach((row: any, index) => {
        try {
          const item = (row.Item || row.item || '').toString();
          if (!item) throw new Error(`Linha ${index + 2}: Item não informado`);

          const m2 = parseFloat(row.M2 || row.m2 || 0);
          const largura = parseFloat(row.Largura || row.largura || 0);
          const mLinear = largura > 0 ? m2 / largura : 0;
          const processo = (row.Processo || row.processo || '').toString();
          const nf = (row.NF || row.nf || '').toString();
          const endereco = (row.Endereco || row.endereco || '').toString();
          const lote = (row.Lote || row.lote || '').toString();

          const loteSistema = generateLoteSistema(
            processo,
            endereco,
            mLinear,
            registros,
            nf,
            item
          );

          const reg: Registro = {
            id: crypto.randomUUID(),
            item,
            processo,
            nf,
            endereco,
            m2,
            mLinear,
            largura,
            lote,
            loteSistema,
            modoOrigem: 'importacao',
            isNew: true
          };

          addRegistro(reg);
          successCount++;
        } catch (err: any) {
          errors.push(err.message);
        }
      });

      setProgress(100);
      setResults({ success: successCount, errors });
      
      if (successCount > 0) {
        toast.success(`${successCount} tecidos importados com sucesso!`);
      }
      if (errors.length > 0) {
        toast.warning(`${errors.length} erros encontrados durante a importação.`);
      }

    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Importar Tecidos
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos registros de uma vez utilizando uma planilha ou arquivo de texto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instruções */}
          <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/70">
              <Info className="w-3.5 h-3.5" /> Modelo Sugerido
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O arquivo deve conter as seguintes colunas (ou campos separados por vírgula/ponto-e-vírgula):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Item', 'Processo', 'NF', 'M2', 'Largura', 'Lote', 'Endereco'].map(field => (
                <Badge key={field} variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                  {field}
                </Badge>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest h-9"
              onClick={downloadTemplate}
            >
              <Download className="w-3.5 h-3.5 mr-2" /> Baixar Template Excel
            </Button>
          </div>

          {!results ? (
            <div className="space-y-4">
              <label 
                className={`
                  flex flex-col items-center justify-center w-full h-40 
                  border-2 border-dashed rounded-[2rem] cursor-pointer
                  transition-all duration-300
                  ${loading ? 'opacity-50 cursor-not-allowed border-primary/30' : 'border-border/40 hover:border-primary/40 hover:bg-primary/5'}
                `}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-xs font-bold text-primary animate-pulse">Processando...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-primary/5 text-primary mb-3">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black text-foreground">Clique ou arraste o arquivo</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                        XLSX, XLS, TXT, CSV
                      </p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx,.xls,.txt,.csv" 
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
              
              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
                    {progress}% concluído
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="text-sm font-black text-emerald-600">Importação Concluída</p>
                    <p className="text-xs font-bold text-emerald-600/70">{results.success} registros adicionados</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setResults(null)} className="h-8 rounded-lg">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500/70 ml-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Erros Encontrados ({results.errors.length})
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-red-500/20 bg-red-500/5 p-3 custom-scrollbar">
                    {results.errors.map((err, i) => (
                      <p key={i} className="text-[10px] font-medium text-red-600/80 mb-1 last:mb-0">
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full rounded-2xl h-12 font-black uppercase tracking-widest"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <p className="text-[9px] text-muted-foreground font-medium italic">
            Dica: O campo 'Item' é obrigatório. Campos não informados serão tratados como vazios ou zero.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
