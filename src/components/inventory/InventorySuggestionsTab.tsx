import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Calendar, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateBR } from '@/lib/app-utils';

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
        // Actually the table has curve_a_days, curve_b_days, curve_c_days
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
      
      // Check if task already exists for this lot/item
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

      // We need to know expected qty to create task
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
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Analisando histórico de estoque...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-black uppercase tracking-tight">Auditoria Sugerida</h3>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            {suggestions.length} itens precisam de nova contagem
          </p>
        </div>
        <Button 
          onClick={fetchSuggestions} 
          variant="outline" 
          size="sm" 
          className="rounded-xl font-black uppercase tracking-widest text-[9px] h-10 px-4 gap-2 transition-all hover:bg-muted"
        >
          <RefreshCw className={loading ? "w-3 h-3 animate-spin" : "w-3 h-3"} />
          Atualizar Lista
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-16 text-center rounded-[2.5rem] border-2 border-dashed border-border/10 bg-card/5 backdrop-blur-sm"
        >
          <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h4 className="text-lg font-black uppercase tracking-tight text-muted-foreground">Tudo em dia!</h4>
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-2">Nenhum item em atraso de auditoria.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {suggestions.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-[2rem] bg-card/40 backdrop-blur-xl border border-white/5 hover:border-primary/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group shadow-lg shadow-black/5"
              >
                <div className="flex items-center gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl ${
                    item.curva_abc === 'A' ? 'bg-rose-500 shadow-rose-500/20' : 
                    item.curva_abc === 'B' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
                  }`}>
                    {item.curva_abc}
                  </motion.div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-black uppercase tracking-tight text-foreground">{item.name}</h4>
                      <Badge variant="outline" className="text-[8px] font-black uppercase py-0.5 px-2 border-white/10 bg-white/5">
                        {item.source === 'registros' ? 'TECIDO' : 'GERAL'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          ÚLTIMA: {formatDateBR(item.ultima_contagem || item.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/10">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {item.dias_atraso} DIAS DE ATRASO
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleCreateTask(item)}
                  disabled={creatingTask === item.id}
                  className="rounded-2xl h-16 px-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] gap-3 border-none shadow-none transition-all duration-300"
                >
                  {creatingTask === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                  CRIAR TAREFA
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

}
