import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Package, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Banner global exibido quando o usuário está retomando uma conferência arquivada
 * via "Incluir Item" no /historico. Mostra o nome da pasta, contagem de itens
 * herdados e botões para concluir ou cancelar a inclusão.
 */
export default function ResumeBanner() {
  const navigate = useNavigate();
  const resumeMode = useAppStore(s => s.resumeMode);
  const registros = useAppStore(s => s.registros);
  const finish = useAppStore(s => s.finishResumeConference);
  const cancel = useAppStore(s => s.cancelResumeConference);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!resumeMode) return null;

  const lockedCount = resumeMode.lockedIds.length;
  const newCount = registros.filter(r => !resumeMode.lockedIds.includes(r.id)).length;

  const handleFinish = async () => {
    setSaving(true);
    try {
      await finish();
      navigate('/estoque/historico');
    } catch {
      /* toast já exibido */
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (newCount > 0) {
      setConfirmCancel(true);
      return;
    }
    cancel();
    navigate('/estoque/historico');
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="sticky top-0 z-40 border-b border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 backdrop-blur-md"
          role="status"
          aria-label="Modo de inclusão na conferência"
        >
          <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  Incluindo itens em: <span className="text-primary">{resumeMode.folderName}</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" aria-hidden="true" /> {lockedCount} bipados
                  </span>
                  <span className="text-border" aria-hidden="true">·</span>
                  <span className="text-primary font-medium">+{newCount} novos</span>
                  <span className="text-border hidden sm:inline" aria-hidden="true">·</span>
                  <span className="hidden sm:inline">Remover itens antigos só em /historico</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="h-9 gap-1.5"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cancelar</span>
              </Button>
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={saving}
                className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {saving ? 'Salvando…' : 'Concluir inclusão'}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden">
          <AlertDialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0">
            <AlertDialogTitle>Descartar itens novos?</AlertDialogTitle>
            <AlertDialogDescription>
              Você adicionou {newCount} item(ns) novos que ainda não foram salvos no histórico.
              Cancelar agora vai descartá-los.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-5 sm:p-6 pt-2 sm:pt-2 space-y-4">
            <AlertDialogDescription>
              Você adicionou {newCount} item(ns) novos que ainda não foram salvos no histórico.
              Cancelar agora vai descartá-los.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="p-5 sm:p-6 pt-4 sm:pt-4 mt-0">
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancel();
                navigate('/estoque/historico');
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
