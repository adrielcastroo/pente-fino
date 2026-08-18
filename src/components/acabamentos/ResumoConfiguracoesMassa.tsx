import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTagCustomConfigurationSearch } from '@/hooks/useTagCustomConfigurationSearch';

interface ResumoConfiguracoesMassaProps {
  termoBusca: string;
  customAberta: { cd: string; nm: string } | null;
  setCustomAberta: (v: { cd: string; nm: string } | null) => void;
  obrigatoriasCount: number;
}

export function ResumoConfiguracoesMassa({
  termoBusca,
  customAberta,
  setCustomAberta,
  obrigatoriasCount
}: ResumoConfiguracoesMassaProps) {
  const termo = termoBusca.trim();
  const { data: configsResumo = [], isLoading: carregandoResumo } = useTagCustomConfigurationSearch(termo);

  const totalTagsMassa = useMemo(() => 
    configsResumo.reduce((s, c) => s + (c.qtd_tags ?? 0), 0),
    [configsResumo]
  );

  if (termo.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-muted/30 overflow-hidden"
    >
      <details className="group">
        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors list-none">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Resumo{' '}
              {configsResumo.length > 0
                ? `(${configsResumo.length} configurações · ${totalTagsMassa} TAGs)`
                : carregandoResumo
                  ? '(buscando…)'
                  : '(nenhuma configuração encontrada)'}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <div className="px-3 pb-3 space-y-3 border-t pt-2">
          {configsResumo.length > 0 ? (
            <>
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground leading-relaxed flex items-center justify-between">
                  <span>
                    Exibindo configurações que possuam <strong>TODOS</strong> os tokens/palavras inseridas na busca (Curinga SAP B1).
                    As alterações realizadas na composição abaixo serão aplicadas a todas as configurações listadas aqui.
                  </span>
                  {obrigatoriasCount > 0 && (
                    <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-600 bg-blue-50/50">
                      {obrigatoriasCount} TAGs Reconhecidas
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 px-1">
                    <Sparkles className="h-2.5 w-2.5" /> Configurações que serão alteradas ({configsResumo.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1 p-1 bg-background/40 rounded-md border border-dashed">
                    {configsResumo.map((cfg) => {
                      const isSelected = customAberta?.cd === cfg.cd_configuracao;
                      return (
                        <button
                          key={cfg.cd_configuracao}
                          onClick={() => setCustomAberta({ cd: cfg.cd_configuracao, nm: cfg.nm_configuracao })}
                          className={cn(
                            "px-2 py-1 rounded-full border text-[10px] transition-all flex items-center gap-1.5",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:border-primary/50 text-muted-foreground"
                          )}
                        >
                          <span className="truncate max-w-[150px]">{cfg.nm_configuracao}</span>
                          <Badge variant="secondary" className={cn(
                            "h-3.5 px-1 text-[8px] min-w-[1.2rem] flex justify-center",
                            isSelected ? "bg-primary-foreground/20 text-primary-foreground border-transparent" : ""
                          )}>
                            {cfg.qtd_tags}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              {carregandoResumo ? (
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando configurações compatíveis...
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground italic">
                  Nenhuma configuração encontrada para os termos digitados.
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </motion.div>
  );
}
