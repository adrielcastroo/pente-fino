
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CyclicNotification() {
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingTasks = async () => {
      const { count, error } = await supabase
        .from('inventory_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingTasks();

    // Optional: set up real-time subscription
    const channel = supabase
      .channel('inventory_tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_tasks' }, () => {
        fetchPendingTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (pendingCount === 0) return null;

  return (
    <Card className="mb-6 border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-warning dark:text-warning">Inventário Cíclico</h3>
            <p className="text-sm font-bold text-foreground/70">
              Você possui <span className="text-warning dark:text-warning font-semibold">{pendingCount}</span> contagens cíclicas pendentes para hoje.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/inventario-ciclico')}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold uppercase tracking-widest text-xs py-6 px-8 rounded-md shadow-lg shadow-amber-600/20 transition-all hover:scale-105 active:scale-95 gap-3"
        >
          Iniciar Conferência
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
