import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import { formatResetTime } from '../formatters.js';

export interface QuotaData {
    name: string;
    remaining: number;
    limit: number;
    resetTime?: string;
    source: 'Prod' | 'Daily';
}

interface Props {
    data: QuotaData[];
    filter: 'all' | 'prod' | 'daily';
}

export const QuotaTable: React.FC<Props> = ({ data, filter }) => {
    const filteredData = data.filter(item => {
        if (filter === 'all') return true;
        return item.source.toLowerCase() === filter;
    });

    return (
        <Box flexDirection="column" paddingX={1}>
            <Box flexDirection="row" borderStyle="single" borderColor="gray" paddingX={1}>
                <Box flexBasis="50%">
                    <Text bold>Name</Text>
                </Box>
                <Box flexBasis="25%">
                    <Text bold>Remaining</Text>
                </Box>
                <Box flexBasis="25%">
                    <Text bold>Reset</Text>
                </Box>
            </Box>

            {filteredData.length === 0 ? (
                <Box paddingY={1} justifyContent="center">
                    <Text dimColor>No quota data available</Text>
                </Box>
            ) : (
                filteredData.map((item, index) => {
                    const percentage = (item.remaining / item.limit) * 100;
                    let color = 'green';
                    if (percentage < 20) color = 'red';
                    else if (percentage < 50) color = 'yellow';

                    return (
                        <Box key={index} flexDirection="row" paddingX={1}>
                            <Box flexBasis="50%">
                                <Text color={item.source === 'Prod' ? 'cyan' : 'magenta'}>
                                    [{item.source.charAt(0)}] {item.name}
                                </Text>
                            </Box>
                            <Box flexBasis="25%">
                                <Text color={color}>
                                    {item.remaining} / {item.limit}
                                </Text>
                            </Box>
                            <Box flexBasis="25%">
                                <Text dimColor>
                                    {item.resetTime ? formatResetTime(item.resetTime) : '-'}
                                </Text>
                            </Box>
                        </Box>
                    );
                })
            )}
        </Box>
    );
};
