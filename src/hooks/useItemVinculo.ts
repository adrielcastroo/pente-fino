import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { itensCadastroService } from '@/services/itensCadastroService';

/**
 * Consulta o vínculo do item bipado nos cadastros do app (itens_cadastro) e
 * no espelho do ERP Auge (auge_produtos). Debounced (250 ms) para não
 * disparar requests a cada tecla enquanto o conferente digita.
 */
export function useItemVinculo(item: string, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const raw = (item || '').trim();
    if (!raw) { setDebounced(''); return; }
    const t = setTimeout(() => setDebounced(raw), 250);
    return () => clearTimeout(t);
  }, [item]);

  const query = useQuery({
    queryKey: ['item-vinculo', debounced],
    enabled: enabled && debounced.length > 0,
    queryFn: () => itensCadastroService.lookupVinculo(debounced),
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    loading: enabled && debounced.length > 0 && query.isFetching,
    codigoConsultado: debounced,
  };
}
