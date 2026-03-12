'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Row, Col, Typography, Select, Space, Tag, Divider, Table, message } from 'antd';
import { CopyOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Asia/Ho_Chi_Minh (GMT+7)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Asia/Bangkok (GMT+7)', value: 'Asia/Bangkok' },
  { label: 'Asia/Singapore (GMT+8)', value: 'Asia/Singapore' },
  { label: 'Asia/Tokyo (GMT+9)', value: 'Asia/Tokyo' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
];

function formatDate(date: Date, tz: string): Record<string, string> {
  const opts = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: tz }).format(date);

  return {
    'ISO 8601': date.toISOString(),
    'RFC 2822': date.toUTCString(),
    'Local (full)': opts({ dateStyle: 'full', timeStyle: 'long' }),
    'Date only': opts({ year: 'numeric', month: '2-digit', day: '2-digit' }),
    'Time only': opts({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    'Relative': getRelative(date),
  };
}

function getRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Math.abs(diff) < 60) return `${Math.abs(diff)} giây ${diff >= 0 ? 'trước' : 'sau'}`;
  if (Math.abs(diff) < 3600) return `${Math.floor(Math.abs(diff) / 60)} phút ${diff >= 0 ? 'trước' : 'sau'}`;
  if (Math.abs(diff) < 86400) return `${Math.floor(Math.abs(diff) / 3600)} giờ ${diff >= 0 ? 'trước' : 'sau'}`;
  return `${Math.floor(Math.abs(diff) / 86400)} ngày ${diff >= 0 ? 'trước' : 'sau'}`;
}

const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

export default function TimestampConverterTool() {
  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [resultTs, setResultTs] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fromTimestamp = () => {
    setError('');
    const raw = tsInput.trim();
    if (!raw) return;
    let ms = parseInt(raw);
    if (isNaN(ms)) { setError('Timestamp không hợp lệ'); return; }
    // auto-detect seconds vs milliseconds
    if (raw.length <= 10) ms = ms * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) { setError('Timestamp không hợp lệ'); return; }
    setResult(formatDate(d, timezone));
    setResultTs(String(Math.floor(d.getTime() / 1000)));
  };

  const fromDate = () => {
    setError('');
    const raw = dateInput.trim();
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) { setError('Định dạng ngày không hợp lệ. Ví dụ: 2024-03-15 14:30:00'); return; }
    setResult(formatDate(d, timezone));
    setResultTs(String(Math.floor(d.getTime() / 1000)));
  };

  const useNow = () => {
    const d = new Date();
    setTsInput(String(Math.floor(d.getTime() / 1000)));
    setResult(formatDate(d, timezone));
    setResultTs(String(Math.floor(d.getTime() / 1000)));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Đã copy!');
  };

  const tableData = result
    ? Object.entries(result).map(([key, val]) => ({ key, format: key, value: val }))
    : [];

  const columns = [
    { title: 'Định dạng', dataIndex: 'format', key: 'format', width: 160,
      render: (v: string) => <Text style={{ color: dark.primary, fontWeight: 600 }}>{v}</Text> },
    { title: 'Giá trị', dataIndex: 'value', key: 'value',
      render: (v: string) => (
        <Space>
          <Text style={{ color: dark.text, fontFamily: 'monospace' }}>{v}</Text>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(v)} type="text" />
        </Space>
      ) },
  ];

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const inputStyle = { background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <ClockCircleOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Timestamp Converter
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Chuyển đổi Unix timestamp ↔ datetime, hỗ trợ nhiều múi giờ
      </Text>

      {/* Live clock */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text style={{ color: '#888' }}>Unix timestamp hiện tại:</Text>
          </Col>
          <Col>
            <Text style={{ color: dark.primary, fontSize: 20, fontFamily: 'monospace', fontWeight: 700 }}>
              {Math.floor(now / 1000)}
            </Text>
          </Col>
          <Col>
            <Text style={{ color: '#666', fontFamily: 'monospace' }}>({now} ms)</Text>
          </Col>
          <Col>
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(String(Math.floor(now / 1000)))} type="text" style={{ color: dark.text }} />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24} style={{ marginBottom: 8 }}>
          <Text style={{ color: '#888' }}>Múi giờ: </Text>
          <Select value={timezone} onChange={setTimezone} style={{ width: 280, marginLeft: 8 }}
            dropdownStyle={{ background: '#1e1e1e' }}>
            {TIMEZONES.map(tz => <Option key={tz.value} value={tz.value}>{tz.label}</Option>)}
          </Select>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Timestamp → Date */}
        <Col xs={24} md={12}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Timestamp → Datetime</Text>}>
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input
                value={tsInput}
                onChange={e => setTsInput(e.target.value)}
                placeholder="VD: 1710000000 hoặc 1710000000000"
                style={inputStyle}
                onPressEnter={fromTimestamp}
              />
              <Button onClick={fromTimestamp} type="primary" style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
                Convert
              </Button>
            </Space.Compact>
            <Button onClick={useNow} icon={<ReloadOutlined />} size="small" style={{ color: dark.text, border: `1px solid ${dark.border}`, background: 'transparent' }}>
              Dùng thời điểm hiện tại
            </Button>
          </Card>
        </Col>

        {/* Date → Timestamp */}
        <Col xs={24} md={12}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Datetime → Timestamp</Text>}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                placeholder="VD: 2024-03-15 14:30:00"
                style={inputStyle}
                onPressEnter={fromDate}
              />
              <Button onClick={fromDate} type="primary" style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
                Convert
              </Button>
            </Space.Compact>
          </Card>
        </Col>
      </Row>

      {error && <Text style={{ color: '#ff4d4f' }}>{error}</Text>}

      {result && (
        <Card style={cardStyle} title={
          <Space>
            <Text style={{ color: '#e0e0e0' }}>Kết quả</Text>
            <Tag color="green" style={{ cursor: 'pointer' }} onClick={() => copy(resultTs)}>
              Unix: {resultTs} <CopyOutlined />
            </Tag>
          </Space>
        }>
          <Table
            dataSource={tableData}
            columns={columns}
            pagination={false}
            size="small"
            style={{ background: 'transparent' }}
          />
        </Card>
      )}

      <Divider style={{ borderColor: dark.border }} />
      <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Ví dụ timestamp thông dụng</Text>}>
        <Row gutter={[8, 8]}>
          {[
            { label: 'Unix epoch (1970-01-01)', ts: '0' },
            { label: 'Y2K (2000-01-01)', ts: '946684800' },
            { label: 'iPhone ra mắt (2007-01-09)', ts: '1168300800' },
          ].map(ex => (
            <Col key={ex.ts}>
              <Tag style={{ cursor: 'pointer', background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}
                onClick={() => { setTsInput(ex.ts); }}>
                {ex.label} ({ex.ts})
              </Tag>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
