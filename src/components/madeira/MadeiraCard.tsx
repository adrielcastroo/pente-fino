import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TreePine, AlertTriangle, MapPin, Hash, Package, Ruler, Calendar, User, ChevronRight, BarChart3 } from "lucide-react";
import { formatDateBR } from "@/lib/app-utils";
import { LoteMestre } from "@/services/lotesMestresService";

interface MadeiraCardProps {
  item: {
    id: string;
    item: string;
    nf: string;
    endereco: string | null;
    lote: string | null;
    lote_sistema: string | null;
    largura: number | null;
    m_linear: number | null;
    m2: number | null;
    tipo_tecido: string | null;
    lote_mestre_id: string | null;
    avaria_tipo: string | null;
    avaria_descricao: string | null;
    avaria_foto_url: string | null;
    created_at: string;
    edited_by: string | null;
  };
  loteMestre?: LoteMestre;
  onClick?: () => void;
}

const AVARIA_LABELS: Record<string, string> = {
  riscado: 'Riscado',
  manchado: 'Manchado',
  quebrado: 'Quebrado',
  tonalidade: 'Tonalidade',
  outro: 'Outro',
};

export function MadeiraCard({ item, loteMestre, onClick }: MadeiraCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group overflow-hidden border border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
    >
      <CardContent className="p-0">
        {/* Header with Item Name and Avaria Badge */}
        <div className="p-4 border-b border-border/20 bg-muted/10 group-hover:bg-primary/10 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <TreePine className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm truncate leading-tight group-hover:text-primary transition-colors">
                {item.item || 'Sem descrição'}
              </h3>
            </div>
            {item.avaria_tipo && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-5 gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {AVARIA_LABELS[item.avaria_tipo] || item.avaria_tipo}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {/* Main Info Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Endereço</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-muted/40 px-2 py-1 rounded-md border border-border/30 w-fit">
                <MapPin className="w-3 h-3 text-primary/60" />
                {item.endereco || '—'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Processo</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Hash className="w-3 h-3 text-muted-foreground" />
                {item.nf || '—'}
              </div>
            </div>
          </div>

          {/* Tonalidade / Lote Mestre */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Tonalidade</span>
            {loteMestre ? (
              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-border/30 bg-muted/20">
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                  style={{ background: loteMestre.cor_hex }} 
                />
                <span className="text-xs font-bold tracking-tight">{loteMestre.nome}</span>
                {item.tipo_tecido && (
                  <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-background/50">
                    {item.tipo_tecido}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground/60 italic px-2">
                Nenhuma tonalidade vinculada
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30 border border-border/20">
              <Ruler className="w-3 h-3 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-muted-foreground/60 leading-none mb-0.5">Largura</span>
                <span className="font-bold tabular-nums">{item.largura ? `${item.largura}m` : '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30 border border-border/20">
              <Package className="w-3 h-3 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-muted-foreground/60 leading-none mb-0.5">M Linear</span>
                <span className="font-bold tabular-nums">{item.m_linear ? `${item.m_linear}m` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-3 border-t border-border/10 flex items-center justify-between bg-muted/5 group-hover:bg-primary/5 transition-colors">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
              <User className="w-2.5 h-2.5" />
              <span className="truncate max-w-[80px]">{item.edited_by || 'Sistema'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
              <Calendar className="w-2.5 h-2.5" />
              <span>{formatDateBR(item.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
              <BarChart3 className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              DETALHES
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
