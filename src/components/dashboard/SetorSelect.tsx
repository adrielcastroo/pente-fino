import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSetores } from "@/hooks/useSetores";

interface SetorSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  includeAllOption?: boolean;
  className?: string;
}

/**
 * Select de Setores alimentado por dados reais (registros.modo_origem).
 * Carga distinta cacheada por 5min via useSetores.
 */
export function SetorSelect({
  value,
  onChange,
  placeholder = "Setor",
  includeAllOption = true,
  className,
}: SetorSelectProps) {
  const { data: setores = [], isLoading } = useSetores();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && <SelectItem value="__all__">Todos os setores</SelectItem>}
        {setores.map((s) => (
          <SelectItem key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </SelectItem>
        ))}
        {!isLoading && setores.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum setor encontrado</div>
        )}
      </SelectContent>
    </Select>
  );
}
