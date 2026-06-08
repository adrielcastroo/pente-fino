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
        .from('configuracoes_inventario')
        .select('*');

      if (configError) throw configError;

      const configMap = configs.reduce((acc: any, curr: any) => {
        acc[curr.curva] = curr.dias_frequencia;
        return acc;
      }, {});

      // 2. Fetch data from registros and inventory
      const [registrosRes, inventoryRes] = await Promise.all([
        supabase.from('registros').select('id, item, curva_abc, ultima_contagem, created_at, lote'),
        supabase.from('inventory').select('id, name, curva_abc, ultima_contagem, created_at, sku')
      ]);

      if (registrosRes.error) throw registrosRes.error;
      if (inventoryRes.error) throw inventoryRes.error;

      const allItems: Suggestion[] = [
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
      const suggested = allItems.filter(item => {
        const referenceDate = new Date(item.ultima_contagem || item.created_at);
        const diffTime = Math.abs(today.getTime() - referenceDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const maxDays = configMap[item.curva_abc] || 90;

        (item as any).dias_desde_referencia = diffDays;
        item.dias_atraso = diffDays - maxDays;

        return diffDays > maxDays;
      }).sort((a, b) => b.dias_atraso - a.dias_atraso);

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
        .from('tarefas_contagem')
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

      const { error } = await supabase
        .from('tarefas_contagem')
        .insert({
          item_id: item.id,
          item_name: item.name,
          codigo_lote: item.lote || 'N/A',
          quantidade_esperada_sistema: qty,
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
          <h3 className="text-2xl font-black uppercase tracking-tight">Sugestões de Auditoria</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {suggestions.length} itens precisam de nova contagem
          </p>
        </div>
        <Button onClick={fetchSuggestions} variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[10px]">
          Atualizar Lista
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <div className="p-12 text-center rounded-[2rem] border-2 border-dashed border-border/10 bg-card/5">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h4 className="font-black uppercase text-muted-foreground">Tudo em dia!</h4>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase mt-2">Nenhum item precisa de contagem no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {suggestions.map((item) => (
            <div 
              key={item.id}
              className="p-6 rounded-3xl bg-card/10 backdrop-blur-xl border border-border/10 hover:border-primary/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg ${
                  item.curva_abc === 'A' ? 'bg-rose-500' : 
                  item.curva_abc === 'B' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}>
                  {item.curva_abc}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black uppercase tracking-tight">{item.name}</h4>
                    <Badge variant="outline" className="text-[9px] font-black uppercase py-0 border-border/20">
                      {item.source === 'registros' ? 'Tecido' : 'Geral'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase">
                        Última: {formatDateBR(item.ultima_contagem || item.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase">
                        Atraso: {item.dias_atraso} dias
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleCreateTask(item)}
                disabled={creatingTask === item.id}
                className="rounded-2xl h-14 px-6 bg-primary/10 text-primary hover:bg-primary hover:text-white font-black uppercase tracking-widest text-[10px] gap-2 border-none shadow-none"
              >
                {creatingTask === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Tarefa
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
