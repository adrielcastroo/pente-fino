import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface VisitorIdentificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed?: (name: string) => void;
}

export function VisitorIdentificationDialog({ open, onOpenChange, onConfirmed }: VisitorIdentificationDialogProps) {
  const [name, setName] = useState('');
  const setConferente = useAppStore(s => s.setConferente);
  const currentConferente = useAppStore(s => s.conferente);

  useEffect(() => {
    if (open) {
      setName(currentConferente || '');
    }
  }, [open, currentConferente]);

  const handleConfirm = () => {
    if (!name.trim()) {
      toast.error('Por favor, insira seu nome para continuar.');
      return;
    }
    setConferente(name.trim());
    if (onConfirmed) onConfirmed(name.trim());
    onOpenChange(false);
    toast.success(`Identificado como: ${name.trim()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] rounded-[2rem] p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-8 bg-amber-500/10 dark:bg-amber-500/5">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-amber-600">
             <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600"><ShieldAlert className="w-5 h-5" /></div>
             Identificação Necessária
          </DialogTitle>
          <DialogDescription className="text-sm font-medium mt-1 text-amber-700/80">
            Visitantes podem visualizar, mas para salvar ou alterar dados é obrigatório identificar-se.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">
              Seu Nome / Identificação
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                autoFocus
                className="h-14 pl-11 rounded-2xl border-border/50 bg-muted/20 font-bold focus:bg-background transition-all" 
                placeholder="Ex: João Silva"
                value={name} 
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-border/30 gap-3">
          <Button variant="outline" className="rounded-xl font-bold px-6 h-11" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="rounded-xl font-black px-8 h-11 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20" 
            onClick={handleConfirm}
          >
            Confirmar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
