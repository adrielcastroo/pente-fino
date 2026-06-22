import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lista os "setores" reais encontrados nos registros.
 * Hoje usamos `modo_origem` como proxy (tecido | madeira | motor).
 */
export function useSetores() {
  return useQuery({
    queryKey: ["setores-distintos"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("registros")
        .select("modo_origem")
        .not("modo_origem", "is", null)
        .limit(5000);
      if (error) throw error;
      const set = new Set<string>();
      for (const row of (data ?? []) as Array<{ modo_origem: string | null }>) {
        const v = row.modo_origem?.trim();
        if (v) set.add(v);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
  });
}
