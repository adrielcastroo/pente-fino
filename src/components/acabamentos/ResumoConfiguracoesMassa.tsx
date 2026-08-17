import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';

export interface ConfigResumo {
  cd_configuracao: string;
  nm_configuracao: string;
  count: number;
}

interface ResumoConfiguracoesMassaProps {
  configs: ConfigResumo[];
  onRemove: (cd: string) => void;
  onClear: () => void;
  termoBusca?: string; // Mantido para compatibilidade se necessário
}

export function ResumoConfiguracoesMassa({ configs, onRemove, onClear }: ResumoConfiguracoesMassaProps) {
  if (configs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3"
    >
      <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-primary/5">
        <div className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-primary tracking-tight uppercase">Configurações Afetadas</h3>
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px] px-1.5 py-0">
              {configs.length} Configurações
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-7 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            Limpar Tudo
          </Button>
        </div>
        
        <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
          <AnimatePresence initial={false}>
            {configs.map((cfg) => (
              <motion.div
                key={cfg.cd_configuracao}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-lg border border-primary/10 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-mono text-[10px] text-primary/70 font-bold bg-primary/5 px-1.5 py-0.5 rounded">
                      #{cfg.cd_configuracao}
                    </span>
                    <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors uppercase">
                      {cfg.nm_configuracao}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                    <ArrowRight className="h-3 w-3 text-primary/40" />
                    <span>{cfg.count} itens técnicos mapeados</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => onRemove(cfg.cd_configuracao)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="px-4 py-2.5 bg-muted/30 border-t border-primary/5 text-[10px] text-muted-foreground italic flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
          <span>Ações em massa impactam diretamente a integridade do Auge. Revise antes de consolidar.</span>
        </div>
      </Card>
    </motion.div>
  );
}
