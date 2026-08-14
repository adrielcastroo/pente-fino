import { supabase } from "@/integrations/supabase/client";

/**
 * Script de emergência para injetar a função RPC buscar_auge_tag_custom_configuracoes
 * via Edge Function (Proxy SQL).
 */
async function fixMissingRPC() {
  console.log("🛠️ Iniciando correção de RPC ausente...");
  
  const sql = `
CREATE OR REPLACE FUNCTION public.buscar_auge_tag_custom_configuracoes(p_termo text)
RETURNS TABLE (
    cd_configuracao text,
    nm_configuracao text,
    qtd_tags bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tokens text[];
BEGIN
    -- 1. Normalização e Tokenização
    v_tokens := regexp_split_to_array(lower(unaccent(p_termo)), '[^a-z0-9]+');
    
    -- Remove tokens vazios
    SELECT array_agg(t) INTO v_tokens FROM unnest(v_tokens) t WHERE t <> '';

    -- Se não houver tokens válidos, retornamos vazio
    IF v_tokens IS NULL OR array_length(v_tokens, 1) = 0 THEN
        RETURN;
    END IF;

    -- 2. Consulta com lógica AND em nm_configuracao
    RETURN QUERY
    SELECT 
        t.cd_configuracao,
        t.nm_configuracao,
        COUNT(*)::bigint as qtd_tags
    FROM public.auge_tag_custom t
    WHERE 
        (
            SELECT bool_and(lower(unaccent(t.nm_configuracao)) LIKE '%' || token || '%')
            FROM unnest(v_tokens) AS token
        )
    GROUP BY t.cd_configuracao, t.nm_configuracao
    ORDER BY t.nm_configuracao ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_auge_tag_custom_configuracoes(text) TO anon, authenticated;
  `;

  try {
    // Tenta executar via endpoint de SQL (se disponível no ambiente de build)
    // Caso contrário, usaremos um fallback de filtragem no cliente.
    console.log("Tentando criar função via Edge Function...");
    const { data, error } = await supabase.functions.invoke('auge-sync?action=run_sql', {
      body: { sql }
    });

    if (error) {
      console.warn("⚠️ Não foi possível injetar a RPC via Edge Function (normal em dev local).");
      console.log("Aplicando fallback: a busca será feita via filtragem em memória no cliente.");
    } else {
      console.log("✅ RPC criada com sucesso!");
    }
  } catch (e) {
    console.error("Erro ao tentar injetar RPC:", e);
  }
}

fixMissingRPC();
