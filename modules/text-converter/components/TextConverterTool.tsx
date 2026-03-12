'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  UndoOutlined,
  FontSizeOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

// ─── Vietnamese diacritics removal ─────────────────────────────────────────────

const VIET_MAP: Record<string, string> = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ắ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ấ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ế: 'e', ề: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ố: 'o', ồ: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ớ: 'o', ờ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ứ: 'u', ừ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
  À: 'A', Á: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
  Ă: 'A', Ắ: 'A', Ằ: 'A', Ẳ: 'A', Ẵ: 'A', Ặ: 'A',
  Â: 'A', Ấ: 'A', Ầ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
  È: 'E', É: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
  Ê: 'E', Ế: 'E', Ề: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E',
  Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
  Ò: 'O', Ó: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
  Ô: 'O', Ố: 'O', Ồ: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O',
  Ơ: 'O', Ớ: 'O', Ờ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O',
  Ù: 'U', Ú: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
  Ư: 'U', Ứ: 'U', Ừ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U',
  Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
  Đ: 'D',
};

function removeDiacritics(text: string): string {
  return text.split('').map((c) => VIET_MAP[c] ?? c).join('');
}

// ─── Conversion functions ───────────────────────────────────────────────────

function toUpperCase(t: string) { return t.toUpperCase(); }
function toLowerCase(t: string) { return t.toLowerCase(); }
function toTitleCase(t: string) {
  return t.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
function toSentenceCase(t: string) {
  return t.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()).replace(/(^\s*\S)/g, (c) => c.toUpperCase());
}
function toCamelCase(t: string) {
  const words = t.trim().split(/[\s_\-]+/).filter(Boolean);
  return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}
function toPascalCase(t: string) {
  return t.trim().split(/[\s_\-]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}
function toSnakeCase(t: string) {
  return t.trim().replace(/\s+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}
function toKebabCase(t: string) {
  return t.trim().replace(/\s+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
function toConstantCase(t: string) {
  return toSnakeCase(t).toUpperCase();
}
function toToggleCase(t: string) {
  return t.split('').map((c) =>
    c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
  ).join('');
}
function removeExtraSpaces(t: string) {
  return t.replace(/\s+/g, ' ').trim();
}
function toSlug(t: string) {
  return removeDiacritics(t).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}
function reverseString(t: string) { return t.split('').reverse().join(''); }

// ─── Conversion definitions ─────────────────────────────────────────────────

interface ConversionDef {
  id: string;
  label: string;
  description: string;
  fn: (t: string) => string;
  color: string;
}

const CONVERSIONS: ConversionDef[] = [
  { id: 'upper', label: 'UPPER CASE', description: 'Tất cả HOA', fn: toUpperCase, color: '#ef4444' },
  { id: 'lower', label: 'lower case', description: 'Tất cả thường', fn: toLowerCase, color: '#3b82f6' },
  { id: 'title', label: 'Title Case', description: 'Viết Hoa Đầu Mỗi Từ', fn: toTitleCase, color: '#8b5cf6' },
  { id: 'sentence', label: 'Sentence case', description: 'Viết hoa đầu câu', fn: toSentenceCase, color: '#06b6d4' },
  { id: 'camel', label: 'camelCase', description: 'vietHoaKieuNay', fn: toCamelCase, color: '#f59e0b' },
  { id: 'pascal', label: 'PascalCase', description: 'VietHoaKieuNay', fn: toPascalCase, color: '#ec4899' },
  { id: 'snake', label: 'snake_case', description: 'viet_hoa_kieu_nay', fn: toSnakeCase, color: '#10b981' },
  { id: 'kebab', label: 'kebab-case', description: 'viet-hoa-kieu-nay', fn: toKebabCase, color: '#f97316' },
  { id: 'constant', label: 'CONSTANT_CASE', description: 'VIET_HOA_KIEU_NAY', fn: toConstantCase, color: '#dc2626' },
  { id: 'toggle', label: 'Đảo chữ hoa/thường', description: 'ĐẢO nGƯỢC tỪNG kÝ tỰ', fn: toToggleCase, color: '#7c3aed' },
  { id: 'trim', label: 'Xóa khoảng trắng thừa', description: 'Chuẩn hóa khoảng trắng', fn: removeExtraSpaces, color: '#64748b' },
  { id: 'nodiac', label: 'Xóa dấu tiếng Việt', description: 'Bỏ dấu → không dấu', fn: removeDiacritics, color: '#0ea5e9' },
  { id: 'slug', label: 'slug-url', description: 'URL-friendly slug', fn: toSlug, color: '#50C878' },
  { id: 'reverse', label: 'Đảo ngược chuỗi', description: 'gnōhC cảĐ iảĐ', fn: reverseString, color: '#a855f7' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function countStats(text: string) {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  return { chars, words };
}

interface HistoryItem {
  id: number;
  conversionLabel: string;
  input: string;
  output: string;
  timestamp: number;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TextConverterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeConversion, setActiveConversion] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyCounter, setHistoryCounter] = useState(0);

  // ─── Theme tokens ──────────────────────────────────────────────────────────
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const sectionBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const inputStats = countStats(input);
  const outputStats = countStats(output);

  const applyConversion = useCallback((conv: ConversionDef) => {
    const result = conv.fn(input);
    setOutput(result);
    setActiveConversion(conv.id);

    // Add to history (last 5)
    const item: HistoryItem = {
      id: historyCounter,
      conversionLabel: conv.label,
      input,
      output: result,
      timestamp: Date.now(),
    };
    setHistory((prev) => [item, ...prev].slice(0, 5));
    setHistoryCounter((c) => c + 1);
  }, [input, historyCounter]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      message.success('Đã sao chép!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('Không thể sao chép');
    }
  }, [output]);

  const handleUndo = useCallback((item: HistoryItem) => {
    setInput(item.input);
    setOutput(item.output);
    setActiveConversion(null);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setActiveConversion(null);
  }, []);

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 200,
    padding: '12px 14px',
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.7,
    color: textColor,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    colorScheme: isDark ? 'dark' : 'light',
  };

  const statsStyle: React.CSSProperties = {
    fontSize: 11,
    color: subColor,
    marginTop: 6,
    display: 'flex',
    gap: 16,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ── Two-column: Input & Output ── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        {/* Input */}
        <div
          style={{
            flex: 1,
            minWidth: 280,
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '20px 20px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FontSizeOutlined style={{ fontSize: 16, color: '#50C878' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Văn bản nguồn</span>
            </div>
            <button
              onClick={handleClear}
              title="Xóa tất cả"
              style={{
                background: 'transparent',
                border: `1px solid ${inputBorder}`,
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 12,
                color: subColor,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ClearOutlined />
              Xóa
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập văn bản cần chuyển đổi..."
            style={textareaStyle}
          />
          <div style={statsStyle as React.CSSProperties}>
            <span>{inputStats.chars} ký tự</span>
            <span>{inputStats.words} từ</span>
          </div>
        </div>

        {/* Output */}
        <div
          style={{
            flex: 1,
            minWidth: 280,
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '20px 20px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SwapOutlined style={{ fontSize: 16, color: '#50C878' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
                Kết quả
                {activeConversion && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: CONVERSIONS.find((c) => c.id === activeConversion)?.color ?? '#888',
                      fontWeight: 500,
                    }}
                  >
                    ({CONVERSIONS.find((c) => c.id === activeConversion)?.label})
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={handleCopy}
              disabled={!output}
              style={{
                background: output ? 'rgba(80,200,120,0.1)' : 'transparent',
                border: `1px solid ${output ? '#50C87855' : inputBorder}`,
                borderRadius: 6,
                padding: '4px 10px',
                cursor: output ? 'pointer' : 'not-allowed',
                fontSize: 12,
                color: output ? '#50C878' : subColor,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
              }}
            >
              {copied ? <CheckOutlined /> : <CopyOutlined />}
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Kết quả sẽ hiện ở đây..."
            style={{ ...textareaStyle, cursor: 'default', color: output ? textColor : subColor }}
          />
          <div style={statsStyle as React.CSSProperties}>
            <span>{outputStats.chars} ký tự</span>
            <span>{outputStats.words} từ</span>
          </div>
        </div>
      </div>

      {/* ── Conversion Buttons ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          padding: '20px 20px 16px',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: textColor }}>
          Chọn kiểu chuyển đổi
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 10,
          }}
        >
          {CONVERSIONS.map((conv) => {
            const isActive = activeConversion === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => applyConversion(conv)}
                disabled={!input}
                style={{
                  padding: '10px 14px',
                  background: isActive
                    ? `${conv.color}18`
                    : sectionBg,
                  border: isActive
                    ? `1.5px solid ${conv.color}66`
                    : `1px solid ${inputBorder}`,
                  borderRadius: 8,
                  cursor: input ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  opacity: input ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (!input) return;
                  (e.currentTarget as HTMLElement).style.borderColor = `${conv.color}88`;
                  (e.currentTarget as HTMLElement).style.background = `${conv.color}10`;
                }}
                onMouseLeave={(e) => {
                  if (isActive) return;
                  (e.currentTarget as HTMLElement).style.borderColor = inputBorder;
                  (e.currentTarget as HTMLElement).style.background = sectionBg;
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isActive ? conv.color : textColor,
                    marginBottom: 3,
                    fontFamily: 'monospace',
                  }}
                >
                  {conv.label}
                </div>
                <div style={{ fontSize: 11, color: subColor }}>{conv.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '20px 20px 16px',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: textColor }}>
            Lịch sử chuyển đổi (5 gần nhất)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  background: sectionBg,
                  borderRadius: 8,
                  border: `1px solid ${inputBorder}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: CONVERSIONS.find((c) => c.label === item.conversionLabel)?.color ?? '#50C878',
                        fontFamily: 'monospace',
                      }}
                    >
                      {item.conversionLabel}
                    </span>
                    <span style={{ fontSize: 10, color: subColor }}>
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: subColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ color: textColor }}>{item.input.slice(0, 40)}{item.input.length > 40 ? '...' : ''}</span>
                    <span style={{ margin: '0 6px' }}>→</span>
                    <span style={{ color: '#50C878' }}>{item.output.slice(0, 40)}{item.output.length > 40 ? '...' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUndo(item)}
                  title="Khôi phục lần chuyển đổi này"
                  style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 6,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: subColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <UndoOutlined />
                  Khôi phục
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
