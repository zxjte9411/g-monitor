import Conf from 'conf';

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Account {
  tokens: Tokens;
  projectId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

interface StoreSchema {
  activeAccount?: string;
  accounts: Record<string, Account>;
  // Legacy fields for migration
  tokens?: Tokens;
  projectId?: string;
}

export class ConfigStore {
  private store: Conf<StoreSchema>;

  constructor() {
    this.store = new Conf<StoreSchema>({
      projectName: 'g-monitor',
      defaults: {
        accounts: {},
      },
    });
    this.migrate();
  }

  private migrate() {
    const tokens = this.store.get('tokens');
    const projectId = this.store.get('projectId');
    const accounts = this.store.get('accounts') || {};

    if (tokens && projectId && Object.keys(accounts).length === 0) {
      const legacyAccount: Account = {
        tokens,
        projectId,
        email: 'default',
      };
      this.store.set('accounts', { default: legacyAccount });
      this.store.set('activeAccount', 'default');

      // @ts-ignore - delete legacy fields
      this.store.delete('tokens');
      // @ts-ignore - delete legacy fields
      this.store.delete('projectId');
    }
  }

  getAccounts(): Account[] {
    return Object.values(this.store.get('accounts') || {});
  }

  getAccount(email: string): Account | undefined {
    return (this.store.get('accounts') || {})[email];
  }

  addAccount(account: Account) {
    const accounts = this.store.get('accounts') || {};
    accounts[account.email] = account;
    this.store.set('accounts', accounts);
    if (!this.store.get('activeAccount')) {
      this.setActiveAccount(account.email);
    }
  }

  removeAccount(email: string) {
    const accounts = this.store.get('accounts') || {};
    delete accounts[email];
    this.store.set('accounts', accounts);
    if (this.store.get('activeAccount') === email) {
      const remaining = Object.keys(accounts);
      this.store.set('activeAccount', remaining[0]);
    }
  }

  setActiveAccount(email: string) {
    this.store.set('activeAccount', email);
  }

  getActiveAccount(): Account | undefined {
    const activeEmail = this.store.get('activeAccount');
    if (!activeEmail) return undefined;
    return this.getAccount(activeEmail);
  }

  setTokens(tokens: Tokens) {
    const activeEmail = this.store.get('activeAccount');
    if (!activeEmail) return;
    const account = this.getAccount(activeEmail);
    if (account) {
      account.tokens = tokens;
      this.addAccount(account);
    }
  }

  getTokens(): Tokens | undefined {
    return this.getActiveAccount()?.tokens;
  }

  setProjectId(projectId: string) {
    const activeEmail = this.store.get('activeAccount');
    if (!activeEmail) return;
    const account = this.getAccount(activeEmail);
    if (account) {
      account.projectId = projectId;
      this.addAccount(account);
    }
  }

  getProjectId(): string | undefined {
    return this.getActiveAccount()?.projectId;
  }
  
  clear() {
    this.store.clear();
  }
}

export const configStore = new ConfigStore();
