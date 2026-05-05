import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ReservaFormData, initialReservaForm } from './reservas-utils';

interface ReservaFormDialogProps {
  onAdd: (data: ReservaFormData) => Promise<void>;
}

/**
 * ReservaFormDialog - Optimized form with input validation and UX enhancements.
 */
export function ReservaFormDialog({ onAdd }: ReservaFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ReservaFormData>(initialReservaForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(() => {
    return form.codigo.trim().length > 0 && 
           form.endereco.trim().length > 0 && 
           form.quantidade.trim().length > 0;
  }, [form.codigo, form.endereco, form.quantidade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Preencha todos os campos obrigatórios (Código, Endereço e Quantidade).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(form);
      setForm(initialReservaForm);
      setIsOpen(false);
    } catch (error) {
      // Error handled by parent/mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = useCallback((field: keyof ReservaFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNumericInput = useCallback((field: keyof ReservaFormData, value: string) => {
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      updateField(field, value);
    }
  }, [updateField]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-hidden border-border/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Plus className="w-5 h-5 text-primary" />
            Nova Reserva
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="codigo" className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Código <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="codigo" 
              value={form.codigo} 
              onChange={e => updateField('codigo', e.target.value)} 
              placeholder="Ex: PROD-123"
              className="bg-muted/30 border-border/60 focus:bg-background transition-all font-mono"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="endereco" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Endereço <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="endereco" 
              value={form.endereco} 
              onChange={e => updateField('endereco', e.target.value)} 
              placeholder="Ex: A-12-3"
              className="bg-muted/30 border-border/60 focus:bg-background transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantidade" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Qtd Unid. <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="quantidade" 
                type="text"
                inputMode="numeric"
                value={form.quantidade} 
                onChange={e => handleNumericInput('quantidade', e.target.value)} 
                placeholder="0"
                className="bg-muted/30 border-border/60 focus:bg-background transition-all font-mono"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantidadeCx" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Qtd por CX
              </Label>
              <Input 
                id="quantidadeCx" 
                type="text"
                inputMode="numeric"
                value={form.quantidadeCx} 
                onChange={e => handleNumericInput('quantidadeCx', e.target.value)} 
                placeholder="Ex: 5"
                className="bg-muted/30 border-border/60 focus:bg-background transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="caixa" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Nº da Caixa
              </Label>
              <Input 
                id="caixa" 
                value={form.caixaNum} 
                onChange={e => updateField('caixaNum', e.target.value)} 
                placeholder="Opcional"
                className="bg-muted/10 border-border/40 focus:bg-background transition-all"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Descrição
              </Label>
              <Input 
                id="descricao" 
                value={form.descricao} 
                onChange={e => updateField('descricao', e.target.value)} 
                placeholder="Opcional"
                className="bg-muted/10 border-border/40 focus:bg-background transition-all"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observacao" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Observação
            </Label>
            <Textarea 
              id="observacao" 
              value={form.observacao} 
              onChange={e => updateField('observacao', e.target.value)} 
              placeholder="Informações adicionais sobre a reserva..."
              className="min-h-[80px] resize-none bg-muted/10 border-border/40 focus:bg-background transition-all text-xs"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button 
              type="submit" 
              className="w-full font-black text-sm uppercase tracking-widest h-11"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Reserva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

