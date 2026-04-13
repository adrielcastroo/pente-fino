import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, Archive, Calendar, User, Clock, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

function formatDateBR(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function SaidaPage() {
  const [saidas, setSaidas] = useState<SaidaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    const q = search.toLowerCase();
    return saidas.filter(s => 
      s.item?.toLowerCase().includes(q) ||
      s.proc?.toLowerCase().includes(q) ||
      s.lote?.toLowerCase().includes(q) ||
      s.lote_sistema?.toLowerCase().includes(q) ||
      s.conferente_saida?.toLowerCase().includes(q) ||
      s.conferente_entrada?.toLowerCase().includes(q)
    );
  }, [search, saidas]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2 justify-center sm:justify-start">
            <Archive className="w-8 h-8 text-primary" />
            Arquivos de Saída
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Histórico completo de tecidos que saíram do estoque</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por item, PROC, conferente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-card border-border/50 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredSaidas.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
          <Archive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum registro de saída encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSaidas.map((saida) => (
            <Card key={saida.id} className="overflow-hidden border-none shadow-xl shadow-black/5 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group">
              <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-black truncate max-w-[200px]">{saida.item}</CardTitle>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{saida.proc || 'Sem PROC'}</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-muted text-[10px] font-mono font-bold text-muted-foreground">
                    {saida.estrutura}.{saida.coluna}.N{String(saida.nivel).padStart(2, '0')} P{saida.posicao}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-y border-border/50 py-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Saída
                    </p>
                    <p className="text-xs font-semibold">{formatDateBR(saida.data_saida)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> Conferente
                    </p>
                    <p className="text-xs font-semibold truncate">{saida.conferente_saida || '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> Entrada
                    </p>
                    <p className="text-xs font-semibold">{formatDateBR(saida.data_registro)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> Incluído por
                    </p>
                    <p className="text-xs font-semibold truncate">{saida.conferente_entrada || '—'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs border-b border-border/30 pb-1">
                    <span className="text-muted-foreground">Lote:</span>
                    <span className="font-bold">{saida.lote || '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-border/30 pb-1">
                    <span className="text-muted-foreground">M² / ML:</span>
                    <span className="font-bold">{saida.m2} m² / {saida.m_linear}m</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> Lote Final
                    </span>
                    <span className="text-[11px] font-mono bg-muted/50 p-1.5 rounded-lg break-all border border-border/30">
                      {saida.lote_sistema || '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
