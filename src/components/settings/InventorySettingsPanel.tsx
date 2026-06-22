import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, History } from 'lucide-react';

export default function InventorySettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<{ id: string; curva: string; dias_frequencia: number }[]>([]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes_inventario')
        .select('*')
        .order('curva', { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações de inventário');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDays = (id: string, days: string) => {
    const value = parseInt(days) || 0;
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, dias_frequencia: value } : c));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const config of configs) {
        const { error } = await supabase
          .from('configuracoes_inventario')
          .update({ dias_frequencia: config.dias_frequencia })
          .eq('id', config.id);
        
        if (error) throw error;
      }
      toast.success('Configurações de inventário salvas!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {configs.map((config) => (
          <Card key={config.id} className="settings-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                  config.curva === 'A' ? 'bg-rose-500' : 
                  config.curva === 'B' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}>
                  {config.curva}
                </div>
                Curva {config.curva}
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-tight opacity-70">
                Frequência de Contagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`days-${config.id}`} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Intervalo (Dias)
                </Label>
                <div className="relative">
                  <Input
                    id={`days-${config.id}`}
                    type="number"
                    value={config.dias_frequencia}
                    onChange={(e) => handleUpdateDays(config.id, e.target.value)}
                    className="h-12 font-semibold text-xl rounded-xl border-border/20 focus:ring-primary/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-bold text-xs">
                    DIAS
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <History className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold uppercase tracking-tight">Como funciona o cálculo?</h4>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
            O sistema sugere itens para contagem quando o tempo decorrido desde a última contagem (ou desde a entrada no estoque) for maior que o intervalo definido para a curva do item.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 font-semibold uppercase tracking-widest text-xs px-8 h-12 rounded-2xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
