import { X, Camera, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memo, RefObject } from 'react';

interface CameraOverlayProps {
  cameraActive: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  stopCamera: () => void;
  snapPhoto: () => void;
}

export const CameraOverlay = memo(({ cameraActive, videoRef, stopCamera, snapPhoto }: CameraOverlayProps) => {
  if (!cameraActive) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-square sm:aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border-4 border-white/10 group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover scale-[1.01]" 
        />
        <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-2xl m-8 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-6 right-6 flex gap-3">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={stopCamera} 
            className="rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border-white/10 text-white w-12 h-12 shadow-lg transition-transform active:scale-90"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8">
          <button 
            onClick={snapPhoto} 
            className="group/btn relative flex items-center justify-center w-24 h-24 rounded-full bg-white transition-all hover:scale-110 active:scale-95 shadow-2xl"
          >
            <div className="absolute inset-[-12px] rounded-full border-4 border-white/20 animate-pulse" />
            <div className="absolute inset-[-6px] rounded-full border-2 border-white/40" />
            <div className="w-18 h-18 rounded-full border-4 border-black/5 flex items-center justify-center">
              <Camera className="w-10 h-10 text-black group-hover/btn:scale-110 transition-transform" />
            </div>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
              <Zap className="w-3 h-3 fill-current" />
              Capturar agora
            </div>
          </button>
        </div>
      </div>
      <p className="mt-8 text-white/40 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
        Posicione a etiqueta no centro do quadro
      </p>
    </div>
  );
});

CameraOverlay.displayName = 'CameraOverlay';
