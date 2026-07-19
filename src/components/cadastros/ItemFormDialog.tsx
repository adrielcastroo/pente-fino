import { useState, useEffect, KeyboardEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { extractCodigoFornecedor, normalizarCodigo } from '@/lib/codigoFornecedor';
import { useUpsertItemCadastro } from '@/hooks/useItensCadastro';
import { ItemCadastro } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { Sparkles, Plus, X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<ItemCadastro> | null;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const na = a.map(normalizarCodigo).sort();
  const nb = b.map(normalizarCodigo).sort();
  return na.every((v, i) => v === nb[i]);
}

export default function ItemFormDialog({ open, onOpenChange, initial }: Props) {
  const [codigoInterno, setCodigoInterno] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigos, setCodigos] = useState<string[]>([]);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [autoApplied, setAutoApplied] = useState(false);
  const [unidade, setUnidade] = useState('');
  const [pacoteFornecedor, setPacoteFornecedor] = useState('');
  const [pacoteEstocagem, setPacoteEstocagem] = useState('');

  const upsert = useUpsertItemCadastro();

  useEffect(() => {
    if (open) {
      setCodigoInterno(initial?.codigo_interno || '');
      setDescricao(initial?.descricao || '');
      const init = initial?.codigos_fornecedor && initial.codigos_fornecedor.length
        ? initial.codigos_fornecedor
        : (initial?.codigo_fornecedor ? [initial.codigo_fornecedor] : []);
      setCodigos(init);
      setNovoCodigo('');
      setAutoApplied(!!init.length);
      setUnidade((initial?.unidade || '').toString());
      setPacoteFornecedor(initial?.pacote_fornecedor != null ? String(initial.pacote_fornecedor) : '');
      setPacoteEstocagem(initial?.pacote_estocagem != null ? String(initial.pacote_estocagem) : '');
    }
  }, [open, initial]);

  // Auto-sugerir o 1º código a partir da descrição quando ainda não há nenhum
  useEffect(() => {
    if (!autoApplied && !codigos.length && descricao) {
      const r = extractCodigoFornecedor(descricao);
      if (r) {
        setCodigos([r.codigo]);
        setAutoApplied(true);
      }
    }
  }, [descricao, codigos.length, autoApplied]);

  const addCodigo = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const norm = normalizarCodigo(v);
    if (!norm) return;
    if (codigos.some((c) => normalizarCodigo(c) === norm)) {
      toast.info('Esse código já está na lista');
      return;
    }
    setCodigos((cs) => [...cs, v]);
    setNovoCodigo('');
    setAutoApplied(true);
  };

  const removeCodigo = (idx: number) => {
    setCodigos((cs) => cs.filter((_, i) => i !== idx));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addCodigo(novoCodigo);
    }
  };

  const handleAutoExtract = () => {
    const r = extractCodigoFornecedor(descricao);
    if (r) {
      addCodigo(r.codigo);
      toast.success(`Código identificado: ${r.codigo}`);
    } else {
      toast.warning('Nenhum código identificado na descrição');
    }
  };

  const handleSave = async () => {
    if (!codigoInterno.trim() || !descricao.trim()) {
      toast.error('Preencha código interno e descrição');
      return;
    }
    // se houver texto pendente no input, anexa antes de salvar
    const finalCodigos = [...codigos];
    if (novoCodigo.trim()) {
      const norm = normalizarCodigo(novoCodigo);
      if (norm && !finalCodigos.some((c) => normalizarCodigo(c) === norm)) {
        finalCodigos.push(novoCodigo.trim());
      }
    }
    try {
      const isEdit = !!initial?.id;
      let changedField: string | null = null;
      if (isEdit) {
        if ((initial?.codigo_interno || '').trim() !== codigoInterno.trim()) changedField = 'codigo_interno';
        else if ((initial?.descricao || '').trim() !== descricao.trim()) changedField = 'descricao';
        else {
          const prev = (initial?.codigos_fornecedor && initial.codigos_fornecedor.length)
            ? initial.codigos_fornecedor
            : (initial?.codigo_fornecedor ? [initial.codigo_fornecedor] : []);
          if (!arraysEqual(prev, finalCodigos)) changedField = 'codigos_fornecedor';
        }
      }
      await upsert.mutateAsync({
        input: {
          codigo_interno: codigoInterno,
          descricao,
          codigos_fornecedor: finalCodigos,
          unidade: unidade.trim() || null,
          pacote_fornecedor: pacoteFornecedor.trim()
            ? Number(pacoteFornecedor.replace(',', '.'))
            : null,
          pacote_estocagem: pacoteEstocagem.trim()
            ? Number(pacoteEstocagem.replace(',', '.'))
            : null,
        },
        opts: { isEdit, changedField },
      });
      toast.success('Item salvo');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Editar item' : 'Novo item'}</DialogTitle>
          <DialogDescription>
            Cadastre código interno, descrição e os códigos de fornecedor (pode ter mais de um — o sistema reconhece qualquer um deles).
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
              <Label>
                Códigos de fornecedor <span className="text-muted-foreground font-normal">(opcional · pode ter vários)</span>
              </Label>
              <Button type="button" size="sm" variant="ghost" onClick={handleAutoExtract} className="h-7 text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-detectar
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-2 min-h-[44px] border rounded-md bg-background">
              {codigos.length === 0 && !novoCodigo && (
                <span className="text-xs text-muted-foreground italic px-1">Nenhum código — adicione abaixo ou deixe vazio</span>
              )}
              {codigos.map((c, i) => (
                <Badge key={`${c}-${i}`} variant="secondary" className="font-mono text-[11px] gap-1 pr-1">
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCodigo(i)}
                    className="hover:bg-destructive/20 rounded-sm p-0.5"
                    aria-label={`Remover ${c}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Input
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ex: YM4202  (Enter ou vírgula para adicionar)"
                className="h-10 font-mono"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addCodigo(novoCodigo)} className="gap-1 h-10">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value.toUpperCase())}
                placeholder="PC / MT / KG"
                maxLength={8}
                className="h-10 font-mono uppercase"
              />
            </div>
            <div>
              <Label htmlFor="pacote_fornecedor">Pacote fornecedor</Label>
              <Input
                id="pacote_fornecedor"
                value={pacoteFornecedor}
                onChange={(e) => setPacoteFornecedor(e.target.value)}
                placeholder="Ex: 30"
                inputMode="decimal"
                className="h-10 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="pacote_estocagem">Pacote estocagem</Label>
              <Input
                id="pacote_estocagem"
                value={pacoteEstocagem}
                onChange={(e) => setPacoteEstocagem(e.target.value)}
                placeholder="Ex: 10"
                inputMode="decimal"
                className="h-10 font-mono"
              />
            </div>
          </div>
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
