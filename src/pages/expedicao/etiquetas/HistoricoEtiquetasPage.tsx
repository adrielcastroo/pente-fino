import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEtiquetaHistorico, useLimparHistorico } from '@/hooks/useEtiquetas';
import { EtiquetaHistoricoTable } from '@/components/etiquetas/EtiquetaHistoricoTable';

export default function HistoricoEtiquetasPage() {
  useDocumentTitle('Histórico de Etiquetas · Expedição');
  const navigate = useNavigate();
  const { data, isLoading } = useEtiquetaHistorico();
  const [filtro, setFiltro] = useState('');
  const limpar = useLimparHistorico();

  const filtrado = (data ?? []).filter((h) => {
    if (!filtro) return true;
    const q = filtro.toLowerCase();
    const nf = String(h.variaveis_usadas?.nf ?? '').toLowerCase();
    return (
      h.template_nome.toLowerCase().includes(q) ||
      (h.usuario_nome ?? '').toLowerCase().includes(q) ||
      nf.includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/expedicao/etiquetas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Histórico de Impressões</h1>
          <p className="text-xs text-muted-foreground">Últimas 100 impressões registradas.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              disabled={!data?.length || limpar.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" /> Limpar histórico
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todo o histórico?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove permanentemente todos os registros de impressão de etiquetas.
                As etiquetas físicas já impressas não são afetadas. Não é possível desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => limpar.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Limpar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>
      <Input
        placeholder="Filtrar por NF, template ou usuário..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="max-w-md"
      />
      <EtiquetaHistoricoTable historico={filtrado} isLoading={isLoading} />
    </div>
  );
}
