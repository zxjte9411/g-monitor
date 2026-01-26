import { buildAuthUrl } from './url.js';
import { describe, it, expect } from 'vitest';

describe('Auth URL', () => {
  it('should build correct google oauth url', () => {
    const url = buildAuthUrl('challenge_123', 'http://localhost:0');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com');
    expect(url).toContain('code_challenge=challenge_123');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A0');
    expect(url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform');
  });
});
