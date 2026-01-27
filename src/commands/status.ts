import { Command } from 'commander';
import { InternalClient } from '../api/internal.js';
import { configStore } from '../store/config.js';
import { formatResetTime } from '../ui/formatters.js';
import { refreshTokens } from '../auth/exchange.js';
import Table from 'cli-table3';
import ora from 'ora';
import chalk from 'chalk';
import React from 'react';
import { render } from 'ink';
import { App } from '../ui/App.js';

interface ModelInfo {
    id: string;
    displayName: string;
    remainingFraction?: number;
    resetTime?: string;
}

export const statusCommand = new Command('status')
    .description('Show quota status across all environments')
    .option('-d, --debug', 'Show raw API response for debugging')
    .option('--prod', 'Show only Production pool')
    .option('--daily', 'Show only Daily Sandbox pool')
    .option('--all', 'Show status for all accounts')
    .option('--tui', 'Display dashboard in TUI mode')
    .action(async (options) => {
        if (options.tui) {
            const account = configStore.getActiveAccount();
            if (!account) {
                console.error(chalk.red('No active account found. Run "login" first.'));
                return;
            }
            render(React.createElement(App));
            return;
        }

        const accounts = options.all 
            ? configStore.getAccounts() 
            : [configStore.getActiveAccount()].filter((a): a is any => !!a);

        if (accounts.length === 0) {
            console.error(chalk.red('No accounts found. Run "login" first.'));
            return;
        }

        for (const account of accounts) {
            if (options.all) {
                console.log(chalk.bold(`\nAccount: ${account.email} (Project: ${account.projectId})`));
                console.log(chalk.dim('─'.repeat(50)));
            }

            await processAccountStatus(account, options);
        }
    });

async function processAccountStatus(account: any, options: any) {
    let tokens = account.tokens;
    const projectId = account.projectId;

    const spinner = ora('Checking session...').start();
    
    try {
        // 1. Auto-Refresh Logic: If token expired or expiring in < 5 mins, refresh it
        const isExpired = Date.now() > (tokens.expiresAt - 5 * 60 * 1000);
        if (isExpired) {
            spinner.text = 'Refreshing session...';
            try {
                const newTokens = await refreshTokens(tokens.refreshToken);
                // Update tokens in the account object and save back to store
                account.tokens = newTokens;
                configStore.addAccount(account);
                tokens = newTokens;
                spinner.succeed('Session refreshed.');
                spinner.start('Performing Global Quota Sweep...');
            } catch (refreshErr: any) {
                spinner.fail(chalk.red(`Session expired and refresh failed for ${account.email}. Please "login" again.`));
                if (options.debug) console.error(refreshErr);
                return;
            }
        } else {
            spinner.text = 'Performing Global Quota Sweep...';
        }

        const client = new InternalClient(tokens.accessToken);
        
        // Sweep all combinations of [Prod, Daily] x [Antigravity, GeminiCLI]
        const sweepResults = await client.sweepQuotas(projectId);
        
        spinner.stop();

        if (options.debug) {
            console.log(chalk.yellow('\n--- DEBUG: Sweep Results ---'));
            console.log(JSON.stringify(sweepResults, null, 2));
            console.log(chalk.yellow('--- END DEBUG ---\n'));
        }

        const modelMap = new Map<string, ModelInfo>();

        // 1. First pass: Collect all display names from all sources
        for (const res of sweepResults) {
            if ((res as any).modelNames) {
                const models = (res as any).modelNames;
                for (const id in models) {
                    const existing = modelMap.get(id);
                    if (!existing || existing.displayName === id) {
                        modelMap.set(id, {
                            id,
                            displayName: models[id].displayName || id
                        });
                    }
                }
            }
        }

        // 2. Second pass: Collect and merge all quota buckets
        for (const res of sweepResults) {
            if ((res as any).data?.buckets) {
                const buckets = (res as any).data.buckets;
                const source = (res as any).source;
                const identity = (res as any).identity;

                // Apply filters if specified
                if (options.prod && source !== 'Prod') continue;
                if (options.daily && source !== 'Daily') continue;

                const identityMap: Record<string, string> = {
                    'antigravity': 'Antigravity',
                    'gemini-cli': 'CLI'
                };
                const poolLabel = `${source}/${identityMap[identity] || identity}`;

                for (const bucket of buckets) {
                    if (!bucket.modelId) continue;
                    
                    const id = bucket.modelId;
                    const existing = modelMap.get(id);
                    
                    const uniqueKey = `${id}|${source}|${identity}`;
                    
                    let displayName = existing?.displayName || id;
                    if (id === 'gemini-3-pro-high') displayName = 'Gemini 3 Pro (High)';
                    if (id === 'gemini-3-pro-low') displayName = 'Gemini 3 Pro (Low)';
                    if (id === 'gemini-3-flash') displayName = 'Gemini 3 Flash';

                    modelMap.set(uniqueKey, {
                        id,
                        displayName: `${displayName} ${chalk.dim(`[${poolLabel}]`)}`,
                        remainingFraction: bucket.remainingFraction,
                        resetTime: bucket.resetTime
                    });
                }
            }
        }

        // 3. Sort: Case-insensitive alphabetical sorting by display name
        const sortedModels = Array.from(modelMap.values())
            .filter(m => m.remainingFraction !== undefined) // Only show items with quota info
            .sort((a, b) => 
                a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
            );

        const table = new Table({
            head: [chalk.cyan('Model Name (Pool)'), chalk.cyan('Remaining %'), chalk.cyan('Reset Time')],
            style: { head: [] }
        });

        for (const m of sortedModels) {
            const fraction = m.remainingFraction;
            
            let remainStr = 'N/A';
            if (typeof fraction === 'number') {
                const pct = Math.round(fraction * 100);
                if (pct === 0) remainStr = chalk.red('0%');
                else if (pct < 10) remainStr = chalk.yellow(`${pct}%`);
                else remainStr = chalk.green(`${pct}%`);
            }
            
            const resetStr = m.resetTime ? formatResetTime(m.resetTime) : 'N/A';
            table.push([m.displayName, remainStr, resetStr]);
        }

        console.log(table.toString());

        // Improved summary
        const successfulSources = Array.from(new Set(sweepResults.map((r: any) => `${r.source}/${r.identity}`)));
        if (!options.all) {
            console.log(chalk.dim(`\nProject: ${projectId}`));
            console.log(chalk.dim(`Active Pools: ${successfulSources.join(', ')}`));
        }
        
    } catch (err: any) {
        spinner.fail(chalk.red(`Sweep failed: ${err.message}`));
    }
}
