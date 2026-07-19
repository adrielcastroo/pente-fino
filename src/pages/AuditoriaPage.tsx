import { RequireRole } from '@/components/auth/RequireRole';
import { ShieldAlert } from 'lucide-react';
import AugeKardexTab from '@/components/auge/AugeKardexTab';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';

function AuditoriaContent() {
  useDocumentTitle('Auditoria');
  return (
    <div className="space-y-4 w-full min-w-0 h-full flex flex-col">
      <PageHeader title="Auditoria" />
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
