import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, X, Info, Search } from 'lucide-react';

interface ResumoConfiguracoesMassaProps {
  termoBusca: string;
  customAberta?: { cd: string; nm: string };
  setCustomAberta?: (v: { cd: string; nm: string }) => void;
  obrigatoriasCount: number;
  configuracoesAtivas: Array<{ cd_configuracao: string; nm_configuracao: string; qtd_tags: number }>;
  onRemove: (cd: string) => void;
  onClear: () => void;
}

export function ResumoConfiguracoesMassa({ 
  termoBusca, 
  customAberta, 
  setCustomAberta,
  obrigatoriasCount,
  configuracoesAtivas,
  onRemove,
  onClear
}: ResumoConfiguracoesMassaProps) {
  if (!termoBusca.trim() && !customAberta) return null;

  const hasAtivas = configuracoesAtivas.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 w-full"
      data-testid="config-summary"
    >
      <Card className="overflow-hidden border-primary/20 shadow-xl bg-card">
        {/* Header do Bloco */}
        <div className="bg-primary/5 px-4 py-4 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <h3 className="text-sm font-bold text-foreground tracking-tight uppercase">
              Configurações Afetadas
            </h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5">
              {configuracoesAtivas.length} Configurações
            </Badge>
            {obrigatoriasCount > 0 && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[9px] px-1.5 py-0 uppercase">
                {obrigatoriasCount} TAGs Obrigatórias
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasAtivas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-8 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all uppercase tracking-wider"
              >
                Limpar Tudo
              </Button>
            )}
            {customAberta && setCustomAberta && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCustomAberta({ cd: '', nm: '' })}
                className="h-8 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all gap-1.5 uppercase tracking-wider"
              >
                <X className="h-3.5 w-3.5" />
                Desvincular
              </Button>
            )}
          </div>
        </div>
        
        {/* Lista de Configurações */}
        <div className="p-0">
          <div 
            className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-primary/5"
            data-testid="config-summary-list"
          >
            <AnimatePresence mode="popLayout">
              {configuracoesAtivas.map((cfg) => (
                <motion.div
                  key={cfg.cd_configuracao}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between gap-4 p-4 hover:bg-primary/[0.02] transition-colors duration-200"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded shadow-sm">
                          #{cfg.cd_configuracao}
                        </span>
                        <span className="text-[12px] font-bold truncate text-foreground uppercase tracking-tight">
                          {cfg.nm_configuracao}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                        <ArrowRight className="h-3 w-3 text-primary/40" />
                        <span>→ {cfg.qtd_tags || 0} itens técnicos mapeados</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(cfg.cd_configuracao)}
                    className="h-8 px-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive text-[10px] font-bold uppercase tracking-wider gap-1.5 border border-transparent hover:border-destructive/20"
                  >
                    <X className="h-3.5 w-3.5" />
                    remover
                  </Button>
                </motion.div>
              ))}

              {/* Estado quando não há resultados */}
              {!hasAtivas && termoBusca.trim() && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted/50">
                      <Search className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">0 configurações encontradas</p>
                      <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                        Nenhum registro corresponde aos termos "<span className="text-primary font-mono">{termoBusca}</span>" na base de dados.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {customAberta?.cd && !configuracoesAtivas.some(c => c.cd_configuracao === customAberta.cd) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-primary/[0.03] border-t border-primary/10"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-primary font-bold bg-primary/20 px-2 py-0.5 rounded">
                        #{customAberta.cd}
                      </span>
                      <span className="text-xs font-bold truncate text-primary uppercase">
                        {customAberta.nm}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground font-medium italic">
                      <ArrowRight className="h-3 w-3 text-primary/40" />
                      <span>Configuração de Autoridade vinculada manualmente</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Rodapé de Aviso */}
        <div className="px-4 py-3 bg-muted/30 border-t border-primary/10 text-[10px] text-muted-foreground font-medium flex items-center gap-3">
          <Info className="h-4 w-4 text-primary shrink-0 opacity-70" />
          <span className="leading-tight">
            O motor de inteligência processa apenas as configurações listadas acima. 
            A precisão é garantida pela combinação de tokens técnicos e validação de autoridade do Auge.
          </span>
        </div>
      </Card>
    </motion.div>
  );
}