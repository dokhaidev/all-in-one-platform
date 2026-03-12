'use client';

import React, { useState, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Row, Col, Select, InputNumber, Table, Switch, message } from 'antd';
import { CopyOutlined, ReloadOutlined, DeleteOutlined, NumberOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

// UUID v4
function uuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// UUID v1 (simplified, time-based)
function uuidV1(): string {
  const now = Date.now();
  const timeHigh = Math.floor(now / 0x100000000);
  const timeLow = now & 0xffffffff;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[0] = timeLow & 0xff;
  bytes[1] = (timeLow >> 8) & 0xff;
  bytes[2] = (timeLow >> 16) & 0xff;
  bytes[3] = (timeLow >> 24) & 0xff;
  bytes[4] = timeHigh & 0xff;
  bytes[5] = (timeHigh >> 8) & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x10;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// NanoID
const NANOID_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
function nanoId(size = 21): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => NANOID_ALPHABET[b & 63]).join('');
}

// ULID
function ulid(): string {
  const t = Date.now();
  const timeStr = t.toString(32).padStart(10, '0').toUpperCase();
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const randStr = Array.from(bytes).map(b => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[b % 32]).join('');
  return timeStr + randStr;
}

type GenType = 'uuidv4' | 'uuidv1' | 'nanoid' | 'ulid';

function generate(type: GenType): string {
  switch (type) {
    case 'uuidv4': return uuidV4();
    case 'uuidv1': return uuidV1();
    case 'nanoid': return nanoId();
    case 'ulid': return ulid();
  }
}

interface GenItem { key: string; id: string; type: string }

export default function UuidGeneratorTool() {
  const [type, setType] = useState<GenType>('uuidv4');
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [noBraces, setNoBraces] = useState(false);
  const [history, setHistory] = useState<GenItem[]>([]);
  const [single, setSingle] = useState(() => uuidV4());

  const fmt = useCallback((id: string) => {
    let s = id;
    if (uppercase) s = s.toUpperCase();
    if (!noBraces && (type === 'uuidv4' || type === 'uuidv1')) s = `{${s}}`;
    return s;
  }, [uppercase, noBraces, type]);

  const regenerateSingle = () => {
    setSingle(generate(type));
  };

  const generateBatch = () => {
    const items: GenItem[] = Array.from({ length: count }, (_, i) => ({
      key: String(Date.now() + i),
      id: fmt(generate(type)),
      type,
    }));
    setHistory(prev => [...items, ...prev].slice(0, 100));
  };

  const copyAll = () => {
    navigator.clipboard.writeText(history.map(h => h.id).join('\n'));
    message.success(`Đã copy ${history.length} IDs!`);
  };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  const TYPE_INFO: Record<GenType, { desc: string; example: string }> = {
    uuidv4: { desc: 'Random UUID, phổ biến nhất, 122 bits entropy', example: '550e8400-e29b-41d4-a716-446655440000' },
    uuidv1: { desc: 'Time-based UUID, chứa timestamp', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
    nanoid: { desc: 'Compact, URL-safe, 21 ký tự', example: 'V1StGXR8_Z5jdHi6B-myT' },
    ulid: { desc: 'Sortable, 26 ký tự, timestamp prefix', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' },
  };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <NumberOutlined style={{ color: dark.primary, marginRight: 8 }} />
        UUID / ID Generator
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Tạo UUID v4, UUID v1, NanoID, ULID ngay trên trình duyệt — không cần server
      </Text>

      <Row gutter={16}>
        <Col xs={24} md={14}>
          {/* Config */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Cấu hình</Text>}>
            <Space wrap style={{ marginBottom: 12 }}>
              <Space>
                <Text style={{ color: dark.text }}>Loại:</Text>
                <Select value={type} onChange={v => { setType(v); setSingle(generate(v)); }} style={{ width: 150 }} dropdownStyle={{ background: '#1e1e1e' }}>
                  <Option value="uuidv4">UUID v4</Option>
                  <Option value="uuidv1">UUID v1</Option>
                  <Option value="nanoid">NanoID</Option>
                  <Option value="ulid">ULID</Option>
                </Select>
              </Space>
              <Space>
                <Text style={{ color: dark.text }}>Số lượng:</Text>
                <InputNumber min={1} max={100} value={count} onChange={v => setCount(v || 1)}
                  style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text, width: 80 }} />
              </Space>
              <Space>
                <Text style={{ color: dark.text }}>Hoa:</Text>
                <Switch checked={uppercase} onChange={setUppercase} size="small" />
              </Space>
              <Space>
                <Text style={{ color: dark.text }}>Bỏ ngoặc &#123;&#125;:</Text>
                <Switch checked={noBraces} onChange={setNoBraces} size="small" />
              </Space>
            </Space>

            {/* Info */}
            <div style={{ background: '#2a2a2a', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
              <Text style={{ color: dark.primary, fontWeight: 600 }}>{type.toUpperCase()}</Text>
              <Text style={{ color: '#888', display: 'block', fontSize: 12 }}>{TYPE_INFO[type].desc}</Text>
              <Text style={{ color: '#555', fontSize: 11, fontFamily: 'monospace' }}>Ví dụ: {TYPE_INFO[type].example}</Text>
            </div>

            {/* Single generate */}
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input readOnly value={fmt(single)} style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.primary, fontFamily: 'monospace', fontWeight: 600 }} />
              <Button icon={<ReloadOutlined />} onClick={regenerateSingle} style={{ border: `1px solid ${dark.border}`, background: '#333', color: dark.text }} />
              <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(fmt(single)); message.success('Đã copy!'); }}
                style={{ border: `1px solid ${dark.border}`, background: '#333', color: dark.text }} />
            </Space.Compact>

            <Button type="primary" onClick={generateBatch} block
              style={{ background: dark.primary, borderColor: dark.primary, color: '#000', fontWeight: 600 }}>
              Tạo {count} ID{count > 1 ? 's' : ''}
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          {/* Quick info */}
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>So sánh các loại ID</Text>}>
            {(['uuidv4', 'uuidv1', 'nanoid', 'ulid'] as GenType[]).map(t => (
              <div key={t} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => { setType(t); setSingle(generate(t)); }}>
                <Tag color={t === type ? 'success' : undefined}>{t.toUpperCase()}</Tag>
                <Text style={{ color: '#888', fontSize: 12 }}>{TYPE_INFO[t].desc}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* History */}
      {history.length > 0 && (
        <Card style={cardStyle} title={
          <Space>
            <Text style={{ color: '#e0e0e0' }}>Lịch sử ({history.length})</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyAll} style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>Copy tất cả</Button>
            <Button size="small" icon={<DeleteOutlined />} onClick={() => setHistory([])} danger>Xóa</Button>
          </Space>
        }>
          <Table
            dataSource={history}
            columns={[
              { title: '#', key: 'idx', render: (_: unknown, __: GenItem, i: number) => <Text style={{ color: '#555' }}>{i + 1}</Text>, width: 40 },
              { title: 'ID', dataIndex: 'id', key: 'id', render: (v: string) => <Text style={{ color: dark.primary, fontFamily: 'monospace', fontSize: 12 }}>{v}</Text> },
              { title: 'Loại', dataIndex: 'type', key: 'type', width: 80, render: (v: string) => <Tag>{v.toUpperCase()}</Tag> },
              { title: '', key: 'copy', width: 50, render: (_: unknown, r: GenItem) => (
                <Button size="small" icon={<CopyOutlined />} type="text"
                  onClick={() => { navigator.clipboard.writeText(r.id); message.success('Đã copy!'); }} />
              )},
            ]}
            pagination={{ pageSize: 20, size: 'small' }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
}
