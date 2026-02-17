import { refreshTokens } from './exchange.js';
import { configStore, Account, Tokens } from '../store/config.js';

/**
 * Checks if the given tokens are expired or expiring within the next 5 minutes.
 */
export function isTokenExpiring(tokens: Tokens): boolean {
    const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
    return Date.now() > (tokens.expiresAt - REFRESH_THRESHOLD_MS);
}

/**
 * Ensures the tokens for an account are valid.
 * If they are expiring soon, it performs an auto-refresh and updates the config store.
 */
export async function ensureValidTokens(account: Account): Promise<Tokens> {
    if (isTokenExpiring(account.tokens)) {
        const newTokens = await refreshTokens(account.tokens.refreshToken);
        account.tokens = newTokens;
        configStore.addAccount(account);
        return newTokens;
    }
    return account.tokens;
}
