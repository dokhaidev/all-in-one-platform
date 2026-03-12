'use client';

import React, { useState, useRef } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Row, Col, Table, InputNumber, Divider, message } from 'antd';
import { ProfileOutlined, PlusOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface LineItem { id: number; desc: string; qty: number; price: number }
interface InvoiceData {
  invoiceNo: string; date: string; dueDate: string;
  fromName: string; fromAddress: string; fromEmail: string; fromPhone: string;
  toName: string; toAddress: string; toEmail: string; toPhone: string;
  items: LineItem[]; taxRate: number; note: string;
}

let nid = 3;

function fmt(n: number) { return n.toLocaleString('vi-VN') + '₫'; }

export default function InvoiceGeneratorTool() {
  const printRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<InvoiceData>({
    invoiceNo: `INV-${new Date().getFullYear()}-001`,
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    fromName: 'Công ty ABC', fromAddress: '123 Nguyễn Văn Linh, Q7, TP.HCM', fromEmail: 'info@abc.com', fromPhone: '0901234567',
    toName: 'Khách hàng XYZ', toAddress: '456 Lê Văn Việt, Q9, TP.HCM', toEmail: 'khachhang@xyz.com', toPhone: '0987654321',
    items: [
      { id: 1, desc: 'Thiết kế website', qty: 1, price: 5000000 },
      { id: 2, desc: 'Hosting 1 năm', qty: 1, price: 1200000 },
    ],
    taxRate: 10,
    note: 'Vui lòng thanh toán trong vòng 30 ngày.\nChuyển khoản: MB Bank - 012345678 - NGUYEN VAN A',
  });

  const set = (field: keyof InvoiceData, val: unknown) => setData(d => ({ ...d, [field]: val }));
  const setItem = (id: number, field: keyof LineItem, val: unknown) =>
    setData(d => ({ ...d, items: d.items.map(it => it.id === id ? { ...it, [field]: val } : it) }));
  const addItem = () => setData(d => ({ ...d, items: [...d.items, { id: nid++, desc: '', qty: 1, price: 0 }] }));
  const removeItem = (id: number) => setData(d => ({ ...d, items: d.items.filter(it => it.id !== id) }));

  const subtotal = data.items.reduce((s, it) => s + it.qty * it.price, 0);
  const tax = subtotal * data.taxRate / 100;
  const total = subtotal + tax;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${data.invoiceNo}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}th{background:#f5f5f5}.total{font-size:18px;font-weight:bold}.primary{color:#50C878}.text-right{text-align:right}</style>
    </head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const inputStyle = { background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
            <ProfileOutlined style={{ color: dark.primary, marginRight: 8 }} />
            Invoice Generator
          </Title>
          <Text style={{ color: '#888' }}>Tạo hóa đơn chuyên nghiệp, in hoặc xuất PDF</Text>
        </div>
        <Button icon={<PrinterOutlined />} type="primary" onClick={handlePrint}
          style={{ background: dark.primary, borderColor: dark.primary, color: '#000', fontWeight: 600 }}>
          In / Xuất PDF
        </Button>
      </div>

      <Row gutter={16}>
        {/* Form */}
        <Col xs={24} md={12}>
          {/* Invoice info */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Thông tin hóa đơn</Text>}>
            <Row gutter={8}>
              <Col span={12}>
                <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Số hóa đơn</Text>
                <Input value={data.invoiceNo} onChange={e => set('invoiceNo', e.target.value)} style={inputStyle} />
              </Col>
              <Col span={6}>
                <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Ngày tạo</Text>
                <Input type="date" value={data.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
              </Col>
              <Col span={6}>
                <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Hạn TT</Text>
                <Input type="date" value={data.dueDate} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
              </Col>
            </Row>
          </Card>

          {/* From */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Người bán / Công ty</Text>}>
            {(['fromName', 'fromAddress', 'fromEmail', 'fromPhone'] as const).map((field, i) => {
              const labels = ['Tên', 'Địa chỉ', 'Email', 'SĐT'];
              return (
                <Row gutter={8} key={field} style={{ marginBottom: 8 }}>
                  <Col span={6}><Text style={{ color: '#888', fontSize: 12 }}>{labels[i]}</Text></Col>
                  <Col span={18}><Input value={data[field]} onChange={e => set(field, e.target.value)} style={inputStyle} /></Col>
                </Row>
              );
            })}
          </Card>

          {/* To */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Người mua / Khách hàng</Text>}>
            {(['toName', 'toAddress', 'toEmail', 'toPhone'] as const).map((field, i) => {
              const labels = ['Tên', 'Địa chỉ', 'Email', 'SĐT'];
              return (
                <Row gutter={8} key={field} style={{ marginBottom: 8 }}>
                  <Col span={6}><Text style={{ color: '#888', fontSize: 12 }}>{labels[i]}</Text></Col>
                  <Col span={18}><Input value={data[field]} onChange={e => set(field, e.target.value)} style={inputStyle} /></Col>
                </Row>
              );
            })}
          </Card>

          {/* Items */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Dịch vụ / Sản phẩm</Text>}>
            {data.items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <Input value={item.desc} onChange={e => setItem(item.id, 'desc', e.target.value)} placeholder="Mô tả" style={{ ...inputStyle, flex: 2 }} />
                <InputNumber value={item.qty} onChange={v => setItem(item.id, 'qty', v || 1)} min={1} style={{ width: 60, background: '#2a2a2a', border: `1px solid ${dark.border}` }} />
                <InputNumber value={item.price} onChange={v => setItem(item.id, 'price', v || 0)} min={0}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: 120, background: '#2a2a2a', border: `1px solid ${dark.border}` }} />
                <Button icon={<DeleteOutlined />} danger size="small" onClick={() => removeItem(item.id)} />
              </div>
            ))}
            <Button icon={<PlusOutlined />} onClick={addItem} size="small"
              style={{ border: `1px dashed ${dark.border}`, background: 'transparent', color: dark.text }}>
              Thêm dòng
            </Button>
            <Row gutter={8} style={{ marginTop: 12 }}>
              <Col span={12}><Text style={{ color: '#888', fontSize: 12 }}>Thuế VAT (%)</Text></Col>
              <Col span={12}><InputNumber value={data.taxRate} onChange={v => set('taxRate', v || 0)} min={0} max={100} style={{ width: '100%', background: '#2a2a2a', border: `1px solid ${dark.border}` }} /></Col>
            </Row>
          </Card>

          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Ghi chú</Text>}>
            <Input.TextArea rows={3} value={data.note} onChange={e => set('note', e.target.value)} style={inputStyle} />
          </Card>
        </Col>

        {/* Preview */}
        <Col xs={24} md={12}>
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Preview hóa đơn</Text>}>
            <div ref={printRef} style={{ background: '#fff', color: '#1a1a1a', padding: 32, borderRadius: 6, fontFamily: 'Arial, sans-serif' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#50C878' }}>HÓA ĐƠN</div>
                  <div style={{ color: '#888', fontSize: 14 }}>{data.invoiceNo}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div><strong>Ngày:</strong> {data.date}</div>
                  <div><strong>Hạn TT:</strong> {data.dueDate}</div>
                </div>
              </div>
              {/* Parties */}
              <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                {[['Người bán', data.fromName, data.fromAddress, data.fromEmail, data.fromPhone],
                  ['Người mua', data.toName, data.toAddress, data.toEmail, data.toPhone]].map(([label, name, addr, email, phone]) => (
                  <div key={label as string} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: 13, color: '#555' }}>{addr}</div>
                    <div style={{ fontSize: 13, color: '#555' }}>{email}</div>
                    <div style={{ fontSize: 13, color: '#555' }}>{phone}</div>
                  </div>
                ))}
              </div>
              {/* Items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {['Mô tả', 'SL', 'Đơn giá', 'Thành tiền'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Mô tả' ? 'left' : 'right', fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(it => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 10px', fontSize: 13 }}>{it.desc}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13 }}>{it.qty}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13 }}>{fmt(it.price)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13 }}>{fmt(it.qty * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <div style={{ width: 240 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span>Tạm tính:</span><span>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span>VAT ({data.taxRate}%):</span><span>{fmt(tax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid #50C878', marginTop: 4, color: '#50C878' }}>
                    <span>TỔNG CỘNG:</span><span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
              {data.note && (
                <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 6, fontSize: 12, color: '#555', whiteSpace: 'pre-wrap' }}>
                  {data.note}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
