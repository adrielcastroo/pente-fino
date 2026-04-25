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
      className="group overflow-hidden border border-border/30 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 cursor-pointer shadow-none hover:shadow-md hover:scale-[1.02] active:scale-[0.99]"
    >
      <CardContent className="p-0">
        {/* Header with Item Name and Avaria Badge */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <TreePine className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm truncate leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">
                {item.item || 'Sem descrição'}
              </h3>
            </div>
            {item.avaria_tipo && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-5 gap-1 animate-pulse font-black uppercase tracking-widest">
                <AlertTriangle className="w-3 h-3" />
                {AVARIA_LABELS[item.avaria_tipo] || item.avaria_tipo}
              </Badge>
            )}
          </div>

          {/* Main Info Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 block">Endereço</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-black bg-muted/40 px-2 py-1 rounded-lg border border-border/20 w-fit group-hover:border-primary/20 transition-colors">
                <MapPin className="w-3 h-3 text-primary/60" />
                {item.endereco || '—'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 block">Processo</span>
              <div className="flex items-center gap-1.5 text-xs font-black tabular-nums">
                <Hash className="w-3 h-3 text-muted-foreground/60" />
                {item.nf || '—'}
              </div>
            </div>
          </div>

          {/* Tonalidade / Lote Mestre */}
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 block">Tonalidade</span>
            {loteMestre ? (
              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-border/20 bg-muted/20 group-hover:bg-muted/30 transition-colors">
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                  style={{ background: loteMestre.cor_hex }} 
                />
                <span className="text-[11px] font-black tracking-tight uppercase">{loteMestre.nome}</span>
                {item.tipo_tecido && (
                  <Badge variant="outline" className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 bg-background/50 border-border/20">
                    {item.tipo_tecido}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground/50 italic px-2 font-medium">
                Nenhuma tonalidade vinculada
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs p-2 rounded-xl bg-primary/5 border border-primary/10 group-hover:border-primary/20 transition-colors">
              <Ruler className="w-3.5 h-3.5 text-primary/60" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-muted-foreground/60 leading-none mb-0.5 tracking-widest">Largura</span>
                <span className="font-black tabular-nums text-foreground">{item.largura ? `${item.largura}m` : '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs p-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 group-hover:border-cyan-500/20 transition-colors">
              <Package className="w-3.5 h-3.5 text-cyan-500/60" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-muted-foreground/60 leading-none mb-0.5 tracking-widest">M Linear</span>
                <span className="font-black tabular-nums text-foreground">{item.m_linear ? `${item.m_linear}m` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-3 border-t border-border/10 flex items-center justify-between bg-muted/5 transition-colors">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-black uppercase tracking-tighter">
              <User className="w-2.5 h-2.5 opacity-60" />
              <span className="truncate max-w-[80px]">{item.edited_by || 'Sistema'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-black uppercase tracking-tighter">
              <Calendar className="w-2.5 h-2.5 opacity-60" />
              <span>{formatDateBR(item.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[9px] font-black text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 tracking-widest">
              DETALHES
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
  );
}
