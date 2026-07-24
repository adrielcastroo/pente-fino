import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getBearerToken = (authHeader: string) => {
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

type CleanupMode = "delete" | "nullify";

interface CleanupTarget {
  table: string;
  column: string;
  mode: CleanupMode;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Sessão ausente. Entre novamente antes de remover usuários." }, 401);
    }

    const bearerToken = getBearerToken(authHeader);
    if (!bearerToken) {
      return jsonResponse({ error: "Sessão inválida. Entre novamente antes de remover usuários." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Configuração da função incompleta." }, 500);
    }

    // Use service role inside the function only. It verifies the caller token and performs admin deletion.
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller identity using their JWT, without depending on an anon key in the function env.
    const { data: userData, error: userErr } = await adminClient.auth.getUser(bearerToken);
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Sessão expirada ou inválida. Entre novamente antes de remover usuários." }, 401);
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
      const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (roleErr || !isAdmin) {
        return jsonResponse({ error: "Apenas administradores podem remover outros usuários." }, 403);
      }
    }

    const userIdToDelete = targetUserId ?? callerId;

    // Pre-clean every known public FK to auth users that can block auth deletion.
    // Historical/business records are preserved by nullifying nullable user references.
    const cleanupTables: CleanupTarget[] = [
      { table: "abreviacoes_solicitadas", column: "revisor_id", mode: "nullify" },
      { table: "app_releases", column: "released_by", mode: "nullify" },
      { table: "auge_permissoes", column: "updated_by", mode: "nullify" },
      { table: "auge_sync_runs", column: "triggered_by", mode: "nullify" },
      { table: "compras_pedidos", column: "created_by", mode: "nullify" },
      { table: "compras_starcolor_ops", column: "created_by", mode: "nullify" },
      { table: "compras_starcolor_romaneios", column: "created_by", mode: "nullify" },
      { table: "conferences", column: "created_by", mode: "nullify" },
      { table: "contagens_diarias_limite", column: "user_id", mode: "delete" },
      { table: "etiqueta_historico", column: "usuario_id", mode: "nullify" },
      { table: "etiqueta_templates", column: "criado_por", mode: "nullify" },
      { table: "expedicao_cargas", column: "criado_por", mode: "nullify" },
      { table: "expedicao_carrinhos", column: "conferente_id", mode: "nullify" },
      { table: "expedicao_comprovantes", column: "criado_por", mode: "nullify" },
      { table: "expedicao_conferencias_itens", column: "conferente_id", mode: "nullify" },
      { table: "expedicao_pecas", column: "conferente_id", mode: "nullify" },
      { table: "expedicao_pecas", column: "embalador_id", mode: "nullify" },
      { table: "expedicao_pecas_historico", column: "usuario_id", mode: "nullify" },
      { table: "expedicao_picking_itens", column: "bipado_por", mode: "nullify" },
      { table: "expedicao_pickings", column: "created_by", mode: "nullify" },
      { table: "expedicao_romaneio_nfe", column: "vinculada_por", mode: "nullify" },
      { table: "expedicao_romaneios", column: "cancelado_por", mode: "nullify" },
      { table: "expedicao_romaneios", column: "created_by", mode: "nullify" },
      { table: "import_log", column: "user_id", mode: "nullify" },
      { table: "independent_reservations", column: "updated_by", mode: "nullify" },
      { table: "inventory_daily_limits", column: "user_id", mode: "delete" },
      { table: "inventory_tasks", column: "assigned_to", mode: "nullify" },
      { table: "inventory_tasks", column: "completed_by", mode: "nullify" },
      { table: "itens_cadastro", column: "created_by", mode: "nullify" },
      { table: "itens_cadastro", column: "updated_by", mode: "nullify" },
      { table: "lotes_mestres", column: "created_by", mode: "nullify" },
      { table: "nfe_consulta_log", column: "user_id", mode: "nullify" },
      { table: "nfe_entrada", column: "manifestada_por", mode: "nullify" },
      { table: "nfe_entrada_eventos", column: "user_id", mode: "nullify" },
      { table: "nfe_importadas", column: "imported_by", mode: "nullify" },
      { table: "operation_logs", column: "user_id", mode: "nullify" },
      { table: "report_settings", column: "user_id", mode: "nullify" },
      { table: "reservas", column: "updated_by", mode: "nullify" },
      { table: "tarefas_contagem", column: "conferente_id", mode: "nullify" },
      { table: "team_members", column: "added_by", mode: "nullify" },
      { table: "team_page_permissions", column: "updated_by", mode: "nullify" },
      { table: "teams", column: "created_by", mode: "nullify" },

      { table: "profiles", column: "id", mode: "delete" },
      { table: "user_roles", column: "user_id", mode: "delete" },
      { table: "team_members", column: "user_id", mode: "delete" },
      { table: "team_page_permissions", column: "user_id", mode: "delete" },
      { table: "auge_permissoes", column: "user_id", mode: "delete" },
      { table: "ai_chat_history", column: "user_id", mode: "delete" },
    ];

    for (const c of cleanupTables) {
      const result = c.mode === "nullify"
        ? await adminClient.from(c.table).update({ [c.column]: null }).eq(c.column, userIdToDelete)
        : await adminClient.from(c.table).delete().eq(c.column, userIdToDelete);
      if (result.error) {
        console.error("[delete-account] cleanup failed", {
          table: c.table,
          column: c.column,
          mode: c.mode,
          error: result.error.message,
        });
        return jsonResponse(
          { error: `Falha ao limpar vínculo em ${c.table}.${c.column}: ${result.error.message}` },
          500,
        );
      }
    }

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userIdToDelete);

    if (deleteErr) {
      console.error("[delete-account] auth.admin.deleteUser failed", deleteErr);
      return jsonResponse(
        {
          error: deleteErr.message || "Falha ao remover usuário",
          details: "details" in deleteErr ? deleteErr.details : null,
          hint: "Verifique se há registros vinculados que impedem a exclusão.",
        },
        500,
      );
    }

    return jsonResponse({ success: true });
  } catch (error: unknown) {
    console.error("[delete-account] unexpected error", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
