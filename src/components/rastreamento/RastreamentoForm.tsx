import { memo, useState, useEffect, useCallback } from 'react';
import { Package, Loader2, Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarrierBadge } from './CarrierBadge';
import { detectCarrier, carriers } from '@/lib/carriers';
import { cn } from '@/lib/utils';

interface RastreamentoFormProps {
  onSubmit: (code: string, opts: { carrier?: string; cnpj?: string; nf?: string }) => void | Promise<void>;
  disabled?: boolean;
  defaultCode?: string;
}

// Transportadoras B2B fracionadas — precisam de CNPJ + NF para rastreio via SSW
const B2B_CARRIERS = new Set(['jamef', 'aceville', 'rodonaves', 'saomiguel']);

export const RastreamentoForm = memo(function RastreamentoForm({ onSubmit, disabled, defaultCode }: RastreamentoFormProps) {
  const [code, setCode] = useState(defaultCode || '');
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);
  const [manualCarrier, setManualCarrier] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [nf, setNf] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const carrier = detectCarrier(code);
      setDetectedCarrier(carrier?.code || null);
      if (carrier) setManualCarrier('');
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  const activeCarrier = manualCarrier || detectedCarrier;
  const isB2B = activeCarrier ? B2B_CARRIERS.has(activeCarrier) : false;

  // Auto-abre o painel avançado quando uma B2B é escolhida
  useEffect(() => {
    if (isB2B) setShowAdvanced(true);
  }, [isB2B]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const clean = code.trim().toUpperCase();
      if (!clean || submitting) return;
      setSubmitting(true);
      try {
        await onSubmit(clean, {
          carrier: manualCarrier || detectedCarrier || undefined,
          cnpj: cnpj.replace(/\D/g, '') || undefined,
          nf: nf.replace(/\D/g, '') || undefined,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [code, submitting, detectedCarrier, manualCarrier, cnpj, nf, onSubmit],
  );

  const clear = () => {
    setCode('');
    setDetectedCarrier(null);
    setManualCarrier('');
    setCnpj('');
    setNf('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
        <div className="relative flex-1">
          <label htmlFor="tracking-code" className="sr-only">Código de rastreio</label>
          <Input
            id="tracking-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AA123456789BR · 888030807097580 · JMF12345678…"
            className={cn('font-mono text-sm pr-28', !activeCarrier && 'pr-10')}
            disabled={disabled || submitting}
            autoComplete="off"
            spellCheck={false}
          />
          {!activeCarrier && (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          )}
          {activeCarrier && (
            <CarrierBadge carrierCode={activeCarrier} className="absolute right-2 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {!detectedCarrier && (
          <Select value={manualCarrier} onValueChange={setManualCarrier} disabled={disabled || submitting}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Transportadora (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {carriers.filter(c => c.code !== 'mock').map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <div className="flex items-center gap-2">
                    <CarrierBadge carrierCode={c.code} />
                    <span>{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button type="submit" disabled={disabled || submitting || !code.trim()} className="whitespace-nowrap">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
          Rastrear
        </Button>

        {code && !submitting && (
          <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Limpar">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')} />
          {isB2B ? 'CNPJ + NF (obrigatório para transportadoras fracionadas)' : 'Rastreio B2B com CNPJ (Jamef, São Miguel, Rodonaves, Aceville…)'}
        </button>

        {showAdvanced && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="CNPJ do pagador (só números)"
              className="font-mono text-sm"
              inputMode="numeric"
              maxLength={18}
              disabled={disabled || submitting}
            />
            <Input
              value={nf}
              onChange={(e) => setNf(e.target.value)}
              placeholder="Nº da NF (se diferente do código)"
              className="font-mono text-sm"
              inputMode="numeric"
              disabled={disabled || submitting}
            />
          </div>
        )}
      </div>
    </form>
  );
});

RastreamentoForm.displayName = 'RastreamentoForm';
