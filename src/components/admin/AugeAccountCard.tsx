import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AugeAccountCard() {
  const abrirSecrets = () => {
    toast.info('Atualize AUGE_USERNAME e AUGE_PASSWORD nos segredos do backend (Lovable Cloud). As próximas execuções já usam a nova conta.', { duration: 8000 });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" /> Conta do Auge usada pelo Pente Fino
            </CardTitle>
            <CardDescription className="mt-1">
              Todas as automações (Necessidade, Transferências, Abreviações, Sincronização) usam
              uma única conta de acesso ao Auge. Atualize <span className="font-mono">AUGE_USERNAME</span> e
              <span className="font-mono"> AUGE_PASSWORD</span> nos segredos do backend para trocar a conta —
              os caminhos e permissões continuam iguais.
            </CardDescription>
          </div>
          <Button onClick={abrirSecrets} variant="outline" className="gap-2 h-10 shrink-0">
            <ExternalLink className="h-4 w-4" /> Abrir segredos do backend
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-1">
        <p>
          Peça ao administrador do Lovable para editar os segredos
          <span className="font-mono"> AUGE_USERNAME</span>,
          <span className="font-mono"> AUGE_PASSWORD</span> e (se necessário)
          <span className="font-mono"> AUGE_BASE_URL</span>. Após salvar, as próximas execuções
          já usam a nova conta — não é preciso redeploy.
        </p>
      </CardContent>
    </Card>
  );
}
