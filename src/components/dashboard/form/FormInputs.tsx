import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Unlock, Badge } from 'lucide-react';
import { memo, RefObject } from 'react';
import { AppMode, FormData } from '@/types';

interface FormInputsProps {
  currentMode: AppMode;
  formData: FormData;
  setFormData: (updates: Partial<FormData>) => void;
  processo: string;
  setProcesso: (p: string) => void;
  lockProcesso: boolean;
  setLockProcesso: (l: boolean) => void;
  lockNf: boolean;
  setLockNf: (l: boolean) => void;
  lockEndereco: boolean;
  setLockEndereco: (l: boolean) => void;
  enderecoError: string;
  itemRef: RefObject<HTMLInputElement>;
  nfRef: RefObject<HTMLInputElement>;
  m2Ref: RefObject<HTMLInputElement>;
  larguraRef: RefObject<HTMLInputElement>;
  loteRef: RefObject<HTMLInputElement>;
  enderecoRef: RefObject<HTMLInputElement>;
  quantidadeRef: RefObject<HTMLInputElement>;
  manualLarguraRef: RefObject<HTMLInputElement>;
  handleFieldKeyDown: (e: React.KeyboardEvent, nextRef: RefObject<HTMLInputElement> | null) => void;
  handleEnderecoChange: (val: string) => void;
  handleProcessoChange: (val: string) => void;
  handleNfChange: (val: string) => void;
  handleItemChange: (val: string) => void;
  toggleLockEndereco: () => void;
  toggleLockProcesso: () => void;
  toggleLockNf: () => void;
  largura: number;
  mLinear: number;
}

export const FormInputs = memo((props: FormInputsProps) => {
  const {
    currentMode, formData, setFormData, processo, setProcesso,
    lockProcesso, lockNf, lockEndereco, enderecoError,
    itemRef, nfRef, m2Ref, larguraRef, loteRef, enderecoRef,
    quantidadeRef, manualLarguraRef, handleFieldKeyDown,
    handleEnderecoChange, handleProcessoChange, handleNfChange,
    handleItemChange, toggleLockEndereco, toggleLockProcesso, toggleLockNf,
    largura, mLinear
  } = props;

  const isAI = currentMode === 'openrouter';
  const isDiversos = currentMode === 'diversos';
  const isMadeira = currentMode === 'madeira';
  const isPVT = isDiversos && formData.diversosTipo === 'PVT';
  const isCelular = isDiversos && formData.diversosTipo === 'Celular';
  const isRolo = isDiversos && formData.diversosTipo === 'Rolo';
  const isCortina = isDiversos && formData.diversosTipo === 'Cortina';
  
  const requiresProcesso = isMadeira || (!isDiversos || isCelular);
  const requiresNF = isDiversos && !isCelular;
  const isCoulisse = currentMode === 'manual';
  const coulisseUsesMLinear = isCoulisse && formData.coulisseMetragem === 'mlinear';
  const usesM2Input = !isMadeira && !isAI && !isPVT && !coulisseUsesMLinear;
  const requiresEndereco = !isMadeira && !isPVT && !isCelular;

  return (
    <div className="grid grid-cols-1 gap-6 px-1.5 pb-2">
      {/* Processo / NF Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {requiresProcesso && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                Nº Processo (PROC)
              </label>
              <Button 
                variant="ghost" size="icon" onClick={toggleLockProcesso}
                className={`h-6 w-6 rounded-md transition-all ${lockProcesso ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'}`}
              >
                {lockProcesso ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </Button>
            </div>
            <Input 
              ref={nfRef} value={processo} onChange={e => handleProcessoChange(e.target.value)}
              onKeyDown={e => handleFieldKeyDown(e, itemRef)}
              placeholder="Ex: 50400"
              className={`h-12 text-sm font-bold bg-muted/30 border-none transition-all focus:ring-4 focus:ring-primary/5 focus:bg-background ${lockProcesso ? 'opacity-70 pointer-events-none sm:pointer-events-auto' : ''}`}
            />
          </div>
        )}

        {requiresNF && (
          <div className="space-y-2.5">
             <div className="flex items-center justify-between px-0.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Nota Fiscal (NF)</label>
              <Button 
                variant="ghost" size="icon" onClick={toggleLockNf}
                className={`h-6 w-6 rounded-md transition-all ${lockNf ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'}`}
              >
                {lockNf ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </Button>
            </div>
            <Input 
              ref={nfRef} value={formData.nf} onChange={e => handleNfChange(e.target.value)}
              onKeyDown={e => handleFieldKeyDown(e, itemRef)}
              placeholder="Ex: 12345"
              className={`h-12 text-sm font-bold bg-muted/30 border-none transition-all focus:ring-4 focus:ring-primary/5 focus:bg-background ${lockNf ? 'opacity-70 pointer-events-none sm:pointer-events-auto' : ''}`}
            />
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5 block">Item / Código</label>
          <Input 
            ref={itemRef} value={formData.item} onChange={e => handleItemChange(e.target.value)}
            onKeyDown={e => handleFieldKeyDown(e, isMadeira ? quantidadeRef : (isPVT || coulisseUsesMLinear ? m2Ref : (usesM2Input ? m2Ref : (isAI ? null : loteRef))))}
            placeholder="Ex: 12345.01"
            className="h-12 text-sm font-black uppercase tracking-wider bg-muted/30 border-none focus:ring-4 focus:ring-primary/5 focus:bg-background"
          />
        </div>
      </div>

      {/* Specific fields based on mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isMadeira && (
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5">Quantidade</label>
            <Input 
              ref={quantidadeRef} type="number" value={formData.quantidade} onChange={e => setFormData({ quantidade: e.target.value })}
              onKeyDown={e => handleFieldKeyDown(e, null)}
              placeholder="0"
              className="h-12 text-sm font-bold bg-muted/30 border-none focus:ring-4 focus:ring-primary/5 focus:bg-background"
            />
          </div>
        )}

        {usesM2Input && (
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5 block">Metragem (M²)</label>
            <Input 
              ref={m2Ref} type="number" step="0.1" value={formData.m2} onChange={e => setFormData({ m2: e.target.value })}
              onKeyDown={e => handleFieldKeyDown(e, isAI ? null : loteRef)}
              placeholder="0.0"
              className="h-12 text-sm font-bold bg-muted/30 border-none focus:ring-4 focus:ring-primary/5 focus:bg-background"
            />
          </div>
        )}

        {(isPVT || coulisseUsesMLinear) && (
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5">Metragem (ML)</label>
            <Input 
              ref={m2Ref} type="number" step="0.1" value={formData.diversosMLinear} onChange={e => setFormData({ diversosMLinear: e.target.value })}
              onKeyDown={e => handleFieldKeyDown(e, loteRef)}
              placeholder="0.0"
              className="h-12 text-sm font-bold bg-muted/30 border-none focus:ring-4 focus:ring-primary/5 focus:bg-background"
            />
          </div>
        )}

        {!isMadeira && !isAI && (
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5">Lote / Série</label>
            <Input 
              ref={loteRef} value={formData.lote} onChange={e => setFormData({ lote: e.target.value.replace(/[''`]/g, '-') })}
              onKeyDown={e => handleFieldKeyDown(e, requiresEndereco ? enderecoRef : null)}
              placeholder="Ex: 2311-01"
              className="h-12 text-sm font-bold bg-muted/30 border-none focus:ring-4 focus:ring-primary/5 focus:bg-background uppercase"
            />
          </div>
        )}
      </div>

      {requiresEndereco && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${enderecoError ? 'text-destructive' : 'text-muted-foreground/80'}`}>
              Endereço / Posição {enderecoError && <span className="text-[9px] lowercase tracking-normal bg-destructive/10 px-2 py-0.5 rounded-full font-bold">Padrão: TEC01.A.N01</span>}
            </label>
            <Button 
              variant="ghost" size="icon" onClick={toggleLockEndereco}
              className={`h-6 w-6 rounded-md transition-all ${lockEndereco ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'}`}
            >
              {lockEndereco ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>
          </div>
          <Input 
            ref={enderecoRef} value={formData.endereco} onChange={e => handleEnderecoChange(e.target.value)}
            onKeyDown={e => handleFieldKeyDown(e, null)}
            placeholder="TEC01.A.N01"
            className={`h-12 text-sm font-black tracking-widest bg-muted/30 border-none transition-all focus:ring-4 focus:ring-primary/5 focus:bg-background uppercase ${enderecoError ? 'ring-2 ring-destructive/50 bg-destructive/5' : ''} ${lockEndereco ? 'opacity-70 pointer-events-none sm:pointer-events-auto' : ''}`}
          />
        </div>
      )}

      {/* Results Preview */}
      {!isMadeira && (
        <div className="pt-2 flex flex-wrap gap-2">
          <div className="flex-1 bg-muted/20 rounded-xl p-3 border border-border/40 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Linear calculado</span>
            <span className="text-sm font-black tabular-nums">{mLinear.toFixed(2)}m</span>
          </div>
          <div className="flex-1 bg-muted/20 rounded-xl p-3 border border-border/40 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Largura aplicada</span>
            <span className="text-sm font-black tabular-nums">{largura.toFixed(2)}m</span>
          </div>
        </div>
      )}
    </div>
  );
});

FormInputs.displayName = 'FormInputs';
