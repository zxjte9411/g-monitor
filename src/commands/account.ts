import { Command } from 'commander';
import Table from 'cli-table3';
import chalk from 'chalk';
import { configStore } from '../store/config.js';

export const accountCommand = new Command('account')
  .description('Manage Google accounts');

accountCommand
  .command('list')
  .alias('ls')
  .description('List all authenticated accounts')
  .action(() => {
    const accounts = configStore.getAccounts();
    const activeAccount = configStore.getActiveAccount();

    if (accounts.length === 0) {
      console.log(chalk.yellow('No accounts found. Use "g-monitor login" to add one.'));
      return;
    }

    const table = new Table({
      head: ['', 'Email', 'Project ID'].map(h => chalk.cyan(h)),
      style: { head: [], border: [] }
    });

    accounts.forEach(account => {
      const isActive = activeAccount?.email === account.email;
      table.push([
        isActive ? chalk.green('*') : '',
        isActive ? chalk.bold(account.email) : account.email,
        account.projectId || chalk.gray('not set')
      ]);
    });

    console.log(table.toString());
  });

accountCommand
  .command('switch <email>')
  .alias('use')
  .description('Switch the active account')
  .action((email) => {
    const account = configStore.getAccount(email);
    if (!account) {
      console.error(chalk.red(`Error: Account with email "${email}" not found.`));
      process.exit(1);
    }

    configStore.setActiveAccount(email);
    console.log(chalk.green(`Switched to account: ${email}`));
  });

accountCommand
  .command('remove <email>')
  .alias('rm')
  .description('Remove an account')
  .action((email) => {
    const account = configStore.getAccount(email);
    if (!account) {
      console.error(chalk.red(`Error: Account with email "${email}" not found.`));
      process.exit(1);
    }

    configStore.removeAccount(email);
    console.log(chalk.green(`Removed account: ${email}`));
    
    const activeAccount = configStore.getActiveAccount();
    if (activeAccount) {
      console.log(chalk.yellow(`Active account is now: ${activeAccount.email}`));
    } else {
      console.log(chalk.yellow('No active account selected.'));
    }
  });
