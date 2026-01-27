import { Command } from 'commander';
import { InternalClient } from '../api/internal.js';
import { configStore } from '../store/config.js';
import Table from 'cli-table3';
import ora from 'ora';
import chalk from 'chalk';

export const statusCommand = new Command('status')
    .description('Show quota status')
    .action(async () => {
        const tokens = configStore.getTokens();
        const projectId = configStore.getProjectId();

        if (!tokens) {
            console.error(chalk.red('Not logged in. Run "login" first.'));
            return;
        }

        const spinner = ora('Fetching quotas...').start();
        try {
            const client = new InternalClient(tokens.accessToken);
            const internalData: any = await client.fetchAvailableModels(projectId);
            
            spinner.stop();

            const table = new Table({
                head: [chalk.cyan('Model'), chalk.cyan('Remaining %'), chalk.cyan('Reset Time')],
                style: { head: [] }
            });

            const models = internalData.models || {};
            for (const key in models) {
                const m = models[key];
                const quota = m.quotaInfo || {};
                const fraction = quota.remainingFraction;
                
                let remainStr = 'N/A';
                if (typeof fraction === 'number') {
                    const pct = (fraction * 100).toFixed(0);
                    remainStr = pct === '0' ? chalk.red('0%') : pct + '%';
                }
                
                const reset = quota.resetTime || 'N/A';
                table.push([m.displayName || key, remainStr, reset]);
            }

            console.log(table.toString());
        } catch (err: any) {
            spinner.fail(chalk.red(`Failed: ${err.message}`));
        }
    });
