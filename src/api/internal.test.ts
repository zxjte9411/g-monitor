import { InternalClient } from './internal.js';
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

describe('InternalClient', () => {
  it('should inject headers including User-Agent impersonation', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: () => ({}) });
    const client = new InternalClient('fake_token');
    await client.loadCodeAssist();
    
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('v1internal:loadCodeAssist'),
        expect.objectContaining({
            headers: expect.objectContaining({
                'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
                'User-Agent': expect.stringContaining('antigravity'),
                'Authorization': 'Bearer fake_token'
            })
        })
    );
  });

  it('should NOT inject X-Goog-User-Project (Stealth Mode)', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: () => ({}) });
    const client = new InternalClient('fake_token');
    await client.retrieveUserQuota('my-project');
    
    const call = (global.fetch as any).mock.calls[0];
    const headers = call[1].headers;
    expect(headers['X-Goog-User-Project']).toBeUndefined();
  });
});
