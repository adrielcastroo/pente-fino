#!/usr/bin/env node
/**
 * Automação de release: versiona o CHANGELOG, sincroniza o package.json,
 * gera CHANGELOG.md legível, cria a git tag e faz o commit atômico.
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
 *   - patch  -> bug fix / ajuste cosmético
 *   - minor  -> nova feature visível
 *   - major  -> breaking change
 *
 * O que este script GARANTE (fonte única de verdade = src/lib/changelog.ts):
 *   1. Prependa a nova entrada no CHANGELOG (array) com data de hoje.
 *   2. Atualiza "version" no package.json para a mesma versão.
 *   3. Regenera CHANGELOG.md (legível) a partir do array.
 *   4. Cria a git tag  vX.Y.Z  e faz commit com mensagem real da release.
 *
 * Requer git instalado e repo limpo o suficiente para commit/tag.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const [, , bumpType, ...rest] = process.argv;
const VALID = ['patch', 'minor', 'major'];
if (!VALID.includes(bumpType)) {
  console.error(`Bump inválido: "${bumpType}". Use: ${VALID.join(' | ')}`);
  process.exit(1);
}

const typeFlag = rest.find((a) => a.startsWith('--type='));
const entryType = typeFlag
  ? typeFlag.split('=')[1]
  : bumpType === 'patch'
    ? 'fix'
    : bumpType === 'minor'
      ? 'feature'
      : 'improvement';
const message = rest.filter((a) => !a.startsWith('--')).join(' ').trim();
if (!message) {
  console.error('Mensagem obrigatória. Ex.: node scripts/bump-changelog.mjs patch "Corrige X"');
  process.exit(1);
}

// ---- 1. Calcular próxima versão a partir do CHANGELOG (fonte da verdade) ----
const CHANGELOG_FILE = resolve('src/lib/changelog.ts');
const changelogSrc = readFileSync(CHANGELOG_FILE, 'utf8');
const versionMatch = changelogSrc.match(/version:\s*'(\d+)\.(\d+)\.(\d+)'/);
if (!versionMatch) {
  console.error('Não encontrei a versão atual em src/lib/changelog.ts');
  process.exit(1);
}
let [major, minor, patch] = versionMatch.slice(1).map(Number);
if (bumpType === 'major') { major += 1; minor = 0; patch = 0; }
else if (bumpType === 'minor') { minor += 1; patch = 0; }
else { patch += 1; }
const nextVersion = `${major}.${minor}.${patch}`;
const tagName = `v${nextVersion}`;

// ---- 2. Prependar entrada no CHANGELOG (array) ----
const today = new Date().toISOString().slice(0, 10);
const newEntry = `  {
    version: '${nextVersion}',
    date: '${today}',
    highlights: [
      { type: '${entryType}', text: ${JSON.stringify(message)} },
    ],
  },
`;
// Âncora robusta a CRLF/LF
const anchor = 'export const CHANGELOG: ChangelogEntry[] = [';
const idx = changelogSrc.indexOf(anchor);
if (idx === -1) {
  console.error('Âncora CHANGELOG não encontrada.');
  process.exit(1);
}
// Insere logo após o "[" (a primeira quebra de linha real do arquivo)
const bracketAt = changelogSrc.indexOf('[', idx);
const insertAt = changelogSrc.indexOf('\n', bracketAt) + 1;
const nextChangelog = changelogSrc.slice(0, insertAt) + newEntry + changelogSrc.slice(insertAt);
writeFileSync(CHANGELOG_FILE, nextChangelog, 'utf8');
console.log(`✓ CHANGELOG (array) -> ${tagName} (${entryType})`);

// ---- 3. Sincronizar package.json ----
const PKG_FILE = resolve('package.json');
const pkg = JSON.parse(readFileSync(PKG_FILE, 'utf8'));
pkg.version = nextVersion;
writeFileSync(PKG_FILE, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`✓ package.json -> ${nextVersion}`);

// ---- 4. Regenerar CHANGELOG.md legível a partir do array ----
const typeEmoji = { feature: '✨', fix: '🐞', improvement: '🔧' };
const changelogBlock = nextChangelog
  .match(/export const CHANGELOG[\s\S]*?=\s*\[([\s\S]*?)\n\];/)?.[1] ?? '';
// Extrai cada entrada de versão por blocos
const entryRegex = /version:\s*'([^']+)'[\s\S]*?date:\s*'([^']+)'[\s\S]*?highlights:\s*\[([\s\S]*?)\]/g;
let m;
const lines = ['# Changelog', '', 'Todas as releases seguem SemVer (MAJOR.MINOR.PATCH). Fonte única: `src/lib/changelog.ts`.', ''];
while ((m = entryRegex.exec(changelogBlock)) !== null) {
  const [_, ver, date, highlightsRaw] = m;
  lines.push(`## ${ver} — ${date}`);
  const hlRegex = /type:\s*'([^']+)'[\s\S]*?text:\s*(['"])([\s\S]*?)\2/g;
  let h;
  while ((h = hlRegex.exec(highlightsRaw)) !== null) {
    const [, t, , txt] = h;
    lines.push(`- ${typeEmoji[t] ?? '•'} ${txt.trim()}`);
  }
  lines.push('');
}
writeFileSync(resolve('CHANGELOG.md'), lines.join('\n') + '\n', 'utf8');
console.log('✓ CHANGELOG.md regenerado');

// ---- 5. Git: commit + tag ----
try {
  execSync('git add src/lib/changelog.ts package.json CHANGELOG.md', { stdio: 'inherit' });
  execSync(`git commit -m "release: ${tagName} — ${message}"`, { stdio: 'inherit' });
  execSync(`git tag -a ${tagName} -m "${tagName}: ${message}"`, { stdio: 'inherit' });
  console.log(`✓ commit + tag ${tagName} criados (local). Faça 'git push --follow-tags' para publicar.`);
} catch (e) {
  console.error('⚠️ Falhou ao commitar/taggear. Os arquivos foram alterados; revise com "git diff" e commit manual se necessário.');
  process.exit(1);
}

console.log(`\n🎉 Release ${tagName} pronta. Mensagem: ${message}`);
