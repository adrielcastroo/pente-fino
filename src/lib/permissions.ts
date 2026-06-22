/**
 * Single source of truth for role-based access control (UX layer).
 * Security is enforced by RLS policies in the database — these guards
 * exist to hide/disable controls the user cannot use.
 */

export type Role = 'admin' | 'gerente' | 'supervisor' | 'operador';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  supervisor: 'Supervisor',
  operador: 'Operador',
};

const RANK: Record<Role, number> = {
  admin: 1,
  gerente: 2,
  supervisor: 3,
  operador: 4,
};

/** Normalize a role string from the database (handles legacy 'user'). */
export function normalizeRole(value: string | null | undefined): Role {
  if (!value) return 'operador';
  if (value === 'user') return 'operador';
  if (value === 'admin' || value === 'gerente' || value === 'supervisor' || value === 'operador') {
    return value;
  }
  return 'operador';
}

/** true if `role` has at least the privilege level of `min`. */
export function atLeast(role: Role | null, min: Role): boolean {
  if (!role) return false;
  return RANK[role] <= RANK[min];
}

export type Action =
  // Records
  | 'delete:registro'
  | 'edit:registro-antigo'
  // Stock
  | 'delete:estoque-posicao'
  | 'delete:estoque-saida'
  // Master data
  | 'manage:cadastros'
  | 'manage:lotes-mestres'
  | 'manage:configuracoes'
  // Reports & dashboards
  | 'view:dashboard-executivo'
  | 'export:relatorio'
  | 'view:auditoria'
  // Admin
  | 'manage:users'
  | 'manage:system';

const REQUIRED: Record<Action, Role> = {
  'delete:registro': 'supervisor',
  'edit:registro-antigo': 'supervisor',
  'delete:estoque-posicao': 'supervisor',
  'delete:estoque-saida': 'supervisor',
  'manage:cadastros': 'supervisor',
  'manage:lotes-mestres': 'supervisor',
  'manage:configuracoes': 'supervisor',
  'view:dashboard-executivo': 'gerente',
  'export:relatorio': 'gerente',
  'view:auditoria': 'gerente',
  'manage:users': 'admin',
  'manage:system': 'admin',
};

export function can(role: Role | null, action: Action): boolean {
  return atLeast(role, REQUIRED[action]);
}

export function requiredRoleFor(action: Action): Role {
  return REQUIRED[action];
}
