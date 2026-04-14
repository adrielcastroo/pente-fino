import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePerformance } from '@/hooks/use-performance';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';

// Custom Hooks
import { useCamera } from '@/hooks/use-camera';
import { useAIVision } from '@/hooks/use-ai-vision';
import { useLeftPanelForm } from '@/hooks/use-left-panel-form';

// UI Components
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import ImportTecidosModal from '@/components/ImportTecidosModal';

// Sub-components
import { CameraOverlay } from './dashboard/form/CameraOverlay';
import { AIStatus } from './dashboard/form/AIStatus';
import { ModeSelector } from './dashboard/form/ModeSelector';
import { FormInputs } from './dashboard/form/FormInputs';
import { FormActions } from './dashboard/form/FormActions';

const LeftPanel = memo(function LeftPanel() {
  const { isLow } = usePerformance();
  const { undoStack, undo } = useAppStore(useShallow(s => ({
    undoStack: s.undoStack,
    undo: s.undo
  })));

  const form = useLeftPanelForm();
  const { aiLoading, aiStatus, progress, processOpenRouter, setAiStatus, setProgress } = useAIVision();

  const [preview, setPreview] = useState<string | null>(null);
  const [fotoB64, setFotoB64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');
  const [importOpen, setImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Handling Logic
  const autoSaveCapturedPhoto = useCallback((dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const safeItem = (form.formData.item || 'rolo').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 24);
    link.download = `conferencia_${date}_${safeItem}_${time}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Foto salva automaticamente');
  }, [form.formData.item]);

  const onCapture = useCallback((b64: string, mime: string, url: string) => {
    setFotoB64(b64);
    setFotoMime(mime);
    setPreview(url);
    autoSaveCapturedPhoto(url);
  }, [autoSaveCapturedPhoto]);

  const { cameraActive, videoRef, openLiveCamera, stopCamera, snapPhoto } = useCamera(onCapture);

  const loadFile = useCallback((file: File) => {
    setFotoMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFotoB64(result.split(',')[1]);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { loadFile(f); toast.success('Imagem colada'); }
        break;
      }
    }
  }, [loadFile]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  const applyAIResult = (parsed: any) => {
    const updates: any = {};
    if (parsed.item) updates.item = parsed.item;
    if (parsed.width) {
      const widthNum = parseInt(parsed.width, 10);
      if (widthNum > 0) updates.aiLargura = (widthNum / 100).toFixed(2);
    }
    if (parsed.m2) {
      const m2Val = parseFloat(parsed.m2);
      updates.m2 = m2Val.toFixed(1);
      const widthNum = parsed.width ? parseInt(parsed.width, 10) / 100 : 0;
      if (widthNum > 0 && m2Val > 0) updates.aiMLinear = (m2Val / widthNum).toFixed(1);
    }
    form.setFormData(updates);
  };

  const handleProcessAI = async () => {
    if (!fotoB64) { toast.warning('Adicione uma foto primeiro.'); return; }
    const result = await processOpenRouter(fotoB64, fotoMime);
    if (result) applyAIResult(result);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
        nextRef.current.select();
      } else {
        form.handleAdd();
      }
    }
  };

  const handleModeChange = (mode: any) => {
    form.setMode(mode);
    setAiStatus(null);
    setProgress(0);
  };

  return (
    <div 
      className="relative flex flex-col h-full overflow-hidden bg-background p-1.5 sm:p-4"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f?.type.startsWith('image/')) loadFile(f);
      }}
    >
      <AIStatus aiLoading={aiLoading} aiStatus={aiStatus} progress={progress} />
      <CameraOverlay cameraActive={cameraActive} videoRef={videoRef} stopCamera={stopCamera} snapPhoto={snapPhoto} />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5 sm:px-2 pb-6">
        <ModeSelector currentMode={form.currentMode} onModeChange={handleModeChange} isLow={isLow} />

        <FormInputs 
          {...form} 
          handleFieldKeyDown={handleFieldKeyDown}
          handleEnderecoChange={(val) => {
             const clean = val.toUpperCase().replace(/\./g, '');
             let formatted = clean;
             if (clean.length > 6) formatted = `${clean.slice(0, 5)}.${clean.slice(5, 6)}.${clean.slice(6)}`;
             else if (clean.length > 5) formatted = `${clean.slice(0, 5)}.${clean.slice(5)}`;
             form.setFormData({ endereco: formatted });
             if (form.lockEndereco) form.setLockedEndereco(formatted);
          }}
          handleProcessoChange={(val) => {
            const normalized = val.replace(/[''`]/g, '-');
            form.setProcesso(normalized);
            if (form.lockProcesso) form.setLockedProcesso(normalized);
          }}
          handleNfChange={(val) => {
            const normalized = val.replace(/[''`]/g, '-');
            form.setFormData({ nf: normalized });
            if (form.lockNf) form.setLockedNf(normalized);
          }}
          handleItemChange={(val) => form.setFormData({ item: val.replace(/[''`]/g, '-') })}
          toggleLockEndereco={() => {
            const newLock = !form.lockEndereco;
            form.setLockEndereco(newLock);
            if (newLock) form.setLockedEndereco(form.formData.endereco);
            toast.success(`Endereço ${newLock ? 'travado' : 'destravado'}`);
          }}
          toggleLockProcesso={() => {
            const newLock = !form.lockProcesso;
            form.setLockProcesso(newLock);
            if (newLock) form.setLockedProcesso(form.processo);
            toast.success(`PROC ${newLock ? 'travado' : 'destravado'}`);
          }}
          toggleLockNf={() => {
            const newLock = !form.lockNf;
            form.setLockNf(newLock);
            if (newLock) form.setLockedNf(form.formData.nf);
            toast.success(`NF ${newLock ? 'travada' : 'destravada'}`);
          }}
        />

        <div className="mt-8">
           <FormActions 
            currentMode={form.currentMode}
            onAdd={form.handleAdd}
            onReset={() => {
              form.resetFormData();
              setAiStatus(null);
              setProgress(0);
              stopCamera();
              setTimeout(() => form.itemRef.current?.focus(), 50);
            }}
            onUndo={() => { const r = undo(); if (r) toast.success(`Restaurado: ${r.item}`); }}
            undoStackLength={undoStack.length}
            onImport={() => setImportOpen(true)}
            onProcessAI={handleProcessAI}
            onOpenFile={() => fileInputRef.current?.click()}
            onOpenCamera={openLiveCamera}
            isAI={form.currentMode === 'openrouter'}
            aiLoading={aiLoading}
          />
        </div>

        {/* Hidden inputs for file/camera */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
      </div>

      <ImportTecidosModal open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
});

export default LeftPanel;
