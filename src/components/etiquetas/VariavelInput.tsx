import { memo } from 'react';
import { Barcode, Calendar, QrCode, X, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VariavelTemplate } from '@/types/etiquetas';

interface VariavelInputProps {
  variavel: VariavelTemplate;
  value: string;
  onChange: (v: string) => void;
}

function gerarCodigoBarras(chave: string): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${chave.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${rand}`;
}

export const VariavelInput = memo(function VariavelInput({ variavel, value, onChange }: VariavelInputProps) {
  const { tipo, label, chave, obrigatorio, opcoes, descricao, placeholder } = variavel;

  const renderIcon = () => {
    if (tipo === 'barcode') return <Barcode className="h-3.5 w-3.5 text-muted-foreground" />;
    if (tipo === 'qr') return <QrCode className="h-3.5 w-3.5 text-muted-foreground" />;
    if (tipo === 'date') return <Calendar className="h-3.5 w-3.5 text-muted-foreground" />;
    if (tipo === 'auto') return <Zap className="h-3.5 w-3.5 text-muted-foreground" />;
    return null;
  };

  const renderInput = () => {
    switch (tipo) {
      case 'barcode':
        return (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? `{{${chave}}}`}
              className="flex-1 font-mono text-sm"
              id={chave}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(gerarCodigoBarras(chave))} title="Gerar código automático">
              <Zap className="h-3.5 w-3.5 mr-1" /> Auto
            </Button>
          </div>
        );
      case 'qr':
        return (
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? `{{${chave}}}`} id={chave} />
        );
      case 'select':
        return (
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger id={chave}>
              <SelectValue placeholder={placeholder ?? 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {opcoes?.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'date':
        return (
          <Input
            id={chave}
            type="date"
            value={value || (variavel.padrao === '{{hoje}}' ? new Date().toISOString().split('T')[0] : '')}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'auto':
        return (
          <Input
            id={chave}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? `{{${chave}}} (auto)`}
            className="bg-muted"
          />
        );
      default:
        return (
          <Input
            id={chave}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={obrigatorio}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={chave} className="text-sm font-medium flex-1 flex items-center gap-1.5">
          {label}
          {renderIcon()}
          {obrigatorio && <span className="text-destructive">*</span>}
        </Label>
        {descricao && <span className="text-xs text-muted-foreground hidden sm:inline">{descricao}</span>}
      </div>
      {renderInput()}
      {value && tipo !== 'select' && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Limpar
        </button>
      )}
    </div>
  );
});
VariavelInput.displayName = 'VariavelInput';
