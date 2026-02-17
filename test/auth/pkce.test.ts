import { generatePKCE, generateState } from '../../src/auth/pkce.js';
import { describe, it, expect } from 'vitest';

describe('PKCE', () => {
  it('should generate verifier and challenge', () => {
    const pkce = generatePKCE();
    expect(pkce.verifier).toHaveLength(43); // Base64URL length for 32 bytes is ~43
    expect(pkce.challenge).toBeDefined();
    expect(pkce.challenge).not.toBe(pkce.verifier);
  });

  it('should generate random state', () => {
    const state1 = generateState();
    const state2 = generateState();
    expect(state1).toHaveLength(43);
    expect(state1).not.toBe(state2);
  });
});
