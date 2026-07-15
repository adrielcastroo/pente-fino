/**
 * Modo Operador — form + preview live.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEtiqueta, useImprimirEtiqueta } from '@/hooks/useEtiquetas';
import { supabase } from '@/integrations/supabase/client';
import { ImpressoraSelector } from '@/components/etiquetas/ImpressoraSelector';
import { LiveZPLPreview } from '@/components/etiquetas/LiveZPLPreview';
import { QuantidadeInput } from '@/components/etiquetas/QuantidadeInput';
import { VariavelInput } from '@/components/etiquetas/VariavelInput';

interface Impressora {
  nome: string;
}

const LOGO_VAR_KEY = '__logo_src__';

export default function ImprimirEtiquetaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const pickingId = sp.get('picking');

  const { data: template, isLoading } = useEtiqueta(id);
  const imprimir = useImprimirEtiqueta();

  useDocumentTitle(template ? `Imprimir · ${template.nome}` : 'Imprimir Etiqueta');

  const [valores, setValores] = useState<Record<string, string>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [impressora, setImpressora] = useState<Impressora | null>(null);

  // Inicializa defaults quando template chega
  useEffect(() => {
    if (!template) return;
    const iniciais: Record<string, string> = {};
    template.variaveis.forEach((v) => {
      if (v.chave === LOGO_VAR_KEY) return;
      if (v.padrao === '{{hoje}}') iniciais[v.chave] = new Date().toISOString().split('T')[0];
      else if (v.padrao) iniciais[v.chave] = v.padrao;
    });
    setValores((prev) => ({ ...iniciais, ...prev }));
  }, [template]);

  const logoUrl = useMemo(() => {
    if (!template) return undefined;
    const stored = template.variaveis.find((v) => v.chave === LOGO_VAR_KEY)?.padrao;
    if (stored) return stored;
    return id ? (localStorage.getItem(`etiqueta-logo-${id}`) || undefined) : undefined;
  }, [template, id]);

  const variaveisVisiveis = useMemo(
    () => template?.variaveis.filter((v) => v.chave !== LOGO_VAR_KEY) ?? [],
    [template],
  );

  // Auto-preenchimento via ?picking=ID
  useEffect(() => {
    if (!pickingId || !template) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('expedicao_pickings')
        .select('numero, cliente, nfe_numero, transportadora_id, expedicao_transportadoras(nome)')
        .eq('id', pickingId)
        .maybeSingle();
      if (cancelled || !data) return;
      const dbRow = data as { numero?: string; cliente?: string; nfe_numero?: string | null; expedicao_transportadoras?: { nome?: string } | null };
      setValores((prev) => ({
        ...prev,
        romaneio: dbRow.numero ?? prev.romaneio ?? '',
        cliente: dbRow.cliente ?? prev.cliente ?? '',
        nf: dbRow.nfe_numero ? String(dbRow.nfe_numero) : (prev.nf ?? ''),
        transportadora: dbRow.expedicao_transportadoras?.nome ?? prev.transportadora ?? '',
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [pickingId, template]);

  const podeImprimir = useMemo(() => {
    if (!template) return false;
    return variaveisVisiveis.every((v) => !v.obrigatorio || (valores[v.chave] ?? '').trim().length > 0);
  }, [template, variaveisVisiveis, valores]);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando template...</div>;
  }
  if (!template) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">Template não encontrado.</p>
        <Button onClick={() => navigate('/expedicao/etiquetas')}>Voltar</Button>
      </div>
    );
  }

  const handleImprimir = async () => {
    await imprimir.mutateAsync({
      templateId: template.id,
      variaveis: valores,
      quantidade,
      impressora: impressora?.nome,
    });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0">
      <aside className="lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="px-2 py-1 text-[10px] rounded bg-primary/10 text-primary font-medium">MODO IMPRESSÃO</span>
          <Badge variant="outline" className="text-[10px]">
            {template.dimensoes.largura}×{template.dimensoes.altura}mm
          </Badge>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center overflow-auto min-h-[240px]">
          <div className="w-full max-w-[260px]" style={{ aspectRatio: `${template.dimensoes.largura} / ${template.dimensoes.altura}` }}>
            <LiveZPLPreview zpl={template.zpl} valores={valores} dimensoes={template.dimensoes} logoUrl={logoUrl} />
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <ImpressoraSelector value={impressora} onChange={setImpressora} />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-xl mx-auto space-y-5">
          <header className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/expedicao/etiquetas')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{template.nome}</h1>
              <p className="text-xs text-muted-foreground capitalize">{template.categoria}</p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/expedicao/etiquetas/${template.id}/editar`)}>
              Editar
            </Button>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (podeImprimir) handleImprimir();
            }}
            className="space-y-4"
          >
            {variaveisVisiveis
              .slice()
              .sort((a, b) => a.ordem - b.ordem)
              .map((v) => (
                <VariavelInput
                  key={v.chave}
                  variavel={v}
                  value={valores[v.chave] ?? ''}
                  onChange={(val) => setValores((p) => ({ ...p, [v.chave]: val }))}
                />
              ))}

            <div className="flex items-end gap-4 pt-4 border-t border-border">
              <QuantidadeInput value={quantidade} onChange={setQuantidade} />
              <Button type="submit" size="lg" className="ml-auto" disabled={!podeImprimir || imprimir.isPending}>
                <Printer className="mr-2 h-4 w-4" />
                {imprimir.isPending ? 'Imprimindo...' : `Imprimir ${quantidade} etiqueta(s)`}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
