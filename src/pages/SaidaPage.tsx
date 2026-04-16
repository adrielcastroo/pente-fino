import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Archive, Calendar, User, Clock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePerformance } from '@/hooks/use-performance';
import { formatDateBR } from '@/lib/app-utils';

interface SaidaRegistro {
  id: string;
  item: string;
  proc: string;
  m2: number;
  largura: number;
  m_linear: number;
  lote: string;
  endereco: string;
  lote_sistema: string;
  conferente_entrada: string;
  conferente_saida: string;
  data_registro: string;
  data_saida: string;
  estrutura: string;
  coluna: string;
  nivel: number;
  posicao: number;
}

export default function SaidaPage() {
  const [saidas, setSaidas] = useState<SaidaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isLow } = usePerformance();

  const loadSaidas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estoque_saidas')
        .select('*')
        .order('data_saida', { ascending: false });
      
      if (error) throw error;
      setSaidas((data as any[]) || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar histórico de saídas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaidas();
  }, []);

  const filteredSaidas = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return saidas;
    return saidas.filter(s => 
      s.item.toLowerCase().includes(q) ||
      (s.proc || '').toLowerCase().includes(q) ||
      (s.lote || '').toLowerCase().includes(q) ||
      (s.lote_sistema || '').toLowerCase().includes(q) ||
      (s.conferente_saida || '').toLowerCase().includes(q) ||
      (s.conferente_entrada || '').toLowerCase().includes(q)
    );
  }, [saidas, search]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 flex-shrink-0">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">
              Arquivos de <span className="text-primary italic">Saída</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group flex-1 sm:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrar por item, PROC, conferente..."
                className="pl-10 h-11 rounded-xl border-border/40 bg-card/40 focus:bg-background transition-all font-bold"
              />
            </div>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-muted-foreground animate-pulse uppercase tracking-widest text-xs">Carregando saídas...</p>
          </div>
        ) : filteredSaidas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Archive className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Nenhum registro de saída encontrado{search ? ' para sua busca' : ''}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-w-[1400px] mx-auto">
            {filteredSaidas.map((saida) => (
              <div key={saida.id} className="bg-card/60 border border-border/40 rounded-2xl p-4 sm:p-5 hover:border-border/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground text-base sm:text-lg tracking-tight truncate">{saida.item}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-primary/20 bg-primary/5 text-primary rounded-lg px-2 py-0.5">
                        {saida.proc || 'Sem PROC'}
                      </Badge>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                        {saida.estrutura}.{saida.coluna}.N{String(saida.nivel).padStart(2, '0')} P{saida.posicao}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Saída
                    </p>
                    <p className="text-xs font-bold tracking-tight">{formatDateBR(saida.data_saida)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Conferente
                    </p>
                    <p className="text-xs font-bold truncate tracking-tight">{saida.conferente_saida || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Entrada
                    </p>
                    <p className="text-xs font-bold tracking-tight text-muted-foreground/60">{formatDateBR(saida.data_registro)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> Entrada por
                    </p>
                    <p className="text-xs font-bold truncate tracking-tight text-muted-foreground/60">{saida.conferente_entrada || '—'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Lote</span>
                    <span className="text-xs font-bold font-mono">{saida.lote || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">M²</span>
                    <span className="text-xs font-bold">{saida.m2}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">M Lin.</span>
                    <span className="text-xs font-bold">{saida.m_linear}m</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-lg flex-1 min-w-0">
                    <FileText className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/70 truncate">{saida.lote_sistema || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
