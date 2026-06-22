import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Shirt,
  TreePine,
  Box,
  Warehouse,
  LogOut,
  Archive,
  Calendar,
  Settings,
  Package,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Material = { id: string; descricao: string | null; codigo_interno: string | null };
type Posicao = { id: string; estrutura: string; coluna: string; nivel: number; posicao: number; item: string | null };
type Conferencia = { id: string; processo: string | null; conferente: string | null; created_at: string };

const ROUTES: Array<{ label: string; path: string; icon: React.ComponentType<{ className?: string }>; keywords?: string }> = [
  { label: 'Início (Dashboard)', path: '/', icon: LayoutDashboard, keywords: 'dashboard inicio home' },
  { label: 'Conferência de Tecido', path: '/tecido', icon: Shirt, keywords: 'tecido conferencia' },
  { label: 'Conferência de Madeira', path: '/madeira', icon: TreePine, keywords: 'madeira' },
  { label: 'Motor / Controle', path: '/motor', icon: Box, keywords: 'motor controle' },
  { label: 'Estoque', path: '/estoque', icon: Warehouse },
  { label: 'Saída', path: '/saida', icon: LogOut },
  { label: 'Reservas', path: '/reservas', icon: Calendar },
  { label: 'Histórico', path: '/historico', icon: Archive },
  { label: 'Cadastros', path: '/cadastros', icon: Package },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [conferencias, setConferencias] = useState<Conferencia[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // Ctrl/Cmd + K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toUpperCase().includes('MAC');
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lazy-load datasets on first open
  const loadData = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const [matRes, posRes, confRes] = await Promise.all([
        supabase.from('itens_cadastro').select('id, descricao, codigo').limit(500),
        supabase
          .from('estoque_posicoes')
          .select('id, estrutura, coluna, nivel, posicao, item')
          .not('item', 'is', null)
          .limit(500),
        supabase
          .from('conferences')
          .select('id, nf, conferente, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      setMateriais((matRes.data as Material[]) ?? []);
      setPosicoes((posRes.data as Posicao[]) ?? []);
      setConferencias((confRes.data as Conferencia[]) ?? []);
      setLoaded(true);
    } catch (err) {
      console.error('CommandPalette load error', err);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  useEffect(() => {
    if (open) void loadData();
  }, [open, loadData]);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const fmtPos = (p: Posicao) =>
    `${p.estrutura}.${p.coluna}.N${String(p.nivel).padStart(2, '0')}.P${String(p.posicao).padStart(2, '0')}`;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar materiais, conferências, posições, ou navegar..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados...
          </div>
        )}
        <CommandEmpty>Nenhum resultado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          {ROUTES.map((r) => (
            <CommandItem
              key={r.path}
              value={`${r.label} ${r.keywords ?? ''}`}
              onSelect={() => go(r.path)}
            >
              <r.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{r.label}</span>
              <span className="ml-auto text-xs text-muted-foreground/60">{r.path}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {materiais.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Materiais (${materiais.length})`}>
              {materiais.slice(0, 50).map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.codigo ?? ''} ${m.descricao ?? ''}`}
                  onSelect={() => go(`/cadastros?id=${m.id}`)}
                >
                  <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{m.descricao || '(sem descrição)'}</span>
                    {m.codigo && (
                      <span className="text-[10px] text-muted-foreground/70 font-mono">{m.codigo}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {posicoes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Posições de estoque (${posicoes.length})`}>
              {posicoes.slice(0, 50).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${fmtPos(p)} ${p.item ?? ''}`}
                  onSelect={() => go(`/estoque?pos=${encodeURIComponent(fmtPos(p))}`)}
                >
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{p.item || '(sem item)'}</span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono">{fmtPos(p)}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {conferencias.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Conferências (${conferencias.length})`}>
              {conferencias.slice(0, 50).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.nf ?? ''} ${c.conferente ?? ''}`}
                  onSelect={() => go(`/historico?conf=${c.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">
                      NF {c.nf || '—'} {c.conferente ? `· ${c.conferente}` : ''}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
