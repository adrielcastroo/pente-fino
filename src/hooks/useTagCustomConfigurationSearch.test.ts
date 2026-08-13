import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTagCustomConfigurationSearch } from './useTagCustomConfigurationSearch';
import { supabase } from '@/integrations/supabase/client';

// Mock do supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('useTagCustomConfigurationSearch', () => {
  it('should not search if term is too short', () => {
    const { result } = renderHook(() => useTagCustomConfigurationSearch('a'));
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should call RPC with correct parameters after debounce', async () => {
    const mockData = [{ cd_configuracao: '1', nm_configuracao: 'Config 1', qtd_tags: 5 }];
    (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useTagCustomConfigurationSearch('rollo*t45'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 1000 });

    expect(supabase.rpc).toHaveBeenCalledWith('buscar_auge_tag_custom_configuracoes', {
      p_termo: 'rollo*t45'
    });
    expect(result.current.data).toEqual(mockData);
  });

  it('should handle errors from RPC', async () => {
    const mockError = { message: 'Database error' };
    (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => useTagCustomConfigurationSearch('error_test'));

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 1000 });
    expect(result.current.error).toBeDefined();
  });
});
