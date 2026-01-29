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
    viewMode?: 'percent' | 'bar';
    scrollOffset?: number;
    maxHeight?: number;
}

export const QuotaTable: React.FC<Props> = ({ data, filter, viewMode = 'percent', scrollOffset = 0, maxHeight = 15 }) => {
    const renderProgressBar = (percentage: number, color: string) => {
        const width = 10;
        const filledChars = Math.round((percentage / 100) * width);
        const emptyChars = width - filledChars;
        return (
            <Text color={color}>
                {'█'.repeat(filledChars)}{'░'.repeat(emptyChars)}
            </Text>
        );
    };

    const filteredData = data.filter(item => {
        if (filter === 'all') return true;
        return item.source.toLowerCase() === filter;
    });

    const visibleData = filteredData.slice(scrollOffset, scrollOffset + maxHeight);

    const totalItems = filteredData.length;
    const thumbHeight = Math.max(1, Math.floor((maxHeight / totalItems) * maxHeight));
    const maxScroll = Math.max(1, totalItems - maxHeight);
    const trackSpace = maxHeight - thumbHeight;
    const thumbTop = Math.floor((scrollOffset / maxScroll) * trackSpace);

    return (
        <Box flexDirection="row" paddingX={1}>
            <Box flexGrow={1} flexDirection="column">
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
                                {viewMode === 'bar' ? (
                                    renderProgressBar(percentage, color)
                                ) : (
                                    <Text color={color}>
                                        {item.remaining} / {item.limit}
                                    </Text>
                                )}
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

            {totalItems > maxHeight && (
                <Box width={1} flexDirection="column" marginLeft={1} marginTop={3}>
                    {Array.from({ length: maxHeight }).map((_, i) => {
                        const isThumb = i >= thumbTop && i < thumbTop + thumbHeight;
                        return (
                            <Text key={i} color={isThumb ? 'cyan' : 'gray'} dimColor={!isThumb}>
                                {isThumb ? '█' : '┃'}
                            </Text>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};
