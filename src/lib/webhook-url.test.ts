import { describe, it, expect } from 'vitest';
import { validateWebhookUrl, isValidWebhookUrl } from './webhook-url';

describe('validateWebhookUrl', () => {
  describe('valores vazios', () => {
    it('aceita string vazia quando allowEmpty=true (default)', () => {
      expect(validateWebhookUrl('')).toEqual({ ok: true, error: '' });
      expect(validateWebhookUrl('   ')).toEqual({ ok: true, error: '' });
      expect(validateWebhookUrl(null)).toEqual({ ok: true, error: '' });
      expect(validateWebhookUrl(undefined)).toEqual({ ok: true, error: '' });
    });

    it('rejeita string vazia quando allowEmpty=false', () => {
      const r = validateWebhookUrl('', { allowEmpty: false });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/obrigatória/i);
    });

    it('rejeita apenas espaços quando allowEmpty=false', () => {
      const r = validateWebhookUrl('   ', { allowEmpty: false });
      expect(r.ok).toBe(false);
    });
  });

  describe('protocolos', () => {
    it('aceita http://', () => {
      expect(validateWebhookUrl('http://localhost:5678/webhook/print').ok).toBe(true);
      expect(validateWebhookUrl('http://192.168.1.10:5678/webhook/x').ok).toBe(true);
    });

    it('aceita https://', () => {
      expect(validateWebhookUrl('https://n8n.example.com/webhook/print').ok).toBe(true);
    });

    it('rejeita ftp://', () => {
      const r = validateWebhookUrl('ftp://example.com/file');
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/ftp:/);
    });

    it('rejeita javascript:', () => {
      const r = validateWebhookUrl('javascript:alert(1)');
      expect(r.ok).toBe(false);
    });

    it('rejeita file://', () => {
      const r = validateWebhookUrl('file:///etc/passwd');
      expect(r.ok).toBe(false);
    });
  });

  describe('formato', () => {
    it('rejeita URL com espaços internos', () => {
      const r = validateWebhookUrl('http://exam ple.com/webhook');
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/espaço/i);
    });

    it('faz trim de espaços nas bordas', () => {
      expect(validateWebhookUrl('  http://localhost:5678/x  ').ok).toBe(true);
    });

    it('rejeita string sem protocolo', () => {
      const r = validateWebhookUrl('localhost:5678/webhook');
      expect(r.ok).toBe(false);
    });

    it('rejeita string totalmente aleatória', () => {
      const r = validateWebhookUrl('não-é-uma-url');
      expect(r.ok).toBe(false);
    });

    it('rejeita URL malformada tipo "http:"', () => {
      const r = validateWebhookUrl('http:');
      expect(r.ok).toBe(false);
    });
  });

  describe('isValidWebhookUrl (atalho booleano)', () => {
    it('devolve true para URL válida', () => {
      expect(isValidWebhookUrl('https://n8n.example.com/webhook/x')).toBe(true);
    });

    it('devolve false para URL inválida', () => {
      expect(isValidWebhookUrl('ftp://x.com')).toBe(false);
    });

    it('respeita allowEmpty=false', () => {
      expect(isValidWebhookUrl('', { allowEmpty: false })).toBe(false);
      expect(isValidWebhookUrl('')).toBe(true);
    });
  });
});
