// ============================================================================
// PrintActions — botões: Imprimir (navegador/USB/Serial), Test, Batch.
// ============================================================================
import { useState } from 'react';
import { Printer, Usb, Cable, FlaskConical, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isWebUsbSupported, isWebSerialSupported } from '../utils/etiquetaPrint';
import type { PrintMethod } from '../types/etiqueta';
import type { UsePrintReturn } from '../hooks/useEtiquetaPrint';

interface Props {
  print: UsePrintReturn['print'];
  isPrinting: boolean;
  onOpenTestPrint: () => void;
  onOpenBatchPrint: () => void;
}

const METHOD_STORAGE = 'exp_etq_default_method_v1';

export function PrintActions({ print, isPrinting, onOpenTestPrint, onOpenBatchPrint }: Props) {
  const [method, setMethod] = useState<PrintMethod>(() =>
    (localStorage.getItem(METHOD_STORAGE) as PrintMethod) || 'browser',
  );

  const setMethodPersist = (m: PrintMethod) => {
    setMethod(m);
    localStorage.setItem(METHOD_STORAGE, m);
  };

  const usb = isWebUsbSupported();
  const serial = isWebSerialSupported();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onOpenTestPrint} disabled={isPrinting}>
              <FlaskConical className="size-4" /> <span className="hidden md:inline">Teste</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Imprimir teste com dados mock (Ctrl+Shift+P)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={onOpenBatchPrint} disabled={isPrinting}>
              <Layers className="size-4" /> <span className="hidden md:inline">Lote</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Impressão em lote (Ctrl+Shift+B)</TooltipContent>
        </Tooltip>

        <div className="flex items-stretch">
          <Button
            size="sm"
            onClick={() => print({ method })}
            disabled={isPrinting}
            className="gap-1.5 rounded-r-none"
          >
            <IconForMethod method={method} />
            <span>{isPrinting ? 'Imprimindo...' : labelForMethod(method)}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-l-none px-2" disabled={isPrinting}>▾</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Método padrão</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setMethodPersist('browser')}>
                <Printer className="size-4 mr-2" /> Navegador (@print)
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!usb} onClick={() => setMethodPersist('zpl-usb')}>
                <Usb className="size-4 mr-2" /> ZPL via USB {!usb && '(não suportado)'}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!serial} onClick={() => setMethodPersist('zpl-serial')}>
                <Cable className="size-4 mr-2" /> ZPL via Serial {!serial && '(não suportado)'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => print({ method: 'browser' })}>Imprimir agora · Navegador</DropdownMenuItem>
              {usb && <DropdownMenuItem onClick={() => print({ method: 'zpl-usb' })}>Imprimir agora · USB</DropdownMenuItem>}
              {serial && <DropdownMenuItem onClick={() => print({ method: 'zpl-serial' })}>Imprimir agora · Serial</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}

function IconForMethod({ method }: { method: PrintMethod }) {
  if (method === 'zpl-usb') return <Usb className="size-4" />;
  if (method === 'zpl-serial') return <Cable className="size-4" />;
  return <Printer className="size-4" />;
}
function labelForMethod(m: PrintMethod): string {
  if (m === 'zpl-usb') return 'Imprimir (USB)';
  if (m === 'zpl-serial') return 'Imprimir (Serial)';
  return 'Imprimir';
}

export default PrintActions;
