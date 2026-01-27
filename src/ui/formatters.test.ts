import { formatResetTime } from './formatters.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('formatResetTime', () => {
  it('should format time correctly', () => {
    const now = Date.now();
    const in45m = new Date(now + 45 * 60 * 1000).toISOString();
    const in2h15m = new Date(now + (2 * 60 + 15) * 60 * 1000).toISOString();
    const passed = new Date(now - 1000).toISOString();

    expect(formatResetTime(in45m)).toBe('(Resets in 45m)');
    expect(formatResetTime(in2h15m)).toBe('(Resets in 2h 15m)');
    expect(formatResetTime(passed)).toBe('Ready');
  });
});
