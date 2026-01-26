import { ConfigStore } from './config.js'; // Note .js extension for ESM/TS NodeNext
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock conf
vi.mock('conf', () => {
  return {
    default: class {
      store: any = {};
      get(key: string) { return this.store[key]; }
      set(key: string, val: any) { this.store[key] = val; }
      clear() { this.store = {}; }
    }
  };
});

describe('ConfigStore', () => {
  it('should save and retrieve tokens', () => {
    const store = new ConfigStore();
    store.setTokens({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 });
    expect(store.getTokens()).toEqual({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 });
  });

  it('should save and retrieve project ID', () => {
    const store = new ConfigStore();
    store.setProjectId('my-project');
    expect(store.getProjectId()).toBe('my-project');
  });
});
