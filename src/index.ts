#!/usr/bin/env bun
import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('g-monitor')
  .description('Google Antigravity & Gemini Quota Monitor')
  .version('0.0.1');

program.addCommand(loginCommand);
program.addCommand(statusCommand);

program.parse(process.argv);
