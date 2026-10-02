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
  console.error('Erro: Variáveis de ambiente necessárias ausentes.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function extrairMinimo(obs) {
  const patterns = [
    /acima\s+de\s+r\$\s*([\d\.]+,?\d*)/i,
    /acima\s+r\$\s*([\d\.]+,?\d*)/i,
    /acima\s+de\s+([\d\.]+,?\d*)/i,
    /acima\s+([\d\.]+,?\d*)/i,
  ];
  for (const pattern of patterns) {
    const match = obs.match(pattern);
    if (match) {
      const valorStr = match[1].replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      if (!isNaN(valor) && valor > 0) return valor;
    }
  }
  if (obs.toLowerCase().includes('sem valor mínimo') || obs.includes('sem valor minimo')) return 0;
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
  let limpo = valor.split('---')[0].split('\n')[0].split('Quando')[0].split('frete')[0].trim();
  limpo = limpo.replace(/^(Transportadora|FOB|CIF|Frete)\s*[:.-]*\s*/i, '');
  limpo = limpo.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  return limpo.length > 3 ? limpo : null;
}

function extrairTransportadora(obs, tipo) {
  const fatPart = obs.split(/FATURAMENTO/i)[1] || obs;

  if (tipo === 'CIF') {
    const match = fatPart.match(/Transportadora\s*:\s*([^,\n|#]+)/i);
    if (match) return limparTransportadora(match[1]);
  }

  if (tipo === 'FOB') {
    const match = fatPart.match(/(?:FOB|Quando FOB|Frete FOB)\s*[:.-]*\s*([^,\n|#]+)/i);
    if (match) return limparTransportadora(match[1]);
  }
  return null;
}

function detectarPendencias(codigo, nome, obs, minimo, modal, cif, fob) {
  const pendencias = [];
  if (obs.toLowerCase().includes('cliente balcão')) return ['cliente_balcão'];
  if (!cif && minimo && minimo > 0) pendencias.push('sem_cif');
  if (!fob && minimo && minimo > 0) pendencias.push('sem_fob');
  if (minimo === null) pendencias.push('sem_minimo');
  return pendencias;
}

async function fetchAllRecords() {
  let allData = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('faturamento_regras')
      .select('id, codigo_cliente')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < 1000) break;
    page++;
  }
  return allData;
}

async function processarArquivo() {
  console.log('📄 Lendo arquivo...');
  const content = fs.readFileSync('U:/DB Regra frete.txt', 'utf-8');
  const lines = content.split('\n');

  const clientes = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || !line.includes('\t')) continue;
    const parts = line.split('\t');
    const cod = parts[0];
    const nome = parts[1];
    const obs = parts[2] || '';

    const minimo = extrairMinimo(obs);
    const modal = extrairModalidade(obs);
    const cif = extrairTransportadora(obs, 'CIF');
    const fob = extrairTransportadora(obs, 'FOB');
    const pendencias = detectarPendencias(cod, nome, obs, minimo, modal, cif, fob);

    clientes.push({ codigo_cliente: cod, nome_cliente: nome, valor_minimo_frete: minimo, modalidade_frete: modal, transportadora_cif: cif, transportadora_fob: fob, pendencias });
  }

  const regrasExistentes = await fetchAllRecords();
  const mapaRegras = new Map(regrasExistentes.map(r => [r.codigo_cliente, r]));

  console.log('🔄 Atualizando em lotes...');
  const BATCH_SIZE = 50;
  for (let i = 0; i < clientes.length; i += BATCH_SIZE) {
    const batch = clientes.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (c) => {
      const existente = mapaRegras.get(c.codigo_cliente);
      if (existente) {
        await supabase.from('faturamento_regras').update({
          modalidade_frete: c.modalidade_frete,
          valor_minimo_frete: c.valor_minimo_frete,
          transportadora_cif: c.transportadora_cif,
          transportadora_fob: c.transportadora_fob,
          pendencias: c.pendencias,
          updated_at: new Date().toISOString()
        }).eq('id', existente.id);
      }
    }));
    console.log(`   Progresso: ${Math.min(i + BATCH_SIZE, clientes.length)}/${clientes.length}`);
  }
  console.log('✅ Concluído com sucesso.');
}

processarArquivo().catch(console.error);
