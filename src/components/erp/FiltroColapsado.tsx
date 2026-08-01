import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Filter, X } from 'lucide-react';

export interface FiltroOpcao {
  /** Valor único da opção. */
  value: string;
  /** Rótulo exibido na lista e no botão quando selecionado. */
  label: string;
  /** Contagem opcional exibida à direita da opção. */
  count?: number;
}

export interface FiltroColapsadoProps {
  /** Rótulo neutro exibido quando nenhum filtro está ativo. */
  label?: string;
  opcoes: FiltroOpcao[];
  /** `null` significa "sem filtro". */
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  /** Altura do controle, para alinhar com inputs vizinhos. */
  heightClassName?: string;
  disabled?: boolean;
}

/**
 * Filtro em lista colapsada.
 *
 * Estados:
 * - Sem filtro: botão neutro que abre a lista de opções.
 * - Com filtro: botão em destaque vermelho exibindo a opção ativa com um "x";
 *   clicar novamente remove o filtro e devolve o botão ao estado neutro.
 */
export default function FiltroColapsado({
  label = 'Filtro',
  opcoes,
  value,
  onChange,
  className,
  heightClassName = 'h-11',
  disabled,
}: FiltroColapsadoProps) {
  const ativa = value ? opcoes.find((o) => o.value === value) ?? null : null;

  // Estado ativo: o próprio botão limpa o filtro (sem abrir a lista).
  if (ativa) {
    return (
      <Button
        type="button"
        variant="destructive"
        disabled={disabled}
        onClick={() => onChange(null)}
        title={`Remover filtro: ${ativa.label}`}
        aria-label={`Remover filtro ${ativa.label}`}
        className={cn(
          heightClassName,
          'shrink-0 gap-2 px-3 text-xs font-semibold',
          className,
        )}
      >
        <Filter className="w-3.5 h-3.5 shrink-0" />
        <span className="max-w-[160px] truncate">{ativa.label}</span>
        <X className="w-3.5 h-3.5 shrink-0 opacity-90" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            heightClassName,
            'shrink-0 gap-2 px-3 text-xs font-semibold',
            className,
          )}
        >
          <Filter className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opcoes.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => onChange(o.value)}
            className="text-xs gap-2"
          >
            <Check className={cn('w-3.5 h-3.5', value === o.value ? 'opacity-100' : 'opacity-0')} />
            <span className="flex-1 truncate">{o.label}</span>
            {typeof o.count === 'number' && (
              <span className="tabular-nums text-[10px] text-muted-foreground">{o.count}</span>
            )}
          </DropdownMenuItem>
        ))}
        {opcoes.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            Nenhuma opção disponível
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
