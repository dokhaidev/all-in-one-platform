'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  Select,
  InputNumber,
  Tooltip,
  message,
  Slider,
  Badge,
} from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SoundOutlined,
  FontSizeOutlined,
  LineOutlined,
  OrderedListOutlined,
  BarChartOutlined,
  CheckOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { TextArea } = Input;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextStats {
  words: number;
  charsWithSpaces: number;
  charsNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTime: string;   // e.g. "2 phút 30 giây"
  speakingTime: string;
}

interface WordFreq {
  word: string;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'và', 'là', 'của', 'trong', 'có', 'với', 'được', 'này', 'đó', 'các', 'một',
  'không', 'để', 'cho', 'từ', 'đến', 'như', 'cũng', 'về', 'theo', 'khi', 'thì',
  'hay', 'mà', 'những', 'bởi', 'vì', 'nên', 'ra', 'lên', 'xuống', 'vào', 'lại',
  'đã', 'sẽ', 'đang', 'rất', 'hơn', 'nhất', 'còn', 'tôi', 'bạn', 'họ', 'chúng',
  'tất', 'cả', 'ai', 'gì', 'nào', 'đây', 'kia', 'thế', 'vậy', 'nhưng', 'hoặc',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that',
  'of', 'in', 'to', 'for', 'on', 'at', 'by', 'with', 'from', 'as',
  'or', 'and', 'but', 'if', 'not', 'no', 'so', 'yet', 'nor',
]);

type LimitPreset = 'twitter' | 'sms' | 'custom';

const LIMIT_PRESETS: Record<LimitPreset, { label: string; value: number }> = {
  twitter: { label: 'Twitter / X (280)', value: 280 },
  sms:     { label: 'SMS (160)',          value: 160 },
  custom:  { label: 'Tuỳ chỉnh',          value: 500 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function analyzeText(text: string): TextStats {
  if (!text || text.trim() === '') {
    return { words: 0, charsWithSpaces: 0, charsNoSpaces: 0, sentences: 0, paragraphs: 0, lines: 0, readingTime: '0 giây', speakingTime: '0 giây' };
  }

  const charsWithSpaces = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;

  // Words: split by whitespace, filter empty
  const wordList = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const words = wordList.length;

  // Sentences: split by .  !  ? (allowing for ... or multiple)
  const sentenceMatches = text.match(/[^.!?]*[.!?]+/g);
  const sentences = sentenceMatches ? sentenceMatches.filter((s) => s.trim().length > 0).length : (text.trim().length > 0 ? 1 : 0);

  // Paragraphs: split by blank line or single newline
  const parasRaw = text.split(/\n+/).filter((p) => p.trim().length > 0);
  const paragraphs = parasRaw.length || (text.trim().length > 0 ? 1 : 0);

  // Lines
  const lines = text.split('\n').length;

  // Times
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)} giây`;
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return s > 0 ? `${m} phút ${s} giây` : `${m} phút`;
  };
  const readingTime = formatTime((words / 200) * 60);
  const speakingTime = formatTime((words / 130) * 60);

  return { words, charsWithSpaces, charsNoSpaces, sentences, paragraphs, lines, readingTime, speakingTime };
}

function getTopWords(text: string, topN = 10): WordFreq[] {
  if (!text.trim()) return [];
  const cleaned = text.toLowerCase().replace(/[^a-zA-ZÀ-ỹ0-9\s]/g, ' ');
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  isDark: boolean;
  accent?: boolean;
}

function StatCard({ icon, label, value, sub, isDark, accent }: StatCardProps) {
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '1px solid #2e2e2e' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e0e0e0' : '#111';
  const subColor = isDark ? '#888' : '#777';

  return (
    <div
      style={{
        background: accent
          ? isDark ? 'rgba(80,200,120,0.06)' : 'rgba(80,200,120,0.04)'
          : cardBg,
        border: accent ? '1.5px solid rgba(80,200,120,0.35)' : cardBorder,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ color: accent ? '#50C878' : '#888', fontSize: 14 }}>{icon}</span>
        <span style={{ color: subColor, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ color: accent ? '#50C878' : textColor, fontSize: 28, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ color: subColor, fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WordCounterTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [text, setText] = useState('');
  const [limitPreset, setLimitPreset] = useState<LimitPreset>('twitter');
  const [customLimit, setCustomLimit] = useState(500);
  const [highlightMode, setHighlightMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '1px solid #2e2e2e' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e0e0e0' : '#111';
  const subColor = isDark ? '#888' : '#777';
  const panelBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const stats = useMemo(() => analyzeText(text), [text]);
  const topWords = useMemo(() => getTopWords(text, 10), [text]);

  const charLimit = limitPreset === 'custom' ? customLimit : LIMIT_PRESETS[limitPreset].value;
  const charsUsed = stats.charsWithSpaces;
  const charsRemaining = charLimit - charsUsed;
  const limitPct = Math.min(100, (charsUsed / charLimit) * 100);
  const limitColor = charsRemaining < 0 ? '#e05555' : charsRemaining <= charLimit * 0.1 ? '#f97316' : '#50C878';

  const handleClearText = () => {
    setText('');
    message.success('Đã xóa nội dung');
  };

  const handleCopyText = () => {
    if (!text) return message.warning('Không có nội dung để sao chép');
    navigator.clipboard.writeText(text).then(() => message.success('Đã sao chép văn bản'));
  };

  const handleCopyStats = () => {
    const statsText = [
      `Số từ: ${stats.words}`,
      `Ký tự (có khoảng trắng): ${stats.charsWithSpaces}`,
      `Ký tự (không khoảng trắng): ${stats.charsNoSpaces}`,
      `Số câu: ${stats.sentences}`,
      `Số đoạn văn: ${stats.paragraphs}`,
      `Số dòng: ${stats.lines}`,
      `Thời gian đọc: ${stats.readingTime}`,
      `Thời gian nói: ${stats.speakingTime}`,
    ].join('\n');
    navigator.clipboard.writeText(statsText).then(() => message.success('Đã sao chép thống kê'));
  };

  // Highlight repeated words
  const renderHighlighted = useCallback(() => {
    if (!text || !highlightMode) return text;
    const wordFreq: Record<string, number> = {};
    const words = text.toLowerCase().replace(/[^a-zA-ZÀ-ỹ0-9\s]/g, ' ').split(/\s+/);
    for (const w of words) {
      if (w.length >= 2) wordFreq[w] = (wordFreq[w] ?? 0) + 1;
    }
    // Build highlighted HTML (for display overlay) — we handle this in a preview <div>
    const repeated = new Set(Object.entries(wordFreq).filter(([, c]) => c > 1).map(([w]) => w));
    return text.split(/(\s+)/).map((chunk, i) => {
      const lower = chunk.trim().toLowerCase().replace(/[^a-zA-ZÀ-ỹ0-9]/g, '');
      if (repeated.has(lower)) {
        return <mark key={i} style={{ background: 'rgba(80,200,120,0.3)', color: 'inherit', borderRadius: 2 }}>{chunk}</mark>;
      }
      return chunk;
    });
  }, [text, highlightMode]);

  // Max bar for top words
  const maxCount = topWords[0]?.count ?? 1;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── LEFT: Textarea + Toolbar ── */}
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>

          {/* Toolbar */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: '10px 10px 0 0',
              borderBottom: 'none',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <Tooltip title="Xóa tất cả">
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearText}
                size="small"
                style={{ background: isDark ? '#2a2a2a' : '#f5f5f5', border: isDark ? '1px solid #333' : '1px solid #ddd', color: textColor, borderRadius: 6 }}
              >
                Xóa
              </Button>
            </Tooltip>
            <Tooltip title="Sao chép văn bản">
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyText}
                size="small"
                style={{ background: isDark ? '#2a2a2a' : '#f5f5f5', border: isDark ? '1px solid #333' : '1px solid #ddd', color: textColor, borderRadius: 6 }}
              >
                Sao chép
              </Button>
            </Tooltip>
            <Tooltip title="Sao chép thống kê">
              <Button
                icon={<BarChartOutlined />}
                onClick={handleCopyStats}
                size="small"
                style={{ background: isDark ? '#2a2a2a' : '#f5f5f5', border: isDark ? '1px solid #333' : '1px solid #ddd', color: textColor, borderRadius: 6 }}
              >
                Sao chép thống kê
              </Button>
            </Tooltip>
            <Button
              icon={highlightMode ? <CheckOutlined /> : <FontSizeOutlined />}
              onClick={() => setHighlightMode((v) => !v)}
              size="small"
              style={{
                background: highlightMode ? 'rgba(80,200,120,0.12)' : isDark ? '#2a2a2a' : '#f5f5f5',
                border: highlightMode ? '1px solid #50C878' : isDark ? '1px solid #333' : '1px solid #ddd',
                color: highlightMode ? '#50C878' : textColor,
                borderRadius: 6,
              }}
            >
              Highlight từ lặp
            </Button>
          </div>

          {/* Textarea or Highlight preview */}
          {highlightMode ? (
            <div
              style={{
                background: isDark ? '#141414' : '#fff',
                border: cardBorder,
                borderRadius: '0 0 10px 10px',
                padding: '12px 14px',
                minHeight: 320,
                fontSize: 14,
                lineHeight: 1.8,
                color: textColor,
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                maxHeight: 500,
                cursor: 'text',
              }}
              onClick={() => setHighlightMode(false)}
            >
              {text ? renderHighlighted() : (
                <span style={{ color: subColor }}>Nhấn vào đây để chỉnh sửa văn bản...</span>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập hoặc dán văn bản vào đây để bắt đầu phân tích..."
              style={{
                width: '100%',
                minHeight: 320,
                maxHeight: 600,
                resize: 'vertical',
                background: isDark ? '#141414' : '#fff',
                border: cardBorder,
                borderRadius: '0 0 10px 10px',
                padding: '12px 14px',
                fontSize: 14,
                lineHeight: 1.8,
                color: textColor,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                caretColor: '#50C878',
              }}
            />
          )}

          {/* Character limit checker */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 10,
              padding: '14px 18px',
              marginTop: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <WarningOutlined style={{ color: limitColor }} />
              <span style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>Giới hạn ký tự</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <Select
                value={limitPreset}
                onChange={(v) => setLimitPreset(v as LimitPreset)}
                style={{ minWidth: 180 }}
                options={Object.entries(LIMIT_PRESETS).map(([key, val]) => ({ value: key, label: val.label }))}
              />
              {limitPreset === 'custom' && (
                <InputNumber
                  value={customLimit}
                  onChange={(v) => setCustomLimit(v ?? 500)}
                  min={1}
                  max={100000}
                  style={{ width: 100, background: isDark ? '#1a1a1a' : undefined, color: textColor }}
                />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: subColor }}>
                Đã dùng {charsUsed.toLocaleString()} / {charLimit.toLocaleString()} ký tự
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: limitColor }}>
                {charsRemaining >= 0 ? `Còn ${charsRemaining.toLocaleString()}` : `Vượt ${Math.abs(charsRemaining).toLocaleString()}`}
              </span>
            </div>
            {/* Progress bar manual */}
            <div style={{ background: isDark ? '#2e2e2e' : '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, limitPct)}%`,
                  height: '100%',
                  background: limitColor,
                  borderRadius: 4,
                  transition: 'width 0.3s, background 0.3s',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Stats + Word Frequency ── */}
        <div style={{ flex: '0 0 280px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard icon={<FileTextOutlined />} label="Số từ" value={stats.words.toLocaleString()} isDark={isDark} accent />
            <StatCard icon={<FontSizeOutlined />} label="Ký tự" value={stats.charsWithSpaces.toLocaleString()} sub={`${stats.charsNoSpaces.toLocaleString()} (no space)`} isDark={isDark} />
            <StatCard icon={<LineOutlined />} label="Số câu" value={stats.sentences.toLocaleString()} isDark={isDark} />
            <StatCard icon={<OrderedListOutlined />} label="Đoạn văn" value={stats.paragraphs.toLocaleString()} isDark={isDark} />
            <StatCard icon={<BarChartOutlined />} label="Số dòng" value={stats.lines.toLocaleString()} isDark={isDark} />
            <StatCard icon={<ClockCircleOutlined />} label="Đọc ~" value={stats.readingTime} isDark={isDark} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            <div
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SoundOutlined style={{ color: '#888', fontSize: 14 }} />
              <div>
                <div style={{ color: subColor, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nói ~</div>
                <div style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{stats.speakingTime}</div>
              </div>
            </div>
          </div>

          {/* Top words */}
          <div
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <BarChartOutlined style={{ color: '#50C878' }} />
              <span style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>Top 10 từ xuất hiện nhiều</span>
            </div>

            {topWords.length === 0 ? (
              <div style={{ color: subColor, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topWords.map((item, index) => {
                  const barPct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.word}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#50C878', fontWeight: 700, fontSize: 11, minWidth: 16, textAlign: 'right' }}>
                            #{index + 1}
                          </span>
                          <span style={{ color: textColor, fontSize: 13, fontWeight: 500 }}>{item.word}</span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#50C878',
                            background: 'rgba(80,200,120,0.12)',
                            borderRadius: 4,
                            padding: '1px 6px',
                          }}
                        >
                          {item.count}
                        </span>
                      </div>
                      <div style={{ background: isDark ? '#2e2e2e' : '#f0f0f0', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${barPct}%`,
                            height: '100%',
                            background: index === 0 ? '#50C878' : `rgba(80,200,120,${0.7 - index * 0.05})`,
                            borderRadius: 3,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
