export class InternalClient {
    private baseUrl = 'https://cloudcode-pa.googleapis.com';
    
    constructor(private accessToken: string) {}

    private async request(path: string, body: any = {}) {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': `GeminiCLI/1.3.6 (win32; x64)`
        };

        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Internal API failed: ${res.status} ${await res.text()}`);
        return res.json();
    }

    async loadCodeAssist(projectId?: string) {
        return this.request('/v1internal:loadCodeAssist', {
            cloudaicompanionProject: projectId,
            metadata: { 
                ideType: 'IDE_UNSPECIFIED', 
                pluginType: 'GEMINI',
                duetProject: projectId
            }
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
