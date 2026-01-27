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
    poolLabel: string;
    remainingFraction: number;
    displayName: string;
}

interface Props {
    data: QuotaData[];
    filter: 'all' | 'prod' | 'daily';
    scrollOffset?: number;
    maxHeight?: number;
}

export const QuotaTable: React.FC<Props> = ({ data, filter, scrollOffset = 0, maxHeight = 15 }) => {
    const filteredData = data.filter(item => {
        if (filter === 'all') return true;
        return item.source.toLowerCase() === filter;
    });

    const visibleData = filteredData.slice(scrollOffset, scrollOffset + maxHeight);
    const hasMoreAbove = scrollOffset > 0;
    const hasMoreBelow = scrollOffset + maxHeight < filteredData.length;

    return (
        <Box flexDirection="column" paddingX={1}>
            {hasMoreAbove && (
                <Box justifyContent="center">
                    <Text dimColor>▲</Text>
                </Box>
            )}

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
                visibleData.map((item, index) => {
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

            {hasMoreBelow && (
                <Box justifyContent="center">
                    <Text dimColor>▼</Text>
                </Box>
            )}
        </Box>
    );
};
