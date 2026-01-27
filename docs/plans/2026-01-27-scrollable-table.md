# Scrollable Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement scrollable table logic in `D:/g-monitor` as specified.

**Architecture:** 
- `QuotaTable` will accept `maxHeight` and `scrollOffset` props.
- It will slice the `filteredData` and display visual indicators (▲/▼).
- `App` component will manage `scrollOffset` state and handle keyboard input (ArrowUp/ArrowDown).
- `scrollOffset` will reset to 0 when the filter changes.

**Tech Stack:** React (Ink), TypeScript.

### Task 1: Update QuotaTable component

**Files:**
- Modify: `D:/g-monitor/src/ui/components/QuotaTable.tsx`

**Step 1: Update Props and implementation**

```typescript
<<<<
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
====
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
>>>>
```

**Step 2: Add visual indicators and slice data**

```typescript
<<<<
            <Box flexDirection="row" borderStyle="single" borderColor="gray" paddingX={1}>
                <Box flexBasis="50%">
                    <Text bold>Name</Text>
                </Box>
====
            {hasMoreAbove && (
                <Box justifyContent="center">
                    <Text dimColor>▲</Text>
                </Box>
            )}

            <Box flexDirection="row" borderStyle="single" borderColor="gray" paddingX={1}>
                <Box flexBasis="50%">
                    <Text bold>Name</Text>
                </Box>
>>>>
```

Update mapping:

```typescript
<<<<
            {filteredData.length === 0 ? (
                <Box paddingY={1} justifyContent="center">
                    <Text dimColor>No quota data available</Text>
                </Box>
            ) : (
                filteredData.map((item, index) => {
====
            {filteredData.length === 0 ? (
                <Box paddingY={1} justifyContent="center">
                    <Text dimColor>No quota data available</Text>
                </Box>
            ) : (
                visibleData.map((item, index) => {
>>>>
```

Add bottom indicator:

```typescript
<<<<
                    );
                })
            )}
        </Box>
    );
};
====
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
>>>>
```

### Task 2: Update App component

**Files:**
- Modify: `D:/g-monitor/src/ui/App.tsx`

**Step 1: Add scroll state and reset logic**

```typescript
<<<<
    const [filter, setFilter] = useState<'all' | 'prod' | 'daily'>('all');
    const [refreshInterval] = useState(60);
====
    const [filter, setFilter] = useState<'all' | 'prod' | 'daily'>('all');
    const [scrollOffset, setScrollOffset] = useState(0);
    const [refreshInterval] = useState(60);

    useEffect(() => {
        setScrollOffset(0);
    }, [filter]);
>>>>
```

**Step 2: Update useInput handler**

```typescript
<<<<
        if (input === 's') {
            setShowAccountSwitcher(current => !current);
        }
    });
====
        if (input === 's') {
            setShowAccountSwitcher(current => !current);
        }

        const filteredDataLength = transformData().filter(item => {
            if (filter === 'all') return true;
            return item.source.toLowerCase() === filter;
        }).length;
        const maxOffset = Math.max(0, filteredDataLength - 15);

        if (key.downArrow) {
            setScrollOffset(prev => Math.min(maxOffset, prev + 1));
        }
        if (key.upArrow) {
            setScrollOffset(prev => Math.max(0, prev - 1));
        }
    });
>>>>
```

**Step 3: Pass props to QuotaTable**

```typescript
<<<<
                ) : (
                    <QuotaTable data={transformData()} filter={filter} />
                )}
            </Box>
====
                ) : (
                    <QuotaTable 
                        data={transformData()} 
                        filter={filter} 
                        scrollOffset={scrollOffset} 
                        maxHeight={15} 
                    />
                )}
            </Box>
>>>>
```

### Task 3: Verification

**Step 1: Build the project**

Run: `bun run build` in `D:/g-monitor`
Expected: Success.

### Task 4: Commit

**Step 1: Commit changes**

Run: `git add . && git commit -m "fix: implement scrollable table for tui" --no-gpg-sign`
