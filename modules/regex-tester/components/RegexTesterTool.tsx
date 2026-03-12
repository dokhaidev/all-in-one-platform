'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Divider,
  Tooltip,
  Badge,
  Collapse,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  BulbOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlagState {
  g: boolean;
  i: boolean;
  m: boolean;
  s: boolean;
}

interface MatchInfo {
  index: number;
  value: string;
  groups: Record<string, string> | null;
  captureGroups: (string | undefined)[];
}

const STORAGE_KEY = 'toolhub_regex_history';
const MAX_HISTORY = 10;

// ─── Cheatsheet ───────────────────────────────────────────────────────────────

interface CheatEntry {
  label: string;
  pattern: string;
  description: string;
}

const CHEATSHEET: CheatEntry[] = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', description: 'Match email addresses' },
  { label: 'URL', pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)', description: 'Match URLs (http/https)' },
  { label: 'Phone (VN)', pattern: '(?:\\+84|0)(?:3[2-9]|5[6-9]|7[06-9]|8[0-9]|9[0-9])\\d{7}', description: 'Vietnamese phone numbers' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', description: 'ISO date format' },
  { label: 'IPv4', pattern: '(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)', description: 'IPv4 address' },
  { label: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', description: 'Hex color codes (#fff or #ffffff)' },
  { label: 'Integer', pattern: '-?\\d+', description: 'Positive or negative integers' },
  { label: 'Decimal', pattern: '-?\\d+(?:\\.\\d+)?', description: 'Decimal numbers' },
  { label: 'Username', pattern: '[a-zA-Z0-9_]{3,16}', description: 'Alphanumeric username 3-16 chars' },
  { label: 'Whitespace', pattern: '\\s+', description: 'One or more whitespace characters' },
  { label: 'HTML Tag', pattern: '<[^>]+>', description: 'HTML tags (simple)' },
  { label: 'Word', pattern: '\\b\\w+\\b', description: 'Match whole words' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRegex(pattern: string, flags: FlagState): { regex: RegExp | null; error: string | null } {
  if (!pattern) return { regex: null, error: null };
  const flagStr = (flags.g ? 'g' : '') + (flags.i ? 'i' : '') + (flags.m ? 'm' : '') + (flags.s ? 's' : '') + 'd';
  try {
    return { regex: new RegExp(pattern, flagStr), error: null };
  } catch (e: unknown) {
    return { regex: null, error: (e as Error).message };
  }
}

function getMatches(regex: RegExp | null, text: string): MatchInfo[] {
  if (!regex || !text) return [];
  const results: MatchInfo[] = [];
  try {
    if (regex.flags.includes('g')) {
      let m: RegExpExecArray | null;
      const re = new RegExp(regex.source, regex.flags);
      while ((m = re.exec(text)) !== null) {
        results.push({
          index: m.index,
          value: m[0],
          groups: m.groups ? { ...m.groups } : null,
          captureGroups: m.slice(1),
        });
        if (m[0].length === 0) re.lastIndex++;
      }
    } else {
      const m = regex.exec(text);
      if (m) {
        results.push({
          index: m.index,
          value: m[0],
          groups: m.groups ? { ...m.groups } : null,
          captureGroups: m.slice(1),
        });
      }
    }
  } catch {
    // ignore
  }
  return results;
}

function buildHighlighted(text: string, matches: MatchInfo[], isDark: boolean): string {
  if (!matches.length) return escapeHtml(text);
  const markBg = isDark ? '#50C878' : '#50C878';
  const markColor = '#000';

  const parts: string[] = [];
  let lastIdx = 0;

  for (const m of matches) {
    if (m.index > lastIdx) {
      parts.push(escapeHtml(text.slice(lastIdx, m.index)));
    }
    parts.push(
      `<mark style="background:${markBg};color:${markColor};border-radius:2px;padding:0 1px;">${escapeHtml(m.value)}</mark>`
    );
    lastIdx = m.index + m.value.length;
  }

  if (lastIdx < text.length) {
    parts.push(escapeHtml(text.slice(lastIdx)));
  }

  return parts.join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegexTesterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const inputBg = isDark ? '#1a1a1a' : '#f8f8f8';

  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<FlagState>({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved) as string[]);
    } catch {
      // ignore
    }
  }, []);

  // Save to history when pattern changes (debounced by blur/run)
  const saveToHistory = useCallback((p: string) => {
    if (!p.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((h) => h !== p);
      const next = [p, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const { regex, error } = useMemo(() => buildRegex(pattern, flags), [pattern, flags]);

  const matches = useMemo(() => getMatches(regex, testString), [regex, testString]);

  const highlighted = useMemo(
    () => buildHighlighted(testString, matches, isDark),
    [testString, matches, isDark]
  );

  const toggleFlag = (f: keyof FlagState) => setFlags((prev) => ({ ...prev, [f]: !prev[f] }));

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const handleClear = () => {
    setPattern('');
    setTestString('');
  };

  const insertCheat = (entry: CheatEntry) => {
    setPattern(entry.pattern);
    saveToHistory(entry.pattern);
  };

  const textareaBase: React.CSSProperties = {
    width: '100%',
    background: inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    color: textColor,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    padding: '10px 14px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  };

  const flagColors: Record<keyof FlagState, string> = {
    g: '#f59e0b',
    i: '#3b82f6',
    m: '#8b5cf6',
    s: '#ec4899',
  };

  return (
    <div>
      {/* Regex Input Row */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Pattern */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 6, letterSpacing: 1 }}>
              REGEX PATTERN
            </Text>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: inputBg,
                border: `1px solid ${error ? '#ff4d4f' : pattern && !error ? '#50C878' : borderColor}`,
                borderRadius: 8,
                padding: '0 12px',
                transition: 'border-color 0.2s',
              }}
            >
              <span style={{ color: mutedColor, fontSize: 18, fontFamily: 'monospace', paddingRight: 6 }}>/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onBlur={() => saveToHistory(pattern)}
                placeholder="Enter regex pattern..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: error ? '#ff4d4f' : textColor,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 14,
                  padding: '10px 0',
                }}
                spellCheck={false}
              />
              <span style={{ color: mutedColor, fontSize: 18, fontFamily: 'monospace', paddingLeft: 6 }}>/</span>
              <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: 14, paddingLeft: 4 }}>
                {(flags.g ? 'g' : '') + (flags.i ? 'i' : '') + (flags.m ? 'm' : '') + (flags.s ? 's' : '')}
              </span>
            </div>
            {error && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                <Text style={{ color: '#ff4d4f', fontSize: 12, fontFamily: 'monospace' }}>{error}</Text>
              </div>
            )}
          </div>

          {/* Flags */}
          <div>
            <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 6, letterSpacing: 1 }}>
              FLAGS
            </Text>
            <Space size={6}>
              {(Object.keys(flags) as (keyof FlagState)[]).map((f) => (
                <Tooltip
                  key={f}
                  title={{
                    g: 'Global – find all matches',
                    i: 'Ignore case',
                    m: 'Multiline – ^ and $ match line boundaries',
                    s: 'Dotall – . matches newlines',
                  }[f]}
                >
                  <button
                    onClick={() => toggleFlag(f)}
                    style={{
                      width: 36,
                      height: 36,
                      border: `1px solid ${flags[f] ? flagColors[f] : borderColor}`,
                      borderRadius: 6,
                      background: flags[f] ? `${flagColors[f]}22` : 'transparent',
                      color: flags[f] ? flagColors[f] : mutedColor,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f}
                  </button>
                </Tooltip>
              ))}
            </Space>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24 }}>
            {pattern && !error ? (
              <Tag
                icon={<CheckCircleOutlined />}
                color={matches.length > 0 ? 'success' : 'default'}
                style={{ fontSize: 12 }}
              >
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </Tag>
            ) : pattern && error ? (
              <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 12 }}>
                Invalid regex
              </Tag>
            ) : null}
            <Tooltip title="Clear all">
              <Button
                icon={<ClearOutlined />}
                size="small"
                onClick={handleClear}
                style={{ borderColor: '#ff4d4f', color: '#ff4d4f', background: 'transparent' }}
              />
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Test String + Highlighted */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Test String Input */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>Test String</Text>}
          >
            <textarea
              style={{ ...textareaBase, minHeight: 160 }}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste or type the text to test your regex against..."
              spellCheck={false}
            />
            <Text style={{ color: mutedColor, fontSize: 11, marginTop: 6, display: 'block' }}>
              {testString.length} chars · {testString.split('\n').length} lines
            </Text>
          </Card>

          {/* Highlighted Preview */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: textColor, fontSize: 13 }}>Highlighted Matches</Text>
                {matches.length > 0 && (
                  <Badge count={matches.length} style={{ background: '#50C878', fontSize: 11 }} />
                )}
              </div>
            }
          >
            {testString ? (
              <div
                dangerouslySetInnerHTML={{ __html: highlighted }}
                style={{
                  minHeight: 100,
                  maxHeight: 240,
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: textColor,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: 80,
                  background: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: mutedColor,
                  fontSize: 13,
                  fontStyle: 'italic',
                }}
              >
                Matches will be highlighted here...
              </div>
            )}
          </Card>

          {/* Match List */}
          {matches.length > 0 && (
            <Card
              style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
              bodyStyle={{ padding: 16 }}
              title={<Text style={{ color: textColor, fontSize: 13 }}>Match Details</Text>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: inputBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <Tag color="green" style={{ fontSize: 11, minWidth: 28, textAlign: 'center' }}>
                      #{idx + 1}
                    </Tag>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <code
                          style={{
                            color: '#50C878',
                            fontFamily: 'monospace',
                            fontSize: 13,
                            background: isDark ? '#0a1f0f' : '#e8f5e9',
                            padding: '1px 6px',
                            borderRadius: 4,
                            wordBreak: 'break-all',
                          }}
                        >
                          {m.value || '(empty)'}
                        </code>
                        <Text style={{ color: mutedColor, fontSize: 11 }}>
                          index {m.index} → {m.index + m.value.length}
                        </Text>
                      </div>
                      {m.captureGroups.length > 0 && (
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {m.captureGroups.map((g, gi) => (
                            <Tag key={gi} style={{ fontSize: 11, borderColor, background: 'transparent', color: textColor }}>
                              Group {gi + 1}: {g ?? 'undefined'}
                            </Tag>
                          ))}
                        </div>
                      )}
                      {m.groups && Object.keys(m.groups).length > 0 && (
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {Object.entries(m.groups).map(([k, v]) => (
                            <Tag key={k} color="blue" style={{ fontSize: 11 }}>
                              {k}: {v}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                    <Tooltip title="Copy match">
                      <Button
                        icon={<CopyOutlined />}
                        size="small"
                        type="text"
                        onClick={() => handleCopy(m.value, idx)}
                        style={{ color: copiedIdx === idx ? '#50C878' : mutedColor, flexShrink: 0 }}
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Cheatsheet + History */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* History */}
          {history.length > 0 && (
            <Card
              style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
              bodyStyle={{ padding: '12px 14px' }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HistoryOutlined style={{ color: mutedColor }} />
                  <Text style={{ color: textColor, fontSize: 13 }}>Recent Patterns</Text>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {history.map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPattern(h)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${borderColor}`,
                      borderRadius: 6,
                      padding: '5px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: textColor,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#50C878')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderColor)}
                    title={h}
                  >
                    /{h}/
                  </button>
                ))}
              </div>
              <Button
                size="small"
                type="link"
                style={{ color: '#ff4d4f', padding: '4px 0', fontSize: 12, marginTop: 4 }}
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem(STORAGE_KEY);
                }}
              >
                Clear history
              </Button>
            </Card>
          )}

          {/* Cheatsheet */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: '12px 14px' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BulbOutlined style={{ color: '#f59e0b' }} />
                <Text style={{ color: textColor, fontSize: 13 }}>Cheatsheet</Text>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CHEATSHEET.map((entry) => (
                <Tooltip key={entry.label} title={entry.description} placement="left">
                  <button
                    onClick={() => insertCheat(entry)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${borderColor}`,
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s',
                      width: '100%',
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
                    <SearchOutlined style={{ color: '#50C878', fontSize: 12, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: textColor, fontSize: 12, fontWeight: 600 }}>{entry.label}</div>
                      <div
                        style={{
                          color: mutedColor,
                          fontSize: 10,
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        /{entry.pattern.slice(0, 28)}{entry.pattern.length > 28 ? '…' : ''}/
                      </div>
                    </div>
                  </button>
                </Tooltip>
              ))}
            </div>
          </Card>

          {/* Quick Reference */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: '12px 14px' }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>Quick Reference</Text>}
          >
            <Collapse
              ghost
              size="small"
              items={[
                {
                  key: 'chars',
                  label: <Text style={{ color: mutedColor, fontSize: 12 }}>Character Classes</Text>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[
                        ['\\d', 'Digit [0-9]'],
                        ['\\D', 'Non-digit'],
                        ['\\w', 'Word char'],
                        ['\\W', 'Non-word'],
                        ['\\s', 'Whitespace'],
                        ['\\S', 'Non-whitespace'],
                        ['.', 'Any char (except \\n)'],
                        ['[abc]', 'Character set'],
                        ['[^abc]', 'Negated set'],
                      ].map(([sym, desc]) => (
                        <div key={sym} style={{ display: 'flex', gap: 8 }}>
                          <code style={{ color: '#50C878', fontFamily: 'monospace', fontSize: 11, width: 48, flexShrink: 0 }}>{sym}</code>
                          <Text style={{ color: mutedColor, fontSize: 11 }}>{desc}</Text>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'quantifiers',
                  label: <Text style={{ color: mutedColor, fontSize: 12 }}>Quantifiers</Text>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[
                        ['*', '0 or more'],
                        ['+', '1 or more'],
                        ['?', '0 or 1 (optional)'],
                        ['{n}', 'Exactly n'],
                        ['{n,}', 'n or more'],
                        ['{n,m}', 'Between n and m'],
                        ['*?', 'Lazy 0 or more'],
                        ['+?', 'Lazy 1 or more'],
                      ].map(([sym, desc]) => (
                        <div key={sym} style={{ display: 'flex', gap: 8 }}>
                          <code style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: 11, width: 48, flexShrink: 0 }}>{sym}</code>
                          <Text style={{ color: mutedColor, fontSize: 11 }}>{desc}</Text>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'anchors',
                  label: <Text style={{ color: mutedColor, fontSize: 12 }}>Anchors & Groups</Text>,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[
                        ['^', 'Start of line'],
                        ['$', 'End of line'],
                        ['\\b', 'Word boundary'],
                        ['(abc)', 'Capture group'],
                        ['(?:abc)', 'Non-capture group'],
                        ['(?<n>abc)', 'Named group'],
                        ['a|b', 'Alternation (a or b)'],
                      ].map(([sym, desc]) => (
                        <div key={sym} style={{ display: 'flex', gap: 8 }}>
                          <code style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: 11, width: 60, flexShrink: 0 }}>{sym}</code>
                          <Text style={{ color: mutedColor, fontSize: 11 }}>{desc}</Text>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
