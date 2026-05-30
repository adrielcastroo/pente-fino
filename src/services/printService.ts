
import { generatePPLA, PPLALabelData } from '@/lib/ppla-utils';
import { toast } from 'sonner';

export interface PrintConfig {
  autoPrint: boolean;
  webhookUrl: string;
}

export const printLabel = async (data: PPLALabelData, config: PrintConfig) => {
  if (!config.autoPrint || !config.webhookUrl) return;

  try {
    const ppla = generatePPLA(data);
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        ppla,
        item: data.item,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta do n8n: ${response.statusText}`);
    }

    toast.success('Etiqueta enviada para impressão!');
  } catch (error) {
    console.error('Erro ao imprimir etiqueta:', error);
    toast.error('Falha ao enviar etiqueta para o n8n local.');
  }
};
