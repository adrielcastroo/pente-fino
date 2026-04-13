import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
  });

  it('should handle conditional classes', () => {
    expect(cn('px-2', true && 'py-2', false && 'm-2')).toBe('px-2 py-2');
  });

  it('should handle undefined and null inputs', () => {
    expect(cn('px-2', undefined, null)).toBe('px-2');
  });

  it('should handle objects correctly', () => {
    expect(cn({ 'px-2': true, 'py-2': false })).toBe('px-2');
  });
});
