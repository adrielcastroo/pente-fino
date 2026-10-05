/**
 * Aplica migrações ausentes no Supabase via service role.
 * As migrações existem no repositório mas nunca foram aplicadas ao banco.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: Variáveis de ambiente necessárias ausentes.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MIGRATIONS = [
  'supabase/migrations/20260902000000_faturamento_regras.sql',
  'supabase/migrations/20260903000001_romaneio_dias.sql',
  'supabase/migrations/20260903000002_romaneio_linhas.sql',
];

async function main() {
  for (const mig of MIGRATIONS) {
    const path = resolve(process.cwd(), mig);
    console.log(`Aplicando: ${mig} ...`);
    const sql = await readFile(path, 'utf-8');
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      // RPC exec_sql pode não existir; tenta via REST endpoint
      console.warn(`  RPC falhou: ${error.message}. Tentando via SQL direto...`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ sql }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Falha ao aplicar ${mig}: ${text}`);
      }
    }
    console.log(`  OK`);
  }
  console.log('\n✅ Todas as migrações aplicadas com sucesso!');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});