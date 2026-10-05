-- Migration: Criação da função RPC para busca segura e eficiente de configurações de TAG Custom
-- Objetivo: Permitir que usuários (incluindo visitantes/anon) busquem configurações exclusivamente por nm_configuracao
--           aplicando lógica AND em todos os tokens, independente da ordem e acentuação.

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
    -- O termo é normalizado (sem acentos, minúsculo) e quebrado por qualquer caractere não alfanumérico (espaço, *, _, -, etc)
    v_tokens := regexp_split_to_array(lower(unaccent(p_termo)), '[^a-z0-9]+');
    
    -- Remove tokens vazios
    SELECT array_agg(t) INTO v_tokens FROM unnest(v_tokens) t WHERE t <> '';

    -- Se não houver tokens válidos (ex: termo com apenas 1 caracter ou só símbolos), retornamos vazio
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
        -- Verificamos se CADA token existe no nome da configuração (também normalizado)
        -- Isso garante a lógica AND independente da ordem
        (
            SELECT bool_and(lower(unaccent(t.nm_configuracao)) LIKE '%' || token || '%')
            FROM unnest(v_tokens) AS token
        )
    GROUP BY t.cd_configuracao, t.nm_configuracao
    ORDER BY t.nm_configuracao ASC;
END;
$$;

-- Permissões: anon e authenticated podem executar a busca
GRANT EXECUTE ON FUNCTION public.buscar_auge_tag_custom_configuracoes(text) TO anon, authenticated;

COMMENT ON FUNCTION public.buscar_auge_tag_custom_configuracoes(text) IS 'Busca configurações em auge_tag_custom filtrando por tokens (AND) exclusivamente em nm_configuracao. Seguro para anon.';
