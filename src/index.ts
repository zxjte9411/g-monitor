#!/usr/bin/env bun
import { Command } from 'commander';
import { loginCommand } from './commands/login.js';

const program = new Command();

program
  .name('g-monitor')
  .description('Google Antigravity & Gemini Quota Monitor')
  .version('0.0.1');

program.addCommand(loginCommand);

program.parse(process.argv);
