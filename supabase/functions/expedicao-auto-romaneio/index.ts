/**
 * Edge Function: expedicao-auto-romaneio
 * 
 * Gera romaneios automaticos com base nas regras de frete dos clientes.
 * 
 * Endpoints:
 * - POST /expedicao-auto-romaneio (action='generate') -> gera romaneios futuros
 * - POST /expedicao-auto-romaneio (action='preview') -> preview sem persistir
 * - GET  /expedicao-auto-romaneio (action='logs')     -> lista logs gerados
 * 
 * Query params:
 * - daysAhead: int (default 3) -> quantos dias a frente gerar
 * - transportadora_id: uuid -> filtrar por transportadora especifica
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || (await req.json().catch(() => ({}))).action || "generate";
    const daysAhead = parseInt(url.searchParams.get("daysAhead") || "3");
    const transportadoraId = url.searchParams.get("transportadora_id") || null;

    // ============================================================
    // ACTION: generate - Gera romaneios automaticos
    // ============================================================
    if (action === "generate") {
      const now = new Date();
      const results: any[] = [];

      // Para cada dia futuro
      for (let i = 1; i <= daysAhead; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + i);
        const dateStr = targetDate.toISOString().split("T")[0];

        // Busca todas as regras de frete ativas
        const { data: regras, error: regraErr } = await supabaseClient
          .from("faturamento_regras")
          .select("*")
          .eq("status", "ativo")
          .isNotNull("transportadora_cif")
          .or("transportadora_cif.neq.,transportadora_fob.notnull");

        if (regraErr) throw regraErr;

        // Busca pecas pendentes do auge_sync para este período
        // (pecas com status "pronto" ou "no_romaneio")
        const { data: pecasPendientes, error: pecasErr } = await supabaseClient
          .from("expedicao_pecas_auge_sync")
          .select("*")
          .in("status_local", ["pronto", "no_romaneio", "aguardando_romaneio"])
          .gte("data_pronto_auge", dateStr)
          .order("data_pronto_auge", { ascending: true });

        if (pecasErr) throw pecasErr;

        if (!pecasPendientes?.length) continue;

        // Agrupa pecas por cliente
        const porCliente = new Map<string, any[]>();
        for (const peca of pecasPendientes) {
          const clienteCodigo = peca.auge_cliente_codigo || peca.auge_cliente_id;
          if (!porCliente.has(clienteCodigo)) {
            porCliente.set(clienteCodigo, []);
          }
          porCliente.get(clienteCodigo)!.push(peca);
        }

        // Para cada cliente, decide transportadora baseada na regra
        const linhas: any[] = [];
        for (const [clienteCodigo, pecas] of porCliente.entries()) {
          const regra = regras?.find((r) => r.codigo_cliente === clienteCodigo);

          // Se não tem regra específica, usa padrão ou ignora
          if (!regra) continue;

          // Decide transportadora
          let transportadora: string | null = null;
          let modalidade: string = "CIF";

          // Verifica grupo economico primeiro
          if (regra.grupo_economico) {
            const grupoRegra = regras?.find((r) => r.id === regra.id); // mesma regra
            if (grupoRegra?.transportadora_cif) {
              transportadora = grupoRegra.transportadora_cif;
              modalidade = "CIF";
            }
          }

          // Se ainda não definiu, usa a regra do proprio cliente
          if (!transportadora) {
            if (regra.modalidade_frete === "FOB" || regra.modalidade_frete === "FOB_SEMPRE") {
              transportadora = regra.transportadora_fob;
              modalidade = "FOB";
            } else if (regra.modalidade_frete === "CIF" || regra.modalidade_frete === "CIF_SEMPRE") {
              transportadora = regra.transportadora_cif;
              modalidade = "CIF";
            } else {
              // CIF_FOB: decide baseado no valor minimo
              const valorTotal = pecas.reduce((acc, p) => acc + (Number(p.quantidade) || 1) * 100, 0); // estimativa
              if (regra.valor_minimo_frete && valorTotal >= regra.valor_minimo_frete) {
                transportadora = regra.transportadora_cif;
                modalidade = "CIF";
              } else {
                transportadora = regra.transportadora_fob;
                modalidade = "FOB";
              }
            }
          }

          // Filtra por transportadora se especificado
          if (transportadoraId && transportadora !== transportadoraId) continue;

          // Cria linha de romaneio
          const totalPecas = pecas.length;
          const transportadoraNome = regra.nome_cliente || `Cliente ${clienteCodigo}`;

          linhas.push({
            data_faturamento: dateStr,
            cliente_codigo: clienteCodigo,
            cliente_nome: regra.nome_cliente || clienteCodigo,
            total_peças: totalPecas,
            transportadora: transportadora,
            modalidade: modalidade,
            quantidade_pecas: totalPecas,
            pecas_ids: pecas.map((p) => p.id),
            observacoes: regra.observacoes?.substring(0, 200) || null,
          });
        }

        if (linhas.length > 0) {
          // Persiste os dados no log
          const { error: logErr } = await supabaseClient
            .from("romaneio_automatico_logs")
            .insert({
              data_faturamento: dateStr,
              status: "gerado",
              total_linhas: linhas.length,
              json_detalhes: linhas,
              usuario_id: null, // sera preenchido pelo caller
            });

          if (logErr) console.error("Erro ao salvar log:", logErr);

          results.push({
            data: dateStr,
            total_clientes: linhas.length,
            linhas,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, results, daysAhead }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ACTION: preview - Preview sem persistir
    // ============================================================
    if (action === "preview") {
      const { data: regras, error } = await supabaseClient
        .from("faturamento_regras")
        .select("*")
        .eq("status", "ativo");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, regras: regras || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ACTION: logs - Lista historico de geracoes
    // ============================================================
    if (action === "logs") {
      const { data: logs, error } = await supabaseClient
        .from("romaneio_automatico_logs")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, logs: logs || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ACTION: get_rules - Busca regras (para admin)
    // ============================================================
    if (action === "get_rules") {
      const { data, error } = await supabaseClient
        .from("faturamento_regras")
        .select("*")
        .order("nome_cliente");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ACTION: save_rule - Salva/Atualiza regra de um cliente
    // ============================================================
    if (action === "save_rule") {
      const body = await req.json().catch(() => ({}));

      if (!body.codigo_cliente) {
        return new Response(JSON.stringify({ error: "codigo_cliente obrigatorio" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("faturamento_regras")
        .upsert(
          {
            codigo_cliente: body.codigo_cliente,
            nome_cliente: body.nome_cliente || body.codigo_cliente,
            modalidade_frete: body.modalidade_frete || "CIF",
            valor_minimo_frete: body.valor_minimo_frete || null,
            transportadora_cif: body.transportadora_cif || null,
            transportadora_fob: body.transportadora_fob || null,
            frequencia_envio: body.frequencia_envio || null,
            grupo_economico: body.grupo_economico || null,
            status: body.status || "ativo",
            condicao_pagamento: body.condicao_pagamento || null,
            limite_credito: body.limite_credito || null,
            observacoes: body.observacoes || null,
            dados_extra: body.dados_extra || {},
          },
          { onConflict: "codigo_cliente" }
        );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ACTION: delete_rule - Remove regra de cliente
    // ============================================================
    if (action === "delete_rule") {
      const body = await req.json().catch(() => ({}));
      const { error } = await supabaseClient
        .from("faturamento_regras")
        .delete()
        .eq("codigo_cliente", body.codigo_cliente);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ACTION: import_rules - Importa regras de arquivo
    // ============================================================
    if (action === "import_rules") {
      const body = await req.json().catch(() => ({}));
      const rules: any[] = body.rules || [];

      if (!Array.isArray(rules) || rules.length === 0) {
        throw new Error("Nenhuma regra fornecida para importacao.");
      }

      const { error } = await supabaseClient
        .from("faturamento_regras")
        .upsert(
          rules.map((r) => ({
            codigo_cliente: r.codigo_cliente,
            nome_cliente: r.nome_cliente || r.codigo_cliente,
            modalidade_frete: r.modalidade_frete || "CIF",
            valor_minimo_frete: r.valor_minimo_frete || null,
            transportadora_cif: r.transportadora_cif || null,
            transportadora_fob: r.transportadora_fob || null,
            frequencia_envio: r.frequencia_envio || null,
            grupo_economico: r.grupo_economico || null,
            status: r.status || "ativo",
            condicao_pagamento: r.condicao_pagamento || null,
            limite_credito: r.limite_credito || null,
            observacoes: r.observacoes || null,
            dados_extra: r.dados_extra || {},
          })),
          { onConflict: "codigo_cliente" }
        );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, imported: rules.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Acao invalida. Use: generate, preview, logs, get_rules, save_rule, delete_rule, import_rules" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[expedicao-auto-romaneio] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
