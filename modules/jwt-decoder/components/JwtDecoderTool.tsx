'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Alert,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Divider,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ─── Types ────────────────────────────────────────────────────────────────────

interface JwtHeader {
  alg?: string;
  typ?: string;
  [key: string]: unknown;
}

interface JwtPayload {
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  iss?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

interface DecodedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const padded2 = pad ? padded + '='.repeat(4 - pad) : padded;
  try {
    return decodeURIComponent(
      atob(padded2)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(padded2);
  }
}

function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const headerStr = base64urlDecode(parts[0]);
    const payloadStr = base64urlDecode(parts[1]);
    return {
      header: JSON.parse(headerStr) as JwtHeader,
      payload: JSON.parse(payloadStr) as JwtPayload,
      signature: parts[2],
      headerRaw: JSON.stringify(JSON.parse(headerStr), null, 2),
      payloadRaw: JSON.stringify(JSON.parse(payloadStr), null, 2),
    };
  } catch {
    return null;
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function relativeTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  const abs = Math.abs(diff);
  const future = diff < 0;
  let label: string;
  if (abs < 60) label = `${abs}s`;
  else if (abs < 3600) label = `${Math.floor(abs / 60)}m`;
  else if (abs < 86400) label = `${Math.floor(abs / 3600)}h`;
  else label = `${Math.floor(abs / 86400)}d`;
  return future ? `in ${label}` : `${label} ago`;
}

// ─── Syntax-highlighted JSON ──────────────────────────────────────────────────

function JsonHighlight({ json, isDark }: { json: string; isDark: boolean }) {
  const keyColor = isDark ? '#9cdcfe' : '#0451a5';
  const strColor = isDark ? '#ce9178' : '#a31515';
  const numColor = isDark ? '#b5cea8' : '#098658';
  const boolColor = isDark ? '#569cd6' : '#0000ff';
  const nullColor = isDark ? '#808080' : '#999';
  const punctColor = isDark ? '#c9c9c9' : '#555';

  const highlighted = json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let color = punctColor;
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          color = keyColor;
        } else {
          color = strColor;
        }
      } else if (/true|false/.test(match)) {
        color = boolColor;
      } else if (/null/.test(match)) {
        color = nullColor;
      } else {
        color = numColor;
      }
      return `<span style="color:${color}">${match}</span>`;
    }
  );

  return (
    <pre
      style={{
        margin: 0,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        color: isDark ? '#c9c9c9' : '#333',
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// ─── Sample JWT ───────────────────────────────────────────────────────────────

// Sample: header.payload.signature (valid structure, HS256, exp in future)
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksImlzcyI6InRvb2xodWIuZGV2Iiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl19.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  color: string;
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  textColor: string;
}

function SectionCard({ title, icon, content, color, isDark, cardBg, borderColor, textColor }: SectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card
      style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, marginBottom: 12 }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space>
          <span style={{ color }}>{icon}</span>
          <Text style={{ color, fontWeight: 600, fontSize: 13 }}>{title}</Text>
        </Space>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={handleCopy}
            style={{
              background: 'transparent',
              borderColor,
              color: copied ? color : textColor,
              fontSize: 12,
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Tooltip>
      </div>
      <div
        style={{
          background: isDark ? '#1a1a1a' : '#f8f8f8',
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '10px 14px',
          overflowX: 'auto',
        }}
      >
        <JsonHighlight json={content} isDark={isDark} />
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JwtDecoderTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const inputBg = isDark ? '#1a1a1a' : '#f8f8f8';

  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = useCallback((value: string) => {
    setToken(value);
    if (!value.trim()) {
      setDecoded(null);
      setError(null);
      return;
    }
    const parts = value.trim().split('.');
    if (parts.length !== 3) {
      setDecoded(null);
      setError('Invalid JWT: token must have exactly 3 parts separated by dots (header.payload.signature)');
      return;
    }
    const result = decodeJwt(value);
    if (!result) {
      setDecoded(null);
      setError('Failed to decode JWT: invalid base64url encoding or malformed JSON');
      return;
    }
    setDecoded(result);
    setError(null);
  }, []);

  const handleClear = () => {
    setToken('');
    setDecoded(null);
    setError(null);
  };

  const handleSample = () => {
    handleDecode(SAMPLE_JWT);
  };

  // Expiry analysis
  const now = Math.floor(Date.now() / 1000);
  const exp = decoded?.payload?.exp;
  const iat = decoded?.payload?.iat;
  const isExpired = exp !== undefined && exp < now;
  const hasExpiry = exp !== undefined;

  return (
    <div>
      {/* Input */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '16px' }}
        title={
          <Space>
            <KeyOutlined style={{ color: '#50C878' }} />
            <Text style={{ color: textColor, fontSize: 14, fontWeight: 600 }}>JWT Decoder</Text>
          </Space>
        }
        extra={
          <Space size={8}>
            <Button
              size="small"
              onClick={handleSample}
              icon={<ExperimentOutlined />}
              style={{ borderColor, color: '#50C878', background: 'transparent', fontSize: 12 }}
            >
              Sample JWT
            </Button>
            <Button
              size="small"
              onClick={handleClear}
              icon={<ClearOutlined />}
              disabled={!token}
              style={{ borderColor, color: token ? '#ff4d4f' : mutedColor, background: 'transparent', fontSize: 12 }}
            >
              Clear
            </Button>
          </Space>
        }
      >
        <TextArea
          value={token}
          onChange={(e) => handleDecode(e.target.value)}
          placeholder="Paste your JWT token here... e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{
            background: inputBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            borderRadius: 8,
          }}
          spellCheck={false}
        />
      </Card>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16, borderRadius: 8 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Expired Warning */}
      {decoded && isExpired && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={
            <Text style={{ fontWeight: 600 }}>
              Token is EXPIRED — expired {relativeTime(exp!)} ({formatTimestamp(exp!)})
            </Text>
          }
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {decoded && (
        <>
          {/* Token Info Summary */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
            bodyStyle={{ padding: '12px 20px' }}
          >
            <Row gutter={[24, 12]}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#50C878', fontSize: 18, fontWeight: 700 }}>
                    {decoded.header.alg || 'N/A'}
                  </div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>Algorithm</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  {!hasExpiry ? (
                    <Tag color="blue" style={{ fontSize: 12 }}>No Expiry</Tag>
                  ) : isExpired ? (
                    <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 12 }}>Expired</Tag>
                  ) : (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 12 }}>Valid</Tag>
                  )}
                  <div style={{ color: mutedColor, fontSize: 12, marginTop: 4 }}>Status</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: textColor, fontSize: 13, fontWeight: 600 }}>
                    {iat ? formatTimestamp(iat) : 'N/A'}
                  </div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>Issued At</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color: isExpired ? '#ff4d4f' : hasExpiry ? '#50C878' : mutedColor,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {hasExpiry ? `${formatTimestamp(exp!)} (${relativeTime(exp!)})` : 'Never'}
                  </div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>Expires</div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Decoded Sections */}
          <SectionCard
            title="Header"
            icon={<SafetyOutlined />}
            content={decoded.headerRaw}
            color="#faad14"
            isDark={isDark}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
          />
          <SectionCard
            title="Payload"
            icon={<ClockCircleOutlined />}
            content={decoded.payloadRaw}
            color="#50C878"
            isDark={isDark}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
          />

          {/* Signature */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, marginBottom: 12 }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Space>
                <KeyOutlined style={{ color: '#ff6b6b' }} />
                <Text style={{ color: '#ff6b6b', fontWeight: 600, fontSize: 13 }}>Signature</Text>
              </Space>
              <Tooltip title="Signature cannot be verified client-side (requires secret key)">
                <Tag color="orange" style={{ fontSize: 11 }}>Not verifiable client-side</Tag>
              </Tooltip>
            </div>
            <div
              style={{
                background: inputBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                padding: '10px 14px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#ff6b6b',
                wordBreak: 'break-all',
              }}
            >
              {decoded.signature}
            </div>
          </Card>

          <Divider style={{ borderColor }} />

          {/* Claim Details */}
          {decoded.payload.sub && (
            <Card
              style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10 }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Text style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>Standard Claims</Text>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'sub', label: 'Subject', value: decoded.payload.sub },
                  { key: 'iss', label: 'Issuer', value: decoded.payload.iss as string | undefined },
                  {
                    key: 'aud',
                    label: 'Audience',
                    value: Array.isArray(decoded.payload.aud)
                      ? decoded.payload.aud.join(', ')
                      : decoded.payload.aud,
                  },
                ]
                  .filter((c) => c.value)
                  .map((c) => (
                    <div
                      key={c.key}
                      style={{
                        background: isDark ? '#1a1a1a' : '#f0f0f0',
                        border: `1px solid ${borderColor}`,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: mutedColor }}>{c.label}: </span>
                      <span style={{ color: textColor, fontFamily: 'monospace' }}>{c.value}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
