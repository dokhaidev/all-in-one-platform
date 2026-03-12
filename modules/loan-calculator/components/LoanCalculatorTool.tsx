'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, Table, Tag, Collapse } from 'antd';
import {
  BankOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type InterestType = 'fixed' | 'reducing';
type TermUnit = 'months' | 'years';

interface AmortizationRow {
  month: number;
  openingBalance: number;
  principal: number;
  interest: number;
  payment: number;
  closingBalance: number;
}

interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalMonths: number;
  schedule: AmortizationRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatVNDCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} tỷ ₫`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} triệu ₫`;
  }
  return formatVND(value);
}

function calcFixed(principal: number, annualRate: number, months: number): LoanResult {
  const r = annualRate / 12 / 100;
  let monthlyPayment: number;

  if (r === 0) {
    monthlyPayment = principal / months;
  } else {
    monthlyPayment = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  }

  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principalPayment = monthlyPayment - interest;
    const closing = Math.max(0, balance - principalPayment);

    schedule.push({
      month: i,
      openingBalance: balance,
      principal: principalPayment,
      interest,
      payment: monthlyPayment,
      closingBalance: closing,
    });

    balance = closing;
  }

  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment,
    totalPayment,
    totalInterest: totalPayment - principal,
    totalMonths: months,
    schedule,
  };
}

function calcReducing(principal: number, annualRate: number, months: number): LoanResult {
  const r = annualRate / 12 / 100;
  const principalPayment = principal / months;
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;

  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const payment = principalPayment + interest;
    const closing = Math.max(0, balance - principalPayment);

    schedule.push({
      month: i,
      openingBalance: balance,
      principal: principalPayment,
      interest,
      payment,
      closingBalance: closing,
    });

    totalInterest += interest;
    balance = closing;
  }

  const firstPayment = schedule[0]?.payment ?? 0;
  return {
    monthlyPayment: firstPayment,
    totalPayment: principal + totalInterest,
    totalInterest,
    totalMonths: months,
    schedule,
  };
}

// ─── CSS Pie Chart ─────────────────────────────────────────────────────────

interface PieChartProps {
  principal: number;
  interest: number;
  isDark: boolean;
}

function CssPieChart({ principal, interest, isDark }: PieChartProps) {
  const total = principal + interest;
  if (total === 0) return null;

  const principalPct = (principal / total) * 100;
  const interestPct = 100 - principalPct;

  const principalAngle = (principalPct / 100) * 360;

  const gradient = `conic-gradient(
    #50C878 0deg ${principalAngle}deg,
    #f59e0b ${principalAngle}deg 360deg
  )`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Pie */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: gradient,
          position: 'relative',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {/* Donut hole */}
        <div
          style={{
            position: 'absolute',
            inset: 30,
            borderRadius: '50%',
            background: isDark ? '#222' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: isDark ? '#888' : '#999', fontWeight: 600, textAlign: 'center' }}>
            {principalPct.toFixed(0)}%<br />
            <span style={{ fontSize: 9, fontWeight: 400 }}>gốc</span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#50C878', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: isDark ? '#aaa' : '#666', flex: 1 }}>Tiền gốc</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#50C878' }}>{principalPct.toFixed(1)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: isDark ? '#aaa' : '#666', flex: 1 }}>Tiền lãi</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{interestPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  color: string;
  isDark: boolean;
  sub?: string;
}

function SummaryCard({ label, value, color, isDark, sub }: SummaryCardProps) {
  return (
    <div
      style={{
        background: isDark ? '#1a1a1a' : '#f5f5f5',
        border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 11, color: isDark ? '#777' : '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: isDark ? '#555' : '#bbb', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoanCalculatorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme tokens
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';

  // Form state
  const [principal, setPrincipal] = useState<string>('500000000');
  const [annualRate, setAnnualRate] = useState<string>('8');
  const [term, setTerm] = useState<string>('12');
  const [termUnit, setTermUnit] = useState<TermUnit>('months');
  const [interestType, setInterestType] = useState<InterestType>('fixed');
  const [showAll, setShowAll] = useState(false);

  // Computed
  const result = useMemo<LoanResult | null>(() => {
    const p = parseFloat(principal.replace(/[^0-9.]/g, ''));
    const r = parseFloat(annualRate);
    const t = parseFloat(term);
    if (!p || !r || !t || p <= 0 || r <= 0 || t <= 0) return null;

    const months = termUnit === 'years' ? Math.round(t * 12) : Math.round(t);
    if (months <= 0 || months > 600) return null;

    return interestType === 'fixed'
      ? calcFixed(p, r, months)
      : calcReducing(p, r, months);
  }, [principal, annualRate, term, termUnit, interestType]);

  const principalNum = parseFloat(principal.replace(/[^0-9.]/g, '')) || 0;

  const handleReset = () => {
    setPrincipal('500000000');
    setAnnualRate('8');
    setTerm('12');
    setTermUnit('months');
    setInterestType('fixed');
    setShowAll(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    color: textColor,
    outline: 'none',
    colorScheme: isDark ? 'dark' : 'light',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: subColor,
    marginBottom: 6,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '9px 12px',
    border: active ? '2px solid #50C878' : `1px solid ${inputBorder}`,
    borderRadius: 8,
    background: active
      ? isDark ? 'rgba(80,200,120,0.1)' : 'rgba(80,200,120,0.06)'
      : inputBg,
    color: active ? '#50C878' : subColor,
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.18s',
    textAlign: 'center',
  });

  // Table columns
  const displayedSchedule = result
    ? showAll
      ? result.schedule
      : result.schedule.slice(0, 12)
    : [];

  const columns = [
    {
      title: 'Tháng',
      dataIndex: 'month',
      key: 'month',
      width: 60,
      render: (v: number) => (
        <span style={{ color: subColor, fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'Số dư đầu kỳ',
      dataIndex: 'openingBalance',
      key: 'openingBalance',
      render: (v: number) => (
        <span style={{ fontSize: 12 }}>{formatVNDCompact(v)}</span>
      ),
    },
    {
      title: 'Tiền gốc',
      dataIndex: 'principal',
      key: 'principal',
      render: (v: number) => (
        <span style={{ color: '#50C878', fontSize: 12, fontWeight: 600 }}>{formatVNDCompact(v)}</span>
      ),
    },
    {
      title: 'Tiền lãi',
      dataIndex: 'interest',
      key: 'interest',
      render: (v: number) => (
        <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>{formatVNDCompact(v)}</span>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment',
      key: 'payment',
      render: (v: number) => (
        <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>{formatVNDCompact(v)}</span>
      ),
    },
    {
      title: 'Số dư cuối kỳ',
      dataIndex: 'closingBalance',
      key: 'closingBalance',
      render: (v: number) => (
        <span style={{ fontSize: 12 }}>{formatVNDCompact(v)}</span>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 24 }}>

        {/* ── Left panel: Inputs ── */}
        <div
          style={{
            flex: '0 0 340px',
            minWidth: 280,
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '24px 24px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BankOutlined style={{ fontSize: 18, color: '#50C878' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Thông tin khoản vay</span>
          </div>

          {/* Principal */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Số tiền vay (VND)</label>
            <input
              type="number"
              min={0}
              placeholder="VD: 500000000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              style={inputStyle}
            />
            {principalNum > 0 && (
              <span style={{ fontSize: 11, color: '#50C878', marginTop: 4, display: 'block' }}>
                = {formatVNDCompact(principalNum)}
              </span>
            )}
          </div>

          {/* Annual Rate */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Lãi suất (%/năm)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="VD: 8"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Term */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Thời hạn vay</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min={1}
                max={600}
                placeholder="VD: 12"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  style={toggleBtnStyle(termUnit === 'months')}
                  onClick={() => setTermUnit('months')}
                >
                  Tháng
                </button>
                <button
                  style={toggleBtnStyle(termUnit === 'years')}
                  onClick={() => setTermUnit('years')}
                >
                  Năm
                </button>
              </div>
            </div>
          </div>

          {/* Interest Type */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Loại lãi suất</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={toggleBtnStyle(interestType === 'fixed')}
                onClick={() => setInterestType('fixed')}
              >
                Cố định
              </button>
              <button
                style={toggleBtnStyle(interestType === 'reducing')}
                onClick={() => setInterestType('reducing')}
              >
                Giảm dần
              </button>
            </div>
            <p style={{ fontSize: 11, color: isDark ? '#555' : '#bbb', marginTop: 8, lineHeight: 1.5 }}>
              {interestType === 'fixed'
                ? 'Lãi suất cố định: khoản trả hàng tháng bằng nhau trong suốt kỳ hạn.'
                : 'Lãi suất giảm dần: tiền gốc bằng nhau, lãi giảm theo số dư.'}
            </p>
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '9px 0',
              background: 'transparent',
              border: `1px solid ${inputBorder}`,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: subColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#50C878';
              (e.currentTarget as HTMLButtonElement).style.color = '#50C878';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = inputBorder;
              (e.currentTarget as HTMLButtonElement).style.color = subColor;
            }}
          >
            <ReloadOutlined />
            Tính lại
          </button>
        </div>

        {/* ── Right panel: Results ── */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {!result ? (
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 14,
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: subColor,
                textAlign: 'center',
              }}
            >
              <CalculatorOutlined style={{ fontSize: 40, color: isDark ? '#333' : '#ccc' }} />
              <p style={{ margin: 0, fontSize: 14 }}>Nhập thông tin khoản vay để xem kết quả.</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: 14,
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <CalculatorOutlined style={{ fontSize: 18, color: '#50C878' }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Kết quả tính toán</span>
                </div>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Cards grid */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <SummaryCard
                        label="Số tiền vay"
                        value={formatVNDCompact(principalNum)}
                        color="#3b82f6"
                        isDark={isDark}
                      />
                      <SummaryCard
                        label="Tổng tiền lãi"
                        value={formatVNDCompact(result.totalInterest)}
                        color="#f59e0b"
                        isDark={isDark}
                      />
                      <SummaryCard
                        label="Tổng phải trả"
                        value={formatVNDCompact(result.totalPayment)}
                        color="#ef4444"
                        isDark={isDark}
                      />
                      <SummaryCard
                        label="Kỳ hạn"
                        value={`${result.totalMonths} tháng`}
                        color="#8b5cf6"
                        isDark={isDark}
                        sub={result.totalMonths >= 12 ? `(${(result.totalMonths / 12).toFixed(1)} năm)` : undefined}
                      />
                    </div>

                    {/* Monthly payment highlight */}
                    <div
                      style={{
                        background: isDark ? 'rgba(80,200,120,0.08)' : 'rgba(80,200,120,0.06)',
                        border: '1.5px solid rgba(80,200,120,0.3)',
                        borderRadius: 10,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: '#50C878', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {interestType === 'fixed' ? 'Trả hàng tháng' : 'Tháng 1 trả'}
                        </div>
                        <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                          {interestType === 'reducing' ? 'Giảm dần theo dư nợ' : 'Cố định mỗi kỳ'}
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#50C878' }}>
                        {formatVNDCompact(result.monthlyPayment)}
                      </div>
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div
                    style={{
                      width: 160,
                      padding: '8px 0',
                      flexShrink: 0,
                    }}
                  >
                    <CssPieChart principal={principalNum} interest={result.totalInterest} isDark={isDark} />
                  </div>
                </div>
              </div>

              {/* Amortization table */}
              <div
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: 14,
                  padding: '24px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InfoCircleOutlined style={{ color: '#50C878' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                      Lịch trả góp
                    </span>
                    <Tag color="default" style={{ fontSize: 11 }}>
                      {result.totalMonths} kỳ
                    </Tag>
                  </div>
                  {result.totalMonths > 12 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${isDark ? '#333' : '#d9d9d9'}`,
                        borderRadius: 6,
                        padding: '4px 12px',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: '#50C878',
                        fontWeight: 600,
                      }}
                    >
                      {showAll ? 'Thu gọn' : `Xem tất cả ${result.totalMonths} tháng`}
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <Table
                    dataSource={displayedSchedule.map((row) => ({ ...row, key: row.month }))}
                    columns={columns}
                    pagination={false}
                    size="small"
                    style={{ fontSize: 12 }}
                  />
                </div>

                {!showAll && result.totalMonths > 12 && (
                  <p style={{ textAlign: 'center', color: subColor, fontSize: 12, marginTop: 12 }}>
                    Hiển thị 12/{result.totalMonths} kỳ đầu tiên
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Formula info ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          padding: '20px 24px',
        }}
      >
        <Collapse
          ghost
          items={[
            {
              key: '1',
              label: (
                <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
                  Công thức tính lãi vay
                </span>
              ),
              children: (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#50C878', margin: '0 0 6px' }}>Lãi suất cố định (Equal Payment)</p>
                    <div style={{
                      background: isDark ? '#141414' : '#f5f5f5',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: textColor,
                      lineHeight: 1.8,
                    }}>
                      M = P × [r(1+r)^n] / [(1+r)^n - 1]
                    </div>
                    <ul style={{ fontSize: 12, color: subColor, marginTop: 8, lineHeight: 2, paddingLeft: 20 }}>
                      <li>M = Khoản thanh toán hàng tháng</li>
                      <li>P = Số tiền vay ban đầu</li>
                      <li>r = Lãi suất tháng = Lãi suất năm / 12 / 100</li>
                      <li>n = Số kỳ (tháng)</li>
                    </ul>
                  </div>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', margin: '0 0 6px' }}>Lãi suất giảm dần (Reducing Balance)</p>
                    <div style={{
                      background: isDark ? '#141414' : '#f5f5f5',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: textColor,
                      lineHeight: 1.8,
                    }}>
                      Gốc = P / n (hằng số)<br />
                      Lãi = Dư nợ × r<br />
                      Thanh toán = Gốc + Lãi
                    </div>
                    <ul style={{ fontSize: 12, color: subColor, marginTop: 8, lineHeight: 2, paddingLeft: 20 }}>
                      <li>Tiền gốc trả đều mỗi kỳ</li>
                      <li>Lãi giảm dần theo dư nợ còn lại</li>
                      <li>Tổng trả ít hơn lãi suất cố định</li>
                    </ul>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
