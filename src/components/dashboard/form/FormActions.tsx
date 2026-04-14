import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Undo2, Zap, FileUp, Sparkles, Image, Camera } from 'lucide-react';
import { memo } from 'react';
import { AppMode } from '@/types';

interface FormActionsProps {
  currentMode: AppMode;
  onAdd: () => void;
  onReset: () => void;
  onUndo: () => void;
  undoStackLength: number;
  onImport: () => void;
  onProcessAI: () => void;
  onOpenFile: () => void;
  onOpenCamera: () => void;
  isAI: boolean;
  aiLoading: boolean;
}

export const FormActions = memo((props: FormActionsProps) => {
  const {
    currentMode, onAdd, onReset, onUndo, undoStackLength,
    onImport, onProcessAI, onOpenFile, onOpenCamera,
    isAI, aiLoading
  } = props;

  return (
    <div className="flex flex-col gap-4 px-1.5 pb-2">
      {/* Primary Action Button */}
      <Button 
        onClick={onAdd} 
        size="lg" 
        className="h-16 w-full rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-500" />
        <span className="text-base font-black uppercase tracking-[0.15em]">Adicionar Registro</span>
        <Badge variant="secondary" className="ml-3 bg-white/15 text-white/90 border-none font-bold tabular-nums">Enter</Badge>
      </Button>

      {/* AI Assistant Buttons (Conditional) */}
      {isAI && (
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" size="lg" onClick={onProcessAI} disabled={aiLoading}
            className="flex-1 h-14 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all group"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Processar com IA
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" size="icon" onClick={onOpenFile}
              className="h-14 w-14 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-all active:scale-90"
            >
              <Image className="w-5 h-5" />
            </Button>
            <Button 
              variant="secondary" size="icon" onClick={onOpenCamera}
              className="h-14 w-14 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-all active:scale-90"
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Auxiliary Buttons Row */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" onClick={onReset}
          className="flex-1 h-12 rounded-xl border-border/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground group"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
          Limpar
        </Button>
        
        {undoStackLength > 0 && (
          <Button 
            variant="outline" onClick={onUndo}
            className="flex-1 h-12 rounded-xl border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground group"
          >
            <Undo2 className="w-3.5 h-3.5 mr-2 group-hover:-rotate-45 transition-transform" />
            Desfazer
          </Button>
        )}
        
        {currentMode === 'manual' && (
          <Button 
            variant="outline" onClick={onImport}
            className="flex-1 h-12 rounded-xl border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground group"
          >
            <FileUp className="w-3.5 h-3.5 mr-2" />
            Importar
          </Button>
        )}
      </div>
    </div>
  );
});

FormActions.displayName = 'FormActions';
