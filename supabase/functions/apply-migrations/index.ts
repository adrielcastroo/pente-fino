import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results: string[] = [];

    // 1. Criar tabela romaneio_automatico_logs
    const { error: e1 } = await supabase.from("romaneio_automatico_logs").select("id").limit(1);
    if (e1) {
      const sql1 = `
        CREATE TABLE IF NOT EXISTS public.romaneio_automatico_logs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          criado_em timestamptz NOT NULL DEFAULT now(),
          referencia text,
          total_linhas integer NOT NULL DEFAULT 0,
          rows jsonb DEFAULT '[]'::jsonb,
          origem text NOT NULL DEFAULT 'automatico',
          status text NOT NULL DEFAULT 'arquivado',
          observacao text
        );
        GRANT SELECT, INSERT ON public.romaneio_automatico_logs TO authenticated;
        GRANT ALL ON public.romaneio_automatico_logs TO service_role;
        ALTER TABLE public.romaneio_automatico_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "romaneio_logs_select" ON public.romaneio_automatico_logs;
        DROP POLICY IF EXISTS "romaneio_logs_insert" ON public.romaneio_automatico_logs;
        CREATE POLICY "romaneio_logs_select" ON public.romaneio_automatico_logs
          FOR SELECT TO authenticated USING (true);
        CREATE POLICY "romaneio_logs_insert" ON public.romaneio_automatico_logs
          FOR INSERT TO authenticated WITH CHECK (true);
      `;
      const { error: sqlErr } = await supabase.rpc("exec_sql", { sql: sql1 });
      if (sqlErr) {
        results.push(`romaneio_automatico_logs: ERRO - ${sqlErr.message}`);
      } else {
        results.push("romaneio_automatico_logs: CRIADA");
      }
    } else {
      results.push("romaneio_automatico_logs: JÁ EXISTE");
    }

    // 2. Verificar FK entre romaneio_linhas e romaneio_dias
    const { data: fkCheck, error: fkErr } = await supabase
      .from("romaneio_linhas")
      .select("romaneio_id")
      .limit(1);

    if (fkErr) {
      results.push("romaneio_linhas não existe ainda");
    } else {
      const sql2 = `
        ALTER TABLE romaneio_linhas
          ADD CONSTRAINT fk_romaneio_linhas_romaneio
          FOREIGN KEY (romaneio_id) REFERENCES romaneio_dias(id) ON DELETE CASCADE;
      `;
      const { error: fkSqlErr } = await supabase.rpc("exec_sql", { sql: sql2 });
      if (fkSqlErr && !fkSqlErr.message.includes("already exists")) {
        results.push(`FK romaneio_linhas: ERRO - ${fkSqlErr.message}`);
      } else {
        results.push("FK romaneio_linhas: OK");
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
