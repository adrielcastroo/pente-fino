import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, ClipboardCheck, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Log {
  id: string;
  conferente_name: string;
  type: string;
  description: string;
  quantity: number;
  item_id: string;
  created_at: string;
}

const History = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("operation_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const renderBadge = (type: string) => {
    if (type === 'entry') {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <ArrowDownLeft className="h-3 w-3 mr-1"/> Entrada
        </Badge>
      );
    }
    if (type === 'exit') {
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
          <ArrowUpRight className="h-3 w-3 mr-1"/> Saída
        </Badge>
      );
    }
    return <Badge variant="outline">{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Operações</h1>
        <p className="text-muted-foreground">Registro compartilhado de todas as movimentações.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Conferente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {log.conferente_name}
                      </div>
                    </TableCell>
                    <TableCell>{renderBadge(log.type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.description}</TableCell>
                    <TableCell className="text-right font-medium">{log.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
