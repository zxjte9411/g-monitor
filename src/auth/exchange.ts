const CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

type TokenResponse = {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
};

type ValidTokenResponse = TokenResponse & {
    access_token: string;
    expires_in: number;
};

type ValidExchangeTokenResponse = ValidTokenResponse & {
    refresh_token: string;
};

function assertValidTokenResponse(data: TokenResponse, action: 'exchange'): asserts data is ValidExchangeTokenResponse;
function assertValidTokenResponse(data: TokenResponse, action: 'refresh'): asserts data is ValidTokenResponse;
function assertValidTokenResponse(data: TokenResponse, action: 'exchange' | 'refresh'): asserts data is ValidTokenResponse {
    if (!data.access_token || typeof data.access_token !== 'string') {
        throw new Error(`Token ${action} failed: Invalid token response (missing access_token)`);
    }

    if (typeof data.expires_in !== 'number') {
        throw new Error(`Token ${action} failed: Invalid token response (missing expires_in)`);
    }

    if (action === 'exchange' && (!data.refresh_token || typeof data.refresh_token !== 'string')) {
        throw new Error('Token exchange failed: Invalid token response (missing refresh_token)');
    }
}

export async function exchangeCode(code: string, verifier: string, redirectUri: string) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
    
    const data = (await res.json()) as TokenResponse;
    assertValidTokenResponse(data, 'exchange');

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        idToken: data.id_token
    };
}

export async function refreshTokens(refreshToken: string) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
    
    const data = (await res.json()) as TokenResponse;
    assertValidTokenResponse(data, 'refresh');

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
        idToken: data.id_token
    };
}
