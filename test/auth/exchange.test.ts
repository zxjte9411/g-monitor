import { exchangeCode, refreshTokens } from '../../src/auth/exchange.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('Token Exchange', () => {
    beforeEach(() => {
        (global.fetch as vi.Mock).mockReset();
    });

    describe('exchangeCode', () => {
        it('should exchange code for tokens', async () => {
            (global.fetch as vi.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: 'acc', refresh_token: 'ref', expires_in: 3600 })
            });

            const tokens = await exchangeCode('code_123', 'verifier_123', 'http://localhost:1234');
            expect(tokens.accessToken).toBe('acc');
            expect(tokens.refreshToken).toBe('ref');
        });

        it('should throw error when token exchange fails', async () => {
            (global.fetch as vi.Mock).mockResolvedValue({
                ok: false,
                text: async () => 'Invalid code'
            });

            await expect(exchangeCode('code_123', 'verifier_123', 'http://localhost:1234'))
                .rejects.toThrow('Token exchange failed: Invalid code');
        });

        it('should throw error when token exchange response is missing access_token', async () => {
            (global.fetch as vi.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ refresh_token: 'ref', expires_in: 3600 })
            });

            await expect(exchangeCode('code_123', 'verifier_123', 'http://localhost:1234'))
                .rejects.toThrow('Token exchange failed: Invalid token response (missing access_token)');
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens', async () => {
            (global.fetch as vi.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: 'new_acc', refresh_token: 'new_ref', expires_in: 3600 })
            });

            const tokens = await refreshTokens('old_ref');
            expect(tokens.accessToken).toBe('new_acc');
            expect(tokens.refreshToken).toBe('new_ref');
        });

        it('should throw error when token refresh fails', async () => {
            (global.fetch as vi.Mock).mockResolvedValue({
                ok: false,
                text: async () => 'Invalid refresh token'
            });

            await expect(refreshTokens('old_ref'))
                .rejects.toThrow('Token refresh failed: Invalid refresh token');
        });

        it('should throw error when token refresh response is missing access_token', async () => {
            (global.fetch as vi.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ refresh_token: 'new_ref', expires_in: 3600 })
            });

            await expect(refreshTokens('old_ref'))
                .rejects.toThrow('Token refresh failed: Invalid token response (missing access_token)');
        });
    });
});
