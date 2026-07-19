import { useState, useMemo, memo, useCallback } from 'react';
import { Package, PackageX, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReservasTable } from '@/components/estoque/ReservasTable';
import { ReservaFormDialog } from '@/components/estoque/ReservaFormDialog';
import TecidosSemEspacoTab from '@/components/estoque/TecidosSemEspacoTab';
import { filterReservas, ReservaFormData } from '@/components/estoque/reservas-utils';
import { useReservas } from '@/hooks/useReservas';
import { Reserva } from '@/types';
import { diffFields } from '@/lib/audit';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';


const ReservasPage = () => {
  useDocumentTitle('Reservas');
  const { reservas, addReserva, deleteReserva, clearReservas } = useReservas();
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Reserva | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const filteredReservas = useMemo(() =>
    filterReservas(reservas, searchTerm),
    [reservas, searchTerm]
  );

  const handleAddReserva = async (formData: ReservaFormData) => {
    const newReserva: Reserva = {
      id: crypto.randomUUID(),
      codigo: formData.codigo.trim(),
      descricao: formData.descricao.trim(),
      endereco: formData.endereco.trim(),
      quantidade: Number(formData.quantidade),
      caixaNum: formData.caixaNum.trim(),
      quantidadeCx: formData.quantidadeCx ? parseInt(formData.quantidadeCx, 10) : undefined,
      observacao: formData.observacao.trim(),
      createdAt: new Date().toISOString(),
    };

    await addReserva({ reserva: newReserva });
  };

  const handleUpdateReserva = async (formData: ReservaFormData) => {
    if (!editing) return;
    const updated: Reserva = {
      ...editing,
      codigo: formData.codigo.trim(),
      descricao: formData.descricao.trim(),
      endereco: formData.endereco.trim(),
      quantidade: Number(formData.quantidade),
      caixaNum: formData.caixaNum.trim(),
      quantidadeCx: formData.quantidadeCx ? parseInt(formData.quantidadeCx, 10) : undefined,
      observacao: formData.observacao.trim(),
    };

    const before = {
      codigo: editing.codigo,
      descricao: editing.descricao ?? '',
      endereco: editing.endereco,
      quantidade: editing.quantidade,
      caixaNum: editing.caixaNum ?? '',
      quantidadeCx: editing.quantidadeCx ?? '',
      observacao: editing.observacao ?? '',
    };
    const after = {
      codigo: updated.codigo,
      descricao: updated.descricao ?? '',
      endereco: updated.endereco,
      quantidade: updated.quantidade,
      caixaNum: updated.caixaNum ?? '',
      quantidadeCx: updated.quantidadeCx ?? '',
      observacao: updated.observacao ?? '',
    };
    const changed = diffFields(before, after, Object.keys(after) as any);
    // Map camelCase to db column for last_edited_field
    const fieldMap: Record<string, string> = {
      caixaNum: 'caixa_num',
      quantidadeCx: 'quantidade_cx',
    };
    const changedField = changed[0] ? (fieldMap[changed[0]] || changed[0]) : null;

    await addReserva({ reserva: updated, opts: { isEdit: true, changedField } });
    setEditing(null);
    setEditOpen(false);
  };

  const handleEdit = useCallback((reserva: Reserva) => {
    setEditing(reserva);
    setEditOpen(true);
  }, []);

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja limpar todas as reservas?')) {
      await clearReservas();
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PageHeader
          title="Reservas"
          subtitle="Gerenciamento de prateleira virtual e reservas sincronizadas em tempo real."
          actions={
            <>
              <ReservaFormDialog onAdd={handleAddReserva} />
              {reservas.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 font-bold"
                >
                  Limpar
                </Button>
              )}
            </>
          }
        />

        <Tabs defaultValue="prateleira" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prateleira" className="gap-2">
              <Package className="w-4 h-4" /> Prateleira Virtual
            </TabsTrigger>
            <TabsTrigger value="sem-espaco" className="gap-2">
              <PackageX className="w-4 h-4" /> Tecidos sem espaço
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prateleira">
            <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden ring-1 ring-black/5">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    Prateleira Virtual
                    <Badge variant="secondary" className="ml-2 font-mono font-bold">
                      {filteredReservas.length}
                    </Badge>
                  </CardTitle>
                  <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      placeholder="Filtrar por código, endereço ou OBS..."
                      className="pl-9 bg-background/50 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      aria-label="Filtrar reservas"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ReservasTable items={filteredReservas} onDelete={deleteReserva} onEdit={handleEdit} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sem-espaco">
            <TecidosSemEspacoTab />
          </TabsContent>
        </Tabs>


        {/* Hidden controlled edit dialog */}
        <ReservaFormDialog
          mode="edit"
          open={editOpen}
          onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null); }}
          initial={editing}
          onAdd={handleUpdateReserva}
        />
      </div>
    </TooltipProvider>
  );
};

export default memo(ReservasPage);
