import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PackageX } from 'lucide-react';

export type ValidacaoResultado =
  | { tipo: 'ok' }
  | { tipo: 'divergente'; bipado: string; fornecedor: string; codigoInterno: string }
  | { tipo: 'nao_cadastrado'; codigoInterno: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resultado: ValidacaoResultado | null;
  onConfirm: () => void;
  onCadastrar?: () => void;
}

export default function ValidacaoEtiquetaDialog({ open, onOpenChange, resultado, onConfirm, onCadastrar }: Props) {
  if (!resultado || resultado.tipo === 'ok') return null;

  const isDivergente = resultado.tipo === 'divergente';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${isDivergente ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-warning'}`}>
            {isDivergente ? <AlertTriangle className="h-6 w-6" /> : <PackageX className="h-6 w-6" />}
          </div>
          <DialogTitle>
            {isDivergente ? 'Código do fornecedor não confere' : 'Item não cadastrado'}
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            {isDivergente && resultado.tipo === 'divergente' && (
              <>
                <div>
                  Item interno: <span className="font-mono font-semibold">{resultado.codigoInterno}</span>
                </div>
                <div>
                  Código bipado: <span className="font-mono font-semibold text-destructive">{resultado.bipado}</span>
                </div>
                <div>
                  Cadastrado no fornecedor: <span className="font-mono font-semibold">{resultado.fornecedor}</span>
                </div>
                <div className="pt-2">Deseja imprimir mesmo assim?</div>
              </>
            )}
            {resultado.tipo === 'nao_cadastrado' && (
              <>
                <div>
                  O item <span className="font-mono font-semibold">{resultado.codigoInterno}</span> não está na base de cadastros.
                </div>
                <div>A etiqueta usará os dados do registro atual, sem validação de fornecedor.</div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {resultado.tipo === 'nao_cadastrado' && onCadastrar && (
            <Button variant="outline" onClick={onCadastrar}>Cadastrar agora</Button>
          )}
          <Button
            onClick={onConfirm}
            className={isDivergente ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            Imprimir assim mesmo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
