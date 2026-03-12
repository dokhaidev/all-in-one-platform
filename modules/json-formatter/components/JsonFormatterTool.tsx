'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Alert,
  Tag,
  Space,
  Typography,
  Divider,
  Tooltip,
  Badge,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CompressOutlined,
  SortAscendingOutlined,
  SafetyOutlined,
  UnlockOutlined,
  ExperimentOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text } = Typography;

// ─── JSON Tree Viewer ───────────────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

interface TreeNodeProps {
  value: JsonValue;
  keyName?: string;
  depth: number;
  isDark: boolean;
}

function TreeNode({ value, keyName, depth, isDark }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 2);
  const textColor = isDark ? '#c9c9c9' : '#333';
  const keyColor = isDark ? '#9cdcfe' : '#0451a5';
  const mutedColor = isDark ? '#555' : '#bbb';

  const indent = depth * 16;

  const valueColor = (v: JsonValue): string => {
    if (v === null) return isDark ? '#808080' : '#999';
    if (typeof v === 'string') return isDark ? '#ce9178' : '#a31515';
    if (typeof v === 'number') return isDark ? '#b5cea8' : '#098658';
    if (typeof v === 'boolean') return isDark ? '#569cd6' : '#0000ff';
    return textColor;
  };

  const renderPrimitive = (v: string | number | boolean | null) => {
    let display: string;
    if (v === null) display = 'null';
    else if (typeof v === 'string') display = `"${v}"`;
    else display = String(v);
    return (
      <span style={{ color: valueColor(v), fontFamily: 'monospace', fontSize: 13 }}>
        {display}
      </span>
    );
  };

  if (value !== null && typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = isArray
      ? (value as JsonArray).map((v, i) => [String(i), v] as [string, JsonValue])
      : Object.entries(value as JsonObject);
    const count = entries.length;
    const openBrace = isArray ? '[' : '{';
    const closeBrace = isArray ? ']' : '}';
    const summary = isArray ? `[${count}]` : `{${count}}`;

    return (
      <div style={{ marginLeft: indent > 0 ? 16 : 0 }}>
        <span
          onClick={() => setCollapsed(!collapsed)}
          style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <span style={{ color: mutedColor, fontSize: 10, width: 12, display: 'inline-block' }}>
            {collapsed ? '▶' : '▼'}
          </span>
          {keyName !== undefined && (
            <>
              <span style={{ color: keyColor, fontFamily: 'monospace', fontSize: 13 }}>"{keyName}"</span>
              <span style={{ color: textColor, fontFamily: 'monospace', fontSize: 13 }}>: </span>
            </>
          )}
          <span style={{ color: textColor, fontFamily: 'monospace', fontSize: 13 }}>{openBrace}</span>
          {collapsed ? (
            <span style={{ color: mutedColor, fontFamily: 'monospace', fontSize: 12, marginLeft: 4 }}>
              {summary} {closeBrace}
            </span>
          ) : (
            <span style={{ color: textColor, fontFamily: 'monospace', fontSize: 13, marginLeft: 2 }}></span>
          )}
        </span>

        {!collapsed && (
          <>
            <div style={{ paddingLeft: 16, borderLeft: `1px solid ${isDark ? '#2e2e2e' : '#e0e0e0'}`, marginLeft: 6 }}>
              {entries.map(([k, v], idx) => (
                <div key={k} style={{ padding: '2px 0' }}>
                  <TreeNode value={v} keyName={isArray ? undefined : k} depth={depth + 1} isDark={isDark} />
                  {idx < entries.length - 1 && (
                    <span style={{ color: mutedColor, fontFamily: 'monospace', fontSize: 13 }}>,</span>
                  )}
                </div>
              ))}
            </div>
            <span style={{ color: textColor, fontFamily: 'monospace', fontSize: 13 }}>{closeBrace}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: 4 }}>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{ color: mutedColor, fontSize: 10, width: 12, display: 'inline-block' }}> </span>
        {keyName !== undefined && (
          <>
            <span style={{ color: keyColor, fontFamily: 'monospace', fontSize: 13 }}>"{keyName}"</span>
            <span style={{ color: isDark ? '#c9c9c9' : '#333', fontFamily: 'monospace', fontSize: 13 }}>: </span>
          </>
        )}
        {renderPrimitive(value as string | number | boolean | null)}
      </span>
    </div>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function countStats(value: JsonValue): { keys: number; arrays: number; depth: number } {
  let keys = 0;
  let arrays = 0;

  function walk(v: JsonValue, d: number): number {
    if (v === null || typeof v !== 'object') return d;
    if (Array.isArray(v)) {
      arrays++;
      let maxD = d;
      (v as JsonArray).forEach((item) => { maxD = Math.max(maxD, walk(item, d + 1)); });
      return maxD;
    }
    const obj = v as JsonObject;
    keys += Object.keys(obj).length;
    let maxD = d;
    Object.values(obj).forEach((item) => { maxD = Math.max(maxD, walk(item, d + 1)); });
    return maxD;
  }

  const depth = walk(value, 1);
  return { keys, arrays, depth };
}

// ─── Sort Keys ───────────────────────────────────────────────────────────────

function sortKeysDeep(value: JsonValue): JsonValue {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return (value as JsonArray).map(sortKeysDeep);
  const obj = value as JsonObject;
  const sorted: JsonObject = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => { sorted[k] = sortKeysDeep(obj[k]); });
  return sorted;
}

// ─── Sample JSON ─────────────────────────────────────────────────────────────

const SAMPLE_JSON = `{
  "name": "ToolHub",
  "version": "1.0.0",
  "description": "A collection of useful daily tools",
  "features": [
    "JSON Formatter",
    "Image Compressor",
    "Base64 Encoder"
  ],
  "config": {
    "theme": "dark",
    "primaryColor": "#50C878",
    "language": "vi",
    "settings": {
      "autoSave": true,
      "maxFileSize": 10485760,
      "supportedFormats": ["jpg", "png", "webp"]
    }
  },
  "stats": {
    "users": 12345,
    "isActive": true,
    "rating": 4.8,
    "lastUpdated": null
  }
}`;

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewMode = 'formatted' | 'tree';

interface ParseResult {
  valid: boolean;
  parsed: JsonValue | null;
  error: string | null;
  line: number | null;
}

function parseJSON(text: string): ParseResult {
  if (!text.trim()) return { valid: false, parsed: null, error: null, line: null };
  try {
    const parsed = JSON.parse(text);
    return { valid: true, parsed, error: null, line: null };
  } catch (e: unknown) {
    const err = e as Error;
    const msg = err.message || 'Invalid JSON';
    // Try to extract line number from error message
    const lineMatch = msg.match(/line (\d+)/i) || msg.match(/position (\d+)/i);
    return { valid: false, parsed: null, error: msg, line: lineMatch ? parseInt(lineMatch[1]) : null };
  }
}

export default function JsonFormatterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const inputBg = isDark ? '#1a1a1a' : '#f8f8f8';

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const parseResult = useMemo(() => parseJSON(input), [input]);

  const stats = useMemo(() => {
    if (!parseResult.valid || parseResult.parsed === null) return null;
    return countStats(parseResult.parsed);
  }, [parseResult]);

  const handleFormat = useCallback(() => {
    if (!parseResult.valid || parseResult.parsed === null) return;
    setOutput(JSON.stringify(parseResult.parsed, null, 2));
    setViewMode('formatted');
  }, [parseResult]);

  const handleMinify = useCallback(() => {
    if (!parseResult.valid || parseResult.parsed === null) return;
    setOutput(JSON.stringify(parseResult.parsed));
    setViewMode('formatted');
  }, [parseResult]);

  const handleSortKeys = useCallback(() => {
    if (!parseResult.valid || parseResult.parsed === null) return;
    const sorted = sortKeysDeep(parseResult.parsed);
    setOutput(JSON.stringify(sorted, null, 2));
    setViewMode('formatted');
  }, [parseResult]);

  const handleEscape = useCallback(() => {
    if (!parseResult.valid || parseResult.parsed === null) return;
    const str = JSON.stringify(parseResult.parsed);
    setOutput(JSON.stringify(str));
    setViewMode('formatted');
  }, [parseResult]);

  const handleUnescape = useCallback(() => {
    try {
      const unescaped = JSON.parse(input);
      if (typeof unescaped === 'string') {
        const re = JSON.parse(unescaped);
        setOutput(JSON.stringify(re, null, 2));
      } else {
        setOutput(JSON.stringify(unescaped, null, 2));
      }
      setViewMode('formatted');
    } catch {
      // ignore
    }
  }, [input]);

  const handleCopy = useCallback(() => {
    const text = viewMode === 'formatted' ? output : (parseResult.valid ? JSON.stringify(parseResult.parsed, null, 2) : '');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [output, viewMode, parseResult]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
  }, []);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_JSON);
    setOutput(SAMPLE_JSON);
  }, []);

  const handleTree = useCallback(() => {
    if (!parseResult.valid) return;
    setViewMode('tree');
  }, [parseResult]);

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 420,
    background: inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    color: textColor,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 13,
    padding: '12px 14px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  };

  const toolbarBtn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    disabled = false,
    color?: string
  ) => (
    <Tooltip title={label} key={label}>
      <Button
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        size="small"
        style={{
          borderColor: color || borderColor,
          color: disabled ? mutedColor : (color || textColor),
          background: 'transparent',
          fontSize: 12,
        }}
      >
        {label}
      </Button>
    </Tooltip>
  );

  const notValid = !parseResult.valid;

  return (
    <div>
      {/* Toolbar */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Space wrap size={6}>
            {toolbarBtn('Format', <CodeOutlined />, handleFormat, notValid, '#50C878')}
            {toolbarBtn('Minify', <CompressOutlined />, handleMinify, notValid)}
            {toolbarBtn('Sort Keys', <SortAscendingOutlined />, handleSortKeys, notValid)}
            {toolbarBtn('Escape', <SafetyOutlined />, handleEscape, notValid)}
            {toolbarBtn('Unescape', <UnlockOutlined />, handleUnescape, !input.trim())}
            <Divider type="vertical" style={{ borderColor, height: 20 }} />
            {toolbarBtn('Tree View', <ExperimentOutlined />, handleTree, notValid)}
            {toolbarBtn('Stats', <BarChartOutlined />, () => setShowStats(!showStats), notValid)}
            <Divider type="vertical" style={{ borderColor, height: 20 }} />
            {toolbarBtn('Sample', <CheckCircleOutlined />, handleSample)}
            {toolbarBtn(copied ? 'Đã copy!' : 'Copy', <CopyOutlined />, handleCopy, !output && viewMode !== 'tree')}
            {toolbarBtn('Clear', <ClearOutlined />, handleClear, !input && !output, '#ff4d4f')}
          </Space>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {input.trim() && (
              <>
                {parseResult.valid ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">Valid JSON</Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">Invalid JSON</Tag>
                )}
              </>
            )}
            {input.trim() && (
              <Text style={{ color: mutedColor, fontSize: 12 }}>
                {new TextEncoder().encode(input).length} bytes
              </Text>
            )}
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {parseResult.error && (
        <Alert
          type="error"
          showIcon
          message={
            <div>
              <span style={{ fontWeight: 600 }}>JSON Error: </span>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{parseResult.error}</span>
              {parseResult.line && (
                <Tag style={{ marginLeft: 8 }} color="red">Line {parseResult.line}</Tag>
              )}
            </div>
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
          closable
        />
      )}

      {/* Stats Panel */}
      {showStats && stats && (
        <Card
          style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
          bodyStyle={{ padding: '12px 20px' }}
        >
          <Row gutter={[24, 8]}>
            {[
              { label: 'Keys', value: stats.keys },
              { label: 'Arrays', value: stats.arrays },
              { label: 'Max Depth', value: stats.depth },
              { label: 'Input Size', value: `${new TextEncoder().encode(input).length} bytes` },
              { label: 'Formatted Size', value: parseResult.valid ? `${new TextEncoder().encode(JSON.stringify(parseResult.parsed, null, 2)).length} bytes` : '-' },
              { label: 'Minified Size', value: parseResult.valid ? `${new TextEncoder().encode(JSON.stringify(parseResult.parsed)).length} bytes` : '-' },
            ].map((s) => (
              <Col key={s.label} xs={12} sm={8} md={4}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#50C878', fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Main Editor */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>Input JSON</Text>}
          >
            <textarea
              style={textareaStyle}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Dán JSON vào đây... ví dụ: {"name": "ToolHub", "version": 1}'
              spellCheck={false}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: mutedColor, fontSize: 11 }}>
                {input.split('\n').length} dòng · {input.length} ký tự
              </Text>
              <Button
                size="small"
                type="link"
                style={{ color: '#50C878', padding: 0, fontSize: 12 }}
                onClick={handleSample}
              >
                Load mẫu
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: 16 }}
            title={
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Text style={{ color: textColor, fontSize: 13 }}>Output</Text>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['formatted', 'tree'] as ViewMode[]).map((m) => (
                    <Badge key={m} dot={false}>
                      <Button
                        size="small"
                        type={viewMode === m ? 'primary' : 'default'}
                        onClick={() => {
                          if (m === 'tree' && !parseResult.valid) return;
                          setViewMode(m);
                        }}
                        style={
                          viewMode === m
                            ? { background: '#50C878', borderColor: '#50C878', fontSize: 12 }
                            : { borderColor, color: textColor, background: 'transparent', fontSize: 12 }
                        }
                      >
                        {m === 'formatted' ? 'Text' : 'Tree'}
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            }
            extra={
              <Button
                icon={<CopyOutlined />}
                size="small"
                onClick={handleCopy}
                style={{ borderColor, color: copied ? '#50C878' : textColor, background: 'transparent', fontSize: 12 }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            }
          >
            {viewMode === 'tree' && parseResult.valid && parseResult.parsed !== null ? (
              <div
                style={{
                  minHeight: 420,
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: 600,
                }}
              >
                <TreeNode value={parseResult.parsed} depth={0} isDark={isDark} />
              </div>
            ) : (
              <textarea
                style={{ ...textareaStyle, color: output ? textColor : mutedColor }}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                placeholder="Kết quả sẽ hiển thị ở đây..."
                spellCheck={false}
                readOnly={viewMode !== 'formatted'}
              />
            )}
            {output && viewMode === 'formatted' && (
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: mutedColor, fontSize: 11 }}>
                  {output.split('\n').length} dòng · {output.length} ký tự
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
