import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, RefreshCw, Plus, Search, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import SolicitarAbreviacaoDialog from '@/components/abreviacoes/SolicitarAbreviacaoDialog';
import { useAuth } from '@/hooks/use-auth';

type Abrev = {
  cd_abreviacao: string;
  id_tipo_abreviacao: string;
  ds_atual: string;
  ds_abreviada: string;
  synced_at: string;
};
type Dic = { id: string; tipo: string; cd: string; nm: string; nm_pai: string | null };
type Sol = {
  id: string;
  tipo: string;
  ds_atual: string;
  ds_abreviada: string;
  motivo: string | null;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'efetivada';
  solicitante_email: string | null;
  solicitante_id: string;
  created_at: string;
  obs_revisao: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  pendente: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  aprovada: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  efetivada: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  rejeitada: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
};

export default function DicionarioPage() {
  const { role, user } = useAuth() as any;
  const isGerentePlus = role === 'admin' || role === 'gerente';

  const [abrevs, setAbrevs] = useState<Abrev[]>([]);
  const [dics, setDics] = useState<Dic[]>([]);
  const [sols, setSols] = useState<Sol[]>([]);
  const [q, setQ] = useState('');
  const [dicTipo, setDicTipo] = useState<'todos' | 'classe' | 'sub_classe' | 'combinacao' | 'tag'>('todos');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<'abr' | 'dic' | null>(null);
  const [dialog, setDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, d, s] = await Promise.all([
        (supabase as any).from('auge_abreviacoes').select('*').order('ds_atual', { ascending: true }).limit(5000),
        (supabase as any).from('auge_dicionarios').select('*').order('nm', { ascending: true }).limit(5000),
        (supabase as any).from('abreviacoes_solicitadas').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      setAbrevs(a.data ?? []);
      setDics(d.data ?? []);
      setSols(s.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runSync = async (kind: 'abr' | 'dic') => {
    setSyncing(kind);
    try {
      const action = kind === 'abr' ? 'sync_abreviacoes' : 'sync_dicionarios';
      const { error } = await supabase.functions.invoke('auge-sync', { body: { action } });
      if (error) throw error;
      toast.success('Sincronização iniciada. Recarregando em instantes...');
      setTimeout(load, 3500);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha na sincronização.');
    } finally {
      setSyncing(null);
    }
  };

  const revisar = async (id: string, novoStatus: 'aprovada' | 'rejeitada') => {
    if (!isGerentePlus) { toast.error('Somente gerentes/admins podem revisar.'); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('abreviacoes_solicitadas').update({
      status: novoStatus,
      revisor_id: u?.user?.id,
      revisor_email: u?.user?.email,
      revisado_em: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Solicitação ${novoStatus}.`);
    load();
  };

  const excluir = async (id: string) => {
    const { error } = await (supabase as any).from('abreviacoes_solicitadas').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Solicitação removida.');
    load();
  };

  const efetivarNoAuge = async (s: Sol) => {
    if (!isGerentePlus) { toast.error('Somente gerentes/admins podem efetivar no Auge.'); return; }
    const conf = window.confirm(`Enviar para o Auge?\n\nAtual: ${s.ds_atual}\nAbreviação: ${s.ds_abreviada}`);
    if (!conf) return;
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {
          action: 'salvar_abreviacao',
          dsAtual: s.ds_atual,
          dsAbreviada: s.ds_abreviada,
          idTipoAbreviacao: 1,
          solicitacaoId: s.id,
        },
      });
      if (error) throw error;
      if ((data as any)?.cdAbreviacao) {
        toast.success(`Efetivada no Auge (cd ${(data as any).cdAbreviacao}).`);
      } else {
        toast.success('Enviada ao Auge. Verifique a lista de abreviações.');
      }
      setTimeout(load, 2500);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao efetivar no Auge.');
    }
  };


  const filteredAbrevs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return abrevs;
    return abrevs.filter((a) =>
      a.ds_atual.toLowerCase().includes(s) ||
      a.ds_abreviada.toLowerCase().includes(s) ||
      a.id_tipo_abreviacao.toLowerCase().includes(s));
  }, [abrevs, q]);

  const filteredDics = useMemo(() => {
    const s = q.trim().toLowerCase();
    return dics
      .filter((d) => dicTipo === 'todos' ? true : d.tipo === dicTipo)
      .filter((d) => !s || d.nm.toLowerCase().includes(s) || d.cd.toLowerCase().includes(s) || (d.nm_pai ?? '').toLowerCase().includes(s));
  }, [dics, dicTipo, q]);

  const pendentes = sols.filter((s) => s.status === 'pendente').length;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Dicionário</h1>
            <p className="text-xs text-muted-foreground">Abreviações, classes e solicitações — sincronizadas do Auge</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => runSync('abr')} disabled={syncing !== null}>
            {syncing === 'abr' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sincronizar abreviações
          </Button>
          <Button size="sm" variant="outline" onClick={() => runSync('dic')} disabled={syncing !== null}>
            {syncing === 'dic' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sincronizar dicionário
          </Button>
          <Button size="sm" onClick={() => setDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Solicitar abreviação
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por texto, código ou tipo..." className="pl-9 h-10" />
      </div>

      <Tabs defaultValue="abreviacoes">
        <TabsList>
          <TabsTrigger value="abreviacoes">Abreviações <Badge variant="secondary" className="ml-2">{filteredAbrevs.length}</Badge></TabsTrigger>
          <TabsTrigger value="dicionario">Dicionário <Badge variant="secondary" className="ml-2">{filteredDics.length}</Badge></TabsTrigger>
          <TabsTrigger value="solicitacoes">
            Solicitações {pendentes > 0 && <Badge className="ml-2 bg-amber-500/20 text-amber-600 border-amber-500/40">{pendentes}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ABREVIAÇÕES */}
        <TabsContent value="abreviacoes">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-left px-3 py-2">Texto atual</th>
                    <th className="text-left px-3 py-2">Abreviação</th>
                    <th className="text-left px-3 py-2">Código</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                  )}
                  {!loading && filteredAbrevs.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma abreviação. Sincronize com o Auge.</td></tr>
                  )}
                  {filteredAbrevs.slice(0, 500).map((a) => (
                    <tr key={a.cd_abreviacao} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{a.id_tipo_abreviacao}</Badge></td>
                      <td className="px-3 py-2">{a.ds_atual}</td>
                      <td className="px-3 py-2 font-mono text-primary">{a.ds_abreviada}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{a.cd_abreviacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* DICIONÁRIO */}
        <TabsContent value="dicionario">
          <div className="mb-3">
            <Select value={dicTipo} onValueChange={(v: any) => setDicTipo(v)}>
              <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="classe">Classes</SelectItem>
                <SelectItem value="sub_classe">Subclasses</SelectItem>
                <SelectItem value="combinacao">Combinações</SelectItem>
                <SelectItem value="tag">Tags</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-left px-3 py-2">Código</th>
                    <th className="text-left px-3 py-2">Nome</th>
                    <th className="text-left px-3 py-2">Vínculo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                  )}
                  {!loading && filteredDics.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum registro. Sincronize com o Auge.</td></tr>
                  )}
                  {filteredDics.slice(0, 500).map((d) => (
                    <tr key={d.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{d.tipo}</Badge></td>
                      <td className="px-3 py-2 font-mono text-xs">{d.cd}</td>
                      <td className="px-3 py-2">{d.nm}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{d.nm_pai ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* SOLICITAÇÕES */}
        <TabsContent value="solicitacoes">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-left px-3 py-2">Atual</th>
                    <th className="text-left px-3 py-2">Abreviação</th>
                    <th className="text-left px-3 py-2">Solicitante</th>
                    <th className="text-left px-3 py-2">Data</th>
                    <th className="text-right px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sols.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma solicitação.</td></tr>
                  )}
                  {sols.map((s) => {
                    const mine = user?.id === s.solicitante_id;
                    return (
                      <tr key={s.id} className="border-t hover:bg-muted/30 align-top">
                        <td className="px-3 py-2"><Badge className={`text-xs ${STATUS_COLOR[s.status]}`}>{s.status}</Badge></td>
                        <td className="px-3 py-2 text-xs">{s.tipo}</td>
                        <td className="px-3 py-2">{s.ds_atual}</td>
                        <td className="px-3 py-2 font-mono text-primary">{s.ds_abreviada}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{s.solicitante_email ?? '—'}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString('pt-BR')}</td>
                        <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                          {s.status === 'pendente' && isGerentePlus && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => revisar(s.id, 'aprovada')} className="h-7 gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => revisar(s.id, 'rejeitada')} className="h-7 gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Rejeitar
                              </Button>
                            </>
                          )}
                          {s.status === 'pendente' && (mine || isGerentePlus) && (
                            <Button size="sm" variant="ghost" onClick={() => excluir(s.id)} className="h-7">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <SolicitarAbreviacaoDialog open={dialog} onOpenChange={setDialog} onSaved={load} />
    </div>
  );
}
