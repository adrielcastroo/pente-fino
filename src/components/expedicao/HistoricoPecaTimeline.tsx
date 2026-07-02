import { useQuery } from '@tanstack/react-query';
import { Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = { pecaId: string; open: boolean; onOpenChange: (o: boolean) => void };

const EVENT_LABEL: Record<string, string> = {
  criada: 'Peça criada',
  alocada_carrinho: 'Alocada em carrinho',
  removida_carrinho: 'Removida do carrinho',
  vinculada_romaneio: 'Vinculada ao romaneio',
  removida_romaneio: 'Removida do romaneio',
};

function formatEvento(evento: string) {
  if (EVENT_LABEL[evento]) return EVENT_LABEL[evento];
  if (evento.startsWith('status:')) return `Status → ${evento.slice(7)}`;
  return evento;
}

export function HistoricoPecaTimeline({ pecaId, open, onOpenChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['expedicao_peca_historico', pecaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_pecas_historico')
        .select('id, acao, detalhes, usuario_id, created_at')
        .eq('peca_id', pecaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" /> Histórico da peça
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center p-6">
            Nenhum evento registrado.
          </p>
        ) : (
          <ol className="space-y-2 border-l border-border pl-3">
            {data.map((e: any) => (
              <li key={e.id} className="text-xs relative">
                <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary" />
                <div className="font-medium">{formatEvento(e.acao)}</div>
                <div className="text-muted-foreground">
                  {new Date(e.created_at).toLocaleString('pt-BR')}
                </div>
                {e.detalhes && Object.keys(e.detalhes).length > 0 && (
                  <pre className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {JSON.stringify(e.detalhes, null, 0)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default HistoricoPecaTimeline;
