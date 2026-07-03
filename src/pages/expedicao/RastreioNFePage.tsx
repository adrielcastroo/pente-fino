import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw, Loader2, Search, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/expedicao/ui';

type Tipo = 'emitido' | 'recebido';

function maskCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

interface Result {
  ok?: boolean;
  cache_hit?: boolean;
  needs_cert?: boolean;
  message?: string;
  chave?: string;
  status?: string;
  motivo?: string;
  emissao?: string;
  valor?: number;
  emitente?: string;
  danfe_url?: string;
}

const POLL_MS = 600_000; // 10 min

export default function RastreioNFePage() {
  const [cnpj, setCnpj] = useState('');
  const [tipo, setTipo] = useState<Tipo>('emitido');
  const [result, setResult] = useState<Result | null>(null);
  const pollRef = useRef<number | null>(null);

  const consultar = useMutation({
    mutationFn: async () => {
      const digits = cnpj.replace(/\D/g, '');
      if (digits.length !== 14) throw new Error('Informe um CNPJ válido (14 dígitos).');
      const { data, error } = await supabase.functions.invoke('nfe-sefaz-consulta', {
        body: { cnpj: digits, tipo },
      });
      if (error) throw error;
      return data as Result;
    },
    onSuccess: (r) => {
      setResult(r);
      if (r?.needs_cert) toast.warning(r.message ?? 'Certificado A1 necessário.');
      else if (r?.ok) toast.success(r.cache_hit ? 'Resultado (cache)' : 'Consulta realizada.');
      else toast.info(r?.message ?? 'Sem retorno da SEFAZ.');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha na consulta.'),
  });

  // Polling automático enquanto houver resultado
  useEffect(() => {
    if (!result) return;
    pollRef.current = window.setInterval(() => {
      consultar.mutate();
    }, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [result, consultar]);

  const statusTone = useMemo(() => {
    const s = (result?.status ?? '').toLowerCase();
    if (s.includes('autoriz')) return 'success';
    if (s.includes('cancel') || s.includes('deneg')) return 'destructive';
    if (s === 'cache') return 'info';
    return 'warning';
  }, [result]);

  return (
    <PageShell>
      <PageHeader
        title="Rastreio de NF-e"
        subtitle="Consulte NF-e emitidas ou recebidas pela SEFAZ usando o CNPJ da empresa."
      />

      <div className="rounded-md border border-border bg-card p-4 space-y-4 max-w-3xl">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <Label htmlFor="cnpj" className="text-xs">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="h-10 font-mono"
              inputMode="numeric"
              aria-label="CNPJ para consulta"
            />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <RadioGroup
              value={tipo}
              onValueChange={(v) => setTipo(v as Tipo)}
              className="flex gap-4 h-10 items-center"
            >
              <label className="flex items-center gap-1 text-sm">
                <RadioGroupItem value="emitido" /> Emitido
              </label>
              <label className="flex items-center gap-1 text-sm">
                <RadioGroupItem value="recebido" /> Recebido
              </label>
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => consultar.mutate()} disabled={consultar.isPending} className="gap-2">
            {consultar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Consultar
          </Button>
          {result && (
            <Button variant="outline" onClick={() => consultar.mutate()} disabled={consultar.isPending} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Atualizar
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div role="alert" aria-live="polite" className="max-w-3xl">
          {result.needs_cert ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Certificado A1 necessário</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : result.ok ? (
            <div className="rounded-md border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="font-medium">{result.emitente ?? 'Resultado'}</span>
                {result.status && <Badge variant={statusTone === 'destructive' ? 'destructive' : 'secondary'}>{result.status}</Badge>}
                {result.cache_hit && <Badge variant="outline">cache</Badge>}
              </div>
              <dl className="grid md:grid-cols-2 gap-2 text-sm">
                {result.chave && (<><dt className="text-muted-foreground">Chave</dt><dd className="font-mono text-xs break-all">{result.chave}</dd></>)}
                {result.motivo && (<><dt className="text-muted-foreground">Motivo</dt><dd>{result.motivo}</dd></>)}
                {result.emissao && (<><dt className="text-muted-foreground">Emissão</dt><dd>{new Date(result.emissao).toLocaleString('pt-BR')}</dd></>)}
                {typeof result.valor === 'number' && (<><dt className="text-muted-foreground">Valor</dt><dd>R$ {result.valor.toFixed(2)}</dd></>)}
              </dl>
              {result.danfe_url && (
                <Button asChild variant="outline" size="sm"><a href={result.danfe_url} target="_blank" rel="noreferrer">Abrir DANFE</a></Button>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhuma NF-e localizada</AlertTitle>
              <AlertDescription>{result.message ?? 'Nenhuma NF-e encontrada para o CNPJ informado.'}</AlertDescription>
            </Alert>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">Atualização automática a cada 10 minutos enquanto esta aba estiver aberta.</p>
        </div>
      )}
    </PageShell>
  );
}
