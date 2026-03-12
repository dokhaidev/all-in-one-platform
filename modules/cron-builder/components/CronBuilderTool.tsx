'use client';

import React, { useState, useMemo } from 'react';
import { Card, Input, Typography, Space, Tag, Row, Col, Select, Button, Table, message } from 'antd';
import { ScheduleOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

const PRESETS = [
  { label: 'Mỗi phút', cron: '* * * * *' },
  { label: 'Mỗi 5 phút', cron: '*/5 * * * *' },
  { label: 'Mỗi 15 phút', cron: '*/15 * * * *' },
  { label: 'Mỗi 30 phút', cron: '*/30 * * * *' },
  { label: 'Mỗi giờ', cron: '0 * * * *' },
  { label: 'Mỗi 2 giờ', cron: '0 */2 * * *' },
  { label: 'Hàng ngày lúc 00:00', cron: '0 0 * * *' },
  { label: 'Hàng ngày lúc 08:00', cron: '0 8 * * *' },
  { label: 'Thứ 2-6 lúc 09:00', cron: '0 9 * * 1-5' },
  { label: 'Mỗi tuần (Chủ nhật)', cron: '0 0 * * 0' },
  { label: 'Đầu tháng', cron: '0 0 1 * *' },
  { label: 'Hàng năm (1/1)', cron: '0 0 1 1 *' },
];

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parsePart(part: string, min: number, max: number): number[] {
  const result: number[] = [];
  if (part === '*') {
    for (let i = min; i <= max; i++) result.push(i);
    return result;
  }
  for (const chunk of part.split(',')) {
    if (chunk.startsWith('*/')) {
      const step = parseInt(chunk.slice(2));
      if (!isNaN(step)) for (let i = min; i <= max; i += step) result.push(i);
    } else if (chunk.includes('-')) {
      const [a, b] = chunk.split('-').map(Number);
      for (let i = a; i <= b; i++) result.push(i);
    } else if (chunk.includes('/')) {
      const [range, step] = chunk.split('/');
      const [a, b] = range.includes('-') ? range.split('-').map(Number) : [min, max];
      const s = parseInt(step);
      for (let i = a; i <= (b || max); i += s) result.push(i);
    } else {
      const n = parseInt(chunk);
      if (!isNaN(n)) result.push(n);
    }
  }
  return [...new Set(result)].sort((a, b) => a - b).filter(n => n >= min && n <= max);
}

function explainCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return 'Cron expression không hợp lệ (cần đúng 5 phần)';
  const [min, hour, dom, month, dow] = parts;

  let desc = 'Chạy ';

  // Time
  if (min === '*' && hour === '*') desc += 'mỗi phút';
  else if (min.startsWith('*/') && hour === '*') desc += `mỗi ${min.slice(2)} phút`;
  else if (hour === '*') desc += `phút ${min} của mỗi giờ`;
  else if (min === '0') desc += `lúc ${hour.padStart(2, '0')}:00`;
  else desc += `lúc ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;

  // Day of week
  if (dow !== '*') {
    const days = parsePart(dow, 0, 6).map(d => DAYS[d]);
    desc += `, các ngày ${days.join(', ')}`;
  }

  // Day of month
  if (dom !== '*') {
    if (dom === '1') desc += ', ngày 1 hàng tháng';
    else desc += `, ngày ${dom} hàng tháng`;
  }

  // Month
  if (month !== '*') {
    const months = parsePart(month, 1, 12).map(m => MONTHS[m - 1]);
    desc += `, tháng ${months.join(', ')}`;
  }

  return desc;
}

function getNextRuns(cron: string, count = 5): Date[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const [min, hour, dom, month, dow] = parts;

  try {
    const mins = parsePart(min, 0, 59);
    const hours = parsePart(hour, 0, 23);
    const doms = parsePart(dom, 1, 31);
    const months = parsePart(month, 1, 12);
    const dows = parsePart(dow, 0, 6);

    const results: Date[] = [];
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);

    let iterations = 0;
    while (results.length < count && iterations < 100000) {
      iterations++;
      const mOk = months.includes(d.getMonth() + 1);
      const domOk = doms.includes(d.getDate());
      const dowOk = dows.includes(d.getDay());
      const hOk = hours.includes(d.getHours());
      const minOk = mins.includes(d.getMinutes());

      if (mOk && (dom === '*' ? dowOk : domOk) && hOk && minOk) {
        results.push(new Date(d));
      }
      d.setMinutes(d.getMinutes() + 1);
    }
    return results;
  } catch {
    return [];
  }
}

export default function CronBuilderTool() {
  const [cronExpr, setCronExpr] = useState('0 8 * * 1-5');

  const explanation = useMemo(() => explainCron(cronExpr), [cronExpr]);
  const nextRuns = useMemo(() => getNextRuns(cronExpr), [cronExpr]);

  const parts = cronExpr.trim().split(/\s+/);
  const isValid = parts.length === 5;

  const copy = () => { navigator.clipboard.writeText(cronExpr); message.success('Đã copy!'); };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const inputStyle = { background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.primary, fontFamily: 'monospace', fontSize: 20, fontWeight: 700 };

  const FIELD_DOCS = [
    { field: 'Phút', range: '0-59', examples: ['*', '*/5', '0,30', '15'] },
    { field: 'Giờ', range: '0-23', examples: ['*', '*/2', '8-18', '0'] },
    { field: 'Ngày (tháng)', range: '1-31', examples: ['*', '1', '1,15', 'L'] },
    { field: 'Tháng', range: '1-12', examples: ['*', '1-6', '*/3', '12'] },
    { field: 'Ngày (tuần)', range: '0-7 (0=CN)', examples: ['*', '1-5', '0,6', '1'] },
  ];

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <ScheduleOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Cron Expression Builder
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Xây dựng và giải thích cron expression bằng tiếng Việt
      </Text>

      {/* Main input */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Input
            value={cronExpr}
            onChange={e => setCronExpr(e.target.value)}
            style={inputStyle}
            placeholder="* * * * *"
          />
          <Button icon={<CopyOutlined />} onClick={copy} style={{ border: `1px solid ${dark.border}`, background: '#333', color: dark.text }} />
        </Space.Compact>

        {/* Field labels */}
        <Row gutter={8} style={{ marginBottom: 8 }}>
          {['Phút', 'Giờ', 'Ngày/tháng', 'Tháng', 'Ngày/tuần'].map((label, i) => (
            <Col key={i} style={{ flex: 1, minWidth: 80 }}>
              <div style={{ background: '#2a2a2a', borderRadius: 4, padding: '4px 8px', textAlign: 'center' }}>
                <Text style={{ color: isValid ? dark.primary : '#666', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, display: 'block' }}>
                  {parts[i] || '?'}
                </Text>
                <Text style={{ color: '#666', fontSize: 11 }}>{label}</Text>
              </div>
            </Col>
          ))}
        </Row>

        {/* Explanation */}
        <div style={{ background: '#2a2a2a', borderRadius: 6, padding: '10px 14px' }}>
          <Text style={{ color: isValid ? '#e0e0e0' : '#ff4d4f', fontSize: 15 }}>
            {explanation}
          </Text>
        </div>
      </Card>

      <Row gutter={16}>
        {/* Presets */}
        <Col xs={24} md={12}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Presets thông dụng</Text>}>
            <Space wrap>
              {PRESETS.map(p => (
                <Tag key={p.cron}
                  style={{ cursor: 'pointer', background: cronExpr === p.cron ? dark.primary : '#2a2a2a', border: `1px solid ${cronExpr === p.cron ? dark.primary : dark.border}`, color: cronExpr === p.cron ? '#000' : dark.text, marginBottom: 4 }}
                  onClick={() => setCronExpr(p.cron)}>
                  <span style={{ fontFamily: 'monospace', marginRight: 6 }}>{p.cron}</span>
                  <span style={{ fontSize: 11 }}>{p.label}</span>
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Next runs */}
        <Col xs={24} md={12}>
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>5 lần chạy tiếp theo</Text>}>
            {nextRuns.length > 0 ? nextRuns.map((d, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: i < 4 ? `1px solid ${dark.border}` : 'none' }}>
                <Text style={{ color: i === 0 ? dark.primary : dark.text, fontFamily: 'monospace' }}>
                  {d.toLocaleString('vi-VN')}
                </Text>
              </div>
            )) : <Text style={{ color: '#888' }}>Cron expression không hợp lệ</Text>}
          </Card>
        </Col>
      </Row>

      {/* Syntax reference */}
      <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Cú pháp & ví dụ</Text>}>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Table
              dataSource={FIELD_DOCS.map((r, i) => ({ ...r, key: i }))}
              columns={[
                { title: 'Trường', dataIndex: 'field', key: 'field', render: (v: string) => <Tag color="blue">{v}</Tag> },
                { title: 'Phạm vi', dataIndex: 'range', key: 'range', render: (v: string) => <Text style={{ color: '#888', fontFamily: 'monospace' }}>{v}</Text> },
                { title: 'Ví dụ', dataIndex: 'examples', key: 'examples', render: (v: string[]) => <Space wrap>{v.map(e => <Tag key={e} style={{ fontFamily: 'monospace', background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}>{e}</Tag>)}</Space> },
              ]}
              pagination={false}
              size="small"
            />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ padding: 12, background: '#2a2a2a', borderRadius: 6 }}>
              {[
                { sym: '*', desc: 'Mọi giá trị' },
                { sym: '*/n', desc: 'Mỗi n đơn vị' },
                { sym: 'a-b', desc: 'Từ a đến b' },
                { sym: 'a,b,c', desc: 'Các giá trị cụ thể' },
                { sym: 'a-b/n', desc: 'Từ a đến b, bước n' },
              ].map(s => (
                <div key={s.sym} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                  <Text style={{ color: dark.primary, fontFamily: 'monospace', width: 60, flexShrink: 0 }}>{s.sym}</Text>
                  <Text style={{ color: dark.text }}>{s.desc}</Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
