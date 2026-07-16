import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RequireRole } from '@/components/auth/RequireRole';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Search, Filter, ChevronDown, ChevronRight, RefreshCw, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AugeKardexTab from '@/components/auge/AugeKardexTab';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface AuditLog {
  id: string;
  occurred_at: string;
  user_id: string | null;
  user_email: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  changed_keys: string[] | null;
}

const ENTITY_LABEL: Record<string, string> = {
  registros: 'Registro',
  estoque_posicoes: 'Posição de Estoque',
  estoque_saidas: 'Saída de Estoque',
  itens_cadastro: 'Cadastro de Item',
  lotes_mestres: 'Lote Mestre',
  user_roles: 'Perfil de Usuário',
  conferences: 'Conferência',
};

const ACTION_BADGE: Record<AuditLog['action'], string> = {
  INSERT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
};

const ACTION_LABEL: Record<AuditLog['action'], string> = {
  INSERT: 'Criou',
  UPDATE: 'Alterou',
  DELETE: 'Excluiu',
};

function AuditoriaContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await (supabase
        .from('audit_logs' as any)
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(500) as any);
      if (error) throw error;
      setLogs((data ?? []) as AuditLog[]);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (entityFilter !== 'all' && l.entity !== entityFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = [l.user_email, l.entity, l.entity_id, ...(l.changed_keys ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, query, actionFilter, entityFilter]);

  const entities = useMemo(() => {
    const set = new Set(logs.map((l) => l.entity));
    return Array.from(set).sort();
  }, [logs]);

  const toggle = (id: string) => {
  useDocumentTitle('Auditoria');
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-[1400px] mx-auto min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
          <p className="text-xs text-muted-foreground">
            Trilha imutável de todas as alterações no sistema. Visível para Gerente e Admin.
          </p>
        </div>
      </header>

      <Tabs defaultValue="auditoria" className="w-full">
        <TabsList className="bg-card/40 border border-border/40 rounded-md">
          <TabsTrigger value="auditoria" className="gap-2 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" /> Auditoria
          </TabsTrigger>
          <TabsTrigger value="kardex" className="gap-2 text-xs font-bold uppercase tracking-wider">
            <History className="h-3.5 w-3.5" /> Kardex (Auge)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auditoria" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={load} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_220px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por usuário, ID, campo alterado..."
              className="pl-9 h-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-10"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ações</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Alteração</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas tabelas</SelectItem>
              {entities.map((e) => (
                <SelectItem key={e} value={e}>{ENTITY_LABEL[e] ?? e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Mostrando {filtered.length} de {logs.length} registros (últimos 500).
        </p>
      </Card>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)
        ) : error ? (
          <Card className="p-6 text-center text-destructive">
            <p className="text-sm font-bold">Falha ao carregar.</p>
            <p className="text-xs opacity-70 mt-1">{error}</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum evento encontrado.</p>
          </Card>
        ) : (
          filtered.map((l) => {
            const isOpen = expanded.has(l.id);
            const when = new Date(l.occurred_at);
            return (
              <Card key={l.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(l.id)}
                  className="w-full flex flex-wrap items-center gap-3 p-3 sm:p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <Badge variant="outline" className={`text-[10px] font-bold ${ACTION_BADGE[l.action]}`}>
                    {ACTION_LABEL[l.action]}
                  </Badge>
                  <span className="text-sm font-bold">{ENTITY_LABEL[l.entity] ?? l.entity}</span>
                  {l.entity_id && (
                    <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                      #{l.entity_id.slice(0, 8)}
                    </span>
                  )}
                  <span className="flex-1" />
                  <span className="text-xs text-muted-foreground truncate">
                    {l.user_email ?? 'sistema'}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {when.toLocaleString('pt-BR')}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border/40 bg-muted/10 p-4 space-y-3">
                    {l.changed_keys && l.changed_keys.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Campos:</span>
                        {l.changed_keys.map((k) => (
                          <Badge key={k} variant="outline" className="text-[10px] font-mono">{k}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {l.before_data && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Antes</p>
                          <pre className="text-[10px] font-mono bg-background/60 border border-border/40 rounded-lg p-3 overflow-x-auto max-h-64">
                            {JSON.stringify(l.before_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {l.after_data && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Depois</p>
                          <pre className="text-[10px] font-mono bg-background/60 border border-border/40 rounded-lg p-3 overflow-x-auto max-h-64">
                            {JSON.stringify(l.after_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AuditoriaPage() {
  return (
    <RequireRole
      action="view:auditoria"
      fallback={
        <div className="p-8 max-w-md mx-auto text-center space-y-3">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h2 className="text-lg font-bold">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">
            A trilha de auditoria está disponível apenas para perfis Gerente e Admin.
          </p>
        </div>
      }
    >
      <AuditoriaContent />
    </RequireRole>
  );
}
