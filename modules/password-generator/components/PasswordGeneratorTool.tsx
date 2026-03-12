'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  CopyOutlined,
  CheckOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Slider, Checkbox, message } from 'antd';

// ─── Char sets ─────────────────────────────────────────────────────────────────

const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_DIGITS = '0123456789';
const CHARS_SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'l', 'I']);

const VIET_WORDS = [
  'Biển', 'Rừng', 'Núi', 'Sao', 'Mây', 'Gió', 'Nước', 'Lửa', 'Đất', 'Trời',
  'Hoa', 'Cây', 'Chim', 'Cá', 'Sóng', 'Ánh', 'Nắng', 'Mưa', 'Tuyết', 'Băng',
  'Đêm', 'Ngày', 'Bình', 'Minh', 'Hoàng', 'Hồng', 'Xanh', 'Vàng', 'Trắng', 'Đỏ',
  'Mèo', 'Chó', 'Hổ', 'Rồng', 'Phượng', 'Long', 'Hạc', 'Ưng', 'Sư', 'Tử',
];

const ENG_WORDS = [
  'Dragon', 'Cloud', 'Storm', 'River', 'Stone', 'Eagle', 'Tiger', 'Shadow',
  'Flame', 'Frost', 'Blade', 'Tower', 'Forest', 'Ocean', 'Thunder', 'Silver',
  'Golden', 'Crimson', 'Emerald', 'Sapphire', 'Phoenix', 'Falcon', 'Viper', 'Cobra',
];

// ─── Crypto random ──────────────────────────────────────────────────────────

function secureRandom(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function pickFrom(charset: string): string {
  return charset[secureRandom(charset.length)];
}

// ─── Password generation ────────────────────────────────────────────────────

interface GenOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  special: boolean;
  excludeAmbiguous: boolean;
}

function buildCharset(opts: GenOptions): string {
  let cs = '';
  if (opts.upper) cs += CHARS_UPPER;
  if (opts.lower) cs += CHARS_LOWER;
  if (opts.digits) cs += CHARS_DIGITS;
  if (opts.special) cs += CHARS_SPECIAL;
  if (opts.excludeAmbiguous) {
    cs = cs.split('').filter((c) => !AMBIGUOUS.has(c)).join('');
  }
  return cs;
}

function generatePassword(opts: GenOptions): string {
  const charset = buildCharset(opts);
  if (!charset) return '';

  // Guarantee at least one char from each enabled group
  const required: string[] = [];
  const filterAmbig = (s: string) =>
    opts.excludeAmbiguous ? s.split('').filter((c) => !AMBIGUOUS.has(c)).join('') : s;

  if (opts.upper) { const s = filterAmbig(CHARS_UPPER); if (s) required.push(pickFrom(s)); }
  if (opts.lower) { const s = filterAmbig(CHARS_LOWER); if (s) required.push(pickFrom(s)); }
  if (opts.digits) { const s = filterAmbig(CHARS_DIGITS); if (s) required.push(pickFrom(s)); }
  if (opts.special) required.push(pickFrom(CHARS_SPECIAL));

  const remaining = opts.length - required.length;
  const extra: string[] = [];
  for (let i = 0; i < Math.max(0, remaining); i++) {
    extra.push(pickFrom(charset));
  }

  const combined = [...required, ...extra];
  // Fisher-Yates shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join('');
}

function generateMemorable(): string {
  const word1 = ENG_WORDS[secureRandom(ENG_WORDS.length)];
  const word2 = ENG_WORDS[secureRandom(ENG_WORDS.length)];
  const num = 10 + secureRandom(90);
  const specials = '!@#$%';
  const sym = specials[secureRandom(specials.length)];
  return `${word1}-${word2}-${num}${sym}`;
}

function generatePassphrase(): string {
  const words: string[] = [];
  for (let i = 0; i < 4; i++) {
    words.push(VIET_WORDS[secureRandom(VIET_WORDS.length)]);
  }
  const num = 10 + secureRandom(90);
  const sep = '-';
  return words.join(sep) + sep + num;
}

// ─── Strength calculation ───────────────────────────────────────────────────

interface Strength {
  score: number; // 0-4
  label: string;
  color: string;
  entropy: number;
  crackTime: string;
}

function calcStrength(password: string, opts: GenOptions): Strength {
  if (!password) return { score: 0, label: 'Chưa có', color: '#555', entropy: 0, crackTime: '-' };

  const charsetSize = buildCharset(opts).length || password.length;
  const entropy = Math.log2(Math.pow(charsetSize, password.length));

  // Rough crack time at 1B guesses/sec
  const guesses = Math.pow(2, entropy);
  const seconds = guesses / 1e9;

  let crackTime: string;
  if (seconds < 1) crackTime = 'tức thì';
  else if (seconds < 60) crackTime = `${Math.round(seconds)}s`;
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} phút`;
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} giờ`;
  else if (seconds < 86400 * 365) crackTime = `${Math.round(seconds / 86400)} ngày`;
  else if (seconds < 86400 * 365 * 100) crackTime = `${Math.round(seconds / (86400 * 365))} năm`;
  else crackTime = 'hàng thế kỷ+';

  let score: number;
  let label: string;
  let color: string;

  if (entropy < 28) { score = 0; label = 'Rất yếu'; color = '#ef4444'; }
  else if (entropy < 36) { score = 1; label = 'Yếu'; color = '#f97316'; }
  else if (entropy < 52) { score = 2; label = 'Trung bình'; color = '#f59e0b'; }
  else if (entropy < 68) { score = 3; label = 'Mạnh'; color = '#22c55e'; }
  else { score = 4; label = 'Rất mạnh'; color = '#50C878'; }

  return { score, label, color, entropy: Math.round(entropy), crackTime };
}

// ─── History item ───────────────────────────────────────────────────────────

interface HistoryItem {
  id: number;
  password: string;
  timestamp: number;
  strength: Strength;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PasswordGeneratorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [special, setSpecial] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [count, setCount] = useState(1);
  const [mode, setMode] = useState<'standard' | 'memorable' | 'passphrase'>('standard');

  const [passwords, setPasswords] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyCounter, setHistoryCounter] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPasswords, setShowPasswords] = useState<boolean[]>([]);

  const opts: GenOptions = { length, upper, lower, digits, special, excludeAmbiguous };

  const generate = useCallback(() => {
    const newPasswords: string[] = [];
    for (let i = 0; i < count; i++) {
      let pw = '';
      if (mode === 'memorable') pw = generateMemorable();
      else if (mode === 'passphrase') pw = generatePassphrase();
      else pw = generatePassword(opts);
      newPasswords.push(pw);
    }
    setPasswords(newPasswords);
    setShowPasswords(new Array(newPasswords.length).fill(false));

    // Add to history
    const newItems: HistoryItem[] = newPasswords.map((pw, i) => ({
      id: historyCounter + i,
      password: pw,
      timestamp: Date.now(),
      strength: calcStrength(pw, opts),
    }));
    setHistory((prev) => [...newItems, ...prev].slice(0, 20));
    setHistoryCounter((c) => c + newPasswords.length);
  }, [length, upper, lower, digits, special, excludeAmbiguous, count, mode, historyCounter, opts]);

  // Auto-generate on first mount
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      generate();
    }
  }, []);

  const handleCopy = useCallback(async (pw: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(pw);
      setCopiedIdx(idx);
      message.success('Đã sao chép mật khẩu!');
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      message.error('Không thể sao chép');
    }
  }, []);

  const handleCopyHistoryItem = useCallback(async (pw: string) => {
    try {
      await navigator.clipboard.writeText(pw);
      message.success('Đã sao chép!');
    } catch {
      message.error('Không thể sao chép');
    }
  }, []);

  // ─── Theme tokens ────────────────────────────────────────────────────────
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const sectionBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const anyEnabled = upper || lower || digits || special;

  const strengthForDisplay = passwords.length > 0
    ? calcStrength(passwords[0], opts)
    : { score: 0, label: '-', color: '#555', entropy: 0, crackTime: '-' };

  const modeOptions: { id: 'standard' | 'memorable' | 'passphrase'; label: string; desc: string }[] = [
    { id: 'standard', label: 'Tiêu chuẩn', desc: 'Ký tự ngẫu nhiên an toàn' },
    { id: 'memorable', label: 'Dễ nhớ', desc: 'word-word-42!' },
    { id: 'passphrase', label: 'Cụm từ', desc: 'Từ tiếng Việt' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Left: Settings ── */}
        <div
          style={{
            flex: '0 0 320px',
            minWidth: 280,
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '22px 22px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <LockOutlined style={{ fontSize: 16, color: '#50C878' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: textColor }}>Cài đặt</span>
          </div>

          {/* Mode */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: subColor, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Chế độ tạo
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {modeOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    flex: 1,
                    minWidth: 80,
                    padding: '8px 10px',
                    background: mode === m.id ? 'rgba(80,200,120,0.12)' : inputBg,
                    border: mode === m.id ? '1.5px solid #50C87866' : `1px solid ${inputBorder}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: mode === m.id ? '#50C878' : textColor }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          {mode === 'standard' && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: subColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Độ dài
                </label>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#50C878', fontVariantNumeric: 'tabular-nums' }}>
                  {length}
                </span>
              </div>
              <Slider
                min={8}
                max={64}
                value={length}
                onChange={(v) => setLength(v)}
                styles={{
                  track: { background: '#50C878' },
                  handle: { borderColor: '#50C878' },
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: subColor, marginTop: 2 }}>
                <span>8</span>
                <span>64</span>
              </div>
            </div>
          )}

          {/* Character sets */}
          {mode === 'standard' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: subColor, marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Bộ ký tự
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Chữ hoa (A-Z)', value: upper, set: setUpper },
                  { label: 'Chữ thường (a-z)', value: lower, set: setLower },
                  { label: 'Số (0-9)', value: digits, set: setDigits },
                  { label: 'Ký tự đặc biệt (!@#...)', value: special, set: setSpecial },
                  { label: 'Loại trừ ký tự dễ nhầm (0Oo1lI)', value: excludeAmbiguous, set: setExcludeAmbiguous },
                ].map(({ label, value, set }) => (
                  <Checkbox
                    key={label}
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    style={{ color: textColor, fontSize: 13 }}
                  >
                    {label}
                  </Checkbox>
                ))}
              </div>
              {!anyEnabled && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
                  Vui lòng chọn ít nhất một bộ ký tự.
                </div>
              )}
            </div>
          )}

          {/* Count */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: subColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Số lượng tạo cùng lúc
              </label>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#50C878' }}>{count}</span>
            </div>
            <Slider
              min={1}
              max={10}
              value={count}
              onChange={(v) => setCount(v)}
              styles={{
                track: { background: '#50C878' },
                handle: { borderColor: '#50C878' },
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={mode === 'standard' && !anyEnabled}
            style={{
              width: '100%',
              padding: '12px',
              background: (mode === 'standard' && !anyEnabled) ? '#333' : 'rgba(80,200,120,0.15)',
              border: '1.5px solid #50C87866',
              borderRadius: 10,
              cursor: (mode === 'standard' && !anyEnabled) ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              color: (mode === 'standard' && !anyEnabled) ? '#555' : '#50C878',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <ReloadOutlined />
            Tạo mật khẩu mới
          </button>
        </div>

        {/* ── Right: Passwords + strength ── */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Passwords list */}
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: textColor }}>Mật khẩu đã tạo</span>
              <button
                onClick={generate}
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
                <ReloadOutlined />
                Làm mới
              </button>
            </div>

            {passwords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: subColor }}>
                <LockOutlined style={{ fontSize: 32, color: isDark ? '#333' : '#ccc' }} />
                <p style={{ margin: '12px 0 0', fontSize: 13 }}>Nhấn "Tạo mật khẩu mới" để bắt đầu</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {passwords.map((pw, idx) => {
                  const str = calcStrength(pw, opts);
                  const visible = showPasswords[idx] ?? false;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        background: sectionBg,
                        borderRadius: 8,
                        border: `1px solid ${inputBorder}`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 15,
                            fontWeight: 600,
                            color: textColor,
                            letterSpacing: '0.05em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            filter: visible ? 'none' : 'blur(4px)',
                            userSelect: visible ? 'text' : 'none',
                            transition: 'filter 0.2s',
                          }}
                        >
                          {pw}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div
                            style={{
                              width: 60,
                              height: 4,
                              background: isDark ? '#2a2a2a' : '#e5e7eb',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${((str.score + 1) / 5) * 100}%`,
                                background: str.color,
                                borderRadius: 2,
                                transition: 'width 0.3s',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: str.color, fontWeight: 600 }}>{str.label}</span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setShowPasswords((prev) => {
                            const next = [...prev];
                            next[idx] = !next[idx];
                            return next;
                          })
                        }
                        style={{
                          background: 'transparent',
                          border: `1px solid ${inputBorder}`,
                          borderRadius: 6,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          color: subColor,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                      <button
                        onClick={() => handleCopy(pw, idx)}
                        style={{
                          background: copiedIdx === idx ? 'rgba(80,200,120,0.1)' : 'transparent',
                          border: `1px solid ${copiedIdx === idx ? '#50C87866' : inputBorder}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: copiedIdx === idx ? '#50C878' : subColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          transition: 'all 0.15s',
                        }}
                      >
                        {copiedIdx === idx ? <CheckOutlined /> : <CopyOutlined />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Strength details for first password */}
          {passwords.length > 0 && (
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '20px 20px 16px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: textColor }}>
                Phân tích độ mạnh
              </h3>

              {/* Strength bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: strengthForDisplay.color, fontWeight: 700 }}>
                    {strengthForDisplay.label}
                  </span>
                  <span style={{ fontSize: 12, color: subColor }}>
                    {strengthForDisplay.score + 1}/5
                  </span>
                </div>
                <div style={{ height: 8, background: isDark ? '#222' : '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${((strengthForDisplay.score + 1) / 5) * 100}%`,
                      background: strengthForDisplay.color,
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Entropy', value: `~${strengthForDisplay.entropy} bits` },
                  { label: 'Thời gian crack', value: strengthForDisplay.crackTime },
                  { label: 'Độ dài', value: `${passwords[0]?.length ?? 0} ký tự` },
                  { label: 'Bộ ký tự', value: `${buildCharset(opts).length || '—'} ký tự` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      padding: '10px 12px',
                      background: sectionBg,
                      borderRadius: 8,
                      border: `1px solid ${inputBorder}`,
                    }}
                  >
                    <div style={{ fontSize: 10, color: subColor, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── History ── */}
      <div
        style={{
          marginTop: 24,
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setShowHistory((v) => !v)}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ fontSize: 16, color: '#50C878' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
              Lịch sử ({history.length}/20)
            </span>
          </div>
          <span style={{ fontSize: 12, color: subColor }}>{showHistory ? 'Thu gọn ▲' : 'Mở rộng ▼'}</span>
        </button>

        {showHistory && (
          <div style={{ padding: '0 20px 16px' }}>
            {history.length === 0 ? (
              <p style={{ color: subColor, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                Chưa có lịch sử nào.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button
                    onClick={() => setHistory([])}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 11,
                      color: subColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <DeleteOutlined />
                    Xóa lịch sử
                  </button>
                </div>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: sectionBg,
                      borderRadius: 8,
                      border: `1px solid ${inputBorder}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          color: textColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.password}
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 3, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: item.strength.color, fontWeight: 600 }}>
                          {item.strength.label}
                        </span>
                        <span style={{ fontSize: 10, color: subColor }}>
                          {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyHistoryItem(item.password)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${inputBorder}`,
                        borderRadius: 6,
                        padding: '5px 8px',
                        cursor: 'pointer',
                        color: subColor,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      <CopyOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
