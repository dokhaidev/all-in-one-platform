'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, message } from 'antd';
import {
  PercentageOutlined,
  CopyOutlined,
  HistoryOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: number;
  mode: string;
  expression: string;
  result: string;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let historyCounter = 0;

function formatNum(n: number): string {
  if (!isFinite(n)) return 'Không hợp lệ';
  if (Number.isInteger(n) || Math.abs(n) >= 1000) {
    return n.toLocaleString('vi-VN', { maximumFractionDigits: 4 });
  }
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
}

function now(): string {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Shared UI Atoms ──────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
  inputBg: string;
  inputBorder: string;
  textColor: string;
  subColor: string;
  isDark: boolean;
}

function InputField({ label, value, onChange, placeholder, unit, inputBg, inputBorder, textColor, subColor, isDark }: InputFieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 0 }}>
        <input
          type="number"
          placeholder={placeholder ?? '0'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius: unit ? '8px 0 0 8px' : 8,
            fontSize: 15,
            fontWeight: 600,
            color: textColor,
            outline: 'none',
            colorScheme: isDark ? 'dark' : 'light',
            boxSizing: 'border-box',
          }}
        />
        {unit && (
          <div style={{
            padding: '10px 14px',
            background: isDark ? '#1a1a1a' : '#f0f0f0',
            border: `1px solid ${inputBorder}`,
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            fontSize: 14,
            fontWeight: 700,
            color: subColor,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          }}>
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultDisplayProps {
  result: string | null;
  formula: string;
  color: string;
  isDark: boolean;
  onCopy: () => void;
}

function ResultDisplay({ result, formula, color, isDark, onCopy }: ResultDisplayProps) {
  return (
    <div style={{ marginTop: 20 }}>
      {/* Formula */}
      <div style={{
        background: isDark ? '#141414' : '#f5f5f5',
        border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontFamily: 'monospace',
        fontSize: 13,
        color: isDark ? '#888' : '#777',
        marginBottom: 12,
        lineHeight: 1.6,
      }}>
        {formula}
      </div>

      {/* Result */}
      <div style={{
        background: result
          ? isDark ? `rgba(80,200,120,0.08)` : `rgba(80,200,120,0.06)`
          : isDark ? '#181818' : '#f9f9f9',
        border: result ? '1.5px solid rgba(80,200,120,0.3)' : `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: isDark ? '#666' : '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Kết quả
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: result ? color : isDark ? '#333' : '#ccc', fontVariantNumeric: 'tabular-nums' }}>
            {result ?? '—'}
          </div>
        </div>
        {result && (
          <button
            onClick={onCopy}
            title="Sao chép kết quả"
            style={{
              background: 'transparent',
              border: `1px solid ${isDark ? '#333' : '#d9d9d9'}`,
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              color: isDark ? '#888' : '#aaa',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = color;
              (e.currentTarget as HTMLButtonElement).style.color = color;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? '#333' : '#d9d9d9';
              (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#888' : '#aaa';
            }}
          >
            <CopyOutlined />
            Sao chép
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: X% of Y ───────────────────────────────────────────────────────────

function Tab1({ addHistory, isDark, inputBg, inputBorder, textColor, subColor }: TabProps) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);
  const valid = !isNaN(xNum) && !isNaN(yNum);
  const result = valid ? (xNum / 100) * yNum : null;
  const resultStr = result !== null ? formatNum(result) : null;

  const handleCopy = () => {
    if (resultStr) {
      navigator.clipboard.writeText(resultStr);
      message.success('Đã sao chép!');
      addHistory({ mode: 'X% của Y', expression: `${xNum}% của ${yNum}`, result: resultStr });
    }
  };

  return (
    <div>
      <InputField label="X (%)" value={x} onChange={setX} placeholder="VD: 20" unit="%" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <InputField label="Y (Số gốc)" value={y} onChange={setY} placeholder="VD: 500" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <ResultDisplay
        result={resultStr}
        formula={valid ? `${xNum}% × ${yNum} = ${resultStr}` : 'Nhập X và Y để tính'}
        color="#50C878"
        isDark={isDark}
        onCopy={handleCopy}
      />
    </div>
  );
}

// ─── Tab 2: X is ?% of Y ─────────────────────────────────────────────────────

function Tab2({ addHistory, isDark, inputBg, inputBorder, textColor, subColor }: TabProps) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);
  const valid = !isNaN(xNum) && !isNaN(yNum) && yNum !== 0;
  const result = valid ? (xNum / yNum) * 100 : null;
  const resultStr = result !== null ? `${formatNum(result)}%` : null;

  const handleCopy = () => {
    if (resultStr) {
      navigator.clipboard.writeText(resultStr);
      message.success('Đã sao chép!');
      addHistory({ mode: 'X là ?% của Y', expression: `${xNum} là ?% của ${yNum}`, result: resultStr });
    }
  };

  return (
    <div>
      <InputField label="X (Giá trị)" value={x} onChange={setX} placeholder="VD: 100" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <InputField label="Y (Tổng)" value={y} onChange={setY} placeholder="VD: 500" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <ResultDisplay
        result={resultStr}
        formula={valid ? `(${xNum} ÷ ${yNum}) × 100 = ${resultStr}` : 'Nhập X và Y để tính'}
        color="#3b82f6"
        isDark={isDark}
        onCopy={handleCopy}
      />
    </div>
  );
}

// ─── Tab 3: Change % ─────────────────────────────────────────────────────────

function Tab3({ addHistory, isDark, inputBg, inputBorder, textColor, subColor }: TabProps) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);
  const valid = !isNaN(xNum) && !isNaN(yNum) && xNum !== 0;
  const pct = valid ? ((yNum - xNum) / Math.abs(xNum)) * 100 : null;
  const isIncrease = pct !== null && pct > 0;
  const resultStr = pct !== null ? `${pct > 0 ? '+' : ''}${formatNum(pct)}%` : null;

  const handleCopy = () => {
    if (resultStr) {
      navigator.clipboard.writeText(resultStr);
      message.success('Đã sao chép!');
      addHistory({ mode: 'Tỷ lệ thay đổi', expression: `${xNum} → ${yNum}`, result: resultStr });
    }
  };

  return (
    <div>
      <InputField label="Giá trị ban đầu (X)" value={x} onChange={setX} placeholder="VD: 100" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <InputField label="Giá trị mới (Y)" value={y} onChange={setY} placeholder="VD: 120" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <ResultDisplay
        result={resultStr ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isIncrease
              ? <ArrowUpOutlined style={{ color: '#50C878', fontSize: 20 }} />
              : <ArrowDownOutlined style={{ color: '#ef4444', fontSize: 20 }} />}
            <span>{resultStr}</span>
          </div>
        ) as unknown as string : null}
        formula={valid ? `((${yNum} - ${xNum}) ÷ |${xNum}|) × 100 = ${resultStr}` : 'Nhập X và Y để tính'}
        color={isIncrease ? '#50C878' : '#ef4444'}
        isDark={isDark}
        onCopy={handleCopy}
      />
    </div>
  );
}

// ─── Tab 4: Increase by % ─────────────────────────────────────────────────────

function Tab4({ addHistory, isDark, inputBg, inputBorder, textColor, subColor }: TabProps) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);
  const valid = !isNaN(xNum) && !isNaN(yNum);
  const result = valid ? xNum * (1 + yNum / 100) : null;
  const resultStr = result !== null ? formatNum(result) : null;

  const handleCopy = () => {
    if (resultStr) {
      navigator.clipboard.writeText(resultStr);
      message.success('Đã sao chép!');
      addHistory({ mode: 'Tăng thêm %', expression: `${xNum} tăng ${yNum}%`, result: resultStr });
    }
  };

  return (
    <div>
      <InputField label="Giá trị gốc (X)" value={x} onChange={setX} placeholder="VD: 100" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <InputField label="Tăng thêm Y%" value={y} onChange={setY} placeholder="VD: 20" unit="%" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <ResultDisplay
        result={resultStr}
        formula={valid ? `${xNum} × (1 + ${yNum}%) = ${resultStr}` : 'Nhập X và Y để tính'}
        color="#50C878"
        isDark={isDark}
        onCopy={handleCopy}
      />
    </div>
  );
}

// ─── Tab 5: Decrease by % ─────────────────────────────────────────────────────

function Tab5({ addHistory, isDark, inputBg, inputBorder, textColor, subColor }: TabProps) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);
  const valid = !isNaN(xNum) && !isNaN(yNum);
  const result = valid ? xNum * (1 - yNum / 100) : null;
  const resultStr = result !== null ? formatNum(result) : null;

  const handleCopy = () => {
    if (resultStr) {
      navigator.clipboard.writeText(resultStr);
      message.success('Đã sao chép!');
      addHistory({ mode: 'Giảm đi %', expression: `${xNum} giảm ${yNum}%`, result: resultStr });
    }
  };

  return (
    <div>
      <InputField label="Giá trị gốc (X)" value={x} onChange={setX} placeholder="VD: 100" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <InputField label="Giảm đi Y%" value={y} onChange={setY} placeholder="VD: 20" unit="%" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <ResultDisplay
        result={resultStr}
        formula={valid ? `${xNum} × (1 - ${yNum}%) = ${resultStr}` : 'Nhập X và Y để tính'}
        color="#ef4444"
        isDark={isDark}
        onCopy={handleCopy}
      />
    </div>
  );
}

// ─── Tab 6: Tax / Fee calculation ─────────────────────────────────────────────

function Tab6({ addHistory, isDark, inputBg, inputBorder, textColor, subColor }: TabProps) {
  const [z, setZ] = useState('');
  const [tax, setTax] = useState('10');

  const zNum = parseFloat(z);
  const taxNum = parseFloat(tax);
  const valid = !isNaN(zNum) && !isNaN(taxNum);
  const taxAmount = valid ? (zNum * taxNum) / 100 : null;
  const total = valid ? zNum + (taxAmount ?? 0) : null;
  const resultStr = total !== null ? formatNum(total) : null;

  const handleCopy = () => {
    if (resultStr) {
      navigator.clipboard.writeText(resultStr);
      message.success('Đã sao chép!');
      addHistory({ mode: 'Tính thuế/phí', expression: `${zNum} + ${taxNum}% thuế`, result: resultStr });
    }
  };

  return (
    <div>
      <InputField label="Giá trước thuế (Z)" value={z} onChange={setZ} placeholder="VD: 1000000" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />
      <InputField label="Thuế suất (%)" value={tax} onChange={setTax} placeholder="VD: 10" unit="%" {...{ inputBg, inputBorder, textColor, subColor, isDark }} />

      {valid && taxAmount !== null && total !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <div style={{
            background: isDark ? '#141414' : '#f5f5f5',
            border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
            borderRadius: 8,
            padding: '10px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: isDark ? '#888' : '#777', fontSize: 13 }}>Giá gốc</span>
              <span style={{ fontWeight: 700, color: textColor, fontSize: 13 }}>{formatNum(zNum)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: isDark ? '#888' : '#777', fontSize: 13 }}>Thuế/phí ({taxNum}%)</span>
              <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 13 }}>+ {formatNum(taxAmount)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#50C878', fontWeight: 700, fontSize: 13 }}>Tổng cộng</span>
              <span style={{ fontWeight: 800, color: '#50C878', fontSize: 16 }}>{resultStr}</span>
            </div>
          </div>
        </div>
      )}

      <ResultDisplay
        result={resultStr}
        formula={valid ? `${zNum} + (${zNum} × ${taxNum}%) = ${resultStr}` : 'Nhập giá và thuế suất'}
        color="#50C878"
        isDark={isDark}
        onCopy={handleCopy}
      />
    </div>
  );
}

// ─── Shared Tab Props ─────────────────────────────────────────────────────────

interface TabProps {
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  isDark: boolean;
  inputBg: string;
  inputBorder: string;
  textColor: string;
  subColor: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PercentageCalculatorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    historyCounter += 1;
    setHistory((prev) => [
      { ...entry, id: historyCounter, timestamp: now() },
      ...prev.slice(0, 9),
    ]);
  }, []);

  const tabProps: TabProps = { addHistory, isDark, inputBg, inputBorder, textColor, subColor };

  const tabItems = [
    {
      key: '1',
      label: 'X% của Y',
      children: (
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ fontSize: 12, color: subColor, marginBottom: 16, background: isDark ? '#141414' : '#f5f5f5', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
            Tính X% của Y là bao nhiêu. Ví dụ: 20% của 500 = 100
          </p>
          <Tab1 {...tabProps} />
        </div>
      ),
    },
    {
      key: '2',
      label: 'X là ?% của Y',
      children: (
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ fontSize: 12, color: subColor, marginBottom: 16, background: isDark ? '#141414' : '#f5f5f5', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
            X chiếm bao nhiêu % trong Y. Ví dụ: 100 là 20% của 500
          </p>
          <Tab2 {...tabProps} />
        </div>
      ),
    },
    {
      key: '3',
      label: 'Tỷ lệ thay đổi',
      children: (
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ fontSize: 12, color: subColor, marginBottom: 16, background: isDark ? '#141414' : '#f5f5f5', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
            Tính phần trăm tăng/giảm từ X đến Y. Ví dụ: 100 → 120 = +20%
          </p>
          <Tab3 {...tabProps} />
        </div>
      ),
    },
    {
      key: '4',
      label: 'Tăng thêm %',
      children: (
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ fontSize: 12, color: subColor, marginBottom: 16, background: isDark ? '#141414' : '#f5f5f5', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
            Tăng X thêm Y% được bao nhiêu. Ví dụ: 100 tăng 20% = 120
          </p>
          <Tab4 {...tabProps} />
        </div>
      ),
    },
    {
      key: '5',
      label: 'Giảm đi %',
      children: (
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ fontSize: 12, color: subColor, marginBottom: 16, background: isDark ? '#141414' : '#f5f5f5', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
            Giảm X đi Y% còn bao nhiêu. Ví dụ: 100 giảm 20% = 80
          </p>
          <Tab5 {...tabProps} />
        </div>
      ),
    },
    {
      key: '6',
      label: 'Tính thuế/phí',
      children: (
        <div style={{ padding: '20px 0 0' }}>
          <p style={{ fontSize: 12, color: subColor, marginBottom: 16, background: isDark ? '#141414' : '#f5f5f5', padding: '8px 12px', borderRadius: 6, lineHeight: 1.5 }}>
            Tính tổng số tiền sau khi cộng thuế hoặc phí. Ví dụ: 1.000.000 + 10% VAT = 1.100.000
          </p>
          <Tab6 {...tabProps} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ width: '100%', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* ── Calculator panel ── */}
      <div
        style={{
          flex: '1 1 420px',
          minWidth: 300,
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <PercentageOutlined style={{ fontSize: 18, color: '#50C878' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Phép tính phần trăm</span>
        </div>

        <Tabs
          items={tabItems}
          type="card"
          size="small"
        />
      </div>

      {/* ── History panel ── */}
      <div
        style={{
          flex: '0 0 280px',
          minWidth: 240,
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ fontSize: 16, color: '#50C878' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: textColor }}>Lịch sử</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              title="Xoá lịch sử"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#555' : '#bbb',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                padding: '2px 6px',
                borderRadius: 6,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#555' : '#bbb'; }}
            >
              <DeleteOutlined />
              Xoá
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 12px', color: isDark ? '#444' : '#ccc' }}>
            <HistoryOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Chưa có lịch sử tính toán</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: isDark ? '#1a1a1a' : '#f5f5f5',
                  border: `1px solid ${isDark ? '#2a2a2a' : '#efefef'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#50C878',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'rgba(80,200,120,0.1)',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}>
                    {entry.mode}
                  </span>
                  <span style={{ fontSize: 10, color: isDark ? '#444' : '#ccc' }}>{entry.timestamp}</span>
                </div>
                <div style={{ fontSize: 12, color: isDark ? '#777' : '#999', marginBottom: 4 }}>{entry.expression}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: textColor }}>{entry.result}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
