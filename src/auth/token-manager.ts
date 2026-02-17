import { refreshTokens } from './exchange.js';
import { Tokens } from '../store/config.js';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Checks if the given tokens are expired or expiring within the next 5 minutes.
 */
export function isTokenExpiring(tokens: Tokens): boolean {
    return Date.now() > (tokens.expiresAt - REFRESH_THRESHOLD_MS);
}

/**
 * Ensures the tokens are valid.
 * If they are expiring soon, it performs an auto-refresh and returns refreshed tokens.
 */
export async function ensureValidTokens(tokens: Tokens): Promise<Tokens> {
    if (isTokenExpiring(tokens)) {
        const newTokens = await refreshTokens(tokens.refreshToken);
        return newTokens;
    }
    return tokens;
}
