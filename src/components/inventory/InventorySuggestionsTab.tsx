
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Calendar, AlertTriangle, Package, RefreshCw } from '@/components/icons';
import { toast } from 'sonner';
import { formatDateBR } from '@/lib/app-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Suggestion {
  id: string;
  name: string;
  source: 'registros' | 'inventory';
  curva_abc: string;
  ultima_contagem: string | null;
  created_at: string;
  dias_atraso: number;
  lote?: string;
}

export function InventorySuggestionsTab() {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch configs
      const { data: configs, error: configError } = await supabase
        .from('inventory_configs')
        .select('*');

      if (configError) throw configError;

      const configMap = configs.reduce((acc: any, curr: any) => {
        acc[curr.curva || 'C'] = curr.curve_a_days || 15; // fallback or logic
        return acc;
      }, {});

      const curveDays = configs[0] || { curve_a_days: 15, curve_b_days: 30, curve_c_days: 60 };
      const getDaysForCurve = (curve: string) => {
          if (curve === 'A') return curveDays.curve_a_days;
          if (curve === 'B') return curveDays.curve_b_days;
          return curveDays.curve_c_days;
      };

      // 2. Fetch data from registros and inventory
      const [registrosRes, inventoryRes] = await Promise.all([
        supabase.from('registros').select('id, item, curva_abc, ultima_contagem, created_at, lote'),
        supabase.from('inventory').select('id, name, curva_abc, ultima_contagem, created_at, sku')
      ]);

      if (registrosRes.error) throw registrosRes.error;
      if (inventoryRes.error) throw inventoryRes.error;

      const allItems = [
        ...(registrosRes.data || []).map(r => ({
          id: r.id,
          name: r.item,
          source: 'registros' as const,
          curva_abc: r.curva_abc || 'C',
          ultima_contagem: r.ultima_contagem,
          created_at: r.created_at,
          lote: r.lote
        })),
        ...(inventoryRes.data || []).map(i => ({
          id: i.id,
          name: i.name,
          source: 'inventory' as const,
          curva_abc: i.curva_abc || 'C',
          ultima_contagem: i.ultima_contagem,
          created_at: i.created_at,
          lote: i.sku
        }))
      ];

      const today = new Date();
      const suggested: Suggestion[] = allItems
        .map(item => {
          const referenceDate = new Date(item.ultima_contagem || item.created_at);
          const diffTime = Math.abs(today.getTime() - referenceDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const maxDays = getDaysForCurve(item.curva_abc);

          return {
            ...item,
            dias_atraso: diffDays - maxDays
          } as Suggestion;
        })
        .filter(item => item.dias_atraso > 0)
        .sort((a, b) => b.dias_atraso - a.dias_atraso);

      setSuggestions(suggested);
    } catch (error: any) {
      console.error('Erro ao buscar sugestões:', error);
      toast.error('Erro ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (item: Suggestion) => {
    try {
      setCreatingTask(item.id);
      
      const { data: existing } = await supabase
        .from('inventory_tasks')
        .select('id')
        .eq('item_id', item.id)
        .eq('status', 'pendente')
        .maybeSingle();

      if (existing) {
        toast.error('Já existe uma tarefa pendente para este item.');
        return;
      }

      let qty = 0;
      if (item.source === 'registros') {
        const { data } = await supabase.from('registros').select('quantidade, m2, m_linear').eq('id', item.id).single();
        qty = data?.quantidade || data?.m2 || data?.m_linear || 0;
      } else {
        const { data } = await supabase.from('inventory').select('quantity').eq('id', item.id).single();
        qty = data?.quantity || 0;
      }

      const { error } = await (supabase
        .from('inventory_tasks') as any)
        .insert({
          item_id: item.id,
          item_type: item.source,
          item_name: item.name,
          codigo_lote: item.lote || 'N/A',
          expected_qty: qty,
          has_lote: item.source === 'registros',
          status: 'pendente'
        });

      if (error) throw error;
      toast.success('Tarefa de contagem criada!');
      setSuggestions(prev => prev.filter(s => s.id !== item.id));
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setCreatingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Analisando histórico de estoque...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-3xl font-semibold">Auditoria Sugerida</h3>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
             <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em]">
               {suggestions.length} itens aguardando conferência
             </p>
          </div>
        </div>
        <Button 
          onClick={fetchSuggestions} 
          variant="outline" 
          size="sm" 
          className="rounded-md font-semibold uppercase tracking-[0.2em] text-[10px] h-12 px-6 gap-2.5 transition-all hover:bg-primary hover:text-white border-white/10 shadow-xl"
        >
          <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          Sincronizar Sugestões
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-20 text-center rounded-[3rem] border-2 border-dashed border-white/10 bg-card/40 backdrop-blur-xl shadow-inner"
        >
          <Package className="w-20 h-20 text-muted-foreground/10 mx-auto mb-6" />
          <h4 className="text-xl font-semibold text-muted-foreground opacity-50">Tudo em dia!</h4>
          <p className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-[0.3em] mt-3">Nenhum item com atraso de auditoria detectado.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence>
            {suggestions.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -50 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 hover:border-primary/50 transition-all flex flex-col md:flex-row items-center justify-between gap-8 group shadow-2xl shadow-black/5 ring-1 ring-white/5"
              >
                <div className="flex items-center gap-8">
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-semibold text-3xl text-white shadow-2xl transition-all duration-500 ring-8 ring-white/5 ${
                    item.curva_abc === 'A' ? 'bg-rose-500 shadow-rose-500/30' : 
                    item.curva_abc === 'B' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'
                  }`}>
                    {item.curva_abc}
                  </motion.div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                      <Badge variant="outline" className="text-[9px] font-semibold uppercase py-1 px-3 border-white/10 bg-white/5 rounded-lg shadow-sm">
                        {item.source === 'registros' ? 'Estoque Oficial' : 'Cadastro Geral'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                          Auditoria: {formatDateBR(item.ultima_contagem || item.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-rose-500 bg-rose-500/10 px-4 py-1.5 rounded-md border border-rose-500/20 shadow-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                          {item.dias_atraso} Dias de Atraso
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleCreateTask(item)}
                  disabled={creatingTask === item.id}
                  className="rounded-md h-20 px-10 bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold uppercase tracking-[0.3em] text-[10px] gap-3 border border-primary/20 shadow-lg shadow-primary/5 transition-all duration-500 hover:scale-105 active:scale-95 group-hover:bg-primary group-hover:text-white"
                >
                  {creatingTask === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                  Lançar Tarefa
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
