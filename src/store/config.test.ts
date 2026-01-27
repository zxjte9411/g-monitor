import { ConfigStore } from './config.js'; // Note .js extension for ESM/TS NodeNext
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock conf
vi.mock('conf', () => {
  return {
    default: class {
      store: any = {};
      defaults: any = {};
      constructor(options: any = {}) {
        this.defaults = options.defaults || {};
        this.store = { ...this.defaults };
      }
      get(key: string) { return this.store[key]; }
      set(key: string, val: any) { this.store[key] = val; }
      delete(key: string) { delete this.store[key]; }
      clear() { this.store = { ...this.defaults }; }
    }
  };
});

describe('ConfigStore', () => {
  let store: ConfigStore;

  beforeEach(() => {
    store = new ConfigStore();
    store.clear();
  });

  it('should save and retrieve tokens for active account', () => {
    store.addAccount({
      email: 'test@example.com',
      projectId: 'p1',
      tokens: { accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 }
    });
    expect(store.getTokens()).toEqual({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 });
  });

  it('should save and retrieve project ID for active account', () => {
    store.addAccount({
      email: 'test@example.com',
      projectId: 'p1',
      tokens: { accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 }
    });
    store.setProjectId('my-project');
    expect(store.getProjectId()).toBe('my-project');
  });

  it('should support multiple accounts', () => {
    const acc1 = {
      email: 'user1@example.com',
      projectId: 'p1',
      tokens: { accessToken: 'a1', refreshToken: 'r1', expiresAt: 1 }
    };
    const acc2 = {
      email: 'user2@example.com',
      projectId: 'p2',
      tokens: { accessToken: 'a2', refreshToken: 'r2', expiresAt: 2 }
    };

    store.addAccount(acc1);
    store.addAccount(acc2);

    expect(store.getAccounts()).toHaveLength(2);
    
    store.setActiveAccount('user1@example.com');
    expect(store.getProjectId()).toBe('p1');

    store.setActiveAccount('user2@example.com');
    expect(store.getProjectId()).toBe('p2');
  });

  it('should migrate legacy data', () => {
    // Manually setup legacy data in the mock store
    const mockStore = (store as any).store;
    mockStore.set('tokens', { accessToken: 'legacy-acc', refreshToken: 'legacy-ref', expiresAt: 999 });
    mockStore.set('projectId', 'legacy-project');
    
    // Trigger migration (normally happens in constructor)
    (store as any).migrate();

    expect(store.getAccounts()).toHaveLength(1);
    expect(store.getActiveAccount()?.email).toBe('default');
    expect(store.getProjectId()).toBe('legacy-project');
    expect(store.getTokens()?.accessToken).toBe('legacy-acc');
    
    // Check legacy fields are gone
    expect(mockStore.get('tokens')).toBeUndefined();
    expect(mockStore.get('projectId')).toBeUndefined();
  });

  it('should handle account removal', () => {
    const acc1 = {
      email: 'user1@example.com',
      projectId: 'p1',
      tokens: { accessToken: 'a1', refreshToken: 'r1', expiresAt: 1 }
    };
    store.addAccount(acc1);
    expect(store.getAccounts()).toHaveLength(1);
    
    store.removeAccount('user1@example.com');
    expect(store.getAccounts()).toHaveLength(0);
    expect(store.getActiveAccount()).toBeUndefined();
  });
});
