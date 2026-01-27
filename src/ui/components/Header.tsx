import React from 'react';
import { Box, Text } from 'ink';
import { configStore } from '../../store/config.js';

interface Props {
    refreshInterval: number;
    lastUpdated: Date;
}

export const Header: React.FC<Props> = ({ refreshInterval, lastUpdated }) => {
    const activeAccount = configStore.getActiveAccount();
    
    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
            <Box justifyContent="space-between">
                <Text color="cyan" bold>g-monitor</Text>
                <Text>
                    Account: <Text color="green">{activeAccount?.email || 'None'}</Text>
                </Text>
            </Box>
            <Box justifyContent="space-between">
                <Text dimColor>
                    Refresh: {refreshInterval}s
                </Text>
                <Text dimColor>
                    Last Updated: {lastUpdated.toLocaleTimeString()}
                </Text>
            </Box>
        </Box>
    );
};
