import { useState, useEffect } from 'react';
import { Package, Upload, ScanBarcode, Shirt, TreePine, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import TecidoEstoque from '@/components/estoque/TecidoEstoque';
import MadeiraEstoque from '@/components/estoque/MadeiraEstoque';
import ImportDialog from '@/components/estoque/ImportDialog';

export default function EstoquePage() {
  const [importOpen, setImportOpen] = useState(false);
  const [category, setCategory] = useState<'tecido' | 'madeira'>('tecido');
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'estoque' });
  }, [setFormData]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight flex items-center gap-3">
            Estoque
            <Package className="w-8 h-8 text-primary/40 hidden sm:block" />
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Gestão inteligente de insumos e matérias-primas.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setImportOpen(true)} 
            variant="outline" 
            className="flex-1 sm:flex-none h-11 px-6 font-bold rounded-xl border-primary/20 text-primary hover:bg-primary/5 gap-2 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Button>
          <Button 
            variant="default"
            className="flex-1 sm:flex-none h-11 px-6 font-bold rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <ScanBarcode className="w-4 h-4" />
            Scanner
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs defaultValue="tecido" value={category} onValueChange={(v) => setCategory(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2 p-1 bg-muted/30 border border-border/30 h-12 rounded-xl">
            <TabsTrigger value="tecido" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-black text-xs tracking-wide gap-2">
              <Shirt className="w-4 h-4" />
              TECIDO
            </TabsTrigger>
            <TabsTrigger value="madeira" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-black text-xs tracking-wide gap-2">
              <TreePine className="w-4 h-4" />
              MADEIRA
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={`Buscar em ${category === 'tecido' ? 'tecidos' : 'madeiras'}...`}
              className="pl-10 h-12 rounded-xl bg-muted/20 border-border/30 focus-visible:ring-primary/30"
            />
          </div>
        </div>

        <div className="mt-2">
          <TabsContent value="tecido" className="focus-visible:outline-none data-[state=inactive]:hidden">
            <TecidoEstoque />
          </TabsContent>
          
          <TabsContent value="madeira" className="focus-visible:outline-none data-[state=inactive]:hidden">
            <MadeiraEstoque />
          </TabsContent>
        </div>
      </Tabs>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
