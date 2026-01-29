import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { QuotaTable, QuotaData } from './components/QuotaTable.js';
import { AccountSwitcher } from './components/AccountSwitcher.js';
import { InternalClient } from '../api/internal.js';
import { configStore } from '../store/config.js';
import { refreshTokens } from '../auth/exchange.js';

interface SweepResult {
    source: 'Prod' | 'Daily';
    identity: string;
    data?: {
        buckets?: Array<{
            modelId: string;
            remainingFraction: number;
            resetTime?: string;
        }>;
    };
    modelNames?: Record<string, { displayName: string }>;
}

export const App: React.FC = () => {
    const { exit } = useApp();
    const { stdout } = useStdout();
    const [windowHeight, setWindowHeight] = useState(stdout?.rows || 20);

    useEffect(() => {
        if (!stdout) return;
        const onResize = () => {
            setWindowHeight(stdout.rows);
        };
        stdout.on('resize', onResize);
        return () => {
            stdout.off('resize', onResize);
        };
    }, [stdout]);

    const HEADER_HEIGHT = 4;
    const FOOTER_HEIGHT = 3;
    const MARGIN = 2;
    const tableHeight = Math.max(5, windowHeight - HEADER_HEIGHT - FOOTER_HEIGHT - MARGIN);

    const [data, setData] = useState<SweepResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState<'name' | 'pool' | 'status'>('name');
    const [viewMode, setViewMode] = useState<'percent' | 'bar'>('percent');
    const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
    const [filter, setFilter] = useState<'all' | 'prod' | 'daily'>('all');
    const [scrollOffset, setScrollOffset] = useState(0);
    const [refreshInterval] = useState(60);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        setScrollOffset(0);
    }, [filter]);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const account = configStore.getActiveAccount();
            if (!account) {
                setError('No active account. Please login.');
                setLoading(false);
                return;
            }

            let tokens = account.tokens;
            const isExpired = Date.now() > (tokens.expiresAt - 5 * 60 * 1000);
            
            if (isExpired) {
                try {
                    const newTokens = await refreshTokens(tokens.refreshToken);
                    account.tokens = newTokens;
                    configStore.addAccount(account);
                    tokens = newTokens;
                } catch (refreshErr) {
                    setError('Session expired and refresh failed. Please login again.');
                    setLoading(false);
                    return;
                }
            }

            const client = new InternalClient(tokens.accessToken);
            const results = await client.sweepQuotas(account.projectId);
            setData(results as SweepResult[]);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(`Fetch failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, refreshInterval * 1000);
        return () => clearInterval(timer);
    }, [fetchData, refreshInterval, refreshTrigger]);

    useInput((input, key) => {
        if (input === 'q') {
            exit();
        }
        if (input === 'r') {
            setRefreshTrigger(t => t + 1);
            fetchData();
        }
        if (input === 'f') {
            setFilter(current => {
                if (current === 'all') return 'prod';
                if (current === 'prod') return 'daily';
                return 'all';
            });
        }
        if (input === 's') {
            setShowAccountSwitcher(current => !current);
        }
        if (input === 'g') {
            setSortMode(current => {
                if (current === 'name') return 'pool';
                if (current === 'pool') return 'status';
                return 'name';
            });
        }
        if (input === 'v') {
            setViewMode(current => current === 'percent' ? 'bar' : 'percent');
        }

        const filteredDataLength = transformData().filter(item => {
            if (filter === 'all') return true;
            return item.source.toLowerCase() === filter;
        }).length;
        const maxOffset = Math.max(0, filteredDataLength - tableHeight);

        if (key.downArrow) {
            setScrollOffset(prev => Math.min(maxOffset, prev + 1));
        }
        if (key.upArrow) {
            setScrollOffset(prev => Math.max(0, prev - 1));
        }
    });

    const handleAccountSelect = (email: string) => {
        configStore.setActiveAccount(email);
        setShowAccountSwitcher(false);
        fetchData();
    };

    // Transform SweepResult[] to QuotaData[]
    const transformData = (): QuotaData[] => {
        const modelMap = new Map<string, { displayName: string }>();
        
        // Collect model names
        data.forEach(res => {
            if (res.modelNames) {
                Object.entries(res.modelNames).forEach(([id, info]) => {
                    modelMap.set(id, { displayName: info.displayName });
                });
            }
        });

        const quotaItems: QuotaData[] = [];
        data.forEach(res => {
            if (res.data?.buckets) {
                const identityMap: Record<string, string> = {
                    'antigravity': 'Antigravity',
                    'gemini-cli': 'CLI'
                };
                const poolLabel = `${res.source}/${identityMap[res.identity] || res.identity}`;

                res.data.buckets.forEach(bucket => {
                    if (!bucket.modelId) return;
                    
                    let displayName = modelMap.get(bucket.modelId)?.displayName || bucket.modelId;
                    
                    // Special case overrides from status.ts
                    if (bucket.modelId === 'gemini-3-pro-high') displayName = 'Gemini 3 Pro (High)';
                    if (bucket.modelId === 'gemini-3-pro-low') displayName = 'Gemini 3 Pro (Low)';
                    if (bucket.modelId === 'gemini-3-flash') displayName = 'Gemini 3 Flash';

                    quotaItems.push({
                        name: `${displayName} [${poolLabel}]`,
                        remaining: Math.round(bucket.remainingFraction * 100),
                        limit: 100,
                        resetTime: bucket.resetTime,
                        source: res.source,
                        poolLabel,
                        remainingFraction: bucket.remainingFraction,
                        displayName
                    });
                });
            }
        });

        // Sort logic
        return quotaItems.sort((a, b) => {
            if (sortMode === 'name') {
                return a.name.localeCompare(b.name);
            }
            if (sortMode === 'pool') {
                const poolComp = a.poolLabel.localeCompare(b.poolLabel);
                return poolComp !== 0 ? poolComp : a.name.localeCompare(b.name);
            }
            if (sortMode === 'status') {
                const statusComp = (a.remainingFraction || 0) - (b.remainingFraction || 0);
                return statusComp !== 0 ? statusComp : a.name.localeCompare(b.name);
            }
            return 0;
        });
    };

    if (showAccountSwitcher) {
        const accounts = configStore.getAccounts().map(a => a.email);
        return (
            <AccountSwitcher 
                accounts={accounts} 
                onSelect={handleAccountSelect} 
                onCancel={() => setShowAccountSwitcher(false)} 
            />
        );
    }

    return (
        <Box flexDirection="column" padding={1}>
            <Header refreshInterval={refreshInterval} lastUpdated={lastUpdated} />
            
            {error && (
                <Box paddingY={1}>
                    <Text color="red">Error: {error}</Text>
                </Box>
            )}

            <Box flexGrow={1} minHeight={10}>
                {loading ? (
                    <Box justifyContent="center" alignItems="center" width="100%">
                        <Text color="yellow">
                            <Spinner type="dots" /> Loading Quota Data...
                        </Text>
                    </Box>
                ) : (
                    <QuotaTable 
                        data={transformData()} 
                        filter={filter} 
                        viewMode={viewMode}
                        scrollOffset={scrollOffset} 
                        maxHeight={tableHeight} 
                    />
                )}
            </Box>

            <Footer sortMode={sortMode} viewMode={viewMode} />
        </Box>
    );
};
