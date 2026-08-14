import { useState, useRef, useEffect } from 'react';
import { ScanLine, Box, CheckCircle2, Loader2, Ban } from 'lucide-react';
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
import { useValidarPeca } from '@/hooks/expedicao/useExpedicaoFlow';
import { bipToast } from '@/lib/toast-flows';

export default function RecebimentoPage() {
  const [peca, setPeca] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    estruturaTemporariaId, 
    setEstruturaTemporaria, 
    bipagemHistorico, 
    addBipagemHistorico 
  } = useExpedicaoStore();
  
  const { validar, loading: validando } = useValidarPeca();
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

  const handleBip = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && peca.trim()) {
      const codigo = peca.trim().toUpperCase();
      
      if (!estruturaTemporariaId) {
        bipToast.erro('Selecione uma estrutura de destino primeiro');
        return;
      }

      if (bipagemHistorico.some(b => b.codigo === codigo && b.tipo === 'peca' && b.status === 'sucesso')) {
        bipToast.duplicado(codigo);
        setPeca('');
        return;
      }

      const pecaValidada = await validar(codigo);
      if (pecaValidada) {
        try {
          await processar.mutateAsync({ 
            etiquetas: [codigo], 
            estruturaId: estruturaTemporariaId 
          });
          addBipagemHistorico({
            codigo,
            tipo: 'peca',
            status: 'sucesso',
            ts: new Date().toISOString()
          });
        } catch (err) {
          addBipagemHistorico({
            codigo,
            tipo: 'peca',
            status: 'erro',
            ts: new Date().toISOString()
          });
        }
      } else {
        addBipagemHistorico({
          codigo,
          tipo: 'peca',
          status: 'erro',
          ts: new Date().toISOString()
        });
      }
      setPeca('');
    }
  };

  return (
    <PageShell>
      <PageHeader 
        title="Recebimento de Peças" 
        subtitle="Entrada atômica de peças no pulmão da expedição."
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
              <label className="text-sm font-medium">Destino (Estrutura Temporária)</label>
              <Select 
                value={estruturaTemporariaId || ''} 
                onValueChange={setEstruturaTemporaria}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o Pulmão" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">QR Code da Etiqueta</label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={peca}
                  onChange={e => setPeca(e.target.value)}
                  onKeyDown={handleBip}
                  disabled={validando || processar.isPending}
                  placeholder="Bipe a etiqueta aqui..."
                  className="h-12 text-lg font-mono uppercase pr-10"
                />
                {(validando || processar.isPending) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Box className="w-5 h-5" />
              Histórico da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bipagemHistorico.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhuma peça processada
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {[...bipagemHistorico].reverse().map((b, idx) => (
                  <div key={`${b.ts}-${idx}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                    <span className="font-mono text-sm">{b.codigo}</span>
                    <Badge variant={b.status === 'sucesso' ? 'outline' : 'destructive'} className="gap-1">
                      {b.status === 'sucesso' ? <CheckCircle2 className="size-3" /> : <Ban className="size-3" />}
                      {b.status === 'sucesso' ? 'Recebida' : 'Erro'}
                    </Badge>
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
