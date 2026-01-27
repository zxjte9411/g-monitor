import React from 'react';
import { Box, Text } from 'ink';

export const Footer: React.FC<{ 
    sortMode: 'name' | 'pool' | 'status',
    viewMode: 'percent' | 'bar' 
}> = ({ sortMode, viewMode }) => {
    const modeLabel = sortMode.charAt(0).toUpperCase() + sortMode.slice(1);
    const viewLabel = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);
    return (
        <Box flexDirection="row" marginTop={1} paddingX={1} borderStyle="single" borderColor="gray">
            <Box marginRight={2}>
                <Text>
                    <Text color="yellow" bold>[R]</Text>efresh
                </Text>
            </Box>
            <Box marginRight={2}>
                <Text>
                    <Text color="yellow" bold>[S]</Text>witch Account
                </Text>
            </Box>
            <Box marginRight={2}>
                <Text>
                    <Text color="yellow" bold>[F]</Text>ilter
                </Text>
            </Box>
            <Box marginRight={2}>
                <Text>
                    <Text color="yellow" bold>[G]</Text>roup: <Text color="cyan">{modeLabel}</Text>
                </Text>
            </Box>
            <Box marginRight={2}>
                <Text>
                    <Text color="yellow" bold>[V]</Text>iew: <Text color="cyan">{viewLabel}</Text>
                </Text>
            </Box>
            <Box>
                <Text>
                    <Text color="yellow" bold>[Q]</Text>uit
                </Text>
            </Box>
        </Box>
    );
};
