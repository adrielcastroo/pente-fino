// Script para buscar motores bipados por visitantes no Supabase
// Execute: npx tsx scripts/buscar-bipados-visitantes.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://ymqrfgqdmgjbwpikcwnk.supabase.co';
const SUPABASE_ANON_KEY = '[REDACTED]'; // Obtenha da configuração do projeto

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Buscando motores bipados...\n');

  // 1. Verificar tabelas relacionadas a bipagem/escaneo
  const tabelasCriticas = [
    'registros',
    'bipagem',
    'historico_contagem',
    'motores_bipados',
    'escaneo',
    'visitantes',
    'log_bipagem'
  ];

  console.log('Tabelas possíveis:', tabelasCriticas.join(', '));

  // 2. Verificar registros com modo "motor" ou "controle"
  console.log('\n📊 Registros com modo origem "motor" ou "controle":');
  const { data: motores, error: errMotores } = await supabase
    .from('registros')
    .select('id, item, processo, lote, quantidade, modo_origem, created_at, edited_by, edited_at')
    .in('modo_origem', ['motor', 'controle'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (errMotores) {
    console.error('Erro ao buscar motores:', errMotores.message);
  } else {
    console.log(`Encontrados ${motores?.length ?? 0} registros:`);
    motores?.forEach(r => {
      console.log(`  - ID: ${r.id}, Item: ${r.item}, Lote: ${r.lote}, Qtd: ${r.quantidade}, Status: ${r.modo_origem}`);
    });
  }

  // 3. Verificar histórico de contagem
  console.log('\n📋 Histórico de contagem (bipagem):');
  const { data: historico, error: errHistorico } = await supabase
    .from('historico_contagem')
    .select('id, tarefa_id, conferente_nome, quantidade_contada, quantidade_sistema, data_conferencia, diferenca')
    .order('data_conferencia', { ascending: false })
    .limit(30);

  if (errHistorico) {
    console.error('Erro ao buscar histórico:', errHistorico.message);
  } else {
    console.log(`Encontrados ${historico?.length ?? 0} registros de contagem:`);
    historico?.forEach(h => {
      console.log(`  - ${h.conferente_nome}: contou ${h.quantidade_contada}, sistema=${h.quantidade_sistema}, data=${h.data_conferencia}`);
    });
  }

  // 4. Verificar quem editou (possíveis visitantes)
  console.log('\n👥 Quem editou registros de motor/controle:');
  const editores = new Set<string>();
  motores?.forEach(r => {
    if (r.edited_by) editores.add(r.edited_by);
  });
  console.log('Editores únicos:', [...editores].length > 0 ? [...editores].join(', ') : 'Nenhum');
}

main().catch(console.error);