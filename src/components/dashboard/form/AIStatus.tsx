import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { memo } from 'react';

interface AIStatusProps {
  aiLoading: boolean;
  aiStatus: { msg: string; type: 'ok' | 'err' } | null;
  progress: number;
}

export const AIStatus = memo(({ aiLoading, aiStatus, progress }: AIStatusProps) => {
  if (!aiLoading && !aiStatus) return null;

  return (
    <div className="absolute top-2.5 right-2.5 z-40 max-w-[280px]">
      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 backdrop-blur-xl transition-all duration-300 shadow-2xl ${
        aiLoading ? 'bg-primary/10 border-primary/20 animate-pulse ring-4 ring-primary/5' : 
        aiStatus?.type === 'ok' ? 'bg-green-500/10 border-green-500/20 ring-4 ring-green-500/5' : 
        'bg-destructive/10 border-destructive/20 ring-4 ring-destructive/5'
      }`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          aiLoading ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 
          aiStatus?.type === 'ok' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 
          'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20'
        }`}>
          {aiLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : 
           aiStatus?.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : 
           <AlertTriangle className="w-4 h-4" />}
        </div>
        
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 mb-0.5">
            IA Assistente
          </p>
          <p className={`text-[11px] font-bold truncate ${
            aiStatus?.type === 'err' ? 'text-destructive' : 'text-foreground'
          }`}>
            {aiLoading ? `Processando imagem... ${progress}%` : aiStatus?.msg}
          </p>
        </div>
      </div>
    </div>
  );
});

AIStatus.displayName = 'AIStatus';
