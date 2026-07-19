import MainLayout from '@/components/MainLayout';
import ExpedicaoSidebar from '@/components/ExpedicaoSidebar';
import ExpedicaoBottomTabBar from '@/components/ExpedicaoBottomTabBar';

/**
 * Layout do módulo Expedição — delega ao MainLayout unificado,
 * injetando a sidebar e a bottom nav específicas do módulo.
 * Isso traz automaticamente TopBar, Breadcrumbs, CommandPalette,
 * ModuleSwitchFab, footer padronizado e presence tracking.
 */
export default function ExpedicaoLayout() {
  return (
    <MainLayout
      sidebar={<ExpedicaoSidebar />}
      bottomNav={<ExpedicaoBottomTabBar />}
      navRail={null}
      showResumeBanner={false}
    />
  );
}
