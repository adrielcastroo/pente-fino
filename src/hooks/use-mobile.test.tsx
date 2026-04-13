import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIsMobile, useIsTablet, useIsLandscape } from './use-mobile';

describe('use-mobile hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  const setHeight = (height: number) => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

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
    it('should return true when width is between 768 and 1024', () => {
      setWidth(800);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return false when width is outside tablet range', () => {
      setWidth(375);
      const { result: mobileRes } = renderHook(() => useIsTablet());
      expect(mobileRes.current).toBe(false);

      setWidth(1200);
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
