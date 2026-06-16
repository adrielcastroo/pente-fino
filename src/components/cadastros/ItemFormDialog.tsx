import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { extractCodigoFornecedor } from '@/lib/codigoFornecedor';
import { useUpsertItemCadastro } from '@/hooks/useItensCadastro';
import { ItemCadastro } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<ItemCadastro> | null;
}

export default function ItemFormDialog({ open, onOpenChange, initial }: Props) {
  const [codigoInterno, setCodigoInterno] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoFornecedor, setCodigoFornecedor] = useState('');
  const [touchedFornecedor, setTouchedFornecedor] = useState(false);

  const upsert = useUpsertItemCadastro();

  useEffect(() => {
    if (open) {
      setCodigoInterno(initial?.codigo_interno || '');
      setDescricao(initial?.descricao || '');
      setCodigoFornecedor(initial?.codigo_fornecedor || '');
      setTouchedFornecedor(!!initial?.codigo_fornecedor);
    }
  }, [open, initial]);

  // Auto-extrair quando descrição muda e o usuário não digitou manualmente
  useEffect(() => {
    if (!touchedFornecedor && descricao) {
      const r = extractCodigoFornecedor(descricao);
      if (r) setCodigoFornecedor(r.codigo);
    }
  }, [descricao, touchedFornecedor]);

  const handleAutoExtract = () => {
    const r = extractCodigoFornecedor(descricao);
    if (r) {
      setCodigoFornecedor(r.codigo);
      setTouchedFornecedor(true);
      toast.success(`Código identificado: ${r.codigo}`);
    } else {
      toast.warning('Nenhum código identificado na descrição');
    }
  };

  const handleSave = async () => {
    if (!codigoInterno.trim() || !descricao.trim() || !codigoFornecedor.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await upsert.mutateAsync({
        codigo_interno: codigoInterno,
        descricao,
        codigo_fornecedor: codigoFornecedor,
      });
      toast.success('Item salvo');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Editar item' : 'Novo item'}</DialogTitle>
          <DialogDescription>
            Cadastre o código interno, descrição e o código do fornecedor que será validado na geração da etiqueta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="codigo_interno">Código interno</Label>
            <Input
              id="codigo_interno"
              value={codigoInterno}
              onChange={(e) => setCodigoInterno(e.target.value)}
              placeholder="002.001.002.000.323"
              className="h-11 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição completa</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Tecido Voil YM4202 cor crua..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="codigo_fornecedor">Código do fornecedor</Label>
              <Button type="button" size="sm" variant="ghost" onClick={handleAutoExtract} className="h-7 text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-detectar
              </Button>
            </div>
            <Input
              id="codigo_fornecedor"
              value={codigoFornecedor}
              onChange={(e) => { setCodigoFornecedor(e.target.value); setTouchedFornecedor(true); }}
              placeholder="YM4202"
              className="h-11 font-mono"
            />
            {codigoFornecedor && (
              <Badge variant="secondary" className="mt-2 font-mono text-[10px]">
                Comparação: {codigoFornecedor.toUpperCase().replace(/[^A-Z0-9]/g, '')}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
