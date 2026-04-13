import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, Archive, Calendar, User, Clock, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';


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

import { formatDateBR } from '@/lib/app-utils';


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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="p-3 sm:p-10 lg:p-16 max-w-[1600px] mx-auto space-y-6 sm:space-y-16"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="text-left space-y-3">
          <div className="flex items-center gap-2.5 text-primary font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs">
            <Archive className="w-4 h-4 text-primary" />
            <span>Repositório Logístico</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
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
            className="pl-12 h-14 sm:h-16 rounded-2xl sm:rounded-3xl bg-card/40 backdrop-blur-md border-border/40 focus:ring-8 focus:ring-primary/5 focus:border-primary/40 text-base font-bold shadow-xl transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : filteredSaidas.length === 0 ? (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-32 bg-muted/5 rounded-[3rem] border-2 border-dashed border-border/40">
          <div className="h-24 w-24 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 opacity-20">
             <Archive className="w-12 h-12" />
          </div>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Nenhum registro de saída encontrado</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
          {filteredSaidas.map((saida) => (
            <Card key={saida.id} className="overflow-hidden border-none shadow-2xl bg-card/40 backdrop-blur-md hover:scale-[1.03] transition-all duration-500 group rounded-[2.5rem] relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-700" />
              
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-black truncate tracking-tighter text-foreground">{saida.item}</CardTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary rounded-lg">{saida.proc || 'Sem PROC'}</Badge>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-muted/50 text-[10px] font-mono font-black text-muted-foreground border border-border/40 whitespace-nowrap shadow-inner shrink-0">
                    {saida.estrutura}.{saida.coluna}.N{String(saida.nivel).padStart(2, '0')} P{saida.posicao}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-2 space-y-6">
                <div className="grid grid-cols-2 gap-y-5 gap-x-6 border-y border-border/10 py-6">
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

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-muted/20 p-3 rounded-2xl border border-border/10">
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
                    <div className="text-[10px] font-mono font-bold bg-[#0A0D14] text-primary-foreground/80 p-4 rounded-2xl break-all border border-white/5 shadow-2xl shadow-inner group-hover:border-primary/30 transition-colors duration-700">
                      {saida.lote_sistema || '—'}
                    </div>
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
