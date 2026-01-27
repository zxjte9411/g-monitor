import { generatePKCE } from '../../src/auth/pkce.js';
import { describe, it, expect } from 'vitest';

describe('PKCE', () => {
  it('should generate verifier and challenge', () => {
    const pkce = generatePKCE();
    expect(pkce.verifier).toHaveLength(43); // Base64URL length for 32 bytes is ~43
    expect(pkce.challenge).toBeDefined();
    expect(pkce.challenge).not.toBe(pkce.verifier);
  });
});
