/**
 * Integração leve com Google Apps Script (Web App) para envio de e-mails
 * sem custo. O usuário publica um Apps Script "doPost" e cola a URL aqui.
 *
 * Exemplo de Apps Script (cola no editor e publica como Web App "anyone"):
 *
 *   function doPost(e) {
 *     const p = JSON.parse(e.postData.contents);
 *     MailApp.sendEmail({
 *       to: p.to,
 *       subject: p.subject,
 *       htmlBody: p.html,
 *     });
 *     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 */

const STORAGE_KEY = 'expedicao.appsScriptWebhook';

export function getAppsScriptWebhook(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

export function setAppsScriptWebhook(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim();
  if (clean) window.localStorage.setItem(STORAGE_KEY, clean);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export interface RomaneioEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendRomaneioEmail(payload: RomaneioEmailPayload): Promise<void> {
  const url = getAppsScriptWebhook();
  if (!url) throw new Error('Webhook do Apps Script não configurado em Configurações.');
  // Apps Script Web Apps não respeitam CORS no preflight; use no-cors para "fire and forget".
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}

export function buildRomaneioHtml(opts: {
  totalPickings: number;
  tree: Map<string, Map<string, Map<string, { numero: string; cliente: string }[]>>>;
}): string {
  const rows: string[] = [];
  opts.tree.forEach((regioes, transp) => {
    rows.push(`<h3 style="margin:16px 0 4px;font-family:sans-serif">${escapeHtml(transp)}</h3>`);
    regioes.forEach((cidades, reg) => {
      rows.push(`<p style="margin:8px 0 2px;font-weight:600;color:#555">${escapeHtml(reg)}</p>`);
      cidades.forEach((pickings, cid) => {
        rows.push(`<p style="margin:4px 0;font-size:12px;text-transform:uppercase;color:#777">${escapeHtml(cid)}</p>`);
        rows.push('<ul style="margin:0 0 8px 16px;padding:0;font-family:sans-serif;font-size:13px">');
        pickings.forEach((p) => {
          rows.push(`<li><code>${escapeHtml(p.numero)}</code> — ${escapeHtml(p.cliente)}</li>`);
        });
        rows.push('</ul>');
      });
    });
  });
  return `
    <div style="max-width:720px;margin:0 auto;color:#111">
      <h2 style="font-family:sans-serif">Romaneio · ${opts.totalPickings} pickings</h2>
      <p style="font-family:sans-serif;color:#555;font-size:12px">Emitido em ${new Date().toLocaleString('pt-BR')}</p>
      ${rows.join('\n')}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
