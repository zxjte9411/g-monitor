import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTokenExpiring, ensureValidTokens } from '../../src/auth/token-manager.js';
import * as exchange from '../../src/auth/exchange.js';

vi.mock('../../src/auth/exchange.js', () => ({
    refreshTokens: vi.fn(),
}));

describe('token-manager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isTokenExpiring', () => {
        it('should return true if token is already expired', () => {
            const tokens = {
                accessToken: 'acc',
                refreshToken: 'ref',
                expiresAt: Date.now() - 1000,
            };
            expect(isTokenExpiring(tokens)).toBe(true);
        });

        it('should return true if token is expiring within 5 minutes', () => {
            const tokens = {
                accessToken: 'acc',
                refreshToken: 'ref',
                expiresAt: Date.now() + 4 * 60 * 1000,
            };
            expect(isTokenExpiring(tokens)).toBe(true);
        });

        it('should return false if token is not expiring soon', () => {
            const tokens = {
                accessToken: 'acc',
                refreshToken: 'ref',
                expiresAt: Date.now() + 6 * 60 * 1000,
            };
            expect(isTokenExpiring(tokens)).toBe(false);
        });
    });

    describe('ensureValidTokens', () => {
        const mockTokens = {
            accessToken: 'old-acc',
            refreshToken: 'old-ref',
            expiresAt: Date.now() + 10 * 60 * 1000,
        };

        it('should return existing tokens if not expired', async () => {
            const tokens = await ensureValidTokens({ ...mockTokens });
            expect(tokens.accessToken).toBe('old-acc');
            expect(exchange.refreshTokens).not.toHaveBeenCalled();
        });

        it('should refresh and return new tokens if expired', async () => {
            const expiredTokens = {
                ...mockTokens,
                expiresAt: Date.now() - 1000,
            };
            const newTokens = {
                accessToken: 'new-acc',
                refreshToken: 'new-ref',
                expiresAt: Date.now() + 3600 * 1000,
            };
            vi.mocked(exchange.refreshTokens).mockResolvedValue(newTokens);

            const tokens = await ensureValidTokens(expiredTokens);

            expect(tokens.accessToken).toBe('new-acc');
            expect(exchange.refreshTokens).toHaveBeenCalledWith('old-ref');
        });
    });
});
