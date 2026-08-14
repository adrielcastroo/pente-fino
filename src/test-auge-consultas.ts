import { supabase } from '@/integrations/supabase/client';

export async function listarConsultasDisponiveis() {
  console.log('--- Listando Consultas Disponíveis no Auge (modTI) ---');
  try {
    const { data, error } = await supabase.functions.invoke('auge-sync', {
      body: { 
        action: 'listar_consultas',
        debug: '1'
      }
    });

    if (error) {
      console.error('Erro invoke listar_consultas:', error);
      return null;
    }

    console.log('Consultas encontradas:', data?.total);
    console.table(data?.data?.slice(0, 20));
    
    if (data?.debug) {
      console.log('DEBUG HTML Snippet (treeTableConsulta):');
      console.log(data.debug);
    }

    return data;
  } catch (e) {
    console.error('Falha catastrófica:', e);
    return null;
  }
}
