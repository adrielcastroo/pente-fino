import { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { exportRomaneioPDF, exportExcel } from '@/lib/expedicao/exports';

export function ExportRomaneioButton({ romaneioId, numero }: { romaneioId: string; numero: string }) {
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [{ data: rom }, { data: pecas }] = await Promise.all([
      supabase
        .from('expedicao_romaneios')
        .select('numero, status, created_at, expedicao_transportadoras(nome)')
        .eq('id', romaneioId)
        .maybeSingle(),
      supabase
        .from('expedicao_pecas')
        .select('codigo_etiqueta, item, largura, expedicao_carrinhos(codigo)')
        .eq('romaneio_id', romaneioId)
        .order('codigo_etiqueta'),
    ]);
    if (!rom) throw new Error('Romaneio não encontrado.');
    return {
      rom,
      pecas: (pecas ?? []).map((p: any) => ({
        codigo_etiqueta: p.codigo_etiqueta,
        item: p.item ?? null,
        largura: p.largura ?? null,
        carrinho: p.expedicao_carrinhos?.codigo ?? null,
      })),
    };
  };

  const doPdf = async () => {
    setLoading(true);
    try {
      const { rom, pecas } = await load();
      exportRomaneioPDF({
        numero: rom.numero,
        status: rom.status,
        criado_em: rom.created_at,
        transportadora: (rom.expedicao_transportadoras as any)?.nome ?? null,
        pecas,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  };

  const doExcel = async () => {
    setLoading(true);
    try {
      const { pecas } = await load();
      exportExcel(pecas, `romaneio-${numero}.xlsx`, 'Peças');
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={loading} className="gap-1 h-8">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={doPdf}>
          <FileText className="w-3 h-3 mr-2" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={doExcel}>
          <FileSpreadsheet className="w-3 h-3 mr-2" /> Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportRomaneioButton;
