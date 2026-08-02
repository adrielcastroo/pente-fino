import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2, Plus, RefreshCw, Search, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Uma memória de longo prazo do Fio (tabela public.fio_memories). */
export type FioMemory = {
  id: string;
  key: string;
  value: string;
  categoria: 'preferencia' | 'fato' | 'atalho' | 'contexto';
  origem: 'chat' | 'manual' | 'inferido';
  updated_at: string;
};

const CATEGORIA_LABEL: Record<FioMemory['categoria'], string> = {
  preferencia: 'Preferência',
  fato: 'Fato',
  atalho: 'Atalho',
  contexto: 'Contexto',
};

function normalizeKey(raw: string) {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

/**
 * Painel de "Memória de Longo Prazo" do Fio.
 * O usuário revisa, edita, adiciona e apaga o que o assistente lembra sobre ele.
 * Todas as consultas passam por RLS (cada usuário só enxerga as próprias memórias).
 */
export default function FioMemoryPanel() {
  const [rows, setRows] = useState<FioMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [novo, setNovo] = useState<{ key: string; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FioMemory | null>(null);
  const [limpandoTudo, setLimpandoTudo] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('fio_memories')
      .select('id,key,value,categoria,origem,updated_at')
      .order('updated_at', { ascending: false });
    if (error) toast.error('Não consegui carregar as memórias: ' + error.message);
    setRows((data ?? []) as FioMemory[]);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => r.key.toLowerCase().includes(q) || r.value.toLowerCase().includes(q));
  }, [rows, busca]);

  const salvarEdicao = async () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (!value) { toast.error('O valor não pode ficar vazio.'); return; }
    setSavingId(editing.id);
    const { error } = await (supabase as any)
      .from('fio_memories')
      .update({ value, origem: 'manual' })
      .eq('id', editing.id);
    setSavingId(null);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    setRows(rs => rs.map(r => (r.id === editing.id ? { ...r, value, origem: 'manual' } : r)));
    setEditing(null);
    toast.success('Memória atualizada');
  };

  const criar = async () => {
    if (!novo) return;
    const key = normalizeKey(novo.key);
    const value = novo.value.trim();
    if (!key || !value) { toast.error('Informe chave e valor.'); return; }
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) { toast.error('Sessão expirada.'); return; }

    const { error } = await (supabase as any)
      .from('fio_memories')
      .upsert({ user_id: userId, key, value, categoria: 'preferencia', origem: 'manual' }, { onConflict: 'user_id,key' });
    if (error) { toast.error('Erro ao criar: ' + error.message); return; }
    setNovo(null);
    toast.success('Memória adicionada');
    carregar();
  };

  const apagar = async (m: FioMemory) => {
    const { error } = await (supabase as any).from('fio_memories').delete().eq('id', m.id);
    if (error) { toast.error('Erro ao apagar: ' + error.message); return; }
    setRows(rs => rs.filter(r => r.id !== m.id));
    setConfirmDelete(null);
    toast.success('Memória apagada');
  };

  const apagarTudo = async () => {
    const ids = rows.map(r => r.id);
    if (!ids.length) return;
    const { error } = await (supabase as any).from('fio_memories').delete().in('id', ids);
    setLimpandoTudo(false);
    if (error) { toast.error('Erro ao limpar: ' + error.message); return; }
    setRows([]);
    toast.success('Memória do Fio limpa');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Memória do Fio</p>
            <p className="text-xs text-muted-foreground">
              O que o assistente lembra sobre você — depósitos favoritos, formatos preferidos e atalhos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={carregar} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setNovo({ key: '', value: '' })}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por chave ou conteúdo…"
          className="pl-8 h-9 text-sm"
        />
      </div>

      {novo && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Chave</Label>
                <Input
                  value={novo.key}
                  onChange={e => setNovo({ ...novo, key: e.target.value })}
                  placeholder="deposito_favorito"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor</Label>
                <Input
                  value={novo.value}
                  onChange={e => setNovo({ ...novo, value: e.target.value })}
                  placeholder="Central Provisório"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setNovo(null)}>Cancelar</Button>
              <Button size="sm" onClick={criar}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando…
        </div>
      ) : filtradas.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
          {rows.length === 0
            ? 'O Fio ainda não guardou nada sobre você. Diga "lembre-se que meu depósito padrão é o 18" no chat.'
            : 'Nenhuma memória corresponde à busca.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(m => {
            const emEdicao = editing?.id === m.id;
            return (
              <div
                key={m.id}
                className="rounded-md border border-border bg-card p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-foreground break-all">{m.key}</span>
                    <Badge variant="secondary" className="text-[10px]">{CATEGORIA_LABEL[m.categoria]}</Badge>
                    <Badge variant="outline" className="text-[10px]">{m.origem}</Badge>
                  </div>
                  {emEdicao ? (
                    <Input
                      autoFocus
                      value={editing!.value}
                      onChange={e => setEditing({ id: m.id, value: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground break-words">{m.value}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {emEdicao ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" onClick={salvarEdicao} disabled={savingId === m.id}>
                        {savingId === m.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Save className="w-3.5 h-3.5" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditing({ id: m.id, value: m.value })}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(m)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <div className="pt-2 flex justify-end">
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setLimpandoTudo(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Esquecer tudo
          </Button>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar memória?</AlertDialogTitle>
            <AlertDialogDescription>
              O Fio deixará de lembrar “{confirmDelete?.key}”. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && apagar(confirmDelete)}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={limpandoTudo} onOpenChange={setLimpandoTudo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Esquecer tudo?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as {rows.length} memórias serão apagadas. O Fio voltará a não saber suas preferências.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={apagarTudo}>Apagar tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
