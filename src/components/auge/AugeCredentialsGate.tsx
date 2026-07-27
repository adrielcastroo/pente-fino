import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import AugeUserCredentialsDialog from '@/components/auge/AugeUserCredentialsDialog';
import { toast } from 'sonner';

/**
 * Monta um gate global de credenciais do Auge:
 * - Ao logar (ou registrar), verifica se o usuário tem credenciais próprias.
 * - Se não tiver: abre um popup centralizado com fundo desfocado explicando
 *   por que são necessárias.
 * - Usuários novos (sign-up) também recebem um toast informativo antes do popup.
 */
export default function AugeCredentialsGate() {
  const { user, loading, isGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const checkedFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user || isGuest) return;
    if (checkedFor.current === user.id) return;
    checkedFor.current = user.id;

    (async () => {
      try {
        const { data, error } = await (supabase.rpc as any)('i_have_auge_credentials');
        if (error) return;
        const ok = !!data;
        setHasCreds(ok);
        if (!ok) {
          // Nova conta ou usuário sem credenciais: mostra toast e abre popup.
          const createdAt = new Date(user.created_at ?? 0).getTime();
          const isNew = Date.now() - createdAt < 5 * 60 * 1000; // 5 min
          if (isNew) {
            toast.info('Configure suas credenciais do Auge para começar a usar as ações no ERP.', {
              duration: 6000,
            });
          }
          setOpen(true);
        }
      } catch { /* silencioso */ }
    })();
  }, [user, loading, isGuest]);

  // Reseta quando o usuário desloga
  useEffect(() => {
    if (!user) {
      checkedFor.current = null;
      setHasCreds(null);
      setOpen(false);
    }
  }, [user]);

  if (!user || isGuest) return null;

  return (
    <AugeUserCredentialsDialog
      open={open}
      onOpenChange={setOpen}
      required={hasCreds === false}
      onSaved={() => setHasCreds(true)}
    />
  );
}
