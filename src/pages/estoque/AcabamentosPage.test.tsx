import { render, screen } from '@testing-library/react';
import AcabamentosPage from './AcabamentosPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { vi, describe, it, expect } from 'vitest';

// Mocks simples para evitar erros de infra
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
            then: vi.fn((cb) => cb({ data: [] }))
          }))
        }))
      })),
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })), subscribe: vi.fn() }))
    })),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn(() => Promise.resolve({ data: { ok: true } })) }
  }
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } }
});

describe('AcabamentosPage Hook Consistency', () => {
  it('renders without crashing and maintains hook order', () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AcabamentosPage />
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Acabamentos/i)).toBeDefined();
    
    // Simular troca de estado/props se necessário para testar variações
    rerender(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AcabamentosPage />
        </AuthProvider>
      </QueryClientProvider>
    );
  });
});
