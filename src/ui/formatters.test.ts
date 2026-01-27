import { formatResetTime } from './formatters.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('formatResetTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format time in minutes', () => {
    const resetTime = '2026-01-27T12:45:00Z';
    expect(formatResetTime(resetTime)).toBe('(Resets in 45m)');
  });

  it('should format time in hours and minutes', () => {
    const resetTime = '2026-01-27T14:15:00Z';
    expect(formatResetTime(resetTime)).toBe('(Resets in 2h 15m)');
  });

  it('should return Ready if time has passed', () => {
    const resetTime = '2026-01-27T11:00:00Z';
    expect(formatResetTime(resetTime)).toBe('Ready');
  });
});
