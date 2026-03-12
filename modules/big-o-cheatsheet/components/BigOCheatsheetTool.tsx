'use client';

import React, { useState, useMemo } from 'react';
import { Tabs, Table, Tag, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';

// ── Complexity color mapping ──────────────────────────────────────────────────
type ComplexityKey = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)' | 'O(2ⁿ)' | 'O(n!)' | 'O(√n)';

const COMPLEXITY_COLORS: Record<ComplexityKey | string, string> = {
  'O(1)': '#52c41a',
  'O(log n)': '#1677ff',
  'O(n)': '#faad14',
  'O(n log n)': '#fa8c16',
  'O(n²)': '#f5222d',
  'O(n³)': '#a8071a',
  'O(2ⁿ)': '#820014',
  'O(n!)': '#531dab',
  'O(√n)': '#13c2c2',
};

function ComplexityTag({ value }: { value: string }) {
  const color = COMPLEXITY_COLORS[value] ?? '#666';
  return (
    <Tag
      style={{
        background: color + '22',
        border: `1px solid ${color}55`,
        color: color,
        fontFamily: 'monospace',
        fontWeight: 600,
        fontSize: 12,
        borderRadius: 4,
        padding: '1px 7px',
      }}
    >
      {value}
    </Tag>
  );
}

// ── Section 1: Complexity Classes ─────────────────────────────────────────────
interface ComplexityClass {
  key: string;
  notation: string;
  name: string;
  example: string;
  performance: string;
}

const complexityClasses: ComplexityClass[] = [
  { key: '1', notation: 'O(1)', name: 'Constant', example: 'Array index access, Hash table lookup', performance: 'Excellent' },
  { key: '2', notation: 'O(log n)', name: 'Logarithmic', example: 'Binary search, BST operations', performance: 'Good' },
  { key: '3', notation: 'O(n)', name: 'Linear', example: 'Linear search, Array traversal', performance: 'Fair' },
  { key: '4', notation: 'O(n log n)', name: 'Linearithmic', example: 'Merge sort, Heap sort, Quick sort (avg)', performance: 'Acceptable' },
  { key: '5', notation: 'O(n²)', name: 'Quadratic', example: 'Bubble sort, Insertion sort, Selection sort', performance: 'Bad' },
  { key: '6', notation: 'O(n³)', name: 'Cubic', example: 'Matrix multiplication (naive)', performance: 'Horrible' },
  { key: '7', notation: 'O(2ⁿ)', name: 'Exponential', example: 'Subset enumeration, Tower of Hanoi', performance: 'Horrible' },
  { key: '8', notation: 'O(n!)', name: 'Factorial', example: 'Permutations, Traveling salesman (brute force)', performance: 'Horrible' },
];

const performanceColor: Record<string, string> = {
  Excellent: '#52c41a',
  Good: '#1677ff',
  Fair: '#faad14',
  Acceptable: '#fa8c16',
  Bad: '#f5222d',
  Horrible: '#820014',
};

const complexityClassColumns = [
  {
    title: 'Notation',
    dataIndex: 'notation',
    key: 'notation',
    render: (v: string) => <ComplexityTag value={v} />,
    width: 130,
  },
  { title: 'Name', dataIndex: 'name', key: 'name', width: 140, render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
  { title: 'Example Use Cases', dataIndex: 'example', key: 'example' },
  {
    title: 'Performance',
    dataIndex: 'performance',
    key: 'performance',
    width: 130,
    render: (v: string) => (
      <Tag
        style={{
          background: (performanceColor[v] ?? '#666') + '22',
          border: `1px solid ${(performanceColor[v] ?? '#666')}55`,
          color: performanceColor[v] ?? '#666',
          fontWeight: 700,
          borderRadius: 4,
        }}
      >
        {v}
      </Tag>
    ),
  },
];

// ── Section 2: Sorting Algorithms ─────────────────────────────────────────────
interface SortAlgo {
  key: string;
  algorithm: string;
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: string;
}

const sortingAlgorithms: SortAlgo[] = [
  { key: '1', algorithm: 'Bubble Sort', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Yes' },
  { key: '2', algorithm: 'Selection Sort', best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'No' },
  { key: '3', algorithm: 'Insertion Sort', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: 'Yes' },
  { key: '4', algorithm: 'Merge Sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: 'Yes' },
  { key: '5', algorithm: 'Quick Sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: 'No' },
  { key: '6', algorithm: 'Heap Sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: 'No' },
  { key: '7', algorithm: 'Radix Sort', best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)', stable: 'Yes' },
  { key: '8', algorithm: 'Counting Sort', best: 'O(n+k)', average: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)', stable: 'Yes' },
  { key: '9', algorithm: 'Tim Sort', best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: 'Yes' },
  { key: '10', algorithm: 'Shell Sort', best: 'O(n log n)', average: 'O(n log² n)', worst: 'O(n²)', space: 'O(1)', stable: 'No' },
];

const sortColumns = [
  { title: 'Algorithm', dataIndex: 'algorithm', key: 'algorithm', width: 150, render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
  { title: 'Best', dataIndex: 'best', key: 'best', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Average', dataIndex: 'average', key: 'average', width: 130, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Worst', dataIndex: 'worst', key: 'worst', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Space', dataIndex: 'space', key: 'space', width: 110, render: (v: string) => <ComplexityTag value={v} /> },
  {
    title: 'Stable',
    dataIndex: 'stable',
    key: 'stable',
    width: 90,
    render: (v: string) => (
      <Tag color={v === 'Yes' ? 'green' : 'red'} style={{ borderRadius: 4 }}>{v}</Tag>
    ),
  },
];

// ── Section 3: Data Structures ────────────────────────────────────────────────
interface DataStructure {
  key: string;
  name: string;
  access: string;
  search: string;
  insert: string;
  delete: string;
  space: string;
  notes?: string;
}

const dataStructures: DataStructure[] = [
  { key: '1', name: 'Array', access: 'O(1)', search: 'O(n)', insert: 'O(n)', delete: 'O(n)', space: 'O(n)', notes: 'Random access, contiguous memory' },
  { key: '2', name: 'Dynamic Array', access: 'O(1)', search: 'O(n)', insert: 'O(1)*', delete: 'O(n)', space: 'O(n)', notes: 'Amortized O(1) append' },
  { key: '3', name: 'Stack', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'LIFO; push/pop at top' },
  { key: '4', name: 'Queue', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'FIFO; enqueue/dequeue' },
  { key: '5', name: 'Linked List', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Insert at known node is O(1)' },
  { key: '6', name: 'Doubly Linked List', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Forward & backward traversal' },
  { key: '7', name: 'Hash Table', access: 'N/A', search: 'O(1)*', insert: 'O(1)*', delete: 'O(1)*', space: 'O(n)', notes: 'Average case; worst O(n) on collision' },
  { key: '8', name: 'BST', access: 'O(log n)*', search: 'O(log n)*', insert: 'O(log n)*', delete: 'O(log n)*', space: 'O(n)', notes: 'Average; worst O(n) if unbalanced' },
  { key: '9', name: 'AVL Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', notes: 'Always balanced, guaranteed O(log n)' },
  { key: '10', name: 'Red-Black Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', notes: 'Self-balancing; used in many STLs' },
  { key: '11', name: 'Heap (Binary)', access: 'O(n)', search: 'O(n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', notes: 'Min/max retrieval O(1)' },
  { key: '12', name: 'Trie', access: 'O(k)', search: 'O(k)', insert: 'O(k)', delete: 'O(k)', space: 'O(n·k)', notes: 'k = key length; ideal for strings' },
  { key: '13', name: 'Graph (Adj. Matrix)', access: 'O(1)', search: 'O(V²)', insert: 'O(1)', delete: 'O(V²)', space: 'O(V²)', notes: 'Dense graphs; V = vertices' },
  { key: '14', name: 'Graph (Adj. List)', access: 'O(V)', search: 'O(V+E)', insert: 'O(1)', delete: 'O(E)', space: 'O(V+E)', notes: 'Sparse graphs; E = edges' },
];

const dsColumns = [
  { title: 'Data Structure', dataIndex: 'name', key: 'name', width: 170, render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
  { title: 'Access', dataIndex: 'access', key: 'access', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Search', dataIndex: 'search', key: 'search', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Insert', dataIndex: 'insert', key: 'insert', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Delete', dataIndex: 'delete', key: 'delete', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Space', dataIndex: 'space', key: 'space', width: 100, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span> },
];

// ── Section 4: Search / Graph Algorithms ──────────────────────────────────────
interface SearchAlgo {
  key: string;
  algorithm: string;
  time: string;
  space: string;
  best: string;
  useCase: string;
}

const searchAlgorithms: SearchAlgo[] = [
  { key: '1', algorithm: 'Linear Search', time: 'O(n)', space: 'O(1)', best: 'O(1)', useCase: 'Unsorted data, small datasets' },
  { key: '2', algorithm: 'Binary Search', time: 'O(log n)', space: 'O(1)', best: 'O(1)', useCase: 'Sorted arrays; fast lookup' },
  { key: '3', algorithm: 'BFS', time: 'O(V+E)', space: 'O(V)', best: 'O(1)', useCase: 'Shortest path (unweighted), level-order traversal' },
  { key: '4', algorithm: 'DFS', time: 'O(V+E)', space: 'O(V)', best: 'O(1)', useCase: 'Cycle detection, topological sort, maze solving' },
  { key: '5', algorithm: "Dijkstra's", time: 'O((V+E) log V)', space: 'O(V)', best: 'O(1)', useCase: 'Shortest path (non-negative weights)' },
  { key: '6', algorithm: 'A* Search', time: 'O(E)', space: 'O(V)', best: 'O(1)', useCase: 'Heuristic pathfinding (maps, games)' },
  { key: '7', algorithm: 'Bellman-Ford', time: 'O(VE)', space: 'O(V)', best: 'O(E)', useCase: 'Shortest path with negative weights' },
  { key: '8', algorithm: "Floyd-Warshall", time: 'O(V³)', space: 'O(V²)', best: 'O(V³)', useCase: 'All-pairs shortest paths' },
  { key: '9', algorithm: 'Ternary Search', time: 'O(log₃ n)', space: 'O(1)', best: 'O(1)', useCase: 'Unimodal functions; find min/max' },
  { key: '10', algorithm: 'Interpolation Search', time: 'O(log log n)*', space: 'O(1)', best: 'O(1)', useCase: 'Uniformly distributed sorted arrays' },
];

const searchColumns = [
  { title: 'Algorithm', dataIndex: 'algorithm', key: 'algorithm', width: 180, render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
  { title: 'Time (Avg)', dataIndex: 'time', key: 'time', width: 150, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Best Case', dataIndex: 'best', key: 'best', width: 120, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Space', dataIndex: 'space', key: 'space', width: 110, render: (v: string) => <ComplexityTag value={v} /> },
  { title: 'Best Use Case', dataIndex: 'useCase', key: 'useCase', render: (v: string) => <span style={{ fontSize: 13, color: '#aaa' }}>{v}</span> },
];

// ── Color Legend ──────────────────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { label: 'O(1)', color: COMPLEXITY_COLORS['O(1)'], desc: 'Excellent' },
  { label: 'O(log n)', color: COMPLEXITY_COLORS['O(log n)'], desc: 'Good' },
  { label: 'O(n)', color: COMPLEXITY_COLORS['O(n)'], desc: 'Fair' },
  { label: 'O(n log n)', color: COMPLEXITY_COLORS['O(n log n)'], desc: 'Acceptable' },
  { label: 'O(n²)', color: COMPLEXITY_COLORS['O(n²)'], desc: 'Bad' },
  { label: 'O(2ⁿ)', color: COMPLEXITY_COLORS['O(2ⁿ)'], desc: 'Horrible' },
  { label: 'O(n!)', color: COMPLEXITY_COLORS['O(n!)'], desc: 'Horrible' },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BigOCheatsheetTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('complexity');

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222' : '#fff';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const headingColor = isDark ? '#e0e0e0' : '#111';
  const mutedColor = isDark ? '#666' : '#aaa';

  const tableStyle: React.CSSProperties = {
    background: cardBg,
  };

  const tableScroll = { x: 'max-content' as const };

  // Filter helpers
  const filterText = search.toLowerCase().trim();

  const filteredClasses = useMemo(() =>
    complexityClasses.filter(r =>
      !filterText ||
      r.notation.toLowerCase().includes(filterText) ||
      r.name.toLowerCase().includes(filterText) ||
      r.example.toLowerCase().includes(filterText)
    ), [filterText]);

  const filteredSorting = useMemo(() =>
    sortingAlgorithms.filter(r =>
      !filterText ||
      r.algorithm.toLowerCase().includes(filterText) ||
      r.best.toLowerCase().includes(filterText) ||
      r.worst.toLowerCase().includes(filterText)
    ), [filterText]);

  const filteredDS = useMemo(() =>
    dataStructures.filter(r =>
      !filterText ||
      r.name.toLowerCase().includes(filterText) ||
      r.notes?.toLowerCase().includes(filterText)
    ), [filterText]);

  const filteredSearch = useMemo(() =>
    searchAlgorithms.filter(r =>
      !filterText ||
      r.algorithm.toLowerCase().includes(filterText) ||
      r.useCase.toLowerCase().includes(filterText)
    ), [filterText]);

  const sharedTableProps = {
    size: 'small' as const,
    pagination: false as const,
    scroll: tableScroll,
    style: tableStyle,
    rowClassName: () => isDark ? 'dark-table-row' : '',
  };

  const tabItems = [
    {
      key: 'complexity',
      label: 'Complexity Classes',
      children: (
        <Table
          {...sharedTableProps}
          dataSource={filteredClasses}
          columns={complexityClassColumns}
        />
      ),
    },
    {
      key: 'sorting',
      label: 'Sorting Algorithms',
      children: (
        <Table
          {...sharedTableProps}
          dataSource={filteredSorting}
          columns={sortColumns}
        />
      ),
    },
    {
      key: 'ds',
      label: 'Data Structures',
      children: (
        <Table
          {...sharedTableProps}
          dataSource={filteredDS}
          columns={dsColumns}
        />
      ),
    },
    {
      key: 'search',
      label: 'Search & Graph',
      children: (
        <Table
          {...sharedTableProps}
          dataSource={filteredSearch}
          columns={searchColumns}
        />
      ),
    },
  ];

  return (
    <div style={{ background: bg, minHeight: '100%', color: textColor }}>
      {/* Color legend */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 20px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: headingColor, marginRight: 4 }}>
          Complexity Legend:
        </span>
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: item.color, fontWeight: 600 }}>
              {item.label}
            </span>
            <span style={{ fontSize: 11, color: mutedColor }}>({item.desc})</span>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: PRIMARY }} />}
          placeholder="Filter rows by name, notation, or use case..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            color: textColor,
            borderRadius: 8,
            maxWidth: 480,
          }}
        />
      </div>

      {/* Main tabs + tables */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <style>{`
          .bigo-tabs .ant-tabs-nav {
            padding: 0 16px;
            margin-bottom: 0 !important;
            border-bottom: 1px solid ${border};
          }
          .bigo-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${PRIMARY} !important;
          }
          .bigo-tabs .ant-tabs-ink-bar {
            background: ${PRIMARY} !important;
          }
          .bigo-tabs .ant-table-wrapper {
            border-radius: 0;
          }
          .bigo-tabs .ant-table {
            background: ${cardBg} !important;
            color: ${textColor} !important;
          }
          .bigo-tabs .ant-table-thead > tr > th {
            background: ${isDark ? '#1a1a1a' : '#f9f9f9'} !important;
            color: ${headingColor} !important;
            border-bottom: 1px solid ${border} !important;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .bigo-tabs .ant-table-tbody > tr > td {
            border-bottom: 1px solid ${isDark ? '#222' : '#f0f0f0'} !important;
            color: ${textColor} !important;
            background: ${cardBg} !important;
            padding: 10px 12px !important;
          }
          .bigo-tabs .ant-table-tbody > tr:hover > td {
            background: ${isDark ? '#2a2a2a' : '#f5f5f5'} !important;
          }
        `}</style>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="bigo-tabs"
          style={{ padding: 0 }}
          tabBarStyle={{ background: isDark ? '#1a1a1a' : '#fafafa' }}
        />
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 16, fontSize: 12, color: mutedColor, textAlign: 'right' }}>
        * = amortized or average case &nbsp;|&nbsp; V = vertices, E = edges, k = key length
      </div>
    </div>
  );
}
