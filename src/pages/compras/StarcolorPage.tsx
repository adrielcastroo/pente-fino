import { PageShell, PageHeader } from '@/components/compras/ui';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function StarcolorPage() {
  return (
    <PageShell>
      <PageHeader
        title="Starcolor"
        subtitle="Acompanhamento específico do fornecedor Starcolor"
      />

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/compras/acompanhamentos">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar para Acompanhamentos
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center gap-3 py-10 text-muted-foreground">
          <Sparkles className="w-10 h-10 opacity-40" />
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Página em construção
            </h2>
            <p className="text-sm max-w-md">
              Em breve os dados de pedidos, cronograma e recebimentos do fornecedor Starcolor aparecerão aqui.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
