import React from 'react';
import { Box, Text } from 'ink';

export const Footer: React.FC = () => {
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
            <Box>
                <Text>
                    <Text color="yellow" bold>[Q]</Text>uit
                </Text>
            </Box>
        </Box>
    );
};
