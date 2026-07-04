import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const EXPORTABLE = [
  { key: 'registros', label: 'Registros' },
  { key: 'conferences', label: 'Conferências' },
  { key: 'estoque_posicoes', label: 'Posições de Estoque' },
  { key: 'estoque_saidas', label: 'Saídas' },
  { key: 'reservas', label: 'Reservas' },
  { key: 'itens_cadastro', label: 'Cadastros de itens' },
  { key: 'expedicao_pecas', label: 'Peças (Expedição)' },
  { key: 'expedicao_romaneios', label: 'Romaneios' },
  { key: 'nfe_importadas', label: 'NF-e importadas' },
  { key: 'audit_logs', label: 'Audit logs' },
  { key: 'auth_audit_logs', label: 'Auth audit logs' },
];

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

export default function BackupTab() {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportTable = async (key: string) => {
    setExporting(key);
    try {
      const { data, error } = await (supabase.from(key as any).select('*').limit(50000) as any);
      if (error) throw error;
      const csv = toCSV((data as any[]) ?? []);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${key}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${key}: ${((data as any[]) ?? []).length.toLocaleString('pt-BR')} linhas exportadas`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <Database className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Backup & Export</p>
            <p className="text-muted-foreground">
              Exporte qualquer tabela como CSV. Limitado a 50.000 linhas por operação — para dumps completos use
              <strong className="text-foreground"> Cloud → Advanced settings → Export data</strong>.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Exportar tabelas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {EXPORTABLE.map((t) => (
            <Card key={t.key} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{t.key}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => exportTable(t.key)} disabled={exporting === t.key}>
                <Download className="h-3.5 w-3.5" /> {exporting === t.key ? '...' : 'CSV'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Zona de risco</h3>
        <Card className="p-5 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-destructive">Limpar dados de teste</p>
              <p className="text-xs text-muted-foreground mt-1">
                Marque este ambiente como "teste" via feature flag <code className="text-[10px]">test_mode</code>.
                Enquanto ativa, quaisquer registros criados podem ser removidos em bloco aqui.
                <Badge variant="outline" className="ml-2 text-[10px]">disponível quando feature flag ativa</Badge>
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="mt-3" disabled>
                    <Trash2 className="h-3.5 w-3.5" /> Limpar dados marcados como teste
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                    <AlertDialogDescription>Requer implementação de coluna is_test nas tabelas envolvidas.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
