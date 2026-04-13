import { useState } from 'react';
import { toast } from 'sonner';

const VISION_PROMPT = `Você é um especialista em leitura de etiquetas de rolos de tecido. Analise a imagem e extraia:

ITEM (código do tecido): Item, Ref, Item No, Description, Artigo, Part No
M² (metragem quadrada): QUANTITY, Q'TY, Quantity, Qty
LARGURA (largura do tecido): WIDTH, Width, Largura

Retorne SOMENTE JSON: {"item":"<código>","m2":<número float ou null>,"width":<número inteiro ou null>}`;

export function useAIVision() {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [progress, setProgress] = useState(0);

  const processOpenRouter = async (fotoB64: string, fotoMime: string) => {
    if (!fotoB64) {
      toast.warning('Adicione uma foto primeiro.');
      return null;
    }
    const key = localStorage.getItem('cft4_or_key') || '';
    if (!key) {
      toast.warning('Configure a chave OpenRouter em ⚙️ API.');
      return null;
    }
    const model = localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku';
    
    setAiLoading(true);
    setProgress(30);
    setAiStatus(null);
    
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + key 
        },
        body: JSON.stringify({ 
          model, 
          messages: [
            { 
              role: 'user', 
              content: [
                { type: 'image_url', image_url: { url: 'data:' + fotoMime + ';base64,' + fotoB64 } }, 
                { type: 'text', text: VISION_PROMPT }
              ] 
            }
          ], 
          max_tokens: 300, 
          temperature: 0.1 
        })
      });
      
      setProgress(80);
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${resp.status}`);
      }
      
      const data = await resp.json();
      const raw = (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      
      setProgress(100);
      setTimeout(() => setProgress(0), 700);
      
      const summary = `✓ ${model.split('/').pop()}: ${parsed.item || '—'} · M² ${parsed.m2 || '—'}`;
      setAiStatus({ msg: summary, type: 'ok' });
      toast.success('OpenRouter processou com sucesso');
      
      return parsed;
    } catch (e: any) {
      setProgress(0);
      setAiStatus({ msg: '❌ ' + e.message, type: 'err' });
      toast.error('Erro OpenRouter: ' + e.message);
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  return {
    aiLoading,
    aiStatus,
    progress,
    processOpenRouter,
    setAiStatus,
    setProgress
  };
}