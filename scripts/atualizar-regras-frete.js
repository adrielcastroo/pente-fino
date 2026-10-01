/**
 * Script para limpar e atualizar regras de frete do arquivo U:\DB Regra frete.txt
 * no banco de dados Supabase.
 *
 * Uso: node scripts/atualizar-regras-frete.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carrega variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// Funções de extração e limpeza
// ============================================================

function extrairMinimo(obs) {
  // Pattern: 'acima de R$ X.XXX,XX'
  const idx = obs.toLowerCase().indexOf('acima de r');
  if (idx >= 0) {
    const after = obs.substring(idx + 9);
    const match = after.match(/\d[\d.,]*/);
    if (match) {
      const valorStr = match[0].replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      if (!isNaN(valor) && valor > 0) return valor;
    }
  }

  // Pattern: 'acima R$ X.XXX,XX'
  const idx2 = obs.toLowerCase().indexOf('acima r');
  if (idx2 >= 0) {
    const after = obs.substring(idx2 + 6);
    const match = after.match(/\d[\d.,]*/);
    if (match) {
      const valorStr = match[0].replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      if (!isNaN(valor) && valor > 0) return valor;
    }
  }

  // Verifica 'sem valor mínimo'
  if (obs.toLowerCase().includes('sem valor mínimo') || obs.includes('sem valor minimo')) {
    return 0;
  }

  return null;
}

function extrairModalidade(obs) {
  if (obs.includes('Frete sempre FOB') || (obs.includes('Frete FOB') && !obs.includes('Frete CIF'))) {
    return 'FOB';
  }
  return 'CIF';
}

function limparTransportadora(valor) {
  if (!valor) return null;

  // Remove textos desnecessários no final
  let limpo = valor
    .replace(/\s*(?:quando|frete|transportadora)\b.*$/i, '')
    .replace(/\s*[:.]\s*$/, '')
    .replace(/\s*P\/\s*$/, '')
    .replace(/\s*P\/$/, '')
    .trim();

  // Remove textos entre parênteses que são observações
  limpo = limpo.replace(/\s*\(.*?\)\s*/g, ' ').trim();

  // Limpa espaços extras
  limpo = limpo.replace(/\s+/g, ' ');

  return limpo || null;
}

function extrairTransportadora(obs, tipo) {
  if (tipo === 'CIF') {
    const match = obs.match(/Transportadora\s*:\s*([^,\n]+)/i);
    if (match) {
      return limparTransportadora(match[1]);
    }
  }

  if (tipo === 'FOB') {
    const match = obs.match(/(?:quando\s+)?(?:frete\s+)?fob\s*[:.]\s*([^,\n]+)/i);
    if (match) {
      return limparTransportadora(match[1]);
    }
  }

  return null;
}

function detectarPendencias(codigo, nome, obs, minimo, modal, cif, fob) {
  const pendencias = [];

  // Cliente balcão - não envia por transportadora
  if (obs.includes('Cliente Balcão') || obs.includes('cliente balcão')) {
    pendencias.push('cliente_balcão');
    return pendencias; // Balcão não precisa de transportadora
  }

  // Sem transportadora CIF definida
  if (!cif && minimo && minimo > 0) {
    pendencias.push('sem_cif');
  }

  // Sem transportadora FOB definida
  if (!fob && minimo && minimo > 0) {
    pendencias.push('sem_fob');
  }

  // Sem valor mínimo definido
  if (minimo === null && !pendencias.includes('cliente_balcão')) {
    pendencias.push('sem_minimo');
  }

  // CIF mal formatado
  if (cif && /P\/|quando fret|sempre que for/i.test(cif)) {
    pendencias.push('cif_mal_formatado');
  }

  // FOB mal formatado
  if (fob && /frequencia|sempre que|solicitado|troca de|até 2m|tamanhos maiores/i.test(fob)) {
    pendencias.push('fob_mal_formatado');
  }

  return pendencias;
}

// ============================================================
// Processamento
// ============================================================

async function processarArquivo() {
  console.log('📄 Lendo arquivo de regras de frete...');
  const content = fs.readFileSync('U:/DB Regra frete.txt', 'utf-8');
  const lines = content.split('\n');

  const clientes = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const cod = parts[0];
    const nome = parts[1];
    const obs = parts[2];

    const minimo = extrairMinimo(obs);
    const modal = extrairModalidade(obs);
    const cif = extrairTransportadora(obs, 'CIF');
    const fob = extrairTransportadora(obs, 'FOB');
    const pendencias = detectarPendencias(cod, nome, obs, minimo, modal, cif, fob);

    clientes.push({
      codigo_cliente: cod,
      nome_cliente: nome,
      valor_minimo_frete: minimo,
      modalidade_frete: modal,
      transportadora_cif: cif,
      transportadora_fob: fob,
      pendencias,
      obs
    });
  }

  console.log(`✅ Extraídos ${clientes.length} clientes do arquivo`);

  // Busca regras existentes no banco
  console.log('\n🔍 Buscando regras existentes no banco...');
  const { data: regrasExistentes, error: errorBusca } = await supabase
    .from('faturamento_regras')
    .select('id, codigo_cliente, nome_cliente, modalidade_frete, valor_minimo_frete, transportadora_cif, transportadora_fob, pendencias');

  if (errorBusca) {
    console.error('❌ Erro ao buscar regras:', errorBusca);
    return;
  }

  const mapaRegras = new Map((regrasExistentes || []).map(r => [r.codigo_cliente, r]));
  console.log(`✅ Encontradas ${regrasExistentes?.length || 0} regras no banco`);

  // Categoriza atualizações
  const paraAtualizar = [];
  const paraCriar = [];
  const ignorados = [];

  clientes.forEach(c => {
    const existente = mapaRegras.get(c.codigo_cliente);

    if (existente) {
      // Compara se há mudanças
      const mudou =
        existente.modalidade_frete !== c.modalidade_frete ||
        existente.valor_minimo_frete !== c.valor_minimo_frete ||
        existente.transportadora_cif !== c.transportadora_cif ||
        existente.transportadora_fob !== c.transportadora_fob ||
        JSON.stringify(existente.pendencias || []) !== JSON.stringify(c.pendencias);

      if (mudou) {
        paraAtualizar.push({
          id: existente.id,
          codigo_cliente: c.codigo_cliente,
          ...c
        });
      } else {
        ignorados.push(c);
      }
    } else {
      paraCriar.push(c);
    }
  });

  console.log(`\n📊 Resumo:`);
  console.log(`   Ignorados (sem mudança): ${ignorados.length}`);
  console.log(`   Para atualizar: ${paraAtualizar.length}`);
  console.log(`   Para criar: ${paraCriar.length}`);

  // Mostra pendências
  const comPendencias = clientes.filter(c => c.pendencias.length > 0);
  console.log(`\n⚠️  Clientes com pendências: ${comPendencias.length}`);

  // Agrupa por tipo de pendência
  const contagemPendencias = {};
  comPendencias.forEach(c => {
    c.pendencias.forEach(p => {
      contagemPendencias[p] = (contagemPendencias[p] || 0) + 1;
    });
  });
  console.log('   Por tipo:');
  Object.entries(contagemPendencias)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tipo, qtd]) => console.log(`     - ${tipo}: ${qtd}`));

  // Atualiza regras
  console.log('\n🔄 Atualizando regras...');
  for (const regra of paraAtualizar) {
    const { error } = await supabase
      .from('faturamento_regras')
      .update({
        modalidade_frete: regra.modalidade_frete,
        valor_minimo_frete: regra.valor_minimo_frete,
        transportadora_cif: regra.transportadora_cif,
        transportadora_fob: regra.transportadora_fob,
        pendencias: regra.pendencias,
        updated_at: new Date().toISOString()
      })
      .eq('id', regra.id);

    if (error) {
      console.error(`   ❌ Erro ao atualizar ${regra.codigo_cliente}:`, error.message);
    }
  }
  console.log(`   ✅ ${paraAtualizar.length} regras atualizadas`);

  // Cria novas regras
  console.log('\n➕ Criando novas regras...');
  for (const regra of paraCriar) {
    const { error } = await supabase
      .from('faturamento_regras')
      .insert({
        codigo_cliente: regra.codigo_cliente,
        nome_cliente: regra.nome_cliente,
        modalidade_frete: regra.modalidade_frete,
        valor_minimo_frete: regra.valor_minimo_frete,
        transportadora_cif: regra.transportadora_cif,
        transportadora_fob: regra.transportadora_fob,
        pendencias: regra.pendencias,
        status: 'ativo'
      });

    if (error) {
      console.error(`   ❌ Erro ao criar ${regra.codigo_cliente}:`, error.message);
    }
  }
  console.log(`   ✅ ${paraCriar.length} regras criadas`);

  console.log('\n✅ Processo concluído!');
}

processarArquivo().catch(console.error);
