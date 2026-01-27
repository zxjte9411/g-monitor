#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { statusCommand } from './commands/status.js';
import { accountCommand } from './commands/account.js';

const program = new Command();

program
  .name('g-monitor')
  .description('Google Antigravity & Gemini Quota Monitor')
  .version('0.0.1');

program.addCommand(loginCommand);
program.addCommand(statusCommand);
program.addCommand(accountCommand);

program.parse(process.argv);
