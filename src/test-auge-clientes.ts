import { supabase } from '@/integrations/supabase/client';

export async function testAugeClientesEndpoint() {
  console.log('--- Iniciando teste de descoberta de Clientes Auge ---');
  
  const candidates = [
    '/l.unilux/modComercial/ajax/getParticipantes.php',
    '/l.unilux/modComercial/ajax/getClientes.php',
    '/l.unilux/modCRM/ajax/getClientes.php',
    '/l.unilux/modCRM/ajax/getParticipantes.php',
    '/l.unilux/modCadastro/ajax/getClientes.php',
    '/l.unilux/modCadastro/ajax/getParticipantes.php',
    '/l.unilux/modInventario/estoque/ajax/getClientes.php'
  ];

  for (const path of candidates) {
    console.log(`Testando endpoint: ${path}`);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { 
          action: 'run_consulta', 
          path, 
          method: 'POST',
          body: {
            draw: '1',
            start: '0',
            length: '10',
            'search[value]': '',
            'search[regex]': 'false'
          }
        }
      });

      if (error) {
        console.error(`Erro invoke ${path}:`, error);
        continue;
      }

      if (data?.ok === false) {
        console.warn(`Auge retornou erro para ${path}:`, data.error);
        continue;
      }

      console.log(`SUCESSO em ${path}! Resposta parcial:`, JSON.stringify(data).slice(0, 500));
      return { path, data };
    } catch (e) {
      console.error(`Falha catastrófica em ${path}:`, e);
    }
  }

  console.log('Nenhum endpoint de clientes encontrado.');
  return null;
}
