import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "xlsx";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { type = "daily" } = await req.json().catch(() => ({}));
    
    // 1. Fetch data
    const now = new Date();
    let startDate = new Date();
    if (type === "daily") startDate.setDate(now.getDate() - 1);
    else if (type === "weekly") startDate.setDate(now.getDate() - 7);
    else if (type === "monthly") startDate.setMonth(now.getMonth() - 1);

    const { data: conferences, error: confError } = await supabaseClient
      .from("conferences")
      .select("*, registros(*)")
      .gte("created_at", startDate.toISOString());

    if (confError) throw confError;

    // 2. Calculate KPIs
    const totalConferences = conferences?.length || 0;
    const totalRegistros = conferences?.reduce((acc, c) => acc + (c.registros?.length || 0), 0) || 0;
    
    // 3. Generate XLSX
    const allRegistros = conferences?.flatMap(c => (c.registros || []).map(r => ({
      ...r,
      conference_name: c.processo,
      conferente: c.conferente
    }))) || [];

    const worksheet = XLSX.utils.json_to_sheet(allRegistros);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Brutos");
    const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 4. Generate AI Analysis (Optional - if OpenRouter is configured)
    const orKey = Deno.env.get("OPENROUTER_API_KEY");
    let aiAnalysis = "Análise técnica em processamento...";
    
    if (orKey) {
      const stats = `Total Conferências: ${totalConferences}, Total Registros: ${totalRegistros}`;
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orKey}` },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [{
            role: "user",
            content: `Com base nos seguintes dados: ${stats}. Escreva um relatório técnico de conferência de tecidos e motores. 
            Inclua: 
            1. Análise técnica.
            2. Dicas de melhorias explicando os "porques".
            Use escrita humana, acessível e de fácil interpretação.`
          }]
        })
      });
      if (resp.ok) {
        const aiData = await resp.json();
        aiAnalysis = aiData.choices[0].message.content;
      }
    }

    // 5. Send Email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Relatorios <reports@seudominio.com>",
        to: ["destinatario@exemplo.com"], // Should fetch from report_settings
        subject: `Relatório ${type === "daily" ? "Diário" : type === "weekly" ? "Semanal" : "Mensal"} de Conferência`,
        html: `
          <h1>Relatório ${type.toUpperCase()}</h1>
          <p><strong>Período:</strong> ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
            <h2>KPIs e Métricas</h2>
            <ul>
              <li>Total de Conferências: ${totalConferences}</li>
              <li>Total de Registros/Rolos: ${totalRegistros}</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h2>Análise Técnica</h2>
            <p>${aiAnalysis.replace(/\n/g, '<br>')}</p>
          </div>
        `,
        attachments: [
          {
            filename: `relatorio_${type}_${now.toISOString().split('T')[0]}.xlsx`,
            content: btoa(String.fromCharCode(...new Uint8Array(xlsxBuffer))),
          },
        ],
      });
    }

    // 6. Log the report
    await supabaseClient.from("report_logs").insert({
      report_type: type,
      status: "sent",
      recipient_count: 1
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
