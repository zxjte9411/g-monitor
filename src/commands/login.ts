import { Command } from 'commander';
import open from 'open';
import ora from 'ora';
import { generatePKCE } from '../auth/pkce.js';
import { buildAuthUrl } from '../auth/url.js';
import { startCallbackServer } from '../auth/server.js';
import { exchangeCode } from '../auth/exchange.js';
import { configStore } from '../store/config.js';

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
      configStore.setTokens(tokens);
      spinner.succeed('Authentication successful!');
    } catch (err: any) {
      spinner.fail(`Auth failed: ${err.message}`);
    }
  });
