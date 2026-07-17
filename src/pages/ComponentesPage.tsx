import { useEffect, useRef, useState, useMemo } from 'react';
import { Package, ScanLine, Trash2, Check, RotateCcw, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type Item = {
  id: string;
  codigo: string;
  quantidade: number;
  ts: number;
};

export default function ComponentesPage() {
  useDocumentTitle('Conferência — Componentes');

  const [codigo, setCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [itens, setItens] = useState<Item[]>([]);

  const codigoRef = useRef<HTMLInputElement>(null);
  const qtdRef = useRef<HTMLInputElement>(null);

  useEffect(() => { codigoRef.current?.focus(); }, []);

  const totais = useMemo(() => {
    const totalPacotes = itens.reduce((acc, i) => acc + i.quantidade, 0);
    return { linhas: itens.length, totalPacotes };
  }, [itens]);

  const adicionar = () => {
    const cod = codigo.trim().toUpperCase();
    const qtd = Number(quantidade);
    if (!cod) {
      toast.warning('Bipe ou informe o código.');
      codigoRef.current?.focus();
      return;
    }
    if (!Number.isFinite(qtd) || qtd <= 0) {
      toast.warning('Quantidade (pacote) deve ser maior que zero.');
      qtdRef.current?.focus();
      return;
    }

    setItens((prev) => {
      const existente = prev.find((i) => i.codigo === cod);
      if (existente) {
        return prev.map((i) =>
          i.codigo === cod ? { ...i, quantidade: i.quantidade + qtd, ts: Date.now() } : i,
        );
      }
      return [
        { id: crypto.randomUUID(), codigo: cod, quantidade: qtd, ts: Date.now() },
        ...prev,
      ];
    });

    toast.success(`${cod} · ${qtd} pacote(s)`);
    setCodigo('');
    setQuantidade('1');
    setTimeout(() => codigoRef.current?.focus(), 0);
  };

  const remover = (id: string) => setItens((prev) => prev.filter((i) => i.id !== id));

  const ajustar = (id: string, delta: number) => {
    setItens((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0),
    );
  };

  const limpar = () => {
    if (itens.length === 0) return;
    if (!confirm('Limpar todos os itens da conferência?')) return;
    setItens([]);
    codigoRef.current?.focus();
  };

  const finalizar = () => {
    if (itens.length === 0) {
      toast.warning('Nenhum item para finalizar.');
      return;
    }
    toast.success(`Conferência finalizada: ${totais.linhas} item(s) · ${totais.totalPacotes} pacote(s).`);
    setItens([]);
    codigoRef.current?.focus();
  };

  const handleCodigoKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Se leitor já traz qtd fixa, pula direto ao adicionar; senão foca quantidade
      if (quantidade && Number(quantidade) > 0) adicionar();
      else qtdRef.current?.focus();
    }
  };

  const handleQtdKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionar();
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Conferência de Componentes"
        subtitle="Bipe o código do componente e informe a quantidade (pacote)."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4" /> Bipar componente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código / Conferência</Label>
              <Input
                id="codigo"
                ref={codigoRef}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={handleCodigoKey}
                placeholder="Bipe ou digite o código"
                autoComplete="off"
                className="h-12 font-mono uppercase text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantidade">Quantidade (Pacote)</Label>
              <Input
                id="quantidade"
                ref={qtdRef}
                type="number"
                inputMode="numeric"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onKeyDown={handleQtdKey}
                className="h-12 text-base text-center font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={adicionar} className="h-12 w-full sm:w-auto gap-2">
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" /> Itens conferidos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{totais.linhas} linha(s)</Badge>
            <Badge className="font-mono">{totais.totalPacotes} pacote(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item bipado ainda. Comece bipando um código acima.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {itens.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="font-mono text-sm truncate">{i.codigo}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => ajustar(i.id, -1)}
                      aria-label="Diminuir"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="min-w-10 text-center font-mono font-semibold">
                      {i.quantidade}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => ajustar(i.id, +1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => remover(i.id)}
                      aria-label="Remover"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={limpar} disabled={itens.length === 0} className="gap-2">
              <RotateCcw className="size-4" /> Limpar
            </Button>
            <Button onClick={finalizar} disabled={itens.length === 0} className="gap-2">
              <Check className="size-4" /> Finalizar conferência
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
