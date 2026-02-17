import { startCallbackServer } from '../../src/auth/server.js';
import { describe, it, expect } from 'vitest';
import http from 'http';

describe('Callback Server', () => {
    it('should start server and return port', async () => {
        const server = await startCallbackServer();
        expect(server.port).toBeGreaterThan(0);
        expect(server.close).toBeDefined();
        server.close();
    });

    it('should extract code and state from callback', async () => {
        const server = await startCallbackServer();
        const port = server.port;

        const waitForCodePromise = server.waitForCode();

        // Simulate a callback from Google
        await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/?code=test_code&state=test_state`, (res) => {
                res.on('data', () => {});
                res.on('end', resolve);
            }).on('error', reject);
        });

        const result = await waitForCodePromise;
        expect(result.code).toBe('test_code');
        expect(result.state).toBe('test_state');

        server.close();
    });

    it('should reject callback when provider returns error', async () => {
        const server = await startCallbackServer();
        const port = server.port;
        const waitForCodePromise = server.waitForCode();
        void waitForCodePromise.catch(() => undefined);

        await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/?error=access_denied`, (res) => {
                res.on('data', () => {});
                res.on('end', resolve);
            }).on('error', reject);
        });

        await expect(waitForCodePromise).rejects.toThrow('Authentication failed: access_denied');
        server.close();
    });

    it('should reject callback when code is missing', async () => {
        const server = await startCallbackServer();
        const port = server.port;
        const waitForCodePromise = server.waitForCode();
        void waitForCodePromise.catch(() => undefined);

        await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/?state=test_state`, (res) => {
                res.on('data', () => {});
                res.on('end', resolve);
            }).on('error', reject);
        });

        await expect(waitForCodePromise).rejects.toThrow('No code found in callback URL');
        server.close();
    });

    it('should ignore requests to non-root paths', async () => {
        const server = await startCallbackServer();
        const port = server.port;
        const waitForCodePromise = server.waitForCode();

        await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/favicon.ico`, (res) => {
                expect(res.statusCode).toBe(404);
                res.on('data', () => {});
                res.on('end', resolve);
            }).on('error', reject);
        });

        await new Promise((resolve) => setTimeout(resolve, 30));

        await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/?code=test_code&state=test_state`, (res) => {
                res.on('data', () => {});
                res.on('end', resolve);
            }).on('error', reject);
        });

        await expect(waitForCodePromise).resolves.toEqual({ code: 'test_code', state: 'test_state' });
        server.close();
    });
});
