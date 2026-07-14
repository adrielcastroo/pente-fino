import { memo } from 'react';
import { Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Impressora {
  nome: string;
}

interface ImpressoraSelectorProps {
  value: Impressora | null;
  onChange: (v: Impressora | null) => void;
  placeholder?: string;
}

const IMPRESSORAS_DISPONIVEIS: Impressora[] = [
  { nome: 'Navegador (Padrão)' },
  { nome: 'Zebra USB' },
  { nome: 'Zebra Rede' },
];

export const ImpressoraSelector = memo(function ImpressoraSelector({ value, onChange, placeholder }: ImpressoraSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Printer className="h-3.5 w-3.5" /> Impressora
      </label>
      <Select
        value={value?.nome ?? 'Navegador (Padrão)'}
        onValueChange={(v) => onChange(IMPRESSORAS_DISPONIVEIS.find((i) => i.nome === v) ?? null)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? 'Selecionar impressora...'} />
        </SelectTrigger>
        <SelectContent>
          {IMPRESSORAS_DISPONIVEIS.map((i) => (
            <SelectItem key={i.nome} value={i.nome}>
              {i.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
ImpressoraSelector.displayName = 'ImpressoraSelector';
