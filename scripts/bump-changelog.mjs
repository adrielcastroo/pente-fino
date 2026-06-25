#!/usr/bin/env node
/**
 * Automação de bump de versão + entrada no CHANGELOG.
 *
 * Uso:
 *   node scripts/bump-changelog.mjs <patch|minor|major> "<mensagem>" [--type=feature|fix|improvement]
 *
 * Exemplos:
 *   node scripts/bump-changelog.mjs patch "Corrige overflow do heatmap" --type=fix
 *   node scripts/bump-changelog.mjs minor "Adiciona trava de NF em PVT/Cortina" --type=feature
 *   node scripts/bump-changelog.mjs major "Refatora navegação principal"
 *
 * Regras SemVer:
 *   - patch  → bug fix / ajuste cosmético
 *   - minor  → nova feature visível
 *   - major  → breaking change
 *
 * Lê src/lib/changelog.ts, calcula a próxima versão a partir da primeira
 * entrada de CHANGELOG, e prepende uma nova entrada com a data de hoje.
 * O rodapé reflete automaticamente via LATEST_VERSION (computado do array).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , bumpType, ...rest] = process.argv;
const VALID = ['patch', 'minor', 'major'];
if (!VALID.includes(bumpType)) {
  console.error(`Bump inválido: "${bumpType}". Use: ${VALID.join(' | ')}`);
  process.exit(1);
}

const typeFlag = rest.find((a) => a.startsWith('--type='));
const entryType = typeFlag ? typeFlag.split('=')[1] : (bumpType === 'patch' ? 'fix' : bumpType === 'minor' ? 'feature' : 'improvement');
const message = rest.filter((a) => !a.startsWith('--')).join(' ').trim();
if (!message) {
  console.error('Mensagem obrigatória. Ex.: node scripts/bump-changelog.mjs patch "Corrige X"');
  process.exit(1);
}

const FILE = resolve('src/lib/changelog.ts');
const src = readFileSync(FILE, 'utf8');

const versionMatch = src.match(/version:\s*'(\d+)\.(\d+)\.(\d+)'/);
if (!versionMatch) {
  console.error('Não encontrei a versão atual em src/lib/changelog.ts');
  process.exit(1);
}
let [major, minor, patch] = versionMatch.slice(1).map(Number);
if (bumpType === 'major') { major += 1; minor = 0; patch = 0; }
else if (bumpType === 'minor') { minor += 1; patch = 0; }
else { patch += 1; }
const nextVersion = `${major}.${minor}.${patch}`;

const today = new Date().toISOString().slice(0, 10);
const newEntry = `  {
    version: '${nextVersion}',
    date: '${today}',
    highlights: [
      { type: '${entryType}', text: ${JSON.stringify(message)} },
    ],
  },
`;

const anchor = 'export const CHANGELOG: ChangelogEntry[] = [\n';
const idx = src.indexOf(anchor);
if (idx === -1) {
  console.error('Âncora CHANGELOG não encontrada.');
  process.exit(1);
}
const insertAt = idx + anchor.length;
const next = src.slice(0, insertAt) + newEntry + src.slice(insertAt);
writeFileSync(FILE, next, 'utf8');

console.log(`✓ CHANGELOG bumpado para v${nextVersion} (${entryType}): ${message}`);
