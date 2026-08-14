import { useState, useRef, useEffect } from 'react';
import { ScanLine, Box, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { useExpedicaoStore } from '@/store/useExpedicaoStore';
import { useProcessarRecebimento } from '@/hooks/expedicao/useRecebimento';
import { bipToast } from '@/lib/toast-flows';

export default function RecebimentoPage() {
  const [etiqueta, setEtiqueta] = useState('');
  const [estruturaId, setEstruturaId] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { bipagemTemporaria, addBipagem, clearBipagem } = useExpedicaoStore();
  const processar = useProcessarRecebimento();

  const { data: estruturas = [] } = useQuery({
    queryKey: ['expedicao_estruturas_temporarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_estruturas_temporarias' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleBip = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && etiqueta.trim()) {
      const code = etiqueta.trim().toUpperCase();
      if (bipagemTemporaria.includes(code)) {
        bipToast.duplicado(code);
      } else {
        addBipagem(code);
      }
      setEtiqueta('');
    }
  };

  const handleFinalizar = async () => {
    if (!estruturaId) {
      bipToast.erro('Selecione uma estrutura de destino (pulmão)');
      return;
    }
    await processar.mutateAsync({
      etiquetas: bipagemTemporaria,
      estruturaId
    });
    clearBipagem();
  };

  return (
    <PageShell>
      <PageHeader 
        title="Recebimento de Peças" 
        subtitle="Entrada de peças no pulmão da expedição para conferência futura."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Bipar Peças
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">QR Code da Etiqueta</label>
              <Input
                ref={inputRef}
                value={etiqueta}
                onChange={e => setEtiqueta(e.target.value)}
                onKeyDown={handleBip}
                placeholder="Bipe a etiqueta aqui..."
                className="h-12 text-lg font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destino (Estrutura Temporária)</label>
              <Select value={estruturaId} onValueChange={setEstruturaId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione onde as peças serão colocadas" />
                </SelectTrigger>
                <SelectContent>
                  {estruturas.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo} - {e.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full h-12 gap-2 text-base" 
              disabled={bipagemTemporaria.length === 0 || !estruturaId || processar.isPending}
              onClick={handleFinalizar}
            >
              {processar.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Finalizar Recebimento ({bipagemTemporaria.length})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Box className="w-5 h-5" />
              Peças na Fila
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearBipagem} className="text-muted-foreground">
              Limpar Lista
            </Button>
          </CardHeader>
          <CardContent>
            {bipagemTemporaria.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhuma peça bipada
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {bipagemTemporaria.map(code => (
                  <div key={code} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                    <span className="font-mono text-sm">{code}</span>
                    <Badge variant="secondary">RECEBENDO</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
