import { exchangeCode } from '../../src/auth/exchange.js';
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

describe('Token Exchange', () => {
  it('should exchange code for tokens', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'acc', refresh_token: 'ref', expires_in: 3600 })
    });

    const tokens = await exchangeCode('code_123', 'verifier_123', 'http://localhost:1234');
    expect(tokens.accessToken).toBe('acc');
    expect(tokens.refreshToken).toBe('ref');
  });
});
