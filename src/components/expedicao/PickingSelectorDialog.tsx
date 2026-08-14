import { useState } from 'react';
import { Search, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePickings, type Picking } from '@/hooks/expedicao/useExpedicaoData';
import { Badge } from '@/components/ui/badge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (picking: Picking) => void;
  clienteNome?: string;
}

export default function PickingSelectorDialog({ open, onOpenChange, onSelect, clienteNome }: Props) {
  const [q, setQ] = useState('');
  const { data = [], isLoading } = usePickings();

  const filtered = data.filter(p => 
    ['aguardando', 'em_separacao'].includes(p.status) &&
    (p.numero.toLowerCase().includes(q.toLowerCase()) || 
     p.cliente.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular a um Picking</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            value={q} 
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por número ou cliente..."
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhum picking compatível encontrado</div>
          ) : (
            filtered.map(p => (
              <Button
                key={p.id}
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 gap-3 flex-col items-start"
                onClick={() => {
                  onSelect(p);
                  onOpenChange(false);
                }}
              >
                <div className="flex w-full justify-between items-center">
                  <span className="font-mono font-bold text-primary">{p.numero}</span>
                  <Badge variant="secondary">{p.status}</Badge>
                </div>
                <div className="text-sm text-left font-normal truncate w-full">
                  {p.cliente}
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
