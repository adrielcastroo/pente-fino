import { Loader2, CheckCircle2, AlertTriangle, Database, Cloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useItemVinculo } from '@/hooks/useItemVinculo';

interface Props {
  item: string;
  /** Desativa a consulta (ex.: modo etiq. pronta, em que o item não é código). */
  enabled?: boolean;
}

/**
 * Mostra, no preview do formulário, se o item bipado está cadastrado no app
 * (itens_cadastro) e/ou espelhado no Auge (auge_produtos). Não altera dados —
 * apenas informa o conferente sobre o vínculo, para facilitar a conciliação.
 */
export default function ItemVinculoBadge({ item, enabled = true }: Props) {
  const { data, loading, codigoConsultado } = useItemVinculo(item, { enabled });

  if (!enabled || !(item || '').trim()) return null;

  if (loading && !data) {
    return (
      <div className="col-span-2 flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Consultando cadastros para "{codigoConsultado}"…
      </div>
    );
  }

  if (!data) return null;

  const { local, auge } = data;
  const nenhum = !local && !auge;
  const descricao = local?.descricao || auge?.descricao || '';

  return (
    <div
      className={`col-span-2 rounded-md border px-3 py-2 space-y-1.5 ${
        nenhum
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-primary/25 bg-primary/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
          Vínculo do item
        </span>
        <div className="flex flex-wrap gap-1.5">
          {local ? (
            <Badge
              variant="secondary"
              className="h-5 gap-1 border border-primary/30 bg-primary/10 text-[10px] text-primary"
              title={`Cadastrado como ${local.codigoInterno} (via ${local.via})`}
            >
              <Database className="h-2.5 w-2.5" /> Cadastro
              {local.via === 'fornecedor' && (
                <span className="opacity-70">· forn.</span>
              )}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="h-5 gap-1 border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground/70"
            >
              <Database className="h-2.5 w-2.5" /> Sem cadastro
            </Badge>
          )}
          {auge ? (
            <Badge
              variant="secondary"
              className="h-5 gap-1 border border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-700 dark:text-violet-300"
              title={`Encontrado no Auge como ${auge.codigo}`}
            >
              <Cloud className="h-2.5 w-2.5" /> Auge
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="h-5 gap-1 border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground/70"
            >
              <Cloud className="h-2.5 w-2.5" /> Fora do Auge
            </Badge>
          )}
        </div>
      </div>

      {descricao && (
        <p className="text-xs font-medium text-foreground/85 leading-snug break-words">
          {descricao}
        </p>
      )}

      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
        {nenhum ? (
          <>
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span>"{codigoConsultado}" não encontrado — será gravado como digitado.</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3 w-3 text-primary" />
            <span>
              Bipado: {codigoConsultado}
              {local && local.codigoInterno !== codigoConsultado && (
                <> → <span className="font-bold text-foreground">{local.codigoInterno}</span></>
              )}
              {!local && auge && auge.codigo !== codigoConsultado && (
                <> → <span className="font-bold text-foreground">{auge.codigo}</span> (Auge)</>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
