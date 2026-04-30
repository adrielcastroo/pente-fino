
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Plus, Package, Trash2, MapPin, Hash, FileText, Search, MessageSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ReservasPage() {
  const setFormData = useAppStore(s => s.setFormData);
  const { reservas, addReserva, deleteReserva, clearReservas } = useAppStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [caixaNum, setCaixaNum] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    setFormData({ activeTab: 'reservas' });
  }, [setFormData]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigo.trim() || !endereco.trim() || !quantidade.trim()) {
      toast.error('Preencha todos os campos obrigatórios (Código, Endereço e Quantidade).');
      return;
    }

    const newReserva = {
      id: crypto.randomUUID(),
      codigo: codigo.trim(),
      descricao: descricao.trim(),
      endereco: endereco.trim(),
      quantidade: Number(quantidade),
      caixaNum: caixaNum.trim(),
      observacao: observacao.trim(),
      createdAt: new Date().toISOString(),
    };

    addReserva(newReserva);
    toast.success('Item adicionado com sucesso!');
    
    // Reset form
    setCodigo('');
    setDescricao('');
    setEndereco('');
    setQuantidade('');
    setCaixaNum('');
    setObservacao('');
    setIsDialogOpen(false);
  };

  const filteredReservas = reservas.filter(r => 
    r.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.descricao && r.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Reservas Estoque
          </h1>
          <p className="text-muted-foreground mt-1">Gerenciamento de prateleira virtual e reservas.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <form onSubmit={handleAddItem} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="codigo" className="font-bold">Código <span className="text-destructive">*</span></Label>
                  <Input 
                    id="codigo" 
                    value={codigo} 
                    onChange={e => setCodigo(e.target.value)} 
                    placeholder="Ex: PROD-123"
                    className="focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao" className="font-bold">Descrição</Label>
                  <Input 
                    id="descricao" 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    placeholder="Opcional"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco" className="font-bold">Endereço <span className="text-destructive">*</span></Label>
                  <Input 
                    id="endereco" 
                    value={endereco} 
                    onChange={e => setEndereco(e.target.value)} 
                    placeholder="Ex: A-12-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantidade" className="font-bold">Quantidade <span className="text-destructive">*</span></Label>
                    <Input 
                      id="quantidade" 
                      type="number" 
                      value={quantidade} 
                      onChange={e => setQuantidade(e.target.value)} 
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="caixa" className="font-bold">Nº da Caixa</Label>
                    <Input 
                      id="caixa" 
                      value={caixaNum} 
                      onChange={e => setCaixaNum(e.target.value)} 
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="observacao" className="font-bold">Observação</Label>
                  <Textarea 
                    id="observacao" 
                    value={observacao} 
                    onChange={e => setObservacao(e.target.value)} 
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
          
          {reservas.length > 0 && (
            <Button variant="outline" onClick={() => {
              if (confirm('Tem certeza que deseja limpar todas as reservas?')) {
                clearReservas();
                toast.success('Reservas limpas com sucesso.');
              }
            }} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 font-bold">
              Limpar
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              Prateleira Virtual
              <Badge variant="secondary" className="ml-2 font-mono">{filteredReservas.length}</Badge>
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar por código ou endereço..." 
                className="pl-9 bg-background/50 border-border/60 focus:bg-background"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Código</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Descrição</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Endereço</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Quantidade</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-center">Nº Caixa</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4">Obs.</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[10px] text-muted-foreground py-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-12 h-12 opacity-10" />
                        <p className="font-medium italic">Nenhum item encontrado na prateleira virtual.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservas.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors border-b border-border/30">
                      <TableCell className="font-mono font-bold text-primary">{item.codigo}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground font-medium">
                        {item.descricao || <span className="text-muted-foreground/30 italic">Sem descrição</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {item.endereco}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                          {item.quantidade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {item.caixaNum ? (
                          <div className="flex items-center justify-center gap-1">
                            <Hash className="w-3 h-3" />
                            {item.caixaNum}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground/70 text-xs">
                        {item.observacao ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-help">
                                <MessageSquare className="w-3 h-3 shrink-0" />
                                <span className="truncate">{item.observacao}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs font-medium">
                              {item.observacao}
                            </TooltipContent>
                          </Tooltip>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => {
                            deleteReserva(item.id);
                            toast.success('Item removido com sucesso.');
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
