import { useEffect, memo, lazy, Suspense } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const FormPageLayout = lazy(() => import('@/components/FormPageLayout'));

const TecidoPage = () => {
  const setMode = useAppStore(s => s.setMode);
  const currentMode = useAppStore(s => s.currentMode);
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'tecido' });
    if (!['manual', 'openrouter', 'diversos', 'etiq_pronta'].includes(currentMode)) {
      setMode('manual');
    }
  }, [currentMode, setMode, setFormData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full w-full"
    >
      <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
        <FormPageLayout>
          <LeftPanel />
        </FormPageLayout>
      </Suspense>
    </motion.div>
  );
};

export default memo(TecidoPage);
