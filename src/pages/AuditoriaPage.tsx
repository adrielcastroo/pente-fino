import { RequireRole } from '@/components/auth/RequireRole';
import { ShieldAlert } from 'lucide-react';
import AugeKardexTab from '@/components/auge/AugeKardexTab';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

function AuditoriaContent() {
  useDocumentTitle('Auditoria');
  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-[1400px] mx-auto min-w-0 h-full flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
          <p className="text-xs text-muted-foreground">
            Kardex — histórico unificado de movimentações do Auge (ERP).
          </p>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <AugeKardexTab />
      </div>
    </div>
  );
}

export default function AuditoriaPage() {
  return (
    <RequireRole
      action="view:auditoria"
      fallback={
        <div className="p-8 max-w-md mx-auto text-center space-y-3">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h2 className="text-lg font-bold">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">
            A trilha de auditoria está disponível apenas para perfis Gerente e Admin.
          </p>
        </div>
      }
    >
      <AuditoriaContent />
    </RequireRole>
  );
}
