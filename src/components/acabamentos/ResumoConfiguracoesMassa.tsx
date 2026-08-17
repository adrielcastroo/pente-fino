import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowRight, X, Info } from 'lucide-react';

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
      className="mt-3"
    >
      <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-primary/5">
        <div className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-primary tracking-tight uppercase">Resumo da Inteligência</h3>
            {obrigatoriasCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px] px-1.5 py-0">
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
                className="h-7 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                Limpar Tudo
              </Button>
            )}
            {customAberta && setCustomAberta && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCustomAberta({ cd: '', nm: '' })}
                className="h-7 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Desvincular
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Escopo de Análise</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Baseado nos termos <span className="font-mono text-primary font-bold">"{termoBusca.trim()}"</span>, 
                o motor identificou <span className="font-bold text-foreground">{configuracoesAtivas.length}</span> configurações para processamento.
              </p>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <AnimatePresence>
              {configuracoesAtivas.map((cfg) => (
                <motion.div
                  key={cfg.cd_configuracao}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between gap-3 p-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[9px] font-mono text-primary/70 font-bold bg-primary/20 px-1.5 py-0.5 rounded">
                        #{cfg.cd_configuracao}
                      </span>
                      <span className="text-[11px] font-semibold truncate text-primary uppercase">
                        {cfg.nm_configuracao}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(cfg.cd_configuracao)}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {customAberta?.cd && !configuracoesAtivas.some(c => c.cd_configuracao === customAberta.cd) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-mono text-primary/70 font-bold bg-primary/20 px-1.5 py-0.5 rounded">
                      #{customAberta.cd}
                    </span>
                    <span className="text-xs font-semibold truncate text-primary uppercase">
                      {customAberta.nm}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                    <ArrowRight className="h-3 w-3 text-primary/40" />
                    <span>Vinculado à Configuração de Autoridade no Auge</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="px-4 py-2.5 bg-muted/30 border-t border-primary/5 text-[10px] text-muted-foreground italic flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
          <span>A precisão absoluta é garantida pela combinação de tokens técnicos e validação de autoridade.</span>
        </div>
      </Card>
    </motion.div>
  );
}