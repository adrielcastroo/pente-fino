import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truck, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface CarrierSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (carrier: any) => void;
  defaultTransportadora?: any;
}

export default function CarrierSelectorDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  defaultTransportadora 
}: CarrierSelectorDialogProps) {
  const [search, setSearch] = useState('');
  
  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ['expedicao_transportadoras', search],
    queryFn: async () => {
      let query = supabase
        .from('expedicao_transportadoras')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });
      
      if (search) {
        query = query.ilike('nome', `%${search}%`);
      }
      
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const handleSelect = (carrier: any) => {
    onSelect(carrier);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="size-5" />
            Selecionar Transportadora
          </DialogTitle>
          <DialogDescription>
            Escolha para qual transportadora esta peça será alocada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : carriers.length === 0 ? (
              <div className="flex h-full items-center justify-center py-10 text-muted-foreground">
                Nenhuma transportadora encontrada.
              </div>
            ) : (
              <div className="space-y-2">
                {carriers.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 px-4 text-left"
                    onClick={() => handleSelect(c)}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{c.nome}</div>
                      <div className="text-xs text-muted-foreground font-mono">ID: {c.id.split('-')[0]}</div>
                    </div>
                    {defaultTransportadora?.id === c.id && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Sugerido
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
