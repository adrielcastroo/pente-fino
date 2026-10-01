/**
 * Script para limpar e atualizar regras de frete do arquivo U:\DB Regra frete.txt
 * no banco de dados Supabase.
 *
 * Uso: node scripts/atualizar-regras-frete.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// Funções de extração e limpeza
// ============================================================

function extrairMinimo(obs) {
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
  let limpo = valor
    .replace(/\s*(?:quando|frete|transportadora)\b.*$/i, '')
    .replace(/\s*[:.]\s*$/, '')
    .replace(/\s*P\/\s*$/, '')
    .replace(/\s*P\/$/, '')
    .trim();
  limpo = limpo.replace(/\s*\(.*?\)\s*/g, ' ').trim();
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
  if (obs.includes('Cliente Balcão') || obs.includes('cliente balcão')) {
    pendencias.push('cliente_balcão');
    return pendencias;
  }
  if (!cif && minimo && minimo > 0) {
    pendencias.push('sem_cif');
  }
  if (!fob && minimo && minimo > 0) {
    pendencias.push('sem_fob');
  }
  if (minimo === null && !pendencias.includes('cliente_balcao')) {
    pendencias.push('sem_minimo');
  }
  if (cif && /P\/|quando fret|sempre que for/i.test(cif)) {
    pendencias.push('cif_mal_formatado');
  }
  if (fob && /frequencia|sempre que|solicitado|troca de|até 2m|tamanhos maiores/i.test(fob)) {
    pendencias.push('fob_mal_formatado');
  }
  return pendencias;
}

// ============================================================
// Busca paginada (Supabase REST tem limite de 1000 por request)
// ============================================================
async function fetchAllRecords() {
  let allData = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('faturamento_regras')
      .select('id, codigo_cliente, nome_cliente, modalidade_frete, valor_minimo_frete, transportadora_cif, transportadora_fob')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < 1000) break;
    page++;
  }
  return allData;
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

  // Busca todas as regras existentes
  console.log('\n🔍 Buscando regras existentes no banco...');
  let regrasExistentes = [];
  try {
    regrasExistentes = await fetchAllRecords();
  } catch (e) {
    console.error('❌ Erro ao buscar regras:', e.message);
    return;
  }
  console.log(`✅ Encontradas ${regrasExistentes.length} regras no banco`);

  const mapaRegras = new Map(regrasExistentes.map(r => [r.codigo_cliente, r]));

  const paraAtualizar = [];
  const paraCriar = [];

  clientes.forEach(c => {
    const existente = mapaRegras.get(c.codigo_cliente);
    if (existente) {
      const mudou =
        existente.modalidade_frete !== c.modalidade_frete ||
        existente.valor_minimo_frete !== c.valor_minimo_frete ||
        existente.transportadora_cif !== c.transportadora_cif ||
        existente.transportadora_fob !== c.transportadora_fob;
      if (mudou) {
        paraAtualizar.push({ id: existente.id, ...c });
      }
    } else {
      paraCriar.push(c);
    }
  });

  console.log(`\n📊 Resumo:`);
  console.log(`   Para atualizar: ${paraAtualizar.length}`);
  console.log(`   Para criar: ${paraCriar.length}`);

  // Mostra pendências
  const comPendencias = clientes.filter(c => c.pendencias.length > 0);
  console.log(`\n⚠️  Clientes com pendências: ${comPendencias.length}`);
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
  let updateOk = 0, updateErr = 0;
  for (const regra of paraAtualizar) {
    const { error } = await supabase
      .from('faturamento_regras')
      .update({
        modalidade_frete: regra.modalidade_frete,
        valor_minimo_frete: regra.valor_minimo_frete,
        transportadora_cif: regra.transportadora_cif,
        transportadora_fob: regra.transportadora_fob,
        updated_at: new Date().toISOString()
      })
      .eq('id', regra.id);
    if (error) {
      updateErr++;
      if (updateErr <= 5) console.error(`   ❌ Erro ao atualizar ${regra.codigo_cliente}:`, error.message);
    } else {
      updateOk++;
    }
  }
  console.log(`   ✅ ${updateOk} regras atualizadas${updateErr > 0 ? `, ${updateErr} erros` : ''}`);

  // Cria novas regras (em batch de 100)
  console.log('\n➕ Criando novas regras...');
  let createOk = 0, createErr = 0;
  const BATCH_SIZE = 100;
  for (let i = 0; i < paraCriar.length; i += BATCH_SIZE) {
    const batch = paraCriar.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('faturamento_regras')
      .insert(batch.map(r => ({
        codigo_cliente: r.codigo_cliente,
        nome_cliente: r.nome_cliente,
        modalidade_frete: r.modalidade_frete,
        valor_minimo_frete: r.valor_minimo_frete,
        transportadora_cif: r.transportadora_cif,
        transportadora_fob: r.transportadora_fob,
        status: 'ativo'
      })));
    if (error) {
      createErr += batch.length;
      console.error(`   ❌ Erro no batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
    } else {
      createOk += batch.length;
    }
    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= paraCriar.length) {
      console.log(`   Progresso: ${Math.min(i + BATCH_SIZE, paraCriar.length)}/${paraCriar.length}`);
    }
  }
  console.log(`   ✅ ${createOk} regras criadas${createErr > 0 ? `, ${createErr} erros` : ''}`);

  console.log('\n✅ Processo concluído!');
  console.log('\n💡 Lembre-se de aplicar a migração SQL no dashboard do Supabase para ativar as tags:');
  console.log('   ALTER TABLE faturamento_regras ADD COLUMN IF NOT EXISTS pendencias text[];');
  console.log('   CREATE INDEX IF NOT EXISTS idx_faturamento_regras_pendencias ON faturamento_regras USING GIN (pendencias);');
  console.log('   Depois execute o script novamente para popular as tags de pendência.');
}

processarArquivo().catch(console.error);
