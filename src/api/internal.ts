export class InternalClient {
    private baseUrl = 'https://cloudcode-pa.googleapis.com';
    
    constructor(private accessToken: string) {}

    private async request(path: string, body: any = {}) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
                'User-Agent': 'antigravity'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Internal API failed: ${res.status} ${await res.text()}`);
        return res.json();
    }

    async loadCodeAssist() {
        return this.request('/v1internal:loadCodeAssist', {
            metadata: { ideType: 'ANTIGRAVITY', pluginType: 'GEMINI' }
        });
    }

    async fetchAvailableModels(projectId?: string) {
        return this.request('/v1internal:fetchAvailableModels', projectId ? { project: projectId } : {});
    }

    async retrieveUserQuota(projectId: string) {
        return this.request('/v1internal:retrieveUserQuota', { project: projectId });
    }
}
