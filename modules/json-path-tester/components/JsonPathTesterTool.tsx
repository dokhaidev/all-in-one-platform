'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Tooltip,
  Alert,
  Divider,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  FormatPainterOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

// ─── Path Evaluator ───────────────────────────────────────────────────────────
// Supports: dot notation, [n] index access, [*] wildcard, nested combinations

function evalPath(root: JsonValue, pathStr: string): JsonValue[] {
  if (!pathStr.trim()) return [root];

  // Tokenize the path
  // E.g. "data.users[0].name" → ["data", "users", "[0]", "name"]
  // "data.items[*].id"       → ["data", "items", "[*]", "id"]
  const tokens = tokenizePath(pathStr);

  let current: JsonValue[] = [root];

  for (const token of tokens) {
    const next: JsonValue[] = [];
    for (const node of current) {
      const resolved = resolveToken(node, token);
      next.push(...resolved);
    }
    current = next;
    if (current.length === 0) break;
  }

  return current;
}

function tokenizePath(path: string): string[] {
  // Split by "." and also break apart bracket notation
  const tokens: string[] = [];
  // We'll parse char by char to handle nested brackets properly
  let i = 0;
  let cur = '';

  while (i < path.length) {
    const ch = path[i];
    if (ch === '.') {
      if (cur) tokens.push(cur);
      cur = '';
      i++;
    } else if (ch === '[') {
      if (cur) { tokens.push(cur); cur = ''; }
      // read until ']'
      let bracket = '[';
      i++;
      while (i < path.length && path[i] !== ']') {
        bracket += path[i];
        i++;
      }
      bracket += ']';
      tokens.push(bracket);
      i++; // skip ']'
    } else {
      cur += ch;
      i++;
    }
  }
  if (cur) tokens.push(cur);
  return tokens.filter(Boolean);
}

function resolveToken(node: JsonValue, token: string): JsonValue[] {
  if (node === null || node === undefined) return [];

  // Array index or wildcard: [0], [*], [-1]
  if (token.startsWith('[') && token.endsWith(']')) {
    const inner = token.slice(1, -1).trim();
    if (!Array.isArray(node)) return [];
    if (inner === '*') {
      return node as JsonArray;
    }
    const idx = parseInt(inner, 10);
    if (isNaN(idx)) return [];
    const arr = node as JsonArray;
    const realIdx = idx < 0 ? arr.length + idx : idx;
    if (realIdx < 0 || realIdx >= arr.length) return [];
    return [arr[realIdx]];
  }

  // Wildcard key on object
  if (token === '*') {
    if (Array.isArray(node)) return node as JsonArray;
    if (typeof node === 'object') return Object.values(node as JsonObject);
    return [];
  }

  // Regular key
  if (typeof node === 'object' && !Array.isArray(node)) {
    const obj = node as JsonObject;
    if (Object.prototype.hasOwnProperty.call(obj, token)) {
      return [obj[token]];
    }
    return [];
  }

  return [];
}

// ─── Examples ─────────────────────────────────────────────────────────────────

interface ExampleEntry {
  label: string;
  json: string;
  path: string;
  description: string;
}

const EXAMPLES: ExampleEntry[] = [
  {
    label: 'User List',
    description: 'Get all user names from a list',
    path: 'users[*].name',
    json: JSON.stringify({
      users: [
        { id: 1, name: 'Alice', role: 'admin', active: true },
        { id: 2, name: 'Bob', role: 'editor', active: false },
        { id: 3, name: 'Carol', role: 'viewer', active: true },
      ],
      total: 3,
    }, null, 2),
  },
  {
    label: 'Product Catalog',
    description: 'Get prices of all products',
    path: 'products[*].price',
    json: JSON.stringify({
      catalog: 'ToolHub Store',
      products: [
        { id: 'p001', name: 'Widget A', price: 9.99, category: 'tools', inStock: true },
        { id: 'p002', name: 'Widget B', price: 19.99, category: 'tools', inStock: false },
        { id: 'p003', name: 'Gadget X', price: 49.99, category: 'gadgets', inStock: true },
      ],
    }, null, 2),
  },
  {
    label: 'Nested Config',
    description: 'Get a deeply nested value',
    path: 'app.config.database.host',
    json: JSON.stringify({
      app: {
        name: 'ToolHub',
        version: '2.0.0',
        config: {
          debug: false,
          database: {
            host: 'localhost',
            port: 5432,
            name: 'toolhub_db',
            ssl: true,
          },
          cache: {
            driver: 'redis',
            ttl: 3600,
          },
        },
      },
    }, null, 2),
  },
  {
    label: 'First User',
    description: 'Access first element of array',
    path: 'users[0]',
    json: JSON.stringify({
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
    }, null, 2),
  },
  {
    label: 'All IDs',
    description: 'Extract IDs using wildcard',
    path: 'data.items[*].id',
    json: JSON.stringify({
      data: {
        page: 1,
        items: [
          { id: 'a1', title: 'Item Alpha', tags: ['new', 'hot'] },
          { id: 'b2', title: 'Item Beta', tags: ['sale'] },
          { id: 'c3', title: 'Item Gamma', tags: ['new'] },
        ],
      },
    }, null, 2),
  },
  {
    label: 'Nested Array Tags',
    description: 'Get tags of first item',
    path: 'data.items[0].tags',
    json: JSON.stringify({
      data: {
        items: [
          { id: 'a1', title: 'Item Alpha', tags: ['new', 'hot', 'trending'] },
          { id: 'b2', title: 'Item Beta', tags: ['sale', 'limited'] },
        ],
      },
    }, null, 2),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function JsonPathTesterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const inputBg = isDark ? '#1a1a1a' : '#f8f8f8';

  const [jsonInput, setJsonInput] = useState('');
  const [pathInput, setPathInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse JSON
  const parsedJson = useMemo<{ value: JsonValue | null; error: string | null }>(() => {
    if (!jsonInput.trim()) return { value: null, error: null };
    try {
      return { value: JSON.parse(jsonInput), error: null };
    } catch (e: unknown) {
      return { value: null, error: (e as Error).message };
    }
  }, [jsonInput]);

  // Evaluate path
  const queryResult = useMemo<{ results: JsonValue[]; error: string | null }>(() => {
    if (!parsedJson.value && parsedJson.error) return { results: [], error: null };
    if (parsedJson.value === null) return { results: [], error: null };
    if (!pathInput.trim()) return { results: [parsedJson.value], error: null };
    try {
      const results = evalPath(parsedJson.value, pathInput.trim());
      return { results, error: null };
    } catch (e: unknown) {
      return { results: [], error: (e as Error).message };
    }
  }, [parsedJson, pathInput]);

  const resultJson = useMemo(() => {
    if (queryResult.results.length === 0) return '';
    if (queryResult.results.length === 1) return JSON.stringify(queryResult.results[0], null, 2);
    return JSON.stringify(queryResult.results, null, 2);
  }, [queryResult]);

  const handleFormat = useCallback(() => {
    if (!parsedJson.value && jsonInput.trim()) return;
    if (parsedJson.value !== null) {
      setJsonInput(JSON.stringify(parsedJson.value, null, 2));
    }
  }, [parsedJson, jsonInput]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setPathInput('');
    setJsonError(null);
    setPathError(null);
  }, []);

  const handleCopyResult = useCallback(() => {
    navigator.clipboard.writeText(resultJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [resultJson]);

  const handleLoadExample = useCallback((ex: ExampleEntry) => {
    setJsonInput(ex.json);
    setPathInput(ex.path);
    setJsonError(null);
    setPathError(null);
  }, []);

  const textareaBase: React.CSSProperties = {
    width: '100%',
    background: inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    color: textColor,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    padding: '12px 14px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  };

  const isJsonValid = !parsedJson.error && parsedJson.value !== null;

  return (
    <div>
      {/* Top Bar */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '10px 16px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Space wrap size={6}>
            <Tooltip title="Format/prettify JSON input">
              <Button
                icon={<FormatPainterOutlined />}
                size="small"
                onClick={handleFormat}
                disabled={!isJsonValid}
                style={{
                  borderColor: isJsonValid ? '#50C878' : borderColor,
                  color: isJsonValid ? '#50C878' : mutedColor,
                  background: 'transparent',
                }}
              >
                Format JSON
              </Button>
            </Tooltip>
            <Tooltip title="Clear everything">
              <Button
                icon={<ClearOutlined />}
                size="small"
                onClick={handleClear}
                style={{ borderColor: '#ff4d4f', color: '#ff4d4f', background: 'transparent' }}
              >
                Clear
              </Button>
            </Tooltip>
          </Space>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {jsonInput.trim() && (
              isJsonValid ? (
                <Tag icon={<CheckCircleOutlined />} color="success">Valid JSON</Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">Invalid JSON</Tag>
              )
            )}
            {isJsonValid && pathInput.trim() && (
              <Tag color={queryResult.results.length > 0 ? 'processing' : 'default'} style={{ fontSize: 12 }}>
                <NodeIndexOutlined /> {queryResult.results.length} result{queryResult.results.length !== 1 ? 's' : ''}
              </Tag>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: JSON Input */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <Card
            style={{ background: cardBg, border: `1px solid ${parsedJson.error ? '#ff4d4f' : borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CodeOutlined style={{ color: '#50C878' }} />
                <Text style={{ color: textColor, fontSize: 13 }}>JSON Input</Text>
              </div>
            }
          >
            <textarea
              style={{ ...textareaBase, minHeight: 320, border: `1px solid ${parsedJson.error ? '#ff4d4f' : borderColor}` }}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={'Paste your JSON here...\n\nExample:\n{\n  "users": [\n    { "id": 1, "name": "Alice" }\n  ]\n}'}
              spellCheck={false}
            />
            {parsedJson.error && (
              <Alert
                type="error"
                showIcon
                message={
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {parsedJson.error}
                  </span>
                }
                style={{ marginTop: 8, borderRadius: 6 }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: mutedColor, fontSize: 11 }}>
                {jsonInput.split('\n').length} lines · {jsonInput.length} chars
              </Text>
              <Button
                size="small"
                type="link"
                style={{ color: '#50C878', padding: 0, fontSize: 12 }}
                onClick={handleFormat}
                disabled={!isJsonValid}
              >
                Auto-format
              </Button>
            </div>
          </Card>

          {/* Path Input */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NodeIndexOutlined style={{ color: '#50C878' }} />
                <Text style={{ color: textColor, fontSize: 13 }}>JSON Path / Query</Text>
              </div>
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: inputBg,
                border: `1px solid ${queryResult.error ? '#ff4d4f' : pathInput && queryResult.results.length > 0 ? '#50C878' : borderColor}`,
                borderRadius: 8,
                padding: '0 12px',
                transition: 'border-color 0.2s',
              }}
            >
              <span style={{ color: mutedColor, fontSize: 12, paddingRight: 8, whiteSpace: 'nowrap' }}>$.</span>
              <input
                type="text"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                placeholder="users[*].name"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: textColor,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 14,
                  padding: '10px 0',
                }}
                spellCheck={false}
              />
            </div>
            {queryResult.error && (
              <div style={{ marginTop: 6, color: '#ff4d4f', fontSize: 12, fontFamily: 'monospace' }}>
                <CloseCircleOutlined /> {queryResult.error}
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: mutedColor, fontSize: 11, width: '100%' }}>Syntax:</Text>
              {[
                ['key', 'Object key'],
                ['[n]', 'Array index'],
                ['[*]', 'All items'],
                ['a.b', 'Nested path'],
                ['a[0].b', 'Combined'],
              ].map(([syn, desc]) => (
                <Tooltip key={syn} title={desc}>
                  <code
                    style={{
                      background: isDark ? '#1a1a1a' : '#f0f0f0',
                      border: `1px solid ${borderColor}`,
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 11,
                      color: '#50C878',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPathInput((prev) => prev + (prev ? '.' : '') + syn.replace('.', ''))}
                  >
                    {syn}
                  </code>
                </Tooltip>
              ))}
            </div>
          </Card>

          {/* Result */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: textColor, fontSize: 13 }}>Result</Text>
                {queryResult.results.length > 0 && (
                  <Tag color="success" style={{ fontSize: 11 }}>
                    {queryResult.results.length} value{queryResult.results.length !== 1 ? 's' : ''}
                  </Tag>
                )}
              </div>
            }
            extra={
              resultJson ? (
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={handleCopyResult}
                  style={{ borderColor, color: copied ? '#50C878' : textColor, background: 'transparent', fontSize: 12 }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              ) : null
            }
          >
            {resultJson ? (
              <pre
                style={{
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 13,
                  color: textColor,
                  margin: 0,
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: 300,
                  lineHeight: 1.6,
                }}
              >
                {resultJson}
              </pre>
            ) : (
              <div
                style={{
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '24px',
                  textAlign: 'center',
                  color: mutedColor,
                  fontSize: 13,
                  fontStyle: 'italic',
                }}
              >
                {!jsonInput.trim()
                  ? 'Paste JSON and enter a path to see results'
                  : parsedJson.error
                  ? 'Fix JSON errors first'
                  : !pathInput.trim()
                  ? 'Enter a path to query (or leave empty to see root)'
                  : 'No results found for this path'}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Examples */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: '12px 14px' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CodeOutlined style={{ color: '#50C878' }} />
                <Text style={{ color: textColor, fontSize: 13 }}>Examples</Text>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleLoadExample(ex)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#50C878';
                    e.currentTarget.style.background = isDark ? '#0a1f0f' : '#e8f5e9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ color: textColor, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {ex.label}
                  </div>
                  <div style={{ color: mutedColor, fontSize: 11, marginBottom: 4 }}>{ex.description}</div>
                  <code
                    style={{
                      color: '#50C878',
                      fontFamily: 'monospace',
                      fontSize: 11,
                      background: isDark ? '#1a1a1a' : '#f0f0f0',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    $.{ex.path}
                  </code>
                </button>
              ))}
            </div>
          </Card>

          {/* Path Syntax Reference */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: '12px 14px' }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>Syntax Reference</Text>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { syntax: 'key', desc: 'Access object property', example: 'name' },
                { syntax: 'a.b', desc: 'Nested object access', example: 'user.email' },
                { syntax: '[n]', desc: 'Array index (0-based)', example: 'items[0]' },
                { syntax: '[-1]', desc: 'Last array element', example: 'items[-1]' },
                { syntax: '[*]', desc: 'All array elements', example: 'users[*]' },
                { syntax: '[*].k', desc: 'Key from every element', example: 'users[*].name' },
                { syntax: '*', desc: 'All values in object/array', example: 'config.*' },
              ].map((item) => (
                <div
                  key={item.syntax}
                  style={{
                    padding: '6px 8px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <code style={{ color: '#50C878', fontFamily: 'monospace', fontSize: 12, flexShrink: 0 }}>
                      {item.syntax}
                    </code>
                    <Text style={{ color: mutedColor, fontSize: 11 }}>{item.desc}</Text>
                  </div>
                  <div style={{ color: '#666', fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
                    e.g. $.{item.example}
                  </div>
                </div>
              ))}
            </div>

            <Divider style={{ borderColor, margin: '10px 0' }} />

            <Text style={{ color: mutedColor, fontSize: 11, display: 'block', lineHeight: 1.6 }}>
              Paths are evaluated left-to-right. Use <code style={{ color: '#50C878', fontSize: 11 }}>[*]</code> to expand arrays,
              then chain further keys. Results of multiple matches are returned as an array.
            </Text>
          </Card>
        </div>
      </div>
    </div>
  );
}
