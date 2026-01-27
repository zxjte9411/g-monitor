import { Command } from 'commander';
import { InternalClient } from '../api/internal.js';
import { configStore } from '../store/config.js';
import { formatResetTime } from '../ui/formatters.js';
import Table from 'cli-table3';
import ora from 'ora';
import chalk from 'chalk';

interface ModelInfo {
    id: string;
    displayName: string;
    remainingFraction?: number;
    resetTime?: string;
}

export const statusCommand = new Command('status')
    .description('Show quota status')
    .action(async () => {
        const tokens = configStore.getTokens();
        const projectId = configStore.getProjectId();

        if (!tokens || !projectId) {
            console.error(chalk.red('Not logged in or Project ID missing. Run "login" first.'));
            return;
        }

        const spinner = ora('Fetching unified quotas...').start();
        try {
            const client = new InternalClient(tokens.accessToken);
            
            // Simultaneously fetch from both endpoints to capture regular and preview models
            const [modelsData, quotaData]: [any, any] = await Promise.all([
                client.fetchAvailableModels(projectId),
                client.retrieveUserQuota(projectId)
            ]);
            
            spinner.stop();

            const modelMap = new Map<string, ModelInfo>();

            // 1. Process standard models list for display names
            const internalModels = modelsData.models || {};
            for (const key in internalModels) {
                const m = internalModels[key];
                modelMap.set(key, {
                    id: key,
                    displayName: m.displayName || key,
                    remainingFraction: m.quotaInfo?.remainingFraction,
                    resetTime: m.quotaInfo?.resetTime
                });
            }

            // 2. Process quota buckets (captures preview models)
            const buckets = quotaData.buckets || [];
            for (const bucket of buckets) {
                if (!bucket.modelId) continue;
                
                const existing = modelMap.get(bucket.modelId);
                modelMap.set(bucket.modelId, {
                    id: bucket.modelId,
                    displayName: existing?.displayName || bucket.modelId,
                    remainingFraction: bucket.remainingFraction,
                    resetTime: bucket.resetTime
                });
            }

            // 3. Sort: Case-insensitive alphabetical sorting by display name
            const sortedModels = Array.from(modelMap.values()).sort((a, b) => 
                a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
            );

            const table = new Table({
                head: [chalk.cyan('Model Name'), chalk.cyan('Remaining %'), chalk.cyan('Reset Time')],
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
            console.log(chalk.dim(`\nProject: ${projectId}`));
        } catch (err: any) {
            spinner.fail(chalk.red(`Failed to fetch quotas: ${err.message}`));
        }
    });
