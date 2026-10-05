UPDATE public.app_releases SET is_current = false WHERE is_current = true;
INSERT INTO public.app_releases (version, notes, is_stable, is_current)
VALUES ('3.17.0', 'Versão inicial registrada — sistema de feature flags e controle de releases embutido.', true, true)
ON CONFLICT DO NOTHING;