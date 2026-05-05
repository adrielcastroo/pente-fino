import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ReservaFormData, initialReservaForm } from './reservas-utils';

interface ReservaFormDialogProps {
  onAdd: (data: ReservaFormData) => Promise<void>;
}

export function ReservaFormDialog({ onAdd }: ReservaFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ReservaFormData>(initialReservaForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.codigo.trim() || !form.endereco.trim() || !form.quantidade.trim()) {
      toast.error('Preencha todos os campos obrigatórios (Código, Endereço e Quantidade).');
      return;
    }

    try {
      await onAdd(form);
      setForm(initialReservaForm);
      setIsOpen(false);
      toast.success('Item adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar item no banco de dados.');
    }
  };

  const updateField = (field: keyof ReservaFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInput = (field: keyof ReservaFormData, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      updateField(field, value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4" />
          Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Nova Reserva
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="codigo" className="font-bold">Código <span className="text-destructive">*</span></Label>
            <Input 
              id="codigo" 
              value={form.codigo} 
              onChange={e => updateField('codigo', e.target.value)} 
              placeholder="Ex: PROD-123"
              className="focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descricao" className="font-bold">Descrição</Label>
            <Input 
              id="descricao" 
              value={form.descricao} 
              onChange={e => updateField('descricao', e.target.value)} 
              placeholder="Opcional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endereco" className="font-bold">Endereço <span className="text-destructive">*</span></Label>
            <Input 
              id="endereco" 
              value={form.endereco} 
              onChange={e => updateField('endereco', e.target.value)} 
              placeholder="Ex: A-12-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantidade" className="font-bold">Quantidade <span className="text-destructive">*</span></Label>
              <Input 
                id="quantidade" 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.quantidade} 
                onChange={e => handleNumericInput('quantidade', e.target.value)} 
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caixa" className="font-bold">Nº da Caixa</Label>
              <Input 
                id="caixa" 
                value={form.caixaNum} 
                onChange={e => updateField('caixaNum', e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantidadeCx" className="font-bold">Quantidade de CX</Label>
            <Input 
              id="quantidadeCx" 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.quantidadeCx} 
              onChange={e => handleNumericInput('quantidadeCx', e.target.value)} 
              placeholder="Ex: 5"
              className="focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="observacao" className="font-bold">Observação</Label>
            <Textarea 
              id="observacao" 
              value={form.observacao} 
              onChange={e => updateField('observacao', e.target.value)} 
              placeholder="Informações adicionais sobre a reserva..."
              className="min-h-[100px] resize-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" className="w-full font-bold">Salvar Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
