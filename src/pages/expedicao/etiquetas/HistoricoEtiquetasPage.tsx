import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEtiquetaHistorico } from '@/hooks/useEtiquetas';
import { EtiquetaHistoricoTable } from '@/components/etiquetas/EtiquetaHistoricoTable';

export default function HistoricoEtiquetasPage() {
  useDocumentTitle('Histórico de Etiquetas · Expedição');
  const navigate = useNavigate();
  const { data, isLoading } = useEtiquetaHistorico();
  const [filtro, setFiltro] = useState('');

  const filtrado = (data ?? []).filter((h) =>
    !filtro ||
    h.template_nome.toLowerCase().includes(filtro.toLowerCase()) ||
    (h.usuario_nome ?? '').toLowerCase().includes(filtro.toLowerCase()),
  );

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
      </header>
      <Input
        placeholder="Filtrar por template ou usuário..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="max-w-md"
      />
      <EtiquetaHistoricoTable historico={filtrado} isLoading={isLoading} />
    </div>
  );
}
