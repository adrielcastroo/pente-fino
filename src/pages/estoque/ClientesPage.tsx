import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Loader2, Info, User, Phone, Mail, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateBR } from '@/lib/app-utils';

interface ClienteAuge {
  id: string;
  codigo: string;
  nome: string | null;
  nome_fantasia: string | null;
  razao_social: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  situacao: string | null;
  synced_at: string;
}

export default function ClientesPage() {
  useDocumentTitle('Clientes (Espelho Auge)');
  const [clientes, setClientes] = useState<ClienteAuge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteAuge | null>(null);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auge_clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar clientes: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando clientes com o Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'sync_clientes' }
      });

      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);

      toast.success('Sincronização concluída: ' + (data?.upserted ?? 0) + ' registros atualizados.', { id: t });
      loadClientes();
    } catch (e: any) {
      toast.error('Falha na sincronização: ' + e.message, { id: t });
    } finally {
      setSyncing(false);
    }
  };

  const filtered = clientes.filter(c => 
    (c.nome?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.codigo?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.cpf_cnpj?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <PageHeader 
        title="Clientes (Auge)" 
        actions={
          <Button 
            onClick={handleSync} 
            disabled={syncing} 
            className="gap-2"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar
          </Button>
        }
      />

      <div className="flex items-center gap-2 px-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou CPF/CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="h-9 px-3">
          {filtered.length} clientes
        </Badge>
      </div>

      <div className="flex-1 overflow-auto border rounded-md bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Nome / Razão Social</TableHead>
              <TableHead>CPF / CNPJ</TableHead>
              <TableHead>Cidade / UF</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow 
                  key={c.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCliente(c)}
                >
                  <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.nome || c.razao_social}</div>
                    {c.nome_fantasia && <div className="text-xs text-muted-foreground">{c.nome_fantasia}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{c.cpf_cnpj}</TableCell>
                  <TableCell className="text-xs">
                    {c.cidade ? `${c.cidade} - ${c.uf}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Detalhes do Cliente
              <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                ERP: {selectedCliente?.codigo}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedCliente && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <section className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Nome / Razão Social</label>
                  <div className="text-sm font-medium border rounded-md p-2 bg-muted/20">
                    {selectedCliente.nome || selectedCliente.razao_social}
                  </div>
                </div>
                {selectedCliente.nome_fantasia && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Nome Fantasia</label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20">{selectedCliente.nome_fantasia}</div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">CPF / CNPJ</label>
                  <div className="text-sm border rounded-md p-2 bg-muted/20 font-mono">{selectedCliente.cpf_cnpj || '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20">{selectedCliente.telefone || '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Celular
                    </label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20">{selectedCliente.celular || '-'}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> E-mail
                  </label>
                  <div className="text-sm border rounded-md p-2 bg-muted/20 truncate">{selectedCliente.email || '-'}</div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Endereço
                  </label>
                  <div className="text-sm border rounded-md p-2 bg-muted/20">
                    {selectedCliente.endereco}{selectedCliente.numero ? `, ${selectedCliente.numero}` : ''}
                    {selectedCliente.complemento ? ` (${selectedCliente.complemento})` : ''}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Bairro</label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20">{selectedCliente.bairro || '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">CEP</label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20 font-mono">{selectedCliente.cep || '-'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Cidade</label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20">{selectedCliente.cidade || '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">UF</label>
                    <div className="text-sm border rounded-md p-2 bg-muted/20 text-center">{selectedCliente.uf || '-'}</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-dashed">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Última sincronização técnica:</span>
                    <span className="font-mono">{selectedCliente.synced_at ? formatDateBR(selectedCliente.synced_at) : '-'}</span>
                  </div>
                  <p className="mt-2 text-[9px] text-muted-foreground italic leading-tight">
                    * Espelho somente leitura. Alterações devem ser feitas diretamente no Auge ERP.
                  </p>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
