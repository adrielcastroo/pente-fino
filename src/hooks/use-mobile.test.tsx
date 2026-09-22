import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIsMobile, useIsTablet, useIsLandscape, useIsDesktop } from './use-mobile';

const state = { width: 1024, height: 768, hasHover: false, hasFinePointer: false };

function evaluateQuery(query: string): boolean {
  const w = state.width;
  const h = state.height;
  // Split on comma for OR-separated conditions
  const parts = query.split(',').map(p => p.trim());
  return parts.some(part => {
    if (part.includes('hover: hover') && part.includes('pointer: fine')) {
      return state.hasHover && state.hasFinePointer;
    }
    if (part.includes('orientation: landscape')) return w > h;
    const min = part.match(/min-width:\s*(\d+)px/);
    const max = part.match(/max-width:\s*(\d+)px/);
    const lo = min ? Number(min[1]) : 0;
    const hi = max ? Number(max[1]) : Infinity;
    if (min || max) return w >= lo && w <= hi;
    return false;
  });
}

const matchMediaMock = vi.fn((query: string) => ({
  matches: evaluateQuery(query),
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

beforeEach(() => {
  state.width = 1024;
  state.height = 768;
  state.hasHover = false;
  state.hasFinePointer = false;
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
});

describe('use-mobile hooks', () => {
  const setWidth = (width: number) => { state.width = width; window.dispatchEvent(new Event('resize')); };
  const setHeight = (height: number) => { state.height = height; window.dispatchEvent(new Event('resize')); };
  const setDesktop = (enabled: boolean) => { state.hasHover = enabled; state.hasFinePointer = enabled; };

  describe('useIsDesktop', () => {
    it('should return true when hover + pointer fine', () => {
      setDesktop(true);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return true when width >= 1366px', () => {
      setDesktop(false);
      setWidth(1440);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false without hover/pointer and narrow width', () => {
      setDesktop(false);
      setWidth(375);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsMobile', () => {
    it('should return true when width < 768', () => {
      setWidth(375);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false when width >= 768', () => {
      setWidth(1024);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true when width is between 768 and 1365', () => {
      setWidth(800);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return false when width is outside tablet range', () => {
      setWidth(375);
      const { result: mobileRes } = renderHook(() => useIsTablet());
      expect(mobileRes.current).toBe(false);

      setWidth(1440);
      const { result: desktopRes } = renderHook(() => useIsTablet());
      expect(desktopRes.current).toBe(false);
    });
  });

  describe('useIsLandscape', () => {
    it('should return true when width > height', () => {
      setWidth(1000);
      setHeight(500);
      const { result } = renderHook(() => useIsLandscape());
      expect(result.current).toBe(true);
    });

    it('should return false when width <= height', () => {
      setWidth(500);
      setHeight(1000);
      const { result } = renderHook(() => useIsLandscape());
      expect(result.current).toBe(false);
    });
  });
});
