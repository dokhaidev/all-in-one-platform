'use client';

import React, { useState } from 'react';
import { message, Tag, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

type Mode = 'sleep' | 'wake';

interface SleepResult {
  time: string;       // HH:MM
  isNextDay: boolean;
  cycles: number;
  totalHours: number;
  recommended: boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcSleepTimes(wakeHHMM: string): SleepResult[] {
  const wakeMin = parseTime(wakeHHMM);
  return [6, 5, 4, 3, 2, 1].map((cycles) => {
    const sleepMin = wakeMin - cycles * 90 - 15;
    const isNextDay = sleepMin < 0 || sleepMin >= 1440;
    return {
      time: formatMinutes(sleepMin),
      isNextDay: !isNextDay, // sleep before wake → "today" in the sense user sleeps tonight
      cycles,
      totalHours: cycles * 1.5,
      recommended: cycles >= 4,
    };
  });
}

function calcWakeTimes(sleepHHMM: string): SleepResult[] {
  const sleepMin = parseTime(sleepHHMM);
  return [6, 5, 4, 3, 2, 1].map((cycles) => {
    const wakeMin = sleepMin + cycles * 90 + 15;
    const isNextDay = wakeMin >= 1440;
    return {
      time: formatMinutes(wakeMin),
      isNextDay,
      cycles,
      totalHours: cycles * 1.5,
      recommended: cycles >= 4,
    };
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface ResultCardProps {
  result: SleepResult;
  isDark: boolean;
}

function ResultCard({ result, isDark }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = result.recommended
    ? '1.5px solid #50C878'
    : isDark
    ? '1px solid #272727'
    : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const btnBg = isDark ? '#272727' : '#f5f5f5';
  const btnHoverBg = isDark ? '#333' : '#e8f8ed';

  const handleCopy = () => {
    navigator.clipboard.writeText(result.time).then(() => {
      setCopied(true);
      message.success(`Đã sao chép ${result.time}`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 12,
        padding: '18px 20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        boxShadow: result.recommended
          ? '0 0 0 1px rgba(80,200,120,0.15), 0 2px 12px rgba(80,200,120,0.08)'
          : isDark
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Badge */}
      {result.recommended && (
        <div style={{ position: 'absolute', top: -1, right: 14 }}>
          <Tag
            color="#50C878"
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              background: '#50C878',
              border: 'none',
              borderRadius: '0 0 6px 6px',
              padding: '2px 8px',
              letterSpacing: '0.02em',
            }}
          >
            Được Đề Xuất
          </Tag>
        </div>
      )}

      {/* Time + Day */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: result.recommended ? '#50C878' : textColor,
              lineHeight: 1,
              letterSpacing: '-0.5px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {result.time}
          </div>
          <div style={{ fontSize: 11, color: subColor, marginTop: 4 }}>
            {result.isNextDay ? 'Ngày Mai' : 'Hôm Nay'}
          </div>
        </div>

        {/* Cycles + Hours */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: subColor, lineHeight: 1.5 }}>
            <span style={{ color: result.recommended ? '#50C878' : textColor, fontWeight: 600 }}>
              {result.cycles}
            </span>{' '}
            chu kỳ
          </div>
          <div style={{ fontSize: 12, color: subColor, lineHeight: 1.5 }}>
            <span style={{ color: result.recommended ? '#50C878' : textColor, fontWeight: 600 }}>
              {result.totalHours % 1 === 0 ? result.totalHours.toFixed(0) : result.totalHours.toFixed(1)}
            </span>{' '}
            giờ
          </div>
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          marginTop: 4,
          width: '100%',
          padding: '7px 0',
          background: btnBg,
          border: isDark ? '1px solid #333' : '1px solid #e0e0e0',
          borderRadius: 7,
          cursor: 'pointer',
          fontSize: 12,
          color: subColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = btnHoverBg;
          (e.currentTarget as HTMLButtonElement).style.color = '#50C878';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = btnBg;
          (e.currentTarget as HTMLButtonElement).style.color = subColor;
        }}
      >
        {copied ? <CheckCircleOutlined style={{ color: '#50C878' }} /> : <CopyOutlined />}
        {copied ? 'Đã sao chép!' : 'Sao Chép Thời Gian'}
      </button>
    </div>
  );
}

// ─── Educational section ─────────────────────────────────────────────────────

interface EduCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}

function EduCard({ icon, title, children, isDark }: EduCardProps) {
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 12,
        padding: '20px 22px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: '#50C878', fontSize: 18 }}>{icon}</span>
        <span style={{ color: textColor, fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ color: isDark ? '#a0a0a0' : '#555', fontSize: 13, lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SleepCalculatorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [mode, setMode] = useState<Mode>('sleep');
  const [timeInput, setTimeInput] = useState('07:00');

  const results =
    mode === 'sleep' ? calcSleepTimes(timeInput) : calcWakeTimes(timeInput);

  // ─── theme tokens ─────────────────────────────────────────────────────────
  const outerBg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';

  const modeSleepActive = mode === 'sleep';
  const modeWakeActive = mode === 'wake';

  // ─── mode card style ──────────────────────────────────────────────────────
  const modeCardStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '18px 20px',
    borderRadius: 12,
    border: active ? '2px solid #50C878' : cardBorder,
    background: active
      ? isDark
        ? 'rgba(80,200,120,0.06)'
        : 'rgba(80,200,120,0.04)'
      : cardBg,
    cursor: 'pointer',
    transition: 'border 0.18s, background 0.18s, box-shadow 0.18s',
    boxShadow: active
      ? '0 0 0 1px rgba(80,200,120,0.15)'
      : 'none',
    userSelect: 'none',
  });

  return (
    <div style={{ width: '100%' }}>

      {/* ── Mode selector ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {/* Card 1 */}
        <div style={modeCardStyle(modeSleepActive)} onClick={() => setMode('sleep')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ClockCircleOutlined
              style={{ fontSize: 22, color: modeSleepActive ? '#50C878' : subColor }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: modeSleepActive ? '#50C878' : textColor,
              }}
            >
              Tính Thời Gian Ngủ
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: subColor, lineHeight: 1.6 }}>
            Nhập giờ thức dậy mong muốn, tính ngược lại thời điểm nên đi ngủ.
          </p>
        </div>

        {/* Card 2 */}
        <div style={modeCardStyle(modeWakeActive)} onClick={() => setMode('wake')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ThunderboltOutlined
              style={{ fontSize: 22, color: modeWakeActive ? '#50C878' : subColor }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: modeWakeActive ? '#50C878' : textColor,
              }}
            >
              Tính Thời Gian Thức Dậy
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: subColor, lineHeight: 1.6 }}>
            Nhập giờ đi ngủ, tính các khung giờ thức dậy phù hợp nhất.
          </p>
        </div>
      </div>

      {/* ── Time input panel ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 28,
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: subColor,
            marginBottom: 10,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {mode === 'sleep' ? 'Thời Gian Thức Dậy' : 'Thời Gian Đi Ngủ'}
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#50C878',
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: 10,
              padding: '10px 18px',
              outline: 'none',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              colorScheme: isDark ? 'dark' : 'light',
            }}
          />
          <span style={{ fontSize: 13, color: subColor }}>
            {mode === 'sleep'
              ? 'Chọn thời gian bạn muốn thức dậy'
              : 'Chọn thời gian bạn dự định đi ngủ'}
          </span>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textColor }}>
            {mode === 'sleep'
              ? `Nên đi ngủ lúc — thức dậy ${timeInput}`
              : `Nên thức dậy lúc — ngủ từ ${timeInput}`}
          </h2>
          <Tooltip title="Dựa trên chu kỳ giấc ngủ 90 phút + 15 phút để chìm vào giấc ngủ">
            <QuestionCircleOutlined style={{ color: subColor, fontSize: 15, cursor: 'pointer' }} />
          </Tooltip>
        </div>

        {/* 2 rows × 3 cols grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {results.map((r) => (
            <ResultCard key={r.cycles} result={r} isDark={isDark} />
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: subColor,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: '#50C878',
              flexShrink: 0,
            }}
          />
          Viền xanh = được khuyến nghị (4–6 chu kỳ ngủ, ngủ đủ 6–9 giờ)
        </div>
      </div>

      {/* ── Educational section ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <BulbOutlined style={{ color: '#50C878', fontSize: 18 }} />
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textColor }}>
            Về Chu Kỳ Giấc Ngủ
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <EduCard icon={<QuestionCircleOutlined />} title="Chu Kỳ Giấc Ngủ Là Gì?" isDark={isDark}>
            Mỗi chu kỳ giấc ngủ kéo dài khoảng{' '}
            <strong style={{ color: '#50C878' }}>90 phút</strong> và bao gồm các giai đoạn:
            ngủ nông (N1, N2), ngủ sâu (N3) và giấc ngủ mắt chuyển động nhanh{' '}
            <strong style={{ color: '#50C878' }}>REM</strong>. Thức dậy ở cuối một chu kỳ
            hoàn chỉnh giúp bạn cảm thấy tỉnh táo và sảng khoái hơn nhiều so với bị
            gián đoạn giữa chu kỳ.
          </EduCard>

          <EduCard icon={<ClockCircleOutlined />} title="Tại Sao Là 90 Phút?" isDark={isDark}>
            Chu kỳ 90 phút dựa trên{' '}
            <strong style={{ color: '#50C878' }}>nhịp điệu tự nhiên của não</strong> — được
            gọi là nhịp sinh học siêu ngày (ultradian rhythm). Nghiên cứu của Nathaniel
            Kleitman và cộng sự đã xác nhận con người trải qua các chu kỳ 90–110 phút
            này trong suốt đêm ngủ. Mỗi giai đoạn đóng vai trò quan trọng: ngủ sâu phục
            hồi thể chất, REM củng cố trí nhớ và cảm xúc.
          </EduCard>
        </div>

        <EduCard icon={<ThunderboltOutlined />} title="Mẹo Ngủ Ngon" isDark={isDark}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <strong style={{ color: '#50C878' }}>Giữ lịch ngủ cố định</strong> — thức
              dậy và đi ngủ cùng một giờ mỗi ngày, kể cả cuối tuần, để đồng hồ sinh học
              hoạt động ổn định.
            </li>
            <li>
              <strong style={{ color: '#50C878' }}>Tắt màn hình 30–60 phút trước khi ngủ</strong>{' '}
              — ánh sáng xanh từ điện thoại và máy tính ức chế sản xuất melatonin, khiến
              bạn khó ngủ hơn.
            </li>
            <li>
              <strong style={{ color: '#50C878' }}>Giữ phòng ngủ mát, tối và yên tĩnh</strong>{' '}
              — nhiệt độ lý tưởng khoảng 18–22°C. Rèm cản sáng và nút tai có thể hỗ trợ
              nếu môi trường ồn ào.
            </li>
            <li>
              <strong style={{ color: '#50C878' }}>Tránh caffeine sau 14:00</strong> —
              caffeine có thể tồn tại trong cơ thể lên đến 6–8 giờ, làm trì hoãn thời
              gian chìm vào giấc ngủ.
            </li>
            <li>
              <strong style={{ color: '#50C878' }}>Thư giãn trước khi ngủ</strong> — thiền,
              đọc sách, tắm nước ấm hoặc thở sâu giúp hạ nhiệt độ cơ thể và kích hoạt
              trạng thái thư giãn của hệ thần kinh.
            </li>
          </ul>
        </EduCard>
      </div>
    </div>
  );
}
