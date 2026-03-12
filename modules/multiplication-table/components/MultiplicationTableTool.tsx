'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Tabs,
  Button,
  Input,
  InputNumber,
  Checkbox,
  Progress,
  Statistic,
  Row,
  Col,
  Tag,
  Tooltip,
  Badge,
  Space,
  Alert,
} from 'antd';
import {
  SoundOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Constants ─────────────────────────────────────────────────────────────
const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';

// ─── Types ──────────────────────────────────────────────────────────────────
interface QuizQuestion {
  a: number;
  b: number;
  answer: number;
}

interface QuizResult {
  question: QuizQuestion;
  userAnswer: number | null;
  correct: boolean;
  timeMs: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCellColor(val: number, max: number, isDark: boolean): string {
  const ratio = (val - 1) / (max - 1);
  // Interpolate from green-ish (low) to warm amber (high) in HSL
  const hue = Math.round(140 - ratio * 100); // 140 (green) → 40 (amber)
  const sat = Math.round(45 + ratio * 35);
  const light = isDark
    ? Math.round(22 + ratio * 10)
    : Math.round(88 - ratio * 24);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function getCellTextColor(val: number, max: number, isDark: boolean): string {
  const ratio = (val - 1) / (max - 1);
  const hue = Math.round(140 - ratio * 100);
  const sat = 70;
  const light = isDark ? Math.round(55 + ratio * 20) : Math.round(30 + ratio * 10);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function generateQuestion(tables: number[]): QuizQuestion {
  const a = tables[Math.floor(Math.random() * tables.length)];
  const b = Math.floor(Math.random() * 12) + 1;
  return { a, b, answer: a * b };
}

function viReadNumber(n: number): string {
  const ones = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín',
    'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu',
    'mười bảy', 'mười tám', 'mười chín'];
  if (n < 20) return ones[n];
  const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi',
    'bảy mươi', 'tám mươi', 'chín mươi'];
  const d = Math.floor(n / 10);
  const r = n % 10;
  return r === 0 ? tens[d] : `${tens[d]} ${ones[r]}`;
}

function speakVietnamese(a: number, b: number, result: number) {
  if (!('speechSynthesis' in window)) return;
  const text = `${viReadNumber(a)} nhân ${viReadNumber(b)} bằng ${viReadNumber(result)}`;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'vi-VN';
  utt.rate = 0.9;
  utt.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

function speakFullTable(tableNum: number, size: number) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const lines: string[] = [];
  for (let i = 1; i <= size; i++) {
    lines.push(`${viReadNumber(tableNum)} nhân ${viReadNumber(i)} bằng ${viReadNumber(tableNum * i)}`);
  }
  const text = lines.join('. ');
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'vi-VN';
  utt.rate = 0.85;
  utt.pitch = 1;
  window.speechSynthesis.speak(utt);
}

// ─── Full Table View ──────────────────────────────────────────────────────────
function FullTableView({ isDark }: { isDark: boolean }) {
  const [size, setSize] = useState<10 | 12>(10);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const headerBg = isDark ? '#141414' : '#f5f5f5';
  const headerColor = isDark ? '#aaa' : '#555';
  const borderColor = isDark ? '#2a2a2a' : '#e8e8e8';

  const maxVal = size * size;

  const cellSize = size === 10 ? 56 : 48;

  const getHighlightStyle = (r: number, c: number): React.CSSProperties => {
    const isSelected = selectedCell?.r === r && selectedCell?.c === c;
    const isHovRow = hoveredRow === r;
    const isHovCol = hoveredCol === c;
    const val = r * c;

    if (isSelected) {
      return {
        background: PRIMARY,
        color: '#fff',
        fontWeight: 800,
        transform: 'scale(1.15)',
        zIndex: 2,
        boxShadow: `0 4px 16px rgba(80,200,120,0.45)`,
      };
    }
    if (isHovRow && isHovCol) {
      return {
        background: PRIMARY,
        color: '#fff',
        fontWeight: 800,
        transform: 'scale(1.1)',
        zIndex: 2,
        boxShadow: `0 2px 10px rgba(80,200,120,0.35)`,
      };
    }
    if (isHovRow || isHovCol) {
      return {
        background: isDark ? 'rgba(80,200,120,0.15)' : 'rgba(80,200,120,0.12)',
        color: PRIMARY,
        fontWeight: 700,
      };
    }
    return {
      background: getCellColor(val, maxVal, isDark),
      color: getCellTextColor(val, maxVal, isDark),
    };
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ color: isDark ? '#888' : '#666', fontSize: 13 }}>Kích thước:</span>
        <Button
          size="small"
          type={size === 10 ? 'primary' : 'default'}
          onClick={() => { setSize(10); setSelectedCell(null); }}
          style={size === 10 ? { background: PRIMARY, borderColor: PRIMARY } : {}}
        >
          10 × 10
        </Button>
        <Button
          size="small"
          type={size === 12 ? 'primary' : 'default'}
          onClick={() => { setSize(12); setSelectedCell(null); }}
          style={size === 12 ? { background: PRIMARY, borderColor: PRIMARY } : {}}
        >
          12 × 12
        </Button>

        {selectedCell && (
          <Tag
            closable
            onClose={() => setSelectedCell(null)}
            color="success"
            style={{ marginLeft: 8, fontSize: 14, padding: '3px 10px' }}
          >
            {selectedCell.r} × {selectedCell.c} = {selectedCell.r * selectedCell.c}
          </Tag>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 20,
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${cellSize}px repeat(${size}, ${cellSize}px)`,
            gap: 3,
            width: 'fit-content',
          }}
          onMouseLeave={() => { setHoveredRow(null); setHoveredCol(null); }}
        >
          {/* Top-left corner */}
          <div
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 6,
              background: headerBg,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              color: PRIMARY,
              fontWeight: 700,
            }}
          >
            ×
          </div>

          {/* Column headers */}
          {Array.from({ length: size }, (_, i) => i + 1).map((c) => (
            <div
              key={`ch-${c}`}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 6,
                background: hoveredCol === c ? 'rgba(80,200,120,0.15)' : headerBg,
                border: `1px solid ${hoveredCol === c ? PRIMARY_BORDER : borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: hoveredCol === c ? PRIMARY : headerColor,
                transition: 'all 0.12s',
              }}
            >
              {c}
            </div>
          ))}

          {/* Data rows */}
          {Array.from({ length: size }, (_, ri) => ri + 1).map((r) => (
            <React.Fragment key={`row-${r}`}>
              {/* Row header */}
              <div
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 6,
                  background: hoveredRow === r ? 'rgba(80,200,120,0.15)' : headerBg,
                  border: `1px solid ${hoveredRow === r ? PRIMARY_BORDER : borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: hoveredRow === r ? PRIMARY : headerColor,
                  transition: 'all 0.12s',
                }}
              >
                {r}
              </div>

              {/* Data cells */}
              {Array.from({ length: size }, (_, ci) => ci + 1).map((c) => {
                const hl = getHighlightStyle(r, c);
                return (
                  <Tooltip
                    key={`cell-${r}-${c}`}
                    title={`${r} × ${c} = ${r * c}`}
                    mouseEnterDelay={0.4}
                  >
                    <div
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 6,
                        border: `1px solid ${selectedCell?.r === r && selectedCell?.c === c ? PRIMARY : borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        userSelect: 'none',
                        position: 'relative',
                        ...hl,
                      }}
                      onMouseEnter={() => { setHoveredRow(r); setHoveredCol(c); }}
                      onClick={() => {
                        setSelectedCell(prev =>
                          prev?.r === r && prev?.c === c ? null : { r, c }
                        );
                      }}
                    >
                      {r * c}
                    </div>
                  </Tooltip>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: isDark ? '#555' : '#aaa', fontSize: 12 }}>Màu sắc:</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => {
            const mapped = Math.round(1 + ((v - 1) / 7) * (maxVal - 1));
            return (
              <div
                key={v}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 3,
                  background: getCellColor(mapped, maxVal, isDark),
                  border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                }}
              />
            );
          })}
        </div>
        <span style={{ color: isDark ? '#555' : '#aaa', fontSize: 11 }}>Nhỏ → Lớn</span>
        <span style={{ color: isDark ? '#555' : '#aaa', fontSize: 11, marginLeft: 8 }}>
          · Click ô để xem công thức
        </span>
      </div>
    </div>
  );
}

// ─── Single Table View ────────────────────────────────────────────────────────
function SingleTableView({ isDark }: { isDark: boolean }) {
  const [tableNum, setTableNum] = useState(2);
  const [size, setSize] = useState<10 | 12>(10);
  const [speaking, setSpeaking] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const lineBg = isDark ? '#222222' : '#fafafa';
  const lineHoverBg = isDark ? 'rgba(80,200,120,0.08)' : 'rgba(80,200,120,0.06)';
  const textColor = isDark ? '#c9c9c9' : '#444';
  const mutedColor = isDark ? '#555' : '#bbb';

  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakFullTable(tableNum, size);
    // Animate line by line
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= size) {
        clearInterval(interval);
        setSpeaking(false);
        setHighlightLine(null);
        return;
      }
      setHighlightLine(idx + 1);
      idx++;
    }, 1100);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setHighlightLine(null);
  }, [tableNum, size]);

  return (
    <div>
      {/* Table selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: isDark ? '#888' : '#666', fontSize: 13, marginBottom: 10 }}>
          Chọn bảng:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              size="small"
              type={tableNum === n ? 'primary' : 'default'}
              onClick={() => setTableNum(n)}
              style={{
                width: 40,
                fontWeight: tableNum === n ? 700 : 400,
                ...(tableNum === n ? { background: PRIMARY, borderColor: PRIMARY } : {}),
              }}
            >
              {n}
            </Button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ color: isDark ? '#888' : '#666', fontSize: 13 }}>Đến:</span>
          <Button
            size="small"
            type={size === 10 ? 'primary' : 'default'}
            onClick={() => setSize(10)}
            style={size === 10 ? { background: PRIMARY, borderColor: PRIMARY } : {}}
          >
            × 10
          </Button>
          <Button
            size="small"
            type={size === 12 ? 'primary' : 'default'}
            onClick={() => setSize(12)}
            style={size === 12 ? { background: PRIMARY, borderColor: PRIMARY } : {}}
          >
            × 12
          </Button>

          <Button
            type={speaking ? 'default' : 'primary'}
            icon={<SoundOutlined />}
            onClick={handleSpeak}
            style={
              speaking
                ? { borderColor: '#ff7875', color: '#ff7875' }
                : { background: PRIMARY, borderColor: PRIMARY }
            }
          >
            {speaking ? 'Dừng' : 'Đọc to'}
          </Button>

          <Tooltip title="Nhấn từng dòng để nghe">
            <span style={{ color: mutedColor, fontSize: 12 }}>Hoặc nhấn vào từng dòng</span>
          </Tooltip>
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: 480,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: isDark ? '#181818' : '#f0fdf4',
            borderBottom: `1px solid ${cardBorder}`,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ color: PRIMARY, fontSize: 22, fontWeight: 800 }}>Bảng {tableNum}</span>
            <span style={{ color: mutedColor, fontSize: 13, marginLeft: 8 }}>
              ({tableNum} × 1 đến {tableNum} × {size})
            </span>
          </div>
          <Tag color="success" style={{ fontSize: 12 }}>
            {size} phép tính
          </Tag>
        </div>

        {/* Lines */}
        {Array.from({ length: size }, (_, i) => i + 1).map((i) => {
          const result = tableNum * i;
          const isHighlighted = highlightLine === i;
          return (
            <div
              key={i}
              onClick={() => speakVietnamese(tableNum, i, result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                borderBottom: i < size ? `1px solid ${isDark ? '#252525' : '#f0f0f0'}` : 'none',
                background: isHighlighted
                  ? 'rgba(80,200,120,0.12)'
                  : i % 2 === 0
                  ? lineBg
                  : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isHighlighted) (e.currentTarget as HTMLElement).style.background = lineHoverBg;
              }}
              onMouseLeave={(e) => {
                if (!isHighlighted)
                  (e.currentTarget as HTMLElement).style.background =
                    i % 2 === 0 ? lineBg : 'transparent';
              }}
            >
              <span style={{ width: 28, color: mutedColor, fontSize: 12, fontWeight: 600 }}>
                {i}.
              </span>

              {/* a × b */}
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 16 }}>
                <span style={{ color: PRIMARY, fontWeight: 700 }}>{tableNum}</span>
                <span style={{ color: mutedColor, margin: '0 8px' }}>×</span>
                <span style={{ color: textColor, fontWeight: 600 }}>{i}</span>
                <span style={{ color: mutedColor, margin: '0 8px' }}>=</span>
                <span
                  style={{
                    color: isHighlighted ? PRIMARY : textColor,
                    fontWeight: 800,
                    fontSize: 18,
                    transition: 'color 0.2s',
                  }}
                >
                  {result}
                </span>
              </span>

              {/* Speaker icon hint */}
              <SoundOutlined
                style={{
                  color: isHighlighted ? PRIMARY : mutedColor,
                  fontSize: 13,
                  opacity: isHighlighted ? 1 : 0.4,
                  transition: 'all 0.2s',
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, color: mutedColor, fontSize: 12 }}>
        * Yêu cầu trình duyệt hỗ trợ Web Speech API (Chrome, Edge khuyến nghị)
      </div>
    </div>
  );
}

// ─── Practice / Quiz Mode ─────────────────────────────────────────────────────
function PracticeView({ isDark }: { isDark: boolean }) {
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [phase, setPhase] = useState<'config' | 'quiz' | 'result'>('config');

  // Quiz state
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const mutedColor = isDark ? '#555' : '#bbb';
  const textColor = isDark ? '#c9c9c9' : '#444';
  const configBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const startQuiz = useCallback(() => {
    if (selectedTables.length === 0) return;
    const q = generateQuestion(selectedTables);
    setQuestion(q);
    setUserInput('');
    setFeedback(null);
    setResults([]);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(timerDuration);
    setQuestionStartTime(Date.now());
    setPhase('quiz');

    if (timerEnabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setPhase('result');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }, [selectedTables, timerEnabled, timerDuration]);

  const nextQuestion = useCallback(
    (currentResults: QuizResult[], currentScore: { correct: number; total: number }) => {
      const q = generateQuestion(selectedTables);
      setQuestion(q);
      setUserInput('');
      setFeedback(null);
      setQuestionStartTime(Date.now());
      setTimeout(() => inputRef.current?.focus(), 50);

      if (!timerEnabled && currentScore.total >= 20) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('result');
      }
    },
    [selectedTables, timerEnabled]
  );

  const handleSubmit = useCallback(() => {
    if (!question || feedback !== null) return;
    const val = parseInt(userInput.trim(), 10);
    if (isNaN(val)) return;

    const correct = val === question.answer;
    const timeMs = Date.now() - questionStartTime;

    const result: QuizResult = {
      question,
      userAnswer: val,
      correct,
      timeMs,
    };

    const newResults = [...results, result];
    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    };

    setResults(newResults);
    setScore(newScore);
    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((m) => Math.max(m, newStreak));
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      nextQuestion(newResults, newScore);
    }, correct ? 600 : 1200);
  }, [question, feedback, userInput, questionStartTime, results, score, streak, nextQuestion]);

  useEffect(() => {
    if (phase === 'quiz') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Keyboard enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // ── Config screen ──
  if (phase === 'config') {
    return (
      <div>
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 28,
            maxWidth: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <SettingOutlined style={{ color: PRIMARY, fontSize: 18 }} />
            <span style={{ color: isDark ? '#e0e0e0' : '#222', fontSize: 17, fontWeight: 700 }}>
              Cấu hình luyện tập
            </span>
          </div>

          {/* Table selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: isDark ? '#aaa' : '#555', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Chọn bảng để luyện tập:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                const checked = selectedTables.includes(n);
                return (
                  <div
                    key={n}
                    onClick={() => {
                      setSelectedTables((prev) =>
                        checked ? prev.filter((x) => x !== n) : [...prev, n]
                      );
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      border: `2px solid ${checked ? PRIMARY : (isDark ? '#333' : '#ddd')}`,
                      background: checked ? PRIMARY_BG : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: checked ? 700 : 500,
                      color: checked ? PRIMARY : textColor,
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button
                size="small"
                onClick={() => setSelectedTables(Array.from({ length: 12 }, (_, i) => i + 1))}
              >
                Chọn tất cả
              </Button>
              <Button size="small" onClick={() => setSelectedTables([])}>
                Bỏ chọn
              </Button>
            </div>
          </div>

          {/* Timer settings */}
          <div
            style={{
              background: configBg,
              border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: timerEnabled ? 12 : 0 }}>
              <Checkbox
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                style={{ color: textColor }}
              >
                <span style={{ color: textColor, fontSize: 13 }}>Bật hẹn giờ</span>
              </Checkbox>
              <ClockCircleOutlined style={{ color: mutedColor, fontSize: 14 }} />
            </div>
            {timerEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 24 }}>
                <span style={{ color: mutedColor, fontSize: 13 }}>Thời gian:</span>
                <InputNumber
                  min={10}
                  max={300}
                  value={timerDuration}
                  onChange={(v) => setTimerDuration(v ?? 60)}
                  style={{ width: 90 }}
                  addonAfter="giây"
                />
              </div>
            )}
            {!timerEnabled && (
              <div style={{ paddingLeft: 24, color: mutedColor, fontSize: 12 }}>
                Không hẹn giờ · Dừng sau 20 câu
              </div>
            )}
          </div>

          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={startQuiz}
            disabled={selectedTables.length === 0}
            style={{
              background: PRIMARY,
              borderColor: PRIMARY,
              height: 48,
              fontSize: 15,
              fontWeight: 700,
              paddingInline: 32,
            }}
          >
            Bắt đầu luyện tập
          </Button>
          {selectedTables.length === 0 && (
            <div style={{ color: '#ff7875', fontSize: 12, marginTop: 8 }}>
              Vui lòng chọn ít nhất 1 bảng
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Result screen ──
  if (phase === 'result') {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const wrongResults = results.filter((r) => !r.correct);
    const tableErrors: Record<number, number> = {};
    wrongResults.forEach((r) => {
      tableErrors[r.question.a] = (tableErrors[r.question.a] ?? 0) + 1;
    });
    const weakTables = Object.entries(tableErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const grade =
      pct >= 90 ? { label: 'Xuất sắc', color: '#50C878', icon: '🏆' } :
      pct >= 70 ? { label: 'Giỏi', color: '#52c41a', icon: '⭐' } :
      pct >= 50 ? { label: 'Trung bình', color: '#faad14', icon: '📚' } :
      { label: 'Cần cố gắng', color: '#ff7875', icon: '💪' };

    return (
      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            background: cardBg,
            border: `2px solid ${grade.color}`,
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>{grade.icon}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: grade.color, marginBottom: 4 }}>
            {grade.label}
          </div>
          <div style={{ color: mutedColor, fontSize: 14, marginBottom: 24 }}>
            Đã hoàn thành luyện tập
          </div>

          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Statistic
                title={<span style={{ color: mutedColor, fontSize: 12 }}>Đúng</span>}
                value={score.correct}
                valueStyle={{ color: PRIMARY, fontWeight: 700 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span style={{ color: mutedColor, fontSize: 12 }}>Tổng câu</span>}
                value={score.total}
                valueStyle={{ color: isDark ? '#e0e0e0' : '#222', fontWeight: 700 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span style={{ color: mutedColor, fontSize: 12 }}>Streak tốt nhất</span>}
                value={maxStreak}
                valueStyle={{ color: '#faad14', fontWeight: 700 }}
                prefix={<FireOutlined />}
              />
            </Col>
          </Row>

          <Progress
            percent={pct}
            strokeColor={grade.color}
            trailColor={isDark ? '#2a2a2a' : '#f0f0f0'}
            format={(p) => `${p}%`}
            strokeWidth={12}
          />
        </div>

        {weakTables.length > 0 && (
          <div
            style={{
              background: cardBg,
              border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ color: isDark ? '#e0e0e0' : '#222', fontWeight: 700, marginBottom: 12 }}>
              Bảng cần ôn thêm:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {weakTables.map(([table, count]) => (
                <Tag key={table} color="warning" style={{ fontSize: 13, padding: '4px 10px' }}>
                  Bảng {table} ({count} sai)
                </Tag>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={startQuiz}
            style={{ background: PRIMARY, borderColor: PRIMARY, flex: 1 }}
          >
            Luyện tập lại
          </Button>
          <Button onClick={() => setPhase('config')} style={{ flex: 1 }}>
            Cấu hình lại
          </Button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ──
  const progress = timerEnabled
    ? Math.round((timeLeft / timerDuration) * 100)
    : score.total > 0
    ? Math.round((score.total / 20) * 100)
    : 0;

  const timerColor =
    timeLeft > timerDuration * 0.5
      ? PRIMARY
      : timeLeft > timerDuration * 0.25
      ? '#faad14'
      : '#ff7875';

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge
            count={score.correct}
            showZero
            style={{ backgroundColor: PRIMARY }}
          >
            <div
              style={{
                background: PRIMARY_BG,
                border: `1px solid ${PRIMARY_BORDER}`,
                borderRadius: 8,
                padding: '6px 14px',
                color: PRIMARY,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {score.correct} / {score.total}
            </div>
          </Badge>

          {streak >= 3 && (
            <Tag color="warning" icon={<FireOutlined />} style={{ fontSize: 13 }}>
              {streak} streak!
            </Tag>
          )}
        </div>

        {timerEnabled ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: timerColor, fontSize: 16 }} />
            <span style={{ color: timerColor, fontSize: 22, fontWeight: 800, minWidth: 36 }}>
              {timeLeft}
            </span>
            <span style={{ color: mutedColor, fontSize: 13 }}>giây</span>
          </div>
        ) : (
          <div style={{ color: mutedColor, fontSize: 13 }}>
            Câu {score.total + 1} / 20
          </div>
        )}

        <Button size="small" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('config'); }}>
          Thoát
        </Button>
      </div>

      {/* Progress bar */}
      <Progress
        percent={progress}
        showInfo={false}
        strokeColor={timerEnabled ? timerColor : PRIMARY}
        trailColor={isDark ? '#2a2a2a' : '#f0f0f0'}
        style={{ marginBottom: 28 }}
        strokeWidth={6}
      />

      {/* Question card */}
      <div
        style={{
          background: cardBg,
          border: `2px solid ${
            feedback === 'correct' ? PRIMARY :
            feedback === 'wrong' ? '#ff7875' :
            cardBorder
          }`,
          borderRadius: 20,
          padding: '40px 32px',
          textAlign: 'center',
          maxWidth: 440,
          margin: '0 auto',
          transition: 'border-color 0.2s',
          boxShadow: feedback === 'correct'
            ? `0 0 32px rgba(80,200,120,0.2)`
            : feedback === 'wrong'
            ? `0 0 32px rgba(255,120,117,0.15)`
            : 'none',
        }}
      >
        {question && (
          <>
            {/* Question */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: isDark ? '#e8e8e8' : '#111',
                marginBottom: 32,
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
              }}
            >
              <span style={{ color: PRIMARY }}>{question.a}</span>
              <span style={{ color: mutedColor, margin: '0 12px' }}>×</span>
              <span>{question.b}</span>
              <span style={{ color: mutedColor, margin: '0 12px' }}>=</span>
              <span style={{ color: isDark ? '#555' : '#ccc' }}>?</span>
            </div>

            {/* Input */}
            <Input
              ref={(el) => {
                inputRef.current = el?.input ?? null;
              }}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập đáp án..."
              size="large"
              disabled={feedback !== null}
              style={{
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 700,
                height: 64,
                borderRadius: 12,
                borderColor: feedback === 'correct' ? PRIMARY : feedback === 'wrong' ? '#ff7875' : undefined,
                marginBottom: 20,
              }}
              autoComplete="off"
            />

            {/* Feedback */}
            {feedback === 'correct' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: PRIMARY,
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                <CheckOutlined /> Chính xác!
              </div>
            )}
            {feedback === 'wrong' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#ff7875',
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                <CloseOutlined />
                Sai rồi! Đáp án đúng là{' '}
                <span style={{ fontSize: 20, fontWeight: 800 }}>{question.answer}</span>
              </div>
            )}

            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              disabled={feedback !== null || !userInput.trim()}
              style={{
                background: PRIMARY,
                borderColor: PRIMARY,
                width: '100%',
                height: 48,
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
              }}
            >
              Kiểm tra (Enter)
            </Button>
          </>
        )}
      </div>

      {/* Recent results mini-log */}
      {results.length > 0 && (
        <div style={{ marginTop: 24, maxWidth: 440, margin: '24px auto 0' }}>
          <div style={{ color: mutedColor, fontSize: 12, marginBottom: 8 }}>
            5 câu gần nhất:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {results.slice(-5).map((r, idx) => (
              <Tooltip
                key={idx}
                title={`${r.question.a} × ${r.question.b} = ${r.question.answer} | Bạn: ${r.userAnswer}`}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: r.correct ? PRIMARY_BG : 'rgba(255,120,117,0.1)',
                    border: `1px solid ${r.correct ? PRIMARY_BORDER : 'rgba(255,120,117,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}
                >
                  {r.correct ? (
                    <CheckOutlined style={{ color: PRIMARY }} />
                  ) : (
                    <CloseOutlined style={{ color: '#ff7875' }} />
                  )}
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────
export default function MultiplicationTableTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const tabItems = [
    {
      key: 'full',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrophyOutlined />
          Bảng đầy đủ
        </span>
      ),
      children: <FullTableView isDark={isDark} />,
    },
    {
      key: 'single',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SoundOutlined />
          Xem từng bảng
        </span>
      ),
      children: <SingleTableView isDark={isDark} />,
    },
    {
      key: 'practice',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltOutlined />
          Luyện tập
        </span>
      ),
      children: <PracticeView isDark={isDark} />,
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Tabs
        defaultActiveKey="full"
        items={tabItems}
        size="large"
        style={{ width: '100%' }}
        tabBarStyle={{ marginBottom: 24 }}
      />
    </div>
  );
}
