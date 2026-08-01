/**
 * Versionamento do Pente Fino — SemVer + codinome.
 *
 * Regra de tamanho da atualização (SemVer estrito):
 *  - major (X.0.0) → mudanças amplas / quebra de fluxo / novo módulo
 *  - minor (x.Y.0) → nova funcionalidade compatível
 *  - patch (x.y.Z) → correção de bug ou ajuste pontual
 *
 * Cada versão recebe também um CODINOME estável, derivado de forma
 * determinística da linha `major.minor` — assim todos os patches de uma
 * mesma linha compartilham o mesmo codinome (ex.: 3.17.0 e 3.17.1 = "Trama").
 */

export type BumpType = 'major' | 'minor' | 'patch' | 'none';

export interface Semver {
  major: number;
  minor: number;
  patch: number;
}

/** Converte "3.17.2" em `{ major: 3, minor: 17, patch: 2 }`. Retorna null se inválido. */
export function parseSemver(raw: string | null | undefined): Semver | null {
  const value = (raw ?? '').trim().replace(/^v/i, '');
  const m = value.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

export function formatSemver(v: Semver): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

/**
 * Classifica o tamanho da mudança entre duas versões.
 * `previous` é a versão anterior (mais antiga); `current` a nova.
 */
export function diffBump(
  previous: string | null | undefined,
  current: string | null | undefined,
): BumpType {
  const a = parseSemver(previous);
  const b = parseSemver(current);
  if (!a || !b) return 'none';
  if (b.major !== a.major) return 'major';
  if (b.minor !== a.minor) return 'minor';
  if (b.patch !== a.patch) return 'patch';
  return 'none';
}

/** Aplica um bump sobre uma versão, zerando os componentes inferiores. */
export function applyBump(current: string, bump: BumpType): string {
  const v = parseSemver(current);
  if (!v) return current;
  if (bump === 'major') return formatSemver({ major: v.major + 1, minor: 0, patch: 0 });
  if (bump === 'minor') return formatSemver({ major: v.major, minor: v.minor + 1, patch: 0 });
  if (bump === 'patch') return formatSemver({ ...v, patch: v.patch + 1 });
  return current;
}

export interface BumpMeta {
  label: string;
  description: string;
  /** Classes com tokens semânticos — nunca cores hard-coded. */
  className: string;
}

export const BUMP_META: Record<BumpType, BumpMeta> = {
  major: {
    label: 'Major',
    description: 'Mudança ampla: novo módulo, quebra de fluxo ou redesenho estrutural.',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
  minor: {
    label: 'Minor',
    description: 'Nova funcionalidade compatível com o que já existia.',
    className: 'bg-primary/15 text-primary border-primary/30',
  },
  patch: {
    label: 'Patch',
    description: 'Correção de bug ou ajuste pontual.',
    className: 'bg-muted text-muted-foreground border-border',
  },
  none: {
    label: 'Inicial',
    description: 'Primeira versão registrada da linha.',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

/**
 * Deduz o bump esperado a partir do conteúdo da release.
 * Usado para avisar o admin quando a numeração não acompanha o tamanho real
 * da atualização (ex.: uma feature publicada como patch).
 */
export function expectedBump(
  highlights: readonly { type: 'feature' | 'fix' | 'improvement' }[],
): BumpType {
  if (!highlights.length) return 'patch';
  if (highlights.some((h) => h.type === 'feature')) {
    // Muitas features juntas caracterizam uma entrega ampla.
    return highlights.filter((h) => h.type === 'feature').length >= 4 ? 'major' : 'minor';
  }
  if (highlights.some((h) => h.type === 'improvement')) return 'minor';
  return 'patch';
}

/**
 * Pool de codinomes (universo têxtil/produção da Unilux). A ordem é fixa:
 * mudar a ordem mudaria o codinome de versões já publicadas.
 */
export const CODENAME_POOL: readonly string[] = [
  'Algodão', 'Bobina', 'Cetim', 'Dobra', 'Estopa', 'Fio', 'Gaze', 'Helanca',
  'Iuta', 'Jacquard', 'Kevlar', 'Linho', 'Malha', 'Nylon', 'Organza', 'Percal',
  'Quadrante', 'Rolo', 'Sarja', 'Trama', 'Urdume', 'Veludo', 'Wattada', 'Xadrez',
  'Yarn', 'Zíper',
];

/** Codinomes fixados manualmente para linhas específicas. */
const CODENAME_OVERRIDES: Record<string, string> = {
  '3.17': 'Trama',
  '3.18': 'Urdume',
};

/**
 * Codinome estável de uma versão. Todos os patches de `major.minor`
 * compartilham o mesmo codinome.
 */
export function codenameFor(version: string | null | undefined): string {
  const v = parseSemver(version);
  if (!v) return '—';
  const line = `${v.major}.${v.minor}`;
  const override = CODENAME_OVERRIDES[line];
  if (override) return override;
  // Índice determinístico: avança 1 codinome por minor, deslocado pelo major.
  const index = (v.major * 7 + v.minor) % CODENAME_POOL.length;
  return CODENAME_POOL[index];
}

/** "v3.17.0 — Trama" */
export function versionLabel(version: string | null | undefined): string {
  const v = parseSemver(version);
  if (!v) return version ?? '—';
  return `v${formatSemver(v)} — ${codenameFor(version)}`;
}

/** Ordena versões da mais nova para a mais antiga. */
export function compareVersionsDesc(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  return (pb.major - pa.major) || (pb.minor - pa.minor) || (pb.patch - pa.patch);
}
