import MainLayout from '@/components/MainLayout';
import ComprasSidebar from '@/components/ComprasSidebar';
import ComprasBottomTabBar from '@/components/ComprasBottomTabBar';

/**
 * Layout do módulo Compras — delega ao MainLayout unificado,
 * injetando a sidebar e a bottom nav específicas do módulo.
 */
export default function ComprasLayout() {
  return (
    <MainLayout
      sidebar={<ComprasSidebar />}
      bottomNav={<ComprasBottomTabBar />}
      navRail={null}
      showResumeBanner={false}
    />
  );
}
