#!/usr/bin/env bun
import { Command } from 'commander';

const program = new Command();

program
  .name('g-monitor')
  .description('Google Antigravity & Gemini Quota Monitor')
  .version('0.0.1');

program.parse(process.argv);
