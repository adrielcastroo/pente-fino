import {
  ClipboardList,
  Package,
  ScanLine,
  FileText,
  DollarSign,
  BarChart3,
  Truck,
  ShoppingCart,
  History,
  FileDown,
  Tag,
} from 'lucide-react';
import ModuleHub, { type HubAction } from '@/components/shared/ModuleHub';

const actions: HubAction[] = [
  { to: '/expedicao/painel', label: 'Painel', description: 'Visão geral e SLA', icon: ClipboardList },
  { to: '/expedicao/pickings', label: 'Pickings', description: 'Separações em andamento', icon: Package },
  { to: '/expedicao/conferencia', label: 'Conferência', description: 'Bipar itens do picking', icon: ScanLine },
  { to: '/expedicao/romaneio', label: 'Romaneio', description: 'Gerar e imprimir romaneios', icon: FileText },
  { to: '/expedicao/faturamento', label: 'Faturamento', description: 'NF-e importadas', icon: DollarSign },
  { to: '/expedicao/dashboard', label: 'Operacional', description: 'Indicadores da operação', icon: BarChart3 },
  { to: '/expedicao/logistica', label: 'Logístico', description: 'Rotas e entregas', icon: Truck },
  { to: '/expedicao/carrinhos', label: 'Carrinhos', description: 'Gestão de carrinhos', icon: ShoppingCart },
  { to: '/expedicao/etiquetas', label: 'Etiquetas', description: 'Layout e impressão', icon: Tag },
  { to: '/expedicao/historico', label: 'Histórico', description: 'Expedições anteriores', icon: History },
  { to: '/expedicao/relatorios', label: 'Relatórios', description: 'Exportações e análises', icon: FileDown },
];

export default function ExpedicaoOperacaoHomePage() {
  return (
    <ModuleHub
      question="O que deseja fazer na expedição?"
      primaryCtaTo="/expedicao/conferencia"
      settingsTo="/expedicao/configuracoes"
      actions={actions}
      ariaGridLabel="Ações da expedição"
    />
  );
}
