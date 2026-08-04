
import { SoraHeader } from "@/components/ui/sora-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export default function EsbocoNfPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SoraHeader 
          title="Esboço de NF" 
          subtitle="Gere rascunhos de Notas Fiscais para conferência antes da emissão"
        />
        <Button className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Esboço
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Filtros e Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número, fornecedor ou data..." className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg bg-card/50">
        <EmptyState
          icon={FileText}
          title="Nenhum esboço encontrado"
          description="Comece criando um novo esboço de nota fiscal para organizar seus dados de compra."
          actionLabel="Criar primeiro esboço"
          onAction={() => {}}
        />
      </div>
    </div>
  );
}
