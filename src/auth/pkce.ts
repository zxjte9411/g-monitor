import { randomBytes, createHash } from 'crypto';

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generatePKCE(): PKCEPair {
  const verifier = base64URLEncode(randomBytes(32));
  const challengeBuffer = createHash('sha256').update(verifier).digest();
  const challenge = base64URLEncode(challengeBuffer);
  
  return { verifier, challenge };
}
