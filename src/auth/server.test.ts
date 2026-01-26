import { startCallbackServer } from './server.js';
import { describe, it, expect } from 'vitest';
import http from 'http';

describe('Callback Server', () => {
  it('should start server and return port', async () => {
    const server = await startCallbackServer();
    expect(server.port).toBeGreaterThan(0);
    expect(server.close).toBeDefined();
    server.close();
  });
});
