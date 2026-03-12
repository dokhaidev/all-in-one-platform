'use client';

import React, { useState } from 'react';
import { Card, Input, Typography, Space, Tag, Row, Col, Table, message, Divider } from 'antd';
import { FieldBinaryOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

type Base = 2 | 8 | 10 | 16;

function parseNum(val: string, base: Base): number | null {
  const clean = val.trim().replace(/\s/g, '');
  if (!clean) return null;
  const n = parseInt(clean, base);
  if (isNaN(n) || n < 0) return null;
  return n;
}

function toBase(n: number, base: Base): string {
  return n.toString(base).toUpperCase();
}

function formatBinary(bin: string): string {
  return bin.padStart(Math.ceil(bin.length / 4) * 4, '0').replace(/(.{4})/g, '$1 ').trim();
}

const EXAMPLES = [
  { label: '255 (0xFF)', dec: '255' },
  { label: '42', dec: '42' },
  { label: '1024', dec: '1024' },
  { label: '65535 (0xFFFF)', dec: '65535' },
];

export default function BaseConverterTool() {
  const [values, setValues] = useState({ 2: '', 8: '', 10: '', 16: '' } as Record<Base, string>);
  const [errors, setErrors] = useState({} as Record<Base, string>);

  const copy = (text: string) => { navigator.clipboard.writeText(text); message.success('Đã copy!'); };

  const updateFrom = (val: string, base: Base) => {
    const newVals = { 2: '', 8: '', 10: '', 16: '' } as Record<Base, string>;
    const newErrs = {} as Record<Base, string>;
    newVals[base] = val;

    const n = parseNum(val, base);
    if (val.trim() && n === null) {
      newErrs[base] = 'Giá trị không hợp lệ';
    } else if (n !== null) {
      ([2, 8, 10, 16] as Base[]).forEach(b => {
        if (b !== base) newVals[b] = toBase(n, b);
      });
    }
    setValues(newVals);
    setErrors(newErrs);
  };

  const loadExample = (dec: string) => updateFrom(dec, 10);

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  const bases: { base: Base; label: string; prefix: string; color: string }[] = [
    { base: 10, label: 'Decimal (DEC)', prefix: '', color: '#50C878' },
    { base: 2, label: 'Binary (BIN)', prefix: '0b', color: '#faad14' },
    { base: 8, label: 'Octal (OCT)', prefix: '0o', color: '#1677ff' },
    { base: 16, label: 'Hexadecimal (HEX)', prefix: '0x', color: '#ff4d4f' },
  ];

  const n = parseNum(values[10] || values[2] || values[8] || values[16],
    values[10] ? 10 : values[2] ? 2 : values[8] ? 8 : 16);

  const bitTable = n !== null ? [8, 16, 32].map(bits => ({
    key: bits,
    bits: `${bits}-bit`,
    signed: n <= Math.pow(2, bits - 1) - 1 ? String(n) : 'Overflow',
    unsigned: n <= Math.pow(2, bits) - 1 ? String(n) : 'Overflow',
    hex: '0x' + n.toString(16).toUpperCase().padStart(bits / 4, '0'),
  })) : [];

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <FieldBinaryOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Number Base Converter
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Chuyển đổi số giữa hệ Decimal ↔ Binary ↔ Octal ↔ Hexadecimal
      </Text>

      {/* Quick examples */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Text style={{ color: '#888' }}>Ví dụ nhanh:</Text>
        {EXAMPLES.map(ex => (
          <Tag key={ex.dec} style={{ cursor: 'pointer', background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}
            onClick={() => loadExample(ex.dec)}>
            {ex.label}
          </Tag>
        ))}
      </Space>

      {/* Inputs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {bases.map(({ base, label, prefix, color }) => (
          <Col xs={24} sm={12} key={base}>
            <Card style={cardStyle}>
              <div style={{ marginBottom: 8 }}>
                <Tag color={color === '#50C878' ? 'success' : color === '#faad14' ? 'warning' : color === '#1677ff' ? 'processing' : 'error'}>
                  Base {base}
                </Tag>
                <Text style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>{label}</Text>
              </div>
              <Space.Compact style={{ width: '100%' }}>
                {prefix && <span style={{ background: '#333', border: `1px solid ${dark.border}`, borderRight: 'none', padding: '4px 8px', color: '#888', fontFamily: 'monospace', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center' }}>{prefix}</span>}
                <Input
                  value={values[base]}
                  onChange={e => updateFrom(e.target.value.toUpperCase(), base)}
                  style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color, fontFamily: 'monospace', fontSize: 16, fontWeight: 600 }}
                  placeholder={base === 10 ? '0-9' : base === 2 ? '0-1' : base === 8 ? '0-7' : '0-9, A-F'}
                />
                <button
                  onClick={() => copy((prefix || '') + values[base])}
                  style={{ background: '#333', border: `1px solid ${dark.border}`, borderLeft: 'none', padding: '4px 10px', color: '#888', cursor: 'pointer', borderRadius: '0 6px 6px 0' }}
                >
                  <CopyOutlined />
                </button>
              </Space.Compact>
              {errors[base] && <Text style={{ color: '#ff4d4f', fontSize: 12 }}>{errors[base]}</Text>}
              {base === 2 && values[2] && !errors[2] && (
                <Text style={{ color: '#555', fontSize: 11, fontFamily: 'monospace', display: 'block', marginTop: 4 }}>
                  {formatBinary(values[2])}
                </Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Bit representation */}
      {n !== null && (
        <>
          <Divider style={{ borderColor: dark.border }} />
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Biểu diễn theo số bit</Text>}>
            <Table
              dataSource={bitTable}
              columns={[
                { title: 'Loại', dataIndex: 'bits', key: 'bits', render: (v: string) => <Tag>{v}</Tag> },
                { title: 'Signed', dataIndex: 'signed', key: 'signed', render: (v: string) => <Text style={{ color: v === 'Overflow' ? '#ff4d4f' : dark.primary, fontFamily: 'monospace' }}>{v}</Text> },
                { title: 'Unsigned', dataIndex: 'unsigned', key: 'unsigned', render: (v: string) => <Text style={{ color: v === 'Overflow' ? '#ff4d4f' : dark.text, fontFamily: 'monospace' }}>{v}</Text> },
                { title: 'HEX', dataIndex: 'hex', key: 'hex', render: (v: string) => <Text style={{ color: '#ff4d4f', fontFamily: 'monospace' }}>{v}</Text> },
              ]}
              pagination={false}
              size="small"
            />
          </Card>

          {/* Visual binary */}
          <Card style={{ ...cardStyle, marginTop: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Biểu diễn nhị phân 8-bit</Text>}>
            <Space wrap>
              {toBase(n % 256, 2).padStart(8, '0').split('').map((bit, i) => (
                <div key={i} style={{
                  width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bit === '1' ? dark.primary : '#2a2a2a',
                  border: `1px solid ${bit === '1' ? dark.primary : dark.border}`,
                  color: bit === '1' ? '#000' : '#555', fontFamily: 'monospace', fontWeight: 700, fontSize: 18,
                }}>
                  {bit}
                </div>
              ))}
              <Text style={{ color: '#555', fontSize: 11 }}>Bit 7 → Bit 0</Text>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}
