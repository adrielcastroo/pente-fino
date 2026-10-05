CREATE OR REPLACE VIEW public.auge_tag_custom_configuracoes AS
SELECT cd_configuracao, MAX(nm_configuracao) AS nm_configuracao, COUNT(*) AS qtd_tags
FROM public.auge_tag_custom
WHERE nm_configuracao IS NOT NULL AND btrim(nm_configuracao) <> ''
GROUP BY cd_configuracao;

GRANT SELECT ON public.auge_tag_custom_configuracoes TO authenticated;
GRANT SELECT ON public.auge_tag_custom_configuracoes TO anon;