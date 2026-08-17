import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCancelarPicking, type Picking } from '@/hooks/expedicao/useExpedicaoData';

interface Props {
  picking: Picking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CancelPickingDialog({ picking, open, onOpenChange }: Props) {
  const [motivo, setMotivo] = useState('');
  const cancelar = useCancelarPicking();
  const isEstorno = picking?.status === 'faturado';

  const handleConfirm = async () => {
    if (!picking) return;
    try {
      await cancelar.mutateAsync({ pickingId: picking.id, motivo, estorno: isEstorno });
      setMotivo('');
      onOpenChange(false);
    } catch {
      // toast já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            {isEstorno ? 'Estornar picking faturado' : 'Cancelar picking'}
          </DialogTitle>
          <DialogDescription>
            {picking?.numero} · {picking?.cliente}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-5 sm:p-6 space-y-4 pt-2">
          <div className="space-y-2">
          <Label htmlFor="motivo">Motivo (obrigatório)</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Descreva o motivo do cancelamento/estorno…"
            rows={4}
            maxLength={500}
          />
          <p className="text-[11px] text-muted-foreground">
            Esta ação fica registrada no log de auditoria e libera o carrinho associado.
          </p>
        </div>

        </div>
        <DialogFooter className="p-5 sm:p-6 pt-4 sm:pt-4 mt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelar.isPending}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={motivo.trim().length < 5 || cancelar.isPending}
          >
            {cancelar.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {isEstorno ? 'Confirmar estorno' : 'Confirmar cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
