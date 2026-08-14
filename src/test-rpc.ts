import { supabase } from "@/integrations/supabase/client";

async function testRPC() {
  console.log("Iniciando teste da RPC buscar_auge_tag_custom_configuracoes...");
  try {
    const { data, error } = await (supabase as any).rpc('buscar_auge_tag_custom_configuracoes', {
      p_termo: 'rollo'
    });

    if (error) {
      console.error("ERRO NO TESTE RPC:", error);
      if (error.code === 'PGRST202') {
        console.error("A FUNÇÃO NÃO EXISTE NO BANCO OU NÃO ESTÁ ACESSÍVEL.");
      }
    } else {
      console.log("SUCESSO NO TESTE RPC:", data);
    }
  } catch (e) {
    console.error("EXCEÇÃO NO TESTE RPC:", e);
  }
}

testRPC();
