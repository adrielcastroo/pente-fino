import { memo, useState, useEffect, useCallback } from 'react';
import { Package, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarrierBadge } from './CarrierBadge';
import { detectCarrier, carriers } from '@/lib/carriers';
import { cn } from '@/lib/utils';

interface RastreamentoFormProps {
  onSubmit: (code: string, carrier?: string) => void | Promise<void>;
  disabled?: boolean;
  defaultCode?: string;
}

export const RastreamentoForm = memo(function RastreamentoForm({ onSubmit, disabled, defaultCode }: RastreamentoFormProps) {
  const [code, setCode] = useState(defaultCode || '');
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);
  const [manualCarrier, setManualCarrier] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const carrier = detectCarrier(code);
      setDetectedCarrier(carrier?.code || null);
      if (carrier) setManualCarrier('');
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const clean = code.trim().toUpperCase();
      if (!clean || submitting) return;
      setSubmitting(true);
      try {
        await onSubmit(clean, manualCarrier || detectedCarrier || undefined);
      } finally {
        setSubmitting(false);
      }
    },
    [code, submitting, detectedCarrier, manualCarrier, onSubmit],
  );

  const clear = () => {
    setCode('');
    setDetectedCarrier(null);
    setManualCarrier('');
  };

  const activeCarrier = detectedCarrier || manualCarrier;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
      <div className="relative flex-1">
        <label htmlFor="tracking-code" className="sr-only">Código de rastreio</label>
        <Input
          id="tracking-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="AA123456789BR · BR2455090392188U · LGG123456…"
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

      {!activeCarrier && (
        <Select value={manualCarrier} onValueChange={setManualCarrier} disabled={disabled || submitting}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Selecionar transportadora" />
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
    </form>
  );
});

RastreamentoForm.displayName = 'RastreamentoForm';
