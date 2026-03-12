'use client';

import React, { useState, useMemo } from 'react';
import { Card, Input, Button, Row, Col, Typography, Space, Tag, Select, Switch, message } from 'antd';
import { DiffOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

type DiffLine = { type: 'same' | 'add' | 'remove'; text: string; lineA?: number; lineB?: number };

function computeDiff(a: string, b: string, ignoreCase: boolean, ignoreWhitespace: boolean): DiffLine[] {
  let linesA = a.split('\n');
  let linesB = b.split('\n');

  const normalize = (s: string) => {
    let r = s;
    if (ignoreCase) r = r.toLowerCase();
    if (ignoreWhitespace) r = r.trim().replace(/\s+/g, ' ');
    return r;
  };

  const normA = linesA.map(normalize);
  const normB = linesB.map(normalize);

  // LCS-based diff
  const m = linesA.length, n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = normA[i] === normB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const result: DiffLine[] = [];
  let i = 0, j = 0, lineNumA = 1, lineNumB = 1;
  while (i < m || j < n) {
    if (i < m && j < n && normA[i] === normB[j]) {
      result.push({ type: 'same', text: linesA[i], lineA: lineNumA++, lineB: lineNumB++ });
      i++; j++;
    } else if (j < n && (i >= m || dp[i + 1][j] >= dp[i][j + 1])) {
      result.push({ type: 'add', text: linesB[j], lineB: lineNumB++ });
      j++;
    } else {
      result.push({ type: 'remove', text: linesA[i], lineA: lineNumA++ });
      i++;
    }
  }
  return result;
}

function DiffLineRow({ line, view }: { line: DiffLine; view: string }) {
  const bg = line.type === 'add' ? 'rgba(80,200,120,0.15)' : line.type === 'remove' ? 'rgba(255,77,79,0.15)' : 'transparent';
  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
  const color = line.type === 'add' ? '#52c41a' : line.type === 'remove' ? '#ff4d4f' : dark.text;

  if (view === 'split') {
    return (
      <tr style={{ background: bg }}>
        <td style={{ width: 40, padding: '1px 6px', color: '#555', fontSize: 11, textAlign: 'right', borderRight: `1px solid ${dark.border}`, userSelect: 'none' }}>
          {line.lineA ?? ''}
        </td>
        <td style={{ padding: '1px 8px', color: line.type === 'remove' ? '#ff4d4f' : dark.text, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', width: '50%', background: line.type === 'remove' ? 'rgba(255,77,79,0.15)' : 'transparent' }}>
          {line.type !== 'add' ? line.text : ''}
        </td>
        <td style={{ width: 40, padding: '1px 6px', color: '#555', fontSize: 11, textAlign: 'right', borderLeft: `1px solid ${dark.border}`, borderRight: `1px solid ${dark.border}`, userSelect: 'none' }}>
          {line.lineB ?? ''}
        </td>
        <td style={{ padding: '1px 8px', color: line.type === 'add' ? '#52c41a' : dark.text, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', width: '50%', background: line.type === 'add' ? 'rgba(80,200,120,0.15)' : 'transparent' }}>
          {line.type !== 'remove' ? line.text : ''}
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: bg }}>
      <td style={{ width: 35, padding: '1px 6px', color: '#555', fontSize: 11, textAlign: 'right', borderRight: `1px solid ${dark.border}`, userSelect: 'none' }}>
        {line.lineA ?? ''}
      </td>
      <td style={{ width: 35, padding: '1px 6px', color: '#555', fontSize: 11, textAlign: 'right', borderRight: `1px solid ${dark.border}`, userSelect: 'none' }}>
        {line.lineB ?? ''}
      </td>
      <td style={{ width: 20, padding: '1px 4px', color, textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{prefix}</td>
      <td style={{ padding: '1px 8px', color, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {line.text}
      </td>
    </tr>
  );
}

export default function DiffTool() {
  const [textA, setTextA] = useState('Hello World\nLine 2\nLine 3\nThis line removed');
  const [textB, setTextB] = useState('Hello World\nLine 2 modified\nLine 3\nThis line added');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWS, setIgnoreWS] = useState(false);
  const [view, setView] = useState<'inline' | 'split'>('inline');

  const diff = useMemo(() => computeDiff(textA, textB, ignoreCase, ignoreWS), [textA, textB, ignoreCase, ignoreWS]);

  const added = diff.filter(l => l.type === 'add').length;
  const removed = diff.filter(l => l.type === 'remove').length;
  const same = diff.filter(l => l.type === 'same').length;

  const swap = () => { setTextA(textB); setTextB(textA); };
  const copyDiff = () => {
    const out = diff.map(l => (l.type === 'add' ? '+ ' : l.type === 'remove' ? '- ' : '  ') + l.text).join('\n');
    navigator.clipboard.writeText(out);
    message.success('Đã copy diff!');
  };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const inputStyle = { background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <DiffOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Text Diff Tool
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>So sánh 2 đoạn text/code, highlight thay đổi</Text>

      {/* Options */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Space wrap>
          <Space>
            <Text style={{ color: dark.text }}>Bỏ qua hoa/thường:</Text>
            <Switch checked={ignoreCase} onChange={setIgnoreCase} />
          </Space>
          <Space>
            <Text style={{ color: dark.text }}>Bỏ qua khoảng trắng:</Text>
            <Switch checked={ignoreWS} onChange={setIgnoreWS} />
          </Space>
          <Space>
            <Text style={{ color: dark.text }}>Chế độ xem:</Text>
            <Select value={view} onChange={v => setView(v as 'inline' | 'split')} style={{ width: 120 }} dropdownStyle={{ background: '#1e1e1e' }}>
              <Option value="inline">Inline</Option>
              <Option value="split">Side by side</Option>
            </Select>
          </Space>
          <Button icon={<SwapOutlined />} onClick={swap} style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>
            Đổi chỗ
          </Button>
          <Button icon={<CopyOutlined />} onClick={copyDiff} style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>
            Copy diff
          </Button>
        </Space>
      </Card>

      {/* Input */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Text A (gốc)</Text>}>
            <TextArea
              value={textA}
              onChange={e => setTextA(e.target.value)}
              rows={10}
              style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
              placeholder="Nhập text gốc..."
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Text B (mới)</Text>}>
            <TextArea
              value={textB}
              onChange={e => setTextB(e.target.value)}
              rows={10}
              style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
              placeholder="Nhập text mới..."
            />
          </Card>
        </Col>
      </Row>

      {/* Stats */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Tag color="success">+{added} dòng thêm</Tag>
        <Tag color="error">-{removed} dòng xóa</Tag>
        <Tag style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: '#888' }}>{same} dòng giống</Tag>
        {added === 0 && removed === 0 && <Tag color="blue">Hai text giống nhau!</Tag>}
      </Space>

      {/* Diff output */}
      <Card style={{ ...cardStyle, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: view === 'split' ? 'fixed' : 'auto' }}>
          <tbody>
            {diff.map((line, i) => (
              <DiffLineRow key={i} line={line} view={view} />
            ))}
          </tbody>
        </table>
        {diff.length === 0 && (
          <Text style={{ color: '#888' }}>Nhập text vào 2 ô trên để xem sự khác biệt</Text>
        )}
      </Card>
    </div>
  );
}
