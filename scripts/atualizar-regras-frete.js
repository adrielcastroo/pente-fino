/**
 * Script para atualizar regras de frete usando a planilha Excel formatada.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ExcelJSModule from 'exceljs';

const ExcelJS = ExcelJSModule.default || ExcelJSModule;
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: Variáveis de ambiente necessárias ausentes.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseMinimo(val) {
  if (val === null || val === undefined || val === '-' || val === '.' || val === ',') return null;
  const s = String(val).replace('R$', '').replace('.', '').replace(',', '.').trim();
  const num = parseFloat(s);
  return isNaN(num) || num <= 0 ? null : num;
}

function parseBalcao(val) {
  if (val === null || val === undefined || String(val).trim() === '-' || String(val).trim() === '') return false;
  return true;
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

async function processarPlanilha(caminhoArquivo) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(caminhoArquivo);
  const sheet = workbook.worksheets[0];

  const headers = [];
  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value;
  });
  console.log('Headers encontrados:', headers);

  let idxCodigo = -1, idxNome = -1, idxCIF = -1, idxFOB = -1, idxBalcao = -1, idxMinimo = -1;

  headers.forEach((h, idx) => {
    if (!h) return;
    const str = String(h).toLowerCase();
    if (str.includes('codigo') || str.includes('código')) idxCodigo = idx;
    else if (str.includes('nome')) idxNome = idx;
    else if (str.includes('cif')) idxCIF = idx;
    else if (str.includes('fob')) idxFOB = idx;
    else if (str.includes('balc')) idxBalcao = idx;
    else if (str.includes('valor') || str.includes('mínimo') || str.includes('minimo')) idxMinimo = idx;
  });

  console.log(`Mapeamento colunas (1-based): Código=${idxCodigo}, Nome=${idxNome}, CIF=${idxCIF}, FOB=${idxFOB}, Balcão=${idxBalcao}, Minimo=${idxMinimo}`);

  const clientes = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cod = String(row.getCell(idxCodigo).value || '').trim();
    if (!cod) return;
    const nome = String(row.getCell(idxNome).value || '').trim();
    const cif = row.getCell(idxCIF).value;
    const fob = row.getCell(idxFOB).value;
    const balcao = idxBalcao !== -1 ? parseBalcao(row.getCell(idxBalcao).value) : false;
    const minimo = idxMinimo !== -1 ? parseMinimo(row.getCell(idxMinimo).value) : null;

    const modal = balcao ? 'CIF' : (cif === '-' && fob !== '-' ? 'FOB' : 'CIF');

    const limpar = (v) => {
      if (!v || v === '-' || v === '.') return null;
      const s = String(v).trim();
      return s.length > 2 ? s : null;
    };

    const pendencias = [];
    if (balcao) {
      pendencias.push('cliente_balcão');
    } else if (!limpar(cif) && minimo && minimo > 0) {
      pendencias.push('sem_cif');
    } else if (!limpar(fob) && minimo && minimo > 0) {
      pendencias.push('sem_fob');
    }
    if (minimo === null && !balcao) pendencias.push('sem_minimo');

    clientes.push({
      codigo_cliente: cod,
      nome_cliente: nome,
      modalidade_frete: modal,
      valor_minimo_frete: minimo,
      transportadora_cif: limpar(cif),
      transportadora_fob: limpar(fob),
      pendencias
    });
  });

  console.log(`✅ Extraídos ${clientes.length} clientes da planilha Excel.`);

  console.log('\n🔍 Buscando regras existentes no banco...');
  const regrasExistentes = await fetchAllRecords();
  const mapaRegras = new Map(regrasExistentes.map(r => [r.codigo_cliente, r]));
  console.log(`✅ Encontradas ${regrasExistentes.length} regras no banco.`);

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

  console.log('\n🔄 Atualizando registros no Supabase...');
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
  console.log('\n✅ Concluído com sucesso!');
}

processarPlanilha('C:/Users/adriel.avila/Downloads/Esboço_tratado_final_v2.xlsx').catch(console.error);
