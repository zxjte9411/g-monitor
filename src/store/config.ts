import Conf from 'conf';

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class ConfigStore {
  private store: Conf;

  constructor() {
    this.store = new Conf({ projectName: 'g-monitor' });
  }

  setTokens(tokens: Tokens) {
    this.store.set('tokens', tokens);
  }

  getTokens(): Tokens | undefined {
    return this.store.get('tokens') as Tokens | undefined;
  }

  setProjectId(projectId: string) {
    this.store.set('projectId', projectId);
  }

  getProjectId(): string | undefined {
    return this.store.get('projectId') as string | undefined;
  }
  
  clear() {
    this.store.clear();
  }
}

export const configStore = new ConfigStore();
