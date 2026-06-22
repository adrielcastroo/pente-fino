import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lista setores reais a partir de registros distintos.
 * Hoje "setor" é derivado de `proc` (processo) — alinhar quando houver coluna dedicada.
 */
export function useSetores() {
  return useQuery({
    queryKey: ["setores-distintos"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("registros")
        .select("proc")
        .not("proc", "is", null)
        .limit(5000);
      if (error) throw error;
      const set = new Set<string>();
      for (const row of data ?? []) {
        const v = (row as { proc: string | null }).proc?.trim();
        if (v) set.add(v);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
  });
}
