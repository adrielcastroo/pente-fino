-- Restringir privilégios para garantir espelho somente leitura via navegador
-- Somente service_role (Edge Functions) pode escrever. 
-- Usuários autenticados podem apenas ler.

REVOKE INSERT, UPDATE, DELETE ON public.auge_clientes FROM authenticated;
GRANT SELECT ON public.auge_clientes TO authenticated;
GRANT ALL ON public.auge_clientes TO service_role;

-- Garantir que a RLS está ativa e com política de SELECT
ALTER TABLE public.auge_clientes ENABLE ROW LEVEL SECURITY;

DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'auge_clientes' 
        AND policyname = 'Permitir leitura para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura para usuários autenticados" ON public.auge_clientes
            FOR SELECT TO authenticated USING (true);
    END IF;
END
\$\$;
