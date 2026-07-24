import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify caller identity using their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

    // Optional body: { target_user_id }
    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.target_user_id === "string") {
        targetUserId = body.target_user_id;
      }
    } catch (_) {
      // no body — self-delete
    }

    // If deleting someone else, caller must be admin
    if (targetUserId && targetUserId !== callerId) {
      const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (roleErr || !isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const userIdToDelete = targetUserId ?? callerId;

    // Use service role to delete user
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Pre-clean tables that reference auth.users without ON DELETE (would block deletion)
    const cleanupTables: Array<{ table: string; column: string; nullify?: boolean }> = [
      { table: "profiles", column: "id" },
      { table: "user_roles", column: "user_id" },
      { table: "team_members", column: "user_id" },
      { table: "team_page_permissions", column: "user_id" },
      { table: "auge_permissoes", column: "user_id" },
      { table: "ai_chat_history", column: "user_id" },
      { table: "tarefas_contagem", column: "conferente_id", nullify: true },
      { table: "tarefas_contagem", column: "assigned_to", nullify: true },
      { table: "tarefas_contagem", column: "completed_by", nullify: true },
      { table: "inventory_tasks", column: "assigned_to", nullify: true },
      { table: "inventory_tasks", column: "completed_by", nullify: true },
      { table: "inventory_task_items", column: "user_id", nullify: true },
      { table: "historico_contagens", column: "user_id", nullify: true },
      { table: "contagem_itens_bipados", column: "user_id", nullify: true },
      { table: "audit_logs", column: "user_id", nullify: true },
      { table: "operation_logs", column: "user_id", nullify: true },
      { table: "auth_audit_logs", column: "user_id", nullify: true },
      { table: "import_log", column: "user_id", nullify: true },
      { table: "report_logs", column: "user_id", nullify: true },
      { table: "expedicao_pecas_historico", column: "usuario_id", nullify: true },
      { table: "nfe_consulta_log", column: "user_id", nullify: true },
      { table: "nfe_importadas", column: "imported_by", nullify: true },
    ];

    for (const c of cleanupTables) {
      try {
        if (c.nullify) {
          await adminClient.from(c.table).update({ [c.column]: null }).eq(c.column, userIdToDelete);
        } else {
          await adminClient.from(c.table).delete().eq(c.column, userIdToDelete);
        }
      } catch (_) { /* ignore, some tables may not exist */ }
    }

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteErr) {
      console.error("[delete-account] auth.admin.deleteUser failed", deleteErr);
      return new Response(
        JSON.stringify({
          error: deleteErr.message || "Falha ao remover usuário",
          details: (deleteErr as any).details ?? null,
          hint: "Verifique se há registros vinculados que impedem a exclusão.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[delete-account] unexpected error", error);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
