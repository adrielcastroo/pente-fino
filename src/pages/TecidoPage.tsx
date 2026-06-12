
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LeftPanel from '@/components/LeftPanel';
import FormPageLayout from '@/components/FormPageLayout';
import { motion } from 'framer-motion';

export default function TecidoPage() {
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
      transition={{ duration: 0.4, ease: \"easeOut\" }}
      className=\"h-full w-full overflow-hidden\"
    >
      <FormPageLayout>
        <LeftPanel />
      </FormPageLayout>
    </motion.div>
  );
}
