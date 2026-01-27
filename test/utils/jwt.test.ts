import { describe, it, expect } from 'vitest';
import { decodeJwt } from '../../src/utils/jwt.js';

describe('JWT Utils', () => {
    it('should decode a valid JWT payload', () => {
        const payload = { email: 'test@example.com', sub: '12345' };
        const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
        expect(decodeJwt(token)).toEqual(payload);
    });

    it('should return null for invalid token format', () => {
        expect(decodeJwt('invalid-token')).toBeNull();
    });

    it('should return null for invalid base64', () => {
        expect(decodeJwt('header.!!!.signature')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
        const token = `header.${Buffer.from('not-json').toString('base64')}.signature`;
        expect(decodeJwt(token)).toBeNull();
    });
});
