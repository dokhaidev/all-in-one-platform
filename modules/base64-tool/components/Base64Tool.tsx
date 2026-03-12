'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Card,
  Tabs,
  Button,
  Switch,
  Alert,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Divider,
  Tooltip,
  Input,
  Form,
} from 'antd';
import {
  CopyOutlined,
  SwapOutlined,
  ClearOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  FileImageOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toBase64(str: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  let b64 = btoa(binary);
  if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}

function fromBase64(b64: string, urlSafe: boolean): string {
  let normalized = b64.trim();
  if (urlSafe) normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
  // Pad if needed
  const pad = normalized.length % 4;
  if (pad === 2) normalized += '==';
  else if (pad === 3) normalized += '=';
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);
  const isCopied = (key: string) => copiedKey === key;
  return { copy, isCopied };
}

// ─── Tab 1: Text Encode/Decode ────────────────────────────────────────────────

function TextTab({
  isDark,
  cardBg,
  borderColor,
  textColor,
  mutedColor,
  inputBg,
}: {
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  inputBg: string;
}) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [stripWs, setStripWs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy, isCopied } = useCopy();

  const process = useCallback(
    (text: string, m: 'encode' | 'decode', us: boolean, sw: boolean) => {
      setError(null);
      if (!text) { setOutput(''); return; }
      try {
        if (m === 'encode') {
          setOutput(toBase64(text, us));
        } else {
          const src = sw ? text.replace(/\s/g, '') : text;
          setOutput(fromBase64(src, us));
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Decode thất bại. Kiểm tra lại input.');
        setOutput('');
      }
    },
    []
  );

  useEffect(() => { process(input, mode, urlSafe, stripWs); }, [input, mode, urlSafe, stripWs, process]);

  const handleSwap = () => {
    setInput(output);
    setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
  };

  const handleClear = () => { setInput(''); setOutput(''); setError(null); };

  const taStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    color: textColor,
    fontFamily: 'monospace',
    fontSize: 13,
    minHeight: 180,
    resize: 'vertical',
  };

  return (
    <div>
      {/* Controls */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '14px 20px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['encode', 'decode'] as const).map((m) => (
              <Button
                key={m}
                type={mode === m ? 'primary' : 'default'}
                onClick={() => setMode(m)}
                style={
                  mode === m
                    ? { background: '#50C878', borderColor: '#50C878' }
                    : { borderColor, color: textColor, background: 'transparent' }
                }
              >
                {m === 'encode' ? 'Encode →' : '← Decode'}
              </Button>
            ))}
          </div>
          <Divider type="vertical" style={{ borderColor, height: 24 }} />
          <Space>
            <Switch
              size="small"
              checked={urlSafe}
              onChange={setUrlSafe}
              style={urlSafe ? { background: '#50C878' } : {}}
            />
            <Text style={{ color: textColor, fontSize: 13 }}>URL-safe</Text>
          </Space>
          {mode === 'decode' && (
            <Space>
              <Switch
                size="small"
                checked={stripWs}
                onChange={setStripWs}
                style={stripWs ? { background: '#50C878' } : {}}
              />
              <Text style={{ color: textColor, fontSize: 13 }}>Strip whitespace</Text>
            </Space>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button icon={<SwapOutlined />} size="small" onClick={handleSwap} disabled={!output} style={{ borderColor, color: textColor }}>
              Swap
            </Button>
            <Button icon={<ClearOutlined />} size="small" onClick={handleClear} danger>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16, borderRadius: 8 }} closable onClose={() => setError(null)} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>{mode === 'encode' ? 'Văn bản gốc' : 'Base64 input'}</Text>}
          >
            <TextArea
              style={taStyle}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? 'Nhập văn bản cần mã hóa...' : 'Nhập chuỗi Base64 cần giải mã...'}
              autoSize={{ minRows: 6, maxRows: 16 }}
            />
            <div style={{ marginTop: 8, color: mutedColor, fontSize: 11 }}>
              {input.length} ký tự · {formatBytes(new TextEncoder().encode(input).length)}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>{mode === 'encode' ? 'Base64 output' : 'Văn bản giải mã'}</Text>}
            extra={
              <Button
                icon={<CopyOutlined />}
                size="small"
                onClick={() => copy(output, 'text-output')}
                disabled={!output}
                style={{ borderColor, color: isCopied('text-output') ? '#50C878' : textColor, background: 'transparent' }}
              >
                {isCopied('text-output') ? 'Copied!' : 'Copy'}
              </Button>
            }
          >
            <TextArea
              style={{ ...taStyle, color: output ? textColor : mutedColor }}
              value={output}
              readOnly
              placeholder="Kết quả..."
              autoSize={{ minRows: 6, maxRows: 16 }}
            />
            {output && (
              <div style={{ marginTop: 8, color: mutedColor, fontSize: 11 }}>
                {output.length} ký tự · {formatBytes(new TextEncoder().encode(output).length)}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// ─── Tab 2: URL Encode/Decode ────────────────────────────────────────────────

interface ParsedUrl {
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  params: { key: string; value: string }[];
}

function parseUrl(raw: string): ParsedUrl | null {
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const params: { key: string; value: string }[] = [];
    u.searchParams.forEach((v, k) => params.push({ key: k, value: v }));
    return {
      protocol: u.protocol,
      host: u.host,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      params,
    };
  } catch {
    return null;
  }
}

function UrlTab({
  isDark,
  cardBg,
  borderColor,
  textColor,
  mutedColor,
  inputBg,
}: {
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  inputBg: string;
}) {
  const [input, setInput] = useState('');
  const [buildProto, setBuildProto] = useState('https:');
  const [buildHost, setBuildHost] = useState('');
  const [buildPath, setBuildPath] = useState('');
  const [buildHash, setBuildHash] = useState('');
  const [buildParams, setBuildParams] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const { copy, isCopied } = useCopy();

  const encoded = input ? encodeURIComponent(input) : '';
  const decoded = (() => { try { return decodeURIComponent(input); } catch { return ''; } })();
  const fullEncoded = input ? input.split('').map((c) => (c === ':' || c === '/' || c === '?' || c === '&' || c === '=' || c === '#' ? c : encodeURIComponent(c))).join('') : '';
  const parsed = input ? parseUrl(input) : null;

  const builtUrl = (() => {
    const base = `${buildProto}//${buildHost}${buildPath || '/'}`;
    const activeParams = buildParams.filter((p) => p.key.trim());
    const qs = activeParams.length
      ? '?' + activeParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
      : '';
    return `${base}${qs}${buildHash ? '#' + buildHash : ''}`;
  })();

  const taStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    color: textColor,
    fontFamily: 'monospace',
    fontSize: 13,
  };

  const resultRow = (label: string, value: string, copyKey: string) => (
    <div style={{ marginBottom: 12 }}>
      <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <TextArea
          style={{ ...taStyle, flex: 1 }}
          value={value}
          readOnly
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
        <Button
          icon={<CopyOutlined />}
          size="small"
          onClick={() => copy(value, copyKey)}
          style={{ borderColor, color: isCopied(copyKey) ? '#50C878' : textColor, background: 'transparent', flexShrink: 0 }}
        >
          {isCopied(copyKey) ? '✓' : ''}
        </Button>
      </div>
    </div>
  );

  return (
    <Row gutter={[16, 16]}>
      {/* Encode/Decode */}
      <Col xs={24} lg={12}>
        <Card
          style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
          bodyStyle={{ padding: 16 }}
          title={<Text style={{ color: textColor, fontSize: 13 }}>URL Encode / Decode</Text>}
        >
          <TextArea
            style={taStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập URL hoặc chuỗi cần encode/decode..."
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
          <div style={{ marginTop: 16 }}>
            {resultRow('encodeURIComponent (component encode)', encoded, 'enc-comp')}
            {resultRow('decodeURIComponent', decoded, 'dec-comp')}
            {resultRow('Full URL encode (giữ :// ? & = #)', fullEncoded, 'full-enc')}
          </div>
        </Card>

        {/* Parse URL */}
        {parsed && (
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>Phân tích URL</Text>}
          >
            {[
              { label: 'Protocol', value: parsed.protocol },
              { label: 'Host', value: parsed.host },
              { label: 'Pathname', value: parsed.pathname },
              { label: 'Query String', value: parsed.search },
              { label: 'Hash', value: parsed.hash },
            ].map(
              (row) =>
                row.value && (
                  <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                    <Text style={{ color: mutedColor, fontSize: 12, width: 90, flexShrink: 0 }}>{row.label}</Text>
                    <Text style={{ color: '#50C878', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                      {row.value}
                    </Text>
                  </div>
                )
            )}
            {parsed.params.length > 0 && (
              <>
                <Divider style={{ borderColor, margin: '12px 0' }} />
                <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 8 }}>Query Params:</Text>
                {parsed.params.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.key}</Tag>
                    <Text style={{ color: textColor, fontFamily: 'monospace', fontSize: 12 }}>=</Text>
                    <Text style={{ color: '#50C878', fontFamily: 'monospace', fontSize: 12 }}>{p.value}</Text>
                  </div>
                ))}
              </>
            )}
          </Card>
        )}
      </Col>

      {/* Build URL */}
      <Col xs={24} lg={12}>
        <Card
          style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
          bodyStyle={{ padding: 16 }}
          title={<Text style={{ color: textColor, fontSize: 13 }}>Xây dựng URL</Text>}
        >
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={6}>
                <Form.Item label={<Text style={{ color: mutedColor, fontSize: 12 }}>Protocol</Text>} style={{ marginBottom: 10 }}>
                  <Input
                    value={buildProto}
                    onChange={(e) => setBuildProto(e.target.value)}
                    style={{ background: inputBg, borderColor, color: textColor }}
                  />
                </Form.Item>
              </Col>
              <Col span={18}>
                <Form.Item label={<Text style={{ color: mutedColor, fontSize: 12 }}>Host</Text>} style={{ marginBottom: 10 }}>
                  <Input
                    value={buildHost}
                    onChange={(e) => setBuildHost(e.target.value)}
                    placeholder="example.com"
                    style={{ background: inputBg, borderColor, color: textColor }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label={<Text style={{ color: mutedColor, fontSize: 12 }}>Path</Text>} style={{ marginBottom: 10 }}>
              <Input
                value={buildPath}
                onChange={(e) => setBuildPath(e.target.value)}
                placeholder="/api/v1/resource"
                style={{ background: inputBg, borderColor, color: textColor }}
              />
            </Form.Item>
            <Form.Item label={<Text style={{ color: mutedColor, fontSize: 12 }}>Query Params</Text>} style={{ marginBottom: 10 }}>
              {buildParams.map((p, i) => (
                <Row gutter={8} key={i} style={{ marginBottom: 6 }}>
                  <Col span={10}>
                    <Input
                      value={p.key}
                      onChange={(e) => {
                        const next = [...buildParams];
                        next[i] = { ...next[i], key: e.target.value };
                        setBuildParams(next);
                      }}
                      placeholder="key"
                      style={{ background: inputBg, borderColor, color: textColor }}
                    />
                  </Col>
                  <Col span={10}>
                    <Input
                      value={p.value}
                      onChange={(e) => {
                        const next = [...buildParams];
                        next[i] = { ...next[i], value: e.target.value };
                        setBuildParams(next);
                      }}
                      placeholder="value"
                      style={{ background: inputBg, borderColor, color: textColor }}
                    />
                  </Col>
                  <Col span={4}>
                    <Button
                      size="small"
                      danger
                      onClick={() => setBuildParams((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={buildParams.length === 1}
                    >
                      ✕
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button
                size="small"
                onClick={() => setBuildParams((prev) => [...prev, { key: '', value: '' }])}
                style={{ borderColor, color: textColor, background: 'transparent', marginTop: 4 }}
              >
                + Thêm param
              </Button>
            </Form.Item>
            <Form.Item label={<Text style={{ color: mutedColor, fontSize: 12 }}>Hash</Text>} style={{ marginBottom: 10 }}>
              <Input
                value={buildHash}
                onChange={(e) => setBuildHash(e.target.value)}
                placeholder="section-id"
                prefix="#"
                style={{ background: inputBg, borderColor, color: textColor }}
              />
            </Form.Item>
          </Form>

          <Divider style={{ borderColor, margin: '12px 0' }} />
          <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 8 }}>URL đã tạo:</Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              style={{ ...taStyle, flex: 1, color: '#50C878' }}
              value={builtUrl}
              readOnly
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => copy(builtUrl, 'built-url')}
              style={{ borderColor, color: isCopied('built-url') ? '#50C878' : textColor, background: 'transparent', flexShrink: 0 }}
            >
              {isCopied('built-url') ? '✓' : 'Copy'}
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

// ─── Tab 3: Image → Base64 ────────────────────────────────────────────────────

function ImageTab({
  isDark,
  cardBg,
  borderColor,
  textColor,
  mutedColor,
  inputBg,
}: {
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  inputBg: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { copy, isCopied } = useCopy();

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (e) => setDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const base64Only = dataUrl ? dataUrl.split(',')[1] : '';
  const b64Size = base64Only ? Math.ceil((base64Only.length * 3) / 4) : 0;
  const overhead = fileSize > 0 ? Math.round(((b64Size - fileSize) / fileSize) * 100) : 0;

  const imgTag = dataUrl ? `<img src="${dataUrl}" alt="${fileName}" />` : '';
  const cssBg = dataUrl ? `background-image: url("${dataUrl}");` : '';

  const snippetCard = (label: string, code: string, copyKey: string) =>
    code ? (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: mutedColor, fontSize: 12 }}>{label}</Text>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copy(code, copyKey)}
            style={{ borderColor, color: isCopied(copyKey) ? '#50C878' : textColor, background: 'transparent' }}
          >
            {isCopied(copyKey) ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div
          style={{
            background: inputBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: 'monospace',
            fontSize: 11,
            color: textColor,
            wordBreak: 'break-all',
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          {code}
        </div>
      </div>
    ) : null;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        {/* Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#50C878' : borderColor}`,
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(80,200,120,0.05)' : cardBg,
            transition: 'all 0.2s',
            marginBottom: 16,
          }}
        >
          <InboxOutlined style={{ fontSize: 40, color: dragging ? '#50C878' : mutedColor, marginBottom: 10 }} />
          <div>
            <Text style={{ color: textColor, fontSize: 14, fontWeight: 600 }}>Kéo thả hoặc click để chọn ảnh</Text>
          </div>
          <div>
            <Text style={{ color: mutedColor, fontSize: 12 }}>JPG, PNG, WebP, GIF, SVG...</Text>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Preview */}
        {dataUrl && (
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <img
              src={dataUrl}
              alt="preview"
              style={{
                maxWidth: '100%',
                maxHeight: 280,
                objectFit: 'contain',
                borderRadius: 8,
                border: `1px solid ${borderColor}`,
                display: 'block',
                margin: '0 auto 12px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ color: textColor, fontWeight: 600, fontSize: 14 }}>{formatBytes(fileSize)}</div>
                <div style={{ color: mutedColor, fontSize: 11 }}>File gốc</div>
              </div>
              <div>
                <div style={{ color: '#50C878', fontWeight: 600, fontSize: 14 }}>{formatBytes(b64Size)}</div>
                <div style={{ color: mutedColor, fontSize: 11 }}>Sau Base64</div>
              </div>
              <div>
                <Tag color="orange">+{overhead}% kích thước</Tag>
                <div style={{ color: mutedColor, fontSize: 11 }}>Overhead</div>
              </div>
            </div>
          </Card>
        )}
      </Col>

      <Col xs={24} lg={14}>
        {dataUrl ? (
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
            title={<Text style={{ color: textColor, fontSize: 13 }}>Snippets</Text>}
          >
            {snippetCard('Data URL (Base64)', dataUrl, 'img-dataurl')}
            {snippetCard('Base64 string only', base64Only, 'img-b64only')}
            {snippetCard('HTML <img> tag', imgTag, 'img-imgtag')}
            {snippetCard('CSS background-image', cssBg, 'img-cssbg')}

            <Divider style={{ borderColor, margin: '12px 0' }} />
            <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 8 }}>
              Preview từ Base64:
            </Text>
            <div
              style={{
                background: inputBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                padding: 12,
                textAlign: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt="b64 preview"
                style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 4 }}
              />
              <div style={{ marginTop: 6 }}>
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Ảnh load từ Base64 thành công
                </Tag>
              </div>
            </div>
          </Card>
        ) : (
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            bodyStyle={{ padding: 40, textAlign: 'center', width: '100%' }}
          >
            <FileImageOutlined style={{ fontSize: 64, color: mutedColor, marginBottom: 16 }} />
            <div>
              <Text style={{ color: mutedColor }}>Chọn ảnh để xem Base64 snippets</Text>
            </div>
          </Card>
        )}
      </Col>
    </Row>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Base64Tool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const inputBg = isDark ? '#1a1a1a' : '#f8f8f8';

  const sharedProps = { isDark, cardBg, borderColor, textColor, mutedColor, inputBg };

  const tabItems = [
    {
      key: 'text',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FontSizeOutlined />
          Văn bản
        </span>
      ),
      children: <TextTab {...sharedProps} />,
    },
    {
      key: 'url',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LinkOutlined />
          URL
        </span>
      ),
      children: <UrlTab {...sharedProps} />,
    },
    {
      key: 'image',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileImageOutlined />
          Ảnh → Base64
        </span>
      ),
      children: <ImageTab {...sharedProps} />,
    },
  ];

  return (
    <Tabs
      defaultActiveKey="text"
      items={tabItems}
      style={{ color: textColor }}
      tabBarStyle={{ borderBottomColor: borderColor, marginBottom: 20 }}
    />
  );
}
