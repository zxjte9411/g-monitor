export type Identity = 'antigravity' | 'gemini-cli';

export class InternalClient {
    private baseUrl = 'https://cloudcode-pa.googleapis.com';
    
    constructor(private accessToken: string) {}

    private async request(path: string, body: any = {}, identity: Identity = 'antigravity', baseUrl?: string) {
        const url = (baseUrl || this.baseUrl) + path;
        
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
        };

        if (identity === 'antigravity') {
            headers['X-Goog-Api-Client'] = 'google-cloud-sdk vscode_cloudshelleditor/0.1';
            headers['User-Agent'] = 'antigravity/1.11.5 windows/amd64';
            headers['Client-Metadata'] = '{"ideType":"IDE_UNSPECIFIED","platform":"PLATFORM_UNSPECIFIED","pluginType":"GEMINI"}';
        } else {
            headers['X-Goog-Api-Client'] = 'gl-node/22.17.0';
            headers['User-Agent'] = 'google-api-nodejs-client/9.15.1';
            headers['Client-Metadata'] = 'ideType=IDE_UNSPECIFIED,platform=PLATFORM_UNSPECIFIED,pluginType=GEMINI';
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Internal API failed (${identity}): ${res.status} ${errText}`);
        }
        return res.json();
    }

    async sweepQuotas(projectId: string) {
        const endpoints = [
            'https://cloudcode-pa.googleapis.com',
            'https://daily-cloudcode-pa.sandbox.googleapis.com'
        ];
        const identities: Identity[] = ['antigravity', 'gemini-cli'];

        const tasks = [];
        for (const url of endpoints) {
            for (const id of identities) {
                tasks.push(
                    this.request('/v1internal:retrieveUserQuota', { project: projectId }, id, url)
                        .then(data => ({ source: url.includes('sandbox') ? 'Daily' : 'Prod', identity: id, data }))
                        .catch(() => null) // Ignore individual failures
                );
                // Also fetch available models for display names
                tasks.push(
                    this.request('/v1internal:fetchAvailableModels', { project: projectId }, id, url)
                        .then(data => ({ source: url.includes('sandbox') ? 'Daily' : 'Prod', identity: id, modelNames: data.models }))
                        .catch(() => null)
                );
            }
        }

        return (await Promise.all(tasks)).filter(t => t !== null);
    }

    // Keep original methods for backward compatibility if needed, but sweep is preferred now
    async loadCodeAssist(projectId?: string) {
        return this.request('/v1internal:loadCodeAssist', {
            cloudaicompanionProject: projectId,
            metadata: { ideType: 'IDE_UNSPECIFIED', pluginType: 'GEMINI', duetProject: projectId }
        });
    }

    async fetchAvailableModels(projectId?: string) {
        return this.request('/v1internal:fetchAvailableModels', projectId ? { project: projectId } : {});
    }

    async retrieveUserQuota(projectId: string) {
        return this.request('/v1internal:retrieveUserQuota', { project: projectId });
    }

    async onboardUser(tierId: string, projectId?: string) {
        return this.request('/v1internal:onboardUser', {
            tierId,
            cloudaicompanionProject: projectId,
            metadata: { ideType: 'IDE_UNSPECIFIED', pluginType: 'GEMINI' }
        });
    }
}
