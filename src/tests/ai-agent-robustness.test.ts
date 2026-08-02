import { expect, test, describe, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

describe('AI Agent Edge Function - Robustness Audit', () => {
  test('should handle missing or malformed messages array', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages: null })
    });
    
    const data = await response.json();
    expect(response.status).toBe(200); // Should fallback gracefully
    expect(data.error).toBeUndefined();
  });

  test('should handle messages with missing parts array', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        messages: [
          { role: 'user', content: 'Olá' } // Some SDKs send content as string, index.ts expects parts or converts it
        ] 
      })
    });
    
    expect(response.status).toBe(200);
  });
});
