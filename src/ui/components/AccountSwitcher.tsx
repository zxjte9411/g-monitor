import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

interface Props {
    accounts: string[];
    onSelect: (email: string) => void;
    onCancel: () => void;
}

export const AccountSwitcher: React.FC<Props> = ({ accounts, onSelect, onCancel }) => {
    // Handle escape key to cancel
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        }
    });

    const items = accounts.map(email => ({
        label: email,
        value: email
    }));

    return (
        <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1}>
            <Text bold color="yellow">Select Account (ESC to cancel):</Text>
            <Box marginTop={1}>
                <SelectInput 
                    items={items} 
                    onSelect={(item) => onSelect(item.value)} 
                />
            </Box>
        </Box>
    );
};
