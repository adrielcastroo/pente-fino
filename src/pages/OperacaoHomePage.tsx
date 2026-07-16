import { Archive, Warehouse, Table as TableIcon, FolderOpen, Package, ArrowRightLeft } from 'lucide-react';
import ModuleHub, { type HubAction } from '@/components/shared/ModuleHub';

const actions: HubAction[] = [
  { to: '/estoque/saida', label: 'Conferir saída', description: 'Bipar documento e itens', icon: Archive },
  { to: '/estoque/mapa', label: 'Consultar estoque', description: 'Localizar posições', icon: Warehouse },
  { to: '/estoque/reservas', label: 'Reservas', description: 'Visualizar e registrar reservas', icon: TableIcon },
  { to: '/estoque/transferencias', label: 'Transferências', description: 'Movimentações entre depósitos (Auge)', icon: ArrowRightLeft },
  { to: '/estoque/cadastros', label: 'Cadastros', description: 'Consultar itens cadastrados', icon: Package },
  { to: '/estoque/historico', label: 'Histórico recente', description: 'Últimas conferências', icon: FolderOpen },
];

export default function OperacaoHomePage() {
  return (
    <ModuleHub
      primaryCtaTo="/estoque/conferencia"
      settingsTo="/estoque/configuracoes"
      actions={actions}
      ariaGridLabel="Ações operacionais"
    />
  );
}
