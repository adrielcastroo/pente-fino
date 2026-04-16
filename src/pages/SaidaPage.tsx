import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Archive, Calendar, User, Clock, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="p-3 sm:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-4 sm:space-y-8 lg:space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="text-left space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-[0.9]">
            Arquivos de <br className="hidden sm:block" />
            <span className="text-primary relative">
              Saída
              <div className="absolute -bottom-2 left-0 w-full h-1 sm:h-2 bg-primary/20 rounded-full blur-sm" />
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground font-medium max-w-lg tracking-tight">Histórico de tecidos expedidos do estoque físico.</p>
        </div>

        <div className="relative w-full lg:max-w-md group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10">
            <Search className="w-5 h-5" />
          </div>
          <Input
            placeholder="Filtrar por item, PROC, conferente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 sm:h-16 rounded-2xl sm:rounded-3xl bg-card/40 border-border/40 focus:ring-8 focus:ring-primary/5 focus:border-primary/40 text-base font-bold shadow-xl transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 sm:h-64 bg-muted/20 animate-pulse rounded-2xl sm:rounded-3xl" />
          ))}
        </div>
      ) : filteredSaidas.length === 0 ? (
        <div className="text-center py-16 sm:py-24 bg-muted/5 rounded-2xl sm:rounded-3xl border-2 border-dashed border-border/40">
          <div className="h-16 w-16 sm:h-24 sm:w-24 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 opacity-20">
             <Archive className="w-8 h-8 sm:w-12 sm:h-12" />
          </div>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-xs sm:text-sm">Nenhum registro de saída encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredSaidas.map((saida) => (
            <Card key={saida.id} className="overflow-hidden border-none shadow-xl sm:shadow-2xl bg-card/40 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 group rounded-2xl sm:rounded-3xl relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-300" />
              
              <CardHeader className="p-4 sm:p-6 pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-xl font-black truncate tracking-tighter text-foreground">{saida.item}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary rounded-lg">{saida.proc || 'Sem PROC'}</Badge>
                    </div>
                  </div>
                  <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-muted/50 text-[8px] sm:text-[10px] font-mono font-black text-muted-foreground border border-border/40 whitespace-nowrap shadow-inner shrink-0">
                    {saida.estrutura}.{saida.coluna}.N{String(saida.nivel).padStart(2, '0')} P{saida.posicao}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-1 space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-y-3 sm:gap-y-5 gap-x-4 sm:gap-x-6 border-y border-border/10 py-3 sm:py-5">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 opacity-50">
                      <Clock className="w-3 h-3" /> Data Saída
                    </p>
                    <p className="text-xs font-bold tracking-tight">{formatDateBR(saida.data_saida)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 opacity-50">
                      <User className="w-3 h-3" /> Conferente
                    </p>
                    <p className="text-xs font-bold truncate tracking-tight">{saida.conferente_saida || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 opacity-50">
                      <Calendar className="w-3 h-3" /> Entrada
                    </p>
                    <p className="text-xs font-bold tracking-tight opacity-60">{formatDateBR(saida.data_registro)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 opacity-50">
                      <User className="w-3 h-3" /> Entrada por
                    </p>
                    <p className="text-xs font-bold truncate tracking-tight opacity-60">{saida.conferente_entrada || '—'}</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center bg-muted/20 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border/10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Lote</span>
                    <span className="text-xs font-black font-mono text-primary/80">{saida.lote || '—'}</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-1 bg-muted/20 p-3 rounded-2xl border border-border/10 text-center">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">M²</p>
                       <p className="text-xs font-black">{saida.m2}</p>
                    </div>
                    <div className="flex-1 bg-muted/20 p-3 rounded-2xl border border-border/10 text-center">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">M Linear</p>
                       <p className="text-xs font-black">{saida.m_linear}m</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 opacity-50 ml-1">
                      <FileText className="w-3 h-3" /> Lote Final Gerado
                    </p>
                    <div className="text-[10px] font-mono font-bold bg-card dark:bg-muted/30 text-foreground/80 p-4 rounded-2xl break-all border border-border/20 shadow-inner group-hover:border-primary/30 transition-colors duration-300">
                      {saida.lote_sistema || '—'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}