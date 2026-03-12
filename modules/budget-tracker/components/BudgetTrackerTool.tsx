'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Select, InputNumber, Row, Col, Table, Progress, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface Transaction { id: string; type: 'income' | 'expense'; amount: number; category: string; note: string; date: string }

const INCOME_CATS = ['Lương', 'Freelance', 'Đầu tư', 'Thưởng', 'Khác'];
const EXPENSE_CATS = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Giải trí', 'Mua sắm', 'Y tế', 'Giáo dục', 'Khác'];

function fmt(n: number) { return n.toLocaleString('vi-VN') + '₫'; }

function load(): Transaction[] {
  try { return JSON.parse(localStorage.getItem('toolhub_budget') || '[]'); }
  catch { return []; }
}
function save(t: Transaction[]) { localStorage.setItem('toolhub_budget', JSON.stringify(t)); }

let nid = Date.now();

export default function BudgetTrackerTool() {
  const [txns, setTxns] = useState<Transaction[]>(() => load());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: 'expense' as 'income' | 'expense', amount: 0, category: 'Ăn uống', note: '', date: new Date().toISOString().slice(0, 10) });
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const update = useCallback((t: Transaction[]) => { setTxns(t); save(t); }, []);

  const filtered = useMemo(() => txns.filter(t => t.date.startsWith(filterMonth)), [txns, filterMonth]);

  const income = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [filtered]);
  const expense = useMemo(() => filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance = income - expense;

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const addTxn = () => {
    if (!form.amount) { message.warning('Nhập số tiền!'); return; }
    const t: Transaction = { id: String(nid++), ...form };
    update([t, ...txns]);
    setModal(false);
    message.success('Đã thêm giao dịch!');
  };

  const deleteTxn = (id: string) => update(txns.filter(t => t.id !== id));

  const months = useMemo(() => {
    const set = new Set(txns.map(t => t.date.slice(0, 7)));
    set.add(new Date().toISOString().slice(0, 7));
    return [...set].sort().reverse();
  }, [txns]);

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  const columns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', width: 100, render: (v: string) => <Text style={{ color: '#888', fontSize: 12 }}>{v}</Text> },
    { title: 'Loại', dataIndex: 'type', key: 'type', width: 80, render: (v: string) => (
      <Tag color={v === 'income' ? 'success' : 'error'}>{v === 'income' ? 'Thu' : 'Chi'}</Tag>
    )},
    { title: 'Danh mục', dataIndex: 'category', key: 'category', render: (v: string) => <Tag style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}>{v}</Tag> },
    { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (v: number, r: Transaction) => (
      <Text style={{ color: r.type === 'income' ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
        {r.type === 'income' ? '+' : '-'}{fmt(v)}
      </Text>
    )},
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: (v: string) => <Text style={{ color: '#888', fontSize: 12 }}>{v}</Text> },
    { title: '', key: 'del', width: 40, render: (_: unknown, r: Transaction) => (
      <Button size="small" icon={<DeleteOutlined />} danger type="text" onClick={() => deleteTxn(r.id)} />
    )},
  ];

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <WalletOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Budget Tracker
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Theo dõi thu chi theo tháng, phân tích theo danh mục
      </Text>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Text style={{ color: '#888' }}>Tháng:</Text>
          <Select value={filterMonth} onChange={setFilterMonth} style={{ width: 140 }} dropdownStyle={{ background: '#1e1e1e' }}>
            {months.map(m => <Option key={m} value={m}>{m}</Option>)}
          </Select>
        </Space>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => setModal(true)}
          style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
          Thêm giao dịch
        </Button>
      </div>

      {/* Summary */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: 'Thu nhập', value: income, color: '#52c41a', icon: <ArrowUpOutlined /> },
          { label: 'Chi tiêu', value: expense, color: '#ff4d4f', icon: <ArrowDownOutlined /> },
          { label: 'Số dư', value: balance, color: balance >= 0 ? '#52c41a' : '#ff4d4f', icon: <WalletOutlined /> },
        ].map(s => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ ...cardStyle, textAlign: 'center' }}>
              <Text style={{ color: '#888', display: 'block' }}>{s.label}</Text>
              <Text style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.icon} {fmt(Math.abs(s.value))}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        {/* Category breakdown */}
        {byCat.length > 0 && (
          <Col xs={24} md={8}>
            <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Chi tiêu theo danh mục</Text>}>
              {byCat.map(([cat, amt]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ color: dark.text }}>{cat}</Text>
                    <Text style={{ color: '#ff4d4f' }}>{fmt(amt)}</Text>
                  </div>
                  <Progress
                    percent={Math.round(amt / expense * 100)}
                    showInfo={false}
                    strokeColor="#ff4d4f"
                    trailColor="#2a2a2a"
                    size="small"
                  />
                </div>
              ))}
            </Card>
          </Col>
        )}

        {/* Transactions */}
        <Col xs={24} md={byCat.length > 0 ? 16 : 24}>
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Giao dịch ({filtered.length})</Text>}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text style={{ color: '#555' }}>Chưa có giao dịch nào trong tháng này</Text>
              </div>
            ) : (
              <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10, size: 'small' }} size="small" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        open={modal}
        title={<Text style={{ color: '#e0e0e0' }}>Thêm giao dịch</Text>}
        onCancel={() => setModal(false)}
        onOk={addTxn}
        okText="Thêm"
        cancelText="Hủy"
        styles={{ content: { background: dark.card }, header: { background: dark.card }, footer: { background: dark.card } }}
      >
        <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Loại</Text>
            <Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v, category: v === 'income' ? 'Lương' : 'Ăn uống' }))} style={{ width: '100%' }} dropdownStyle={{ background: '#1e1e1e' }}>
              <Option value="income">Thu nhập</Option>
              <Option value="expense">Chi tiêu</Option>
            </Select>
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Số tiền (VNĐ) *</Text>
            <InputNumber value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v || 0 }))} min={0}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              style={{ width: '100%', background: '#2a2a2a', border: `1px solid ${dark.border}` }} />
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Danh mục</Text>
            <Select value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} style={{ width: '100%' }} dropdownStyle={{ background: '#1e1e1e' }}>
              {(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Ngày</Text>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Ghi chú</Text>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
