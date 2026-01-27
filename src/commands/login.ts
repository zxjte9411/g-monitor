import { Command } from 'commander';
import open from 'open';
import ora from 'ora';
import { generatePKCE } from '../auth/pkce.js';
import { buildAuthUrl } from '../auth/url.js';
import { startCallbackServer } from '../auth/server.js';
import { exchangeCode } from '../auth/exchange.js';
import { configStore } from '../store/config.js';
import { InternalClient } from '../api/internal.js';
import { decodeJwt } from '../utils/jwt.js';

export const loginCommand = new Command('login')
  .description('Authenticate with Google')
  .option('--manual', 'Use manual copy-paste flow')
  .action(async (options) => {
    const spinner = ora('Initializing auth flow...').start();
    try {
      const { verifier, challenge } = generatePKCE();
      let redirectUri = 'urn:ietf:wg:oauth:2.0:oob';
      let code: string = '';

      if (!options.manual) {
        const server = await startCallbackServer();
        try {
          redirectUri = `http://127.0.0.1:${server.port}`;
          const url = buildAuthUrl(challenge, redirectUri);
          spinner.info(`Opening browser: ${url}`);
          await open(url);
          spinner.start('Waiting for callback...');
          code = await server.waitForCode();
        } finally {
          server.close();
        }
      } else {
        const url = buildAuthUrl(challenge, redirectUri);
        spinner.info(`Open this URL: ${url}`);
        // Manual mode logic - simpler version for now
        console.log('\nCopy the code from the browser and paste it here:');
        // Note: For real manual mode, would need readline.
        spinner.fail('Manual mode not fully implemented yet.');
        return;
      }

      spinner.text = 'Exchanging token...';
      const tokens = await exchangeCode(code, verifier, redirectUri);
      
      let email = 'default';
      if (tokens.idToken) {
        const decoded = decodeJwt(tokens.idToken);
        if (decoded?.email) {
          email = decoded.email;
        }
      }

      configStore.addAccount({
        email,
        tokens,
        projectId: '', // Will be updated during discovery
      });
      configStore.setActiveAccount(email);

      if (email !== 'default') {
        spinner.info(`Logged in as ${email}`);
      }

      const client = new InternalClient(tokens.accessToken);
      spinner.text = 'Discovering project...';
      let data = await client.loadCodeAssist();
      let projectId = (data as any).cloudaicompanionProject?.id || (data as any).cloudaicompanionProject;

      // Deep Impersonation: If no project, try to onboard like Gemini-CLI
      if (!projectId && (data as any).allowedTiers) {
          spinner.text = 'Onboarding to Code Assist...';
          const tier = (data as any).allowedTiers.find((t: any) => t.isDefault) || (data as any).allowedTiers[0];
          if (tier) {
              const onboardRes = await client.onboardUser(tier.id);
              // Simple wait for LRO
              if (onboardRes.name) {
                  spinner.text = 'Waiting for onboarding to complete...';
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  data = await client.loadCodeAssist();
                  projectId = (data as any).cloudaicompanionProject?.id || (data as any).cloudaicompanionProject;
              }
          }
      }

      if (projectId && typeof projectId === 'string') {
        configStore.setProjectId(projectId);
        spinner.succeed(`Connected to project: ${projectId}`);
      } else {
        spinner.warn('No Code Assist project found. Please ensure "Cloud AI Companion API" is enabled in GCP.');
      }
    } catch (err: any) {
      spinner.fail(`Auth failed: ${err.message}`);
    }
  });
