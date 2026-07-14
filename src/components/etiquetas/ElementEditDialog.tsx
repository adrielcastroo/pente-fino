/**
 * ElementEditDialog — popup de edição para elementos do ZPL.
 * - TEXT: conteúdo/variáveis, tamanho da fonte, negativo (^FR).
 * - LOGO: (bloco text com {{logo}}) idem texto.
 * - BOX / LINE: dimensões, espessura, estilo (solid/dashed/dotted).
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
import { Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { ParsedBlock, ShapeStyle, TextAlign } from './InteractiveZPLEditor';
import { VARIAVEIS_INTELIGENTES } from '@/types/etiquetas';

export interface ElementEditValues {
  fd: string;
  size: number;
  reverse: boolean;
  align?: TextAlign;
  fbWidth?: number;
  fbMaxLines?: number;
  width?: number;
  height?: number;
  thickness?: number;
  style?: ShapeStyle;
  x?: number;
  y?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  block: ParsedBlock | null;
  variaveis: { chave: string; label: string }[];
  onSubmit: (v: ElementEditValues) => void;
  onDelete?: () => void;
}

export function ElementEditDialog({ open, onOpenChange, block, variaveis, onSubmit, onDelete }: Props) {
  const todasVariaveis = (() => {
    const map = new Map<string, { chave: string; label: string }>();
    VARIAVEIS_INTELIGENTES.forEach((v) => map.set(v.chave, { chave: v.chave, label: v.label }));
    variaveis.forEach((v) => map.set(v.chave, v));
    return Array.from(map.values());
  })();

  const [fd, setFd] = useState('');
  const [size, setSize] = useState(24);
  const [reverse, setReverse] = useState(false);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(60);
  const [thickness, setThickness] = useState(2);
  const [style, setStyle] = useState<ShapeStyle>('solid');
  const [align, setAlign] = useState<TextAlign>('L');
  const [wrapEnabled, setWrapEnabled] = useState(false);
  const [fbWidth, setFbWidth] = useState(200);
  const [fbMaxLines, setFbMaxLines] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    if (!block) return;
    setFd(block.fd);
    setSize(block.size || 24);
    setReverse(block.reverse);
    setWidth(block.width ?? 100);
    setHeight(block.height ?? 60);
    setThickness(block.thickness ?? 2);
    setStyle(block.style ?? 'solid');
    setAlign(block.align ?? 'L');
    const hasFb = block.fbWidth !== undefined || (block.fbMaxLines ?? 1) > 1;
    setWrapEnabled(hasFb);
    setFbWidth(block.fbWidth ?? 200);
    setFbMaxLines(block.fbMaxLines ?? 1);
    setPosX(block.x);
    setPosY(block.y);
  }, [block]);

  if (!block) return null;

  const insertVar = (chave: string) => setFd((cur) => `${cur}{{${chave}}}`);

  const isText = block.tipo === 'text';
  const isQr = block.tipo === 'qr';
  const isShape = block.tipo === 'box' || block.tipo === 'line';

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
            {isShape
              ? 'Ajuste dimensões, espessura e estilo da linha.'
              : 'Ajuste conteúdo, variáveis e estilo. Refletido em tempo real.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isText && (
            <>
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
                    {todasVariaveis.map((v) => (
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tamanho da fonte</Label>
                  <span className="font-mono text-[10px] text-muted-foreground">{size}pt</span>
                </div>
                <Slider value={[size]} min={10} max={120} step={1} onValueChange={(v) => setSize(v[0] ?? 24)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Alinhamento</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { v: 'L' as TextAlign, icon: AlignLeft, label: 'Esquerda' },
                    { v: 'C' as TextAlign, icon: AlignCenter, label: 'Centro' },
                    { v: 'R' as TextAlign, icon: AlignRight, label: 'Direita' },
                  ]).map(({ v, icon: Icon, label }) => (
                    <Button
                      key={v}
                      type="button"
                      variant={align === v ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 gap-1.5"
                      onClick={() => setAlign(v)}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Usa <code className="font-mono">^FB</code> para alinhar o texto na etiqueta.</p>
              </div>

              <div className="rounded-md border border-border/60 p-2.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Quebra de linha (field block)</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Emite <code className="font-mono">^FB</code> — respeita largura e nº de linhas.
                    </p>
                  </div>
                  <Switch checked={wrapEnabled} onCheckedChange={setWrapEnabled} />
                </div>
                {wrapEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Largura (dots)</Label>
                      <Input
                        type="number" min={20} value={fbWidth}
                        onChange={(e) => setFbWidth(Math.max(20, parseInt(e.target.value, 10) || 20))}
                        className="font-mono h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Máx. de linhas</Label>
                      <Input
                        type="number" min={1} max={9999} value={fbMaxLines}
                        onChange={(e) => setFbMaxLines(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="font-mono h-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/60 p-2.5">
                <div>
                  <Label className="text-xs">Negativo (fundo preto)</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Adiciona <code className="font-mono">^FR</code> — inverte cores.</p>
                </div>
                <Switch checked={reverse} onCheckedChange={setReverse} />
              </div>
            </>
          )}

          {isQr && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fd-qr" className="text-xs">Payload do QR Code (texto ou variáveis)</Label>
                <Input
                  id="fd-qr" value={fd} onChange={(e) => setFd(e.target.value)}
                  placeholder="Ex.: LA,ROM{{romaneio}}-NF{{nf}}"
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Prefixo <code className="font-mono">LA,</code> é padrão ZPL para QR alfanumérico.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Inserir variável</Label>
                <Select onValueChange={insertVar}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Escolha uma variável…" />
                  </SelectTrigger>
                  <SelectContent>
                    {todasVariaveis.map((v) => (
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
            </>
          )}

          {isShape && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Largura</Label>
                  <Input type="number" min={1} value={width} onChange={(e) => setWidth(parseInt(e.target.value, 10) || 1)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Altura</Label>
                  <Input type="number" min={1} value={height} onChange={(e) => setHeight(parseInt(e.target.value, 10) || 1)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Espessura</Label>
                  <Input type="number" min={1} value={thickness} onChange={(e) => setThickness(parseInt(e.target.value, 10) || 1)} className="font-mono" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Estilo da linha</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as ShapeStyle)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Sólida ▬▬▬▬</SelectItem>
                    <SelectItem value="dashed">Tracejada ▬ ▬ ▬</SelectItem>
                    <SelectItem value="dotted">Pontilhada ··· ···</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Estilo aplicado no preview. Impressoras ZPL desenham como sólido; use tracejado/pontilhado apenas como referência visual.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete ? (
            <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Remover elemento
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => onSubmit({ fd, size, reverse, align, fbWidth: wrapEnabled ? fbWidth : undefined, fbMaxLines: wrapEnabled ? fbMaxLines : 1, width, height, thickness, style })}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
