import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function RomaneioGenerator() {
  const [date, setDate] = useState('');
  const [origin, setOrigin] = useState('import_manual');
  const [loading, setLoading] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [lines, setLines] = useState<any[]>([]);

  async function gerar() {
    if (!date) return alert('Informe a data do romaneio');
    setLoading(true);
    try {
      // Call the Postgres function via supabase RPC
      const parsed = new Date(date);
      // format to YYYY-MM-DD
      const iso = parsed.toISOString().slice(0,10);
      const { data, error } = await supabase.rpc('generate_romaneio_for_date', { p_date: iso, p_origem: origin });
      if (error) throw error;
      const romaneio_id = (data && data[0] && data[0].romaneio_id) ? data[0].romaneio_id : (data && data.romaneio_id) || null;
      setResultId(romaneio_id);
      if (romaneio_id) await fetchLines(romaneio_id);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar romaneio: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  async function fetchLines(id: string) {
    const { data, error } = await supabase.from('romaneio_linhas').select('*').eq('romaneio_id', id).order('created_at', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setLines(data || []);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Romaneio por Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>Data do Romaneio</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Origem (tag)</Label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={gerar} disabled={loading}>
                {loading ? 'Gerando...' : 'Gerar romaneio'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {resultId && (
        <Card>
          <CardHeader>
            <CardTitle>Romaneio gerado: {resultId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2">Pedido</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-left p-2">Transportadora Sugerida</th>
                    <th className="text-right p-2">Valor</th>
                    <th className="p-2">Exceção</th>
                    <th className="p-2">Confirmação</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-2 font-mono">{l.nr_pedido || l.cd_pedido}</td>
                      <td className="p-2">{l.cliente}</td>
                      <td className="p-2">{l.transportadora_sugerida}</td>
                      <td className="p-2 text-right">{l.valor ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(l.valor) : '-'}</td>
                      <td className="p-2">{l.flag_excecao ? '⚠️' : ''}</td>
                      <td className="p-2">{l.requires_confirmation ? '🔔' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
