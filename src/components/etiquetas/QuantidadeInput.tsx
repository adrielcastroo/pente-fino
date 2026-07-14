import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuantidadeInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export const QuantidadeInput = memo(function QuantidadeInput({ value, onChange, min = 1, max = 999 }: QuantidadeInputProps) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" onClick={() => set(value - 1)} disabled={value <= min}>
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => set(parseInt(e.target.value, 10) || min)}
          className="w-20 text-center"
          min={min}
          max={max}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => set(value + 1)} disabled={value >= max}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
QuantidadeInput.displayName = 'QuantidadeInput';
