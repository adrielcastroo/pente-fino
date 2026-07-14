/**
 * ElementEditDialog — popup para atribuir variável, mudar fonte e ligar "negativo"
 * a um elemento do ZPL (bloco ^FO ... ^FS). Duplo-clique no preview interativo abre.
 */
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ParsedBlock } from './InteractiveZPLEditor';

export interface ElementEditValues {
  fd: string;
  size: number;
  reverse: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  block: ParsedBlock | null;
  variaveis: { chave: string; label: string }[];
  onSubmit: (v: ElementEditValues) => void;
}

export function ElementEditDialog({ open, onOpenChange, block, variaveis, onSubmit }: Props) {
  const [fd, setFd] = useState('');
  const [size, setSize] = useState(24);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (!block) return;
    setFd(block.fd);
    setSize(block.size || 24);
    setReverse(block.reverse);
  }, [block]);

  if (!block) return null;

  const insertVar = (chave: string) => {
    setFd((cur) => `${cur}{{${chave}}}`);
  };

  const isText = block.tipo === 'text';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar elemento
            <Badge variant="outline" className="font-mono text-[10px]">
              {block.tipo.toUpperCase()} · {block.x},{block.y}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ajuste o conteúdo, atribua variáveis ou mude o estilo. As mudanças refletem no ZPL e no preview em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fd" className="text-xs">Conteúdo (texto ou variáveis)</Label>
            <Input
              id="fd" value={fd} onChange={(e) => setFd(e.target.value)}
              placeholder="Texto ou {{variavel}}"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Inserir variável</Label>
            <Select onValueChange={insertVar}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Escolha uma variável…" />
              </SelectTrigger>
              <SelectContent>
                {variaveis.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma variável definida no modelo</div>
                )}
                {variaveis.map((v) => (
                  <SelectItem key={v.chave} value={v.chave}>
                    <span className="flex items-center gap-2">
                      <span>{v.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{`{{${v.chave}}}`}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isText && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tamanho da fonte</Label>
                <span className="font-mono text-[10px] text-muted-foreground">{size}pt</span>
              </div>
              <Slider
                value={[size]} min={10} max={120} step={1}
                onValueChange={(v) => setSize(v[0] ?? 24)}
              />
            </div>
          )}

          {isText && (
            <div className="flex items-center justify-between rounded-md border border-border/60 p-2.5">
              <div>
                <Label className="text-xs">Negativo (fundo preto)</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Adiciona <code className="font-mono">^FR</code> — inverte cores.</p>
              </div>
              <Switch checked={reverse} onCheckedChange={setReverse} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSubmit({ fd, size, reverse })}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
