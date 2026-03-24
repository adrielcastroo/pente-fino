import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore, gerarLoteUnico, formatML } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, Image, Video, Download, X, Undo2, ScanBarcode,
  Plus, Trash2, Zap, SquarePen, Copy
} from 'lucide-react';

const VISION_PROMPT = `Você é um especialista em leitura de etiquetas de rolos de tecido. Analise a imagem e extraia os 3 campos abaixo.

CAMPO 1 — ITEM (nome ou código do tecido):
Pode aparecer como: ITEM, Item Name, Item No, Ref, REF, Referência, Description, Product, Artigo, Código, Part No, Style
→ Capture o nome/código principal.

CAMPO 2 — LARGURA (do tecido):
Pode aparecer como: WIDTH, WIDTH(CM), Width, Largura, LARG, W, ANCHO
→ Retorne apenas o número em "largura_raw" e a unidade original em "unidade" ("cm" ou "m").

CAMPO 3 — METRAGEM LINEAR (comprimento do rolo):
Pode aparecer como: LENGTH, Length, QUANTITY, Quantity, Q'TY, Q'TY(Net), QTY, MTR, Metros
→ Extraia apenas o número principal em metros.

CAMPO EXTRA — COR (opcional):
Pode aparecer como: COLOR, Colour, Cor

Retorne SOMENTE este JSON válido, sem markdown, sem explicações:
{"item":"<nome/código>","largura_raw":<número float ou null>,"unidade":"cm ou m","metragem_linear":<número float ou null>,"cor":"<cor ou null>"}`;

export default function LeftPanel() {
  const { currentMode, setMode, nfe, registros, addRegistro, undo: undoAction, undoStack } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

  const [item, setItem] = useState('');
  const [ml, setMl] = useState('');
  const [larg, setLarg] = useState('');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');
  const [fotoB64, setFotoB64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');
  const [preview, setPreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [enderecoError, setEnderecoError] = useState('');

  const mlNum = parseFloat(ml) || 0;
  const lgNum = parseFloat(larg) || 0;
  const m2 = mlNum * lgNum;
  const mlFmt = formatML(mlNum);
  const lotePreview = [endereco, nfe, mlFmt].filter(Boolean).join(' ');
  const isDuplicate = item && registros.some(r => r.item.toLowerCase() === item.toLowerCase());

  const getPhotoFileName = useCallback(() => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const safeItem = (item || 'rolo').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 24);
    return `conferencia_${date}_${safeItem}_${time}.jpg`;
  }, [item]);

  const downloadDataUrl = useCallback((dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const autoSaveCapturedPhoto = useCallback((dataUrl: string) => {
    downloadDataUrl(dataUrl, getPhotoFileName());
    addToast('Foto salva automaticamente no dispositivo', 'ok');
  }, [addToast, downloadDataUrl, getPhotoFileName]);

  const ENDERECO_REGEX = /^TEC\d{2}\.[A-Z]\.N\d{2}$/;

  const validateEndereco = (val: string) => {
    if (!val) { setEnderecoError(''); return; }
    if (!ENDERECO_REGEX.test(val)) {
      setEnderecoError('Padrão: TEC01.A.N03');
    } else {
      setEnderecoError('');
    }
  };

  const handleEnderecoChange = (val: string) => {
    const upper = val.toUpperCase();
    setEndereco(upper);
    validateEndereco(upper);
  };

  const scanEnderecoFromFile = async (file: File) => {
    try {
      const scanner = new Html5Qrcode('endereco-scanner-file');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear().catch(() => {});
      const upper = decodedText.toUpperCase().trim();
      setEndereco(upper);
      validateEndereco(upper);
      addToast(`Código lido: ${upper}`, 'ok');
    } catch {
      addToast('Não foi possível ler o QR Code da imagem capturada.', 'err');
    }
  };

  const startScanner = () => {
    scannerInputRef.current?.click();
  };

  const savePhotoLocally = () => {
    if (!preview) { addToast('Nenhuma foto para salvar.', 'warn'); return; }
    downloadDataUrl(preview, getPhotoFileName());
    addToast('Foto salva no dispositivo', 'ok');
  };

  const resetForm = () => {
    setItem(''); setMl(''); setLarg(''); setEndereco(''); setObs('');
    setFotoB64(null); setPreview(null); setAiStatus(null); setProgress(0);
    setEnderecoError('');
    stopCamera();
  };

  const loadFile = useCallback((file: File, options?: { autoSave?: boolean }) => {
    setFotoMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFotoB64(result.split(',')[1]);
      setPreview(result);
      if (options?.autoSave) autoSaveCapturedPhoto(result);
    };
    reader.readAsDataURL(file);
  }, [autoSaveCapturedPhoto]);

  const openNativeCamera = () => { cameraInputRef.current?.click(); };

  const openLiveCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      openNativeCamera();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const snapPhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.85);
    setFotoB64(url.split(',')[1]);
    setFotoMime('image/jpeg');
    setPreview(url);
    autoSaveCapturedPhoto(url);
    stopCamera();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) loadFile(f);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { loadFile(f); addToast('Imagem colada', 'ok'); }
        break;
      }
    }
  }, [loadFile, addToast]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  const applyResult = (parsed: any, provider: string) => {
    let largM = parseFloat(parsed.largura_raw) || 0;
    if (parsed.unidade === 'cm' || largM > 5) largM = largM / 100;
    if (parsed.item) setItem(parsed.item);
    if (largM > 0) setLarg(largM.toFixed(2));
    if (parsed.metragem_linear) setMl(parseFloat(parsed.metragem_linear).toFixed(1));
    if (parsed.cor && parsed.cor !== 'null' && !obs) setObs(parsed.cor);
    const cor = parsed.cor && parsed.cor !== 'null' ? ' · Cor: ' + parsed.cor : '';
    return `✓ ${provider}: ${parsed.item || '—'} · Larg ${largM > 0 ? largM.toFixed(2) + 'm' : '—'} · M.Lin ${parsed.metragem_linear || '—'}m${cor}`;
  };

  const processOpenRouter = async () => {
    if (!fotoB64) { addToast('Adicione uma foto primeiro.', 'warn'); return; }
    const key = localStorage.getItem('cft4_or_key') || '';
    if (!key) { addToast('Configure a chave OpenRouter em ⚙️ API.', 'warn'); return; }
    const model = localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku';
    setAiLoading(true); setProgress(30); setAiStatus(null);
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:' + fotoMime + ';base64,' + fotoB64 } }, { type: 'text', text: VISION_PROMPT }] }], max_tokens: 300, temperature: 0.1 })
      });
      setProgress(80);
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${resp.status}`); }
      const data = await resp.json();
      const raw = (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      const summary = applyResult(parsed, model.split('/').pop() || 'OpenRouter');
      setProgress(100); setTimeout(() => setProgress(0), 700);
      setAiStatus({ msg: summary, type: 'ok' });
      addToast('OpenRouter processou com sucesso', 'ok');
    } catch (e: any) {
      setProgress(0);
      setAiStatus({ msg: '❌ ' + e.message, type: 'err' });
      addToast('Erro OpenRouter: ' + e.message, 'err');
    }
    setAiLoading(false);
  };

  const handleAdd = () => {
    if (!item) { addToast('Preencha o campo Item.', 'warn'); return; }
    if (!endereco) { addToast('Preencha o Endereço.', 'warn'); return; }
    if (!ENDERECO_REGEX.test(endereco)) { addToast('Endereço inválido. Use: TEC01.A.N03', 'warn'); return; }
    const m2Val = parseFloat((mlNum * lgNum).toFixed(3));
    const loteBase = [endereco, nfe, mlFmt].filter(Boolean).join(' ');
    const lote = gerarLoteUnico(registros, loteBase);
    const reg = { id: Date.now(), item, nfe, endereco, mLinear: mlNum, largura: lgNum, m2: m2Val, lote, obs, isNew: true };
    addRegistro(reg);
    addToast(`✓ ${item} adicionado (${registros.length + 1} rolo${registros.length > 0 ? 's' : ''})`, 'ok');
    resetForm();
    setTimeout(() => { reg.isNew = false; }, 400);
  };

  const handleUndo = () => {
    const restored = undoAction();
    if (restored) addToast('Rolo restaurado', 'ok');
  };

  const modes = [
    { key: 'manual' as const, label: 'Manual', icon: SquarePen },
    { key: 'openrouter' as const, label: 'IA', icon: Zap },
  ];

  const showDropzone = currentMode !== 'manual';

  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="surface-bg border-r border-border overflow-y-auto flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conferir Rolo</span>
        <div className="flex gap-1.5">
          {undoStack.length > 0 && (
            <button onClick={handleUndo} className="p-1.5 rounded-md border border-border hover:bg-surface-2 transition-colors" title="Desfazer">
              <Undo2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button onClick={resetForm} className="p-1.5 rounded-md hover:bg-surface-2 transition-colors" title="Limpar formulário">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {/* Mode Toggle */}
        <div className="flex surface-2-bg border border-border rounded-lg p-0.5 gap-0.5">
          {modes.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  currentMode === m.key
                    ? 'surface-bg text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Manual tip */}
        <AnimatePresence mode="wait">
          {currentMode === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ai-status-box text-xs leading-relaxed"
            >
              Preencha os campos abaixo. Modo rápido — sem foto.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropzone for AI modes */}
        <AnimatePresence mode="wait">
          {showDropzone && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div
                className={`dropzone ${preview ? 'has-img' : ''}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{ height: preview || cameraActive ? 200 : 180 }}
              >
                {/* Live camera preview */}
                {cameraActive && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-xl absolute inset-0"
                  />
                )}

                {/* Image preview */}
                {preview && !cameraActive && (
                  <img src={preview} alt="Preview da etiqueta" className="w-full h-full object-cover rounded-xl" />
                )}

                {/* Empty state */}
                {!preview && !cameraActive && (
                  <div className="text-center p-4 select-none flex flex-col items-center gap-3">
                    <Camera className="w-8 h-8 text-muted-foreground/30" />
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Tire uma foto ou selecione da galeria</div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">JPG · PNG · WEBP · Ctrl+V</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openNativeCamera(); }}
                        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-border hover:bg-surface-2 transition-colors bg-surface font-medium"
                      >
                        <Camera className="w-4 h-4" />
                        Câmera
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-border hover:bg-surface-2 transition-colors bg-surface font-medium"
                      >
                        <Image className="w-4 h-4" />
                        Galeria
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f, { autoSave: true }); e.target.value = ''; }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }}
              />
              <input
                ref={scannerInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) void scanEnderecoFromFile(f); e.target.value = ''; }}
              />
              <div id="endereco-scanner-file" className="hidden" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Controls when camera or preview active */}
              {(preview || cameraActive) && (
                <div className="flex gap-2 mt-2.5">
                  {cameraActive ? (
                    <>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-lg navy-3-bg text-primary-foreground font-medium"
                        onClick={snapPhoto}
                      >
                        <Camera className="w-4 h-4" />
                        Capturar
                      </button>
                      <button
                        className="p-2.5 rounded-lg border border-border hover:bg-surface-2"
                        onClick={stopCamera}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex items-center justify-center gap-1 flex-1 text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-surface-2 transition-colors font-medium" onClick={openNativeCamera} title="Câmera">
                        <Camera className="w-4 h-4" />
                        <span className="hidden sm:inline">Câmera</span>
                      </button>
                      <button className="flex items-center justify-center gap-1 flex-1 text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-surface-2 transition-colors font-medium" onClick={() => fileInputRef.current?.click()} title="Galeria">
                        <Image className="w-4 h-4" />
                        <span className="hidden sm:inline">Galeria</span>
                      </button>
                      <button className="flex items-center justify-center gap-1 text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-surface-2 transition-colors font-medium" onClick={openLiveCamera} title="Ao vivo">
                        <Video className="w-4 h-4" />
                      </button>
                      <button className="flex items-center justify-center gap-1 text-xs px-3 py-2.5 rounded-lg border border-primary/30 hover:bg-primary/5 transition-colors font-medium text-primary" onClick={savePhotoLocally} title="Salvar foto">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="flex items-center justify-center text-xs p-2.5 rounded-lg hover:bg-surface-2 transition-colors text-muted-foreground" onClick={() => { setFotoB64(null); setPreview(null); setAiStatus(null); setProgress(0); }} title="Remover foto">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Progress */}
              <div className="progress-bar mt-2">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* AI Button */}
              {preview && !cameraActive && (
                <button
                  onClick={processOpenRouter}
                  disabled={aiLoading}
                  className="w-full mt-2.5 h-11 navy-3-bg text-primary-foreground rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {aiLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>{aiLoading ? 'Enviando…' : 'Processar com OpenRouter'}</span>
                </button>
              )}

              {/* AI Status */}
              <AnimatePresence>
                {aiStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-2 ai-status-box ${aiStatus.type === 'ok' ? 'ai-status-ok' : 'ai-status-err'}`}
                    dangerouslySetInnerHTML={{ __html: aiStatus.msg }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dados do Rolo</div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Item / Referência</label>
            <input
              value={item} onChange={e => setItem(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono font-medium bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="Código do tecido" autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">M Linear</label>
              <input
                type="number" step="0.1" value={ml} onChange={e => setMl(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="76.9" autoComplete="off" inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Largura (m)</label>
              <input
                type="number" step="0.01" value={larg} onChange={e => setLarg(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="1.40" autoComplete="off" inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Endereço</label>
            <div className="flex gap-2">
              <input
                value={endereco} onChange={e => handleEnderecoChange(e.target.value)}
                className={`flex-1 border rounded-lg px-3 py-2.5 text-sm bg-surface outline-none focus:ring-2 transition-all uppercase font-mono ${
                  enderecoError ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'
                }`}
                placeholder="TEC01.A.N03" autoComplete="off"
              />
              <button
                onClick={startScanner}
                className="px-3 py-2.5 rounded-lg border border-border hover:bg-surface-2 bg-surface transition-colors flex items-center justify-center"
                title="Bipar endereço via câmera"
              >
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>
            {enderecoError && (
              <div className="text-[10px] text-destructive mt-1 font-medium">{enderecoError}</div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Cor (opcional)</label>
            <input
              value={obs} onChange={e => setObs(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="Azul marinho, LT.GREY…" autoComplete="off"
            />
          </div>
        </div>

        {/* Computed Card */}
        <div className="comp-card">
          <div>
            <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">M²</div>
            <div className="text-base font-semibold font-mono">{m2 > 0 ? m2.toFixed(3) + ' m²' : '—'}</div>
          </div>
          <div>
            <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">NFe</div>
            <div className="text-sm font-semibold font-mono opacity-50">{nfe || '—'}</div>
          </div>
        </div>

        {/* Lote */}
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lote</div>
          <div
            className="lote-display"
            onClick={() => {
              if (lotePreview && lotePreview !== '—') {
                navigator.clipboard.writeText(lotePreview);
                addToast('Copiado: ' + lotePreview, 'ok');
              }
            }}
          >
            <span className="truncate">{lotePreview || '—'}</span>
            <Copy className="w-3.5 h-3.5 opacity-35 flex-shrink-0" />
          </div>
        </div>

        {/* Add Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAdd}
          className="w-full h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Adicionar à Tabela
        </motion.button>

        {/* Duplicate warning */}
        <AnimatePresence>
          {isDuplicate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg px-3 py-2.5 text-xs border"
              style={{ background: '#FFF8ED', borderColor: '#F5C97A', color: '#7A5B10' }}
            >
              ⚠️ <b>Possível duplicata</b> — item já existe na tabela.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
