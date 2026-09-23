import {
  LayoutDashboard,
  Plug,
  Eye,
  Rocket,
  Flag,
  Users,
  Database,
  ScrollText,
  KeyRound,
  Activity,
  HardDrive,
  Package,
  Warehouse,
  ListChecks,
  Workflow,
  Bug,
  LineChart,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  HardDriveDownload,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export type LucideIcon = typeof Activity;
export type NavItem = { key: string; label: string; icon: LucideIcon };
export type NavSection = { key: string; label: string; icon: LucideIcon; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    key: 'visao',
    label: 'Visão',
    icon: LayoutDashboard,
    items: [{ key: 'overview', label: 'Visão geral', icon: LayoutDashboard }],
  },
  {
    key: 'conexoes',
    label: 'Conexões',
    icon: Plug,
    items: [
      { key: 'integrations', label: 'Integrações', icon: Plug },
      { key: 'auge', label: 'Auge ERP', icon: Warehouse },
      { key: 'n8n', label: 'n8n', icon: Workflow },
      { key: 'backfill-transf', label: 'Backfill Transf.', icon: ListChecks },
    ],
  },
  {
    key: 'observabilidade',
    label: 'Observabilidade',
    icon: Eye,
    items: [
      { key: 'observability', label: 'Visão geral', icon: Eye },
      { key: 'sentry', label: 'Sentry', icon: Bug },
      { key: 'posthog', label: 'PostHog', icon: LineChart },
      { key: 'llm-tokens', label: 'Tokens LLM', icon: KeyRound },
    ],
  },
  {
    key: 'entrega',
    label: 'Entrega',
    icon: Rocket,
    items: [
      { key: 'flags', label: 'Feature Flags', icon: Flag },
      { key: 'releases', label: 'Releases', icon: Rocket },
    ],
  },
  {
    key: 'governanca',
    label: 'Governança',
    icon: ShieldCheck,
    items: [
      { key: 'team', label: 'Usuários & Acessos', icon: Users },
      { key: 'auge-perms', label: 'Permissões Auge', icon: ShieldCheck },
      { key: 'database', label: 'Banco de Dados', icon: Database },
      { key: 'backup', label: 'Backup & Dados', icon: HardDriveDownload },
      { key: 'security', label: 'Segurança & Auth', icon: KeyRound },
    ],
  },
  {
    key: 'auditoria',
    label: 'Auditoria',
    icon: ShieldAlert,
    items: [
      { key: 'audit', label: 'App', icon: ScrollText },
      { key: 'audit-auge', label: 'Auge', icon: ShieldAlert },
      { key: 'technical-audit', label: 'Técnica', icon: Bug },
    ],
  },
];

export const ALL_KEYS = NAV.flatMap((s) => s.items.map((i) => i.key));

export const tabFallback = <Skeleton className="h-96 rounded-md" />;
