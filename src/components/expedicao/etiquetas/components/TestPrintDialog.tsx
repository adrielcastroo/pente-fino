// ============================================================================
// TestPrintDialog — impressão de teste com dados mock.
// ============================================================================
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical } from 'lucide-react';
import type { PrintMethod, Vars } from '../types/etiqueta';
import type { UsePrintReturn } from '../hooks/useEtiquetaPrint';
import { isWebUsbSupported, isWebSerialSupported } from '../utils/etiquetaPrint';

interface Props {
  open: boolean;
  onClose: () => void;
  testPrint: UsePrintReturn['testPrint'];
  currentVars: Vars;
  isPrinting: boolean;
}

const REMEMBER_KEY = 'exp_etq_test_method_v1';

export function TestPrintDialog({ open, onClose, testPrint, currentVars, isPrinting }: Props) {
  const [method, setMethod] = useState<PrintMethod>(() => (localStorage.getItem(REMEMBER_KEY) as PrintMethod) || 'browser');
  const [useReal, setUseReal] = useState(false);
  const [remember, setRemember] = useState(true);

  const handle = async () => {
    if (remember) localStorage.setItem(REMEMBER_KEY, method);
    await testPrint({ method, mockData: useReal ? currentVars : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="size-5" /> Imprimir teste</DialogTitle>
          <DialogDescription>Envia uma etiqueta com dados mock para validar impressora e layout.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Método</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PrintMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="browser">Navegador (@print)</SelectItem>
                {isWebUsbSupported() && <SelectItem value="zpl-usb">ZPL via USB</SelectItem>}
                {isWebSerialSupported() && <SelectItem value="zpl-serial">ZPL via Serial</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={useReal} onCheckedChange={(v) => setUseReal(Boolean(v))} />
            Usar variáveis atuais (em vez de dados mock)
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
            Lembrar impressora
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPrinting}>Cancelar</Button>
          <Button onClick={handle} disabled={isPrinting}>{isPrinting ? 'Enviando...' : 'Imprimir teste'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TestPrintDialog;
