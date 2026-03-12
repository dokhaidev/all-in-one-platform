'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, InputNumber, Input, Tooltip } from 'antd';
import {
  CaretRightOutlined,
  PauseOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SoundOutlined,
  MutedOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#50C878';
const AMBER = '#f59e0b';
const RED = '#ef4444';

const QUICK_PRESETS = [15, 30, 45, 60, 90];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h)}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatCurrentDateTime(): string {
  const now = new Date();
  return now.toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function playBeep(freq = 880, duration = 0.3, volume = 0.3) {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playMultiBeep(count: number, freq: number, vol: number) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => playBeep(freq, 0.25, vol), i * 350);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExamTimerTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const panelBg = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const sectionHeaderColor = isDark ? '#e0e0e0' : '#111111';
  const bodyText = isDark ? '#c9c9c9' : '#1a1a1a';
  const mutedText = isDark ? '#888' : '#999';
  const inputBg = isDark ? '#141414' : '#f9fafb';
  const progressBg = isDark ? '#2a2a2a' : '#e8e8e8';
  const chipBg = isDark ? '#252525' : '#f0f0f0';
  const chipActiveBg = isDark ? '#2d4a35' : '#d1fae5';
  const kbdBg = isDark ? '#2a2a2a' : '#f0f0f0';
  const kbdBorder = isDark ? '#444' : '#ccc';
  const kbdColor = isDark ? '#aaa' : '#555';

  // ── State ─────────────────────────────────────────────────────────────────
  const [examTitle, setExamTitle] = useState('Kiểm tra Toán học kỳ 1');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [warningMinutes, setWarningMinutes] = useState(5);
  const [soundOn, setSoundOn] = useState(true);

  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const [totalSeconds, setTotalSeconds] = useState(45 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [warnedAt5, setWarnedAt5] = useState(false);
  const [warnedAt1, setWarnedAt1] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // ── Refs ──────────────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(secondsLeft);
  const soundRef = useRef(soundOn);
  const warnedAt5Ref = useRef(warnedAt5);
  const warnedAt1Ref = useRef(warnedAt1);
  const warningMinutesRef = useRef(warningMinutes);

  secondsRef.current = secondsLeft;
  soundRef.current = soundOn;
  warnedAt5Ref.current = warnedAt5;
  warnedAt1Ref.current = warnedAt1;
  warningMinutesRef.current = warningMinutes;

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setCurrentDateTime(formatCurrentDateTime());
    clockRef.current = setInterval(() => {
      setCurrentDateTime(formatCurrentDateTime());
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  // ── Notification permission ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ── Fullscreen detection ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Timer tick ────────────────────────────────────────────────────────────
  const handleFinish = useCallback(() => {
    setRunning(false);
    setFinished(true);
    if (soundRef.current) {
      // Sustained multi-beep
      for (let i = 0; i < 6; i++) {
        setTimeout(() => playBeep(660, 0.5, 0.5), i * 400);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('HẾT GIỜ! ⏰', {
          body: 'Thời gian thi đã kết thúc.',
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const current = secondsRef.current;

      // Warning at custom warning time
      const warnSecs = warningMinutesRef.current * 60;
      if (!warnedAt5Ref.current && current <= warnSecs && current > 0) {
        setWarnedAt5(true);
        if (soundRef.current) playMultiBeep(2, 880, 0.3);
      }

      // Warning at 1 minute
      if (!warnedAt1Ref.current && current <= 60 && current > 0) {
        setWarnedAt1(true);
        if (soundRef.current) playMultiBeep(3, 1100, 0.4);
      }

      if (current <= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setSecondsLeft(0);
        handleFinish();
      } else {
        setSecondsLeft(current - 1);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStartPause = useCallback(() => {
    if (finished) return;
    setRunning((r) => !r);
  }, [finished]);

  const handleReset = useCallback(() => {
    setRunning(false);
    setFinished(false);
    setWarnedAt5(false);
    setWarnedAt1(false);
    const total = (hours * 3600) + (minutes * 60);
    setSecondsLeft(total);
    setTotalSeconds(total);
  }, [hours, minutes]);

  const handlePreset = useCallback((mins: number) => {
    setRunning(false);
    setFinished(false);
    setWarnedAt5(false);
    setWarnedAt1(false);
    setHours(0);
    setMinutes(mins);
    const total = mins * 60;
    setSecondsLeft(total);
    setTotalSeconds(total);
  }, []);

  const handleApplyDuration = useCallback(() => {
    if (running) return;
    setFinished(false);
    setWarnedAt5(false);
    setWarnedAt1(false);
    const total = (hours * 3600) + (minutes * 60);
    setSecondsLeft(total);
    setTotalSeconds(total);
  }, [hours, minutes, running]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFullscreen();
      } else if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleStartPause, handleReset, handleFullscreen]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const isWarning = secondsLeft <= warningMinutes * 60 && secondsLeft > 60 && !finished;
  const isDanger = secondsLeft <= 60 && !finished;

  const timerColor = finished
    ? RED
    : isDanger
    ? RED
    : isWarning
    ? AMBER
    : isDark
    ? '#ffffff'
    : '#111111';

  const progressColor = finished ? RED : isDanger ? RED : isWarning ? AMBER : PRIMARY;

  // ─── FULLSCREEN MODE ──────────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          cursor: 'default',
          userSelect: 'none',
        }}
        onClick={(e) => {
          // Don't exit on button clicks
          if ((e.target as HTMLElement).closest('button')) return;
        }}
      >
        {/* Timer display */}
        <div
          style={{
            fontSize: '20vw',
            fontWeight: 900,
            color: timerColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            animation: (isDanger && running && !finished) ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          {finished ? 'HẾT GIỜ' : formatTime(secondsLeft)}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '80vw',
            height: 8,
            background: '#1a1a1a',
            borderRadius: 4,
            marginTop: '3vw',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: progressColor,
              borderRadius: 4,
              transition: running ? 'width 1s linear' : 'none',
            }}
          />
        </div>

        {/* Exam title */}
        {examTitle && (
          <div
            style={{
              fontSize: '3.5vw',
              color: '#888',
              marginTop: '2vw',
              letterSpacing: '0.04em',
              textAlign: 'center',
              maxWidth: '80vw',
            }}
          >
            {examTitle}
          </div>
        )}

        {/* Date/time */}
        <div style={{ fontSize: '1.4vw', color: '#444', marginTop: '1.5vw' }}>
          {currentDateTime}
        </div>

        {/* Corner controls */}
        <div
          style={{
            position: 'fixed',
            bottom: '3vh',
            right: '3vw',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <button
            onClick={handleStartPause}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#ccc',
              padding: '8px 18px',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {running ? <PauseOutlined /> : <CaretRightOutlined />}
            {running ? 'Tạm dừng' : 'Tiếp tục'}
          </button>
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#ccc',
              padding: '8px 14px',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ReloadOutlined />
            Đặt lại
          </button>
          <button
            onClick={handleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#ccc',
              padding: '8px 14px',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FullscreenExitOutlined />
            Thoát
          </button>
        </div>

        {/* Pulse animation keyframes */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.55; }
          }
        `}</style>
      </div>
    );
  }

  // ─── NORMAL MODE ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        width: '100%',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      {/* ── LEFT PANEL — Controls ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: '1 1 320px',
          minWidth: 290,
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          borderRadius: 12,
          padding: '22px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HourglassOutlined style={{ fontSize: 16, color: PRIMARY }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
            Cài đặt đồng hồ
          </span>
        </div>

        {/* Exam title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: bodyText, fontWeight: 600 }}>
            Tên bài thi / kiểm tra
          </label>
          <Input
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="Kiểm tra Toán học kỳ 1"
            style={{ background: inputBg, borderRadius: 8 }}
            disabled={running}
          />
        </div>

        {/* Duration inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: bodyText, fontWeight: 600 }}>
            Thời gian thi
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <InputNumber
                min={0}
                max={9}
                value={hours}
                onChange={(v) => setHours(v ?? 0)}
                style={{ width: '100%', background: inputBg }}
                disabled={running}
                onBlur={handleApplyDuration}
                onPressEnter={handleApplyDuration}
              />
              <span style={{ fontSize: 13, color: mutedText, whiteSpace: 'nowrap' }}>giờ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <InputNumber
                min={0}
                max={59}
                value={minutes}
                onChange={(v) => setMinutes(v ?? 0)}
                style={{ width: '100%', background: inputBg }}
                disabled={running}
                onBlur={handleApplyDuration}
                onPressEnter={handleApplyDuration}
              />
              <span style={{ fontSize: 13, color: mutedText, whiteSpace: 'nowrap' }}>phút</span>
            </div>
          </div>
        </div>

        {/* Warning time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: bodyText, fontWeight: 600 }}>
            Cảnh báo khi còn
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InputNumber
              min={1}
              max={30}
              value={warningMinutes}
              onChange={(v) => setWarningMinutes(v ?? 5)}
              style={{ width: 90, background: inputBg }}
            />
            <span style={{ fontSize: 13, color: mutedText }}>phút</span>
          </div>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: bodyText, fontWeight: 600 }}>
            Thời gian nhanh
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_PRESETS.map((p) => {
              const isActive = !hours && minutes === p && totalSeconds === p * 60;
              return (
                <button
                  key={p}
                  onClick={() => handlePreset(p)}
                  disabled={running}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 20,
                    border: `1px solid ${isActive ? PRIMARY : (isDark ? '#333' : '#ddd')}`,
                    background: isActive ? chipActiveBg : chipBg,
                    color: isActive ? PRIMARY : mutedText,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: running ? 'not-allowed' : 'pointer',
                    opacity: running ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {p} phút
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Start / Pause / Resume */}
          <Button
            type="primary"
            size="large"
            icon={running ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={handleStartPause}
            disabled={finished || secondsLeft === 0}
            style={{
              flex: 2,
              minWidth: 120,
              height: 44,
              fontSize: 15,
              fontWeight: 700,
              background: running ? AMBER : PRIMARY,
              borderColor: running ? AMBER : PRIMARY,
              color: '#fff',
            }}
          >
            {running ? 'Tạm dừng' : secondsLeft < totalSeconds && !finished ? 'Tiếp tục' : 'Bắt đầu'}
          </Button>
          {/* Reset */}
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={handleReset}
            style={{ flex: 1, height: 44, minWidth: 90 }}
          >
            Đặt lại
          </Button>
        </div>

        {/* Fullscreen + Sound row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            size="middle"
            icon={<FullscreenOutlined />}
            onClick={handleFullscreen}
            style={{ flex: 1 }}
          >
            Toàn màn hình
          </Button>
          <Tooltip title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}>
            <Button
              size="middle"
              icon={soundOn ? <SoundOutlined /> : <MutedOutlined />}
              onClick={() => setSoundOn((v) => !v)}
              style={{
                color: soundOn ? PRIMARY : mutedText,
                borderColor: soundOn ? `${PRIMARY}66` : undefined,
              }}
            >
              {soundOn ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            </Button>
          </Tooltip>
        </div>

        {/* Keyboard hint */}
        <p style={{ fontSize: 12, color: mutedText, margin: 0, textAlign: 'center', lineHeight: 1.8 }}>
          Phím tắt:{' '}
          <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: kbdColor }}>Space</kbd>
          {' '}(Bắt đầu/Tạm dừng) ·{' '}
          <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: kbdColor }}>R</kbd>
          {' '}(Đặt lại) ·{' '}
          <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: kbdColor }}>F</kbd>
          {' '}(Toàn màn hình)
        </p>
      </div>

      {/* ── RIGHT PANEL — Timer display ───────────────────────────────────────── */}
      <div
        style={{
          flex: '2 1 380px',
          minWidth: 320,
          background: panelBg,
          border: `1px solid ${finished ? RED : isWarning || isDanger ? (isDanger ? RED : AMBER) : panelBorder}`,
          borderRadius: 12,
          padding: '32px 28px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transition: 'border-color 0.4s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow when warning/danger */}
        {(isWarning || isDanger || finished) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: finished || isDanger
                ? 'radial-gradient(ellipse at center top, rgba(239,68,68,0.06) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center top, rgba(245,158,11,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
              borderRadius: 12,
            }}
          />
        )}

        {/* Status badge */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: finished ? RED : isDanger ? RED : isWarning ? AMBER : running ? PRIMARY : mutedText,
            padding: '3px 12px',
            borderRadius: 20,
            border: `1px solid ${finished ? `${RED}44` : isDanger ? `${RED}44` : isWarning ? `${AMBER}44` : running ? `${PRIMARY}44` : (isDark ? '#2a2a2a' : '#e0e0e0')}`,
            background: finished ? `${RED}11` : isDanger ? `${RED}11` : isWarning ? `${AMBER}11` : running ? `${PRIMARY}11` : 'transparent',
            transition: 'all 0.3s ease',
          }}
        >
          {finished ? 'Hết giờ' : isDanger ? 'Sắp hết giờ!' : isWarning ? `Còn ${warningMinutes} phút — Cảnh báo!` : running ? 'Đang đếm ngược' : 'Sẵn sàng'}
        </div>

        {/* Main time display */}
        <div
          style={{
            fontSize: 'clamp(72px, 12vw, 140px)',
            fontWeight: 900,
            color: timerColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            animation: (isDanger && running && !finished) ? 'pulse 1s ease-in-out infinite' : 'none',
            transition: 'color 0.4s ease',
          }}
        >
          {finished ? 'HẾT GIỜ' : formatTime(secondsLeft)}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: 6,
            background: progressBg,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: progressColor,
              borderRadius: 3,
              transition: running ? 'width 1s linear, background 0.4s ease' : 'background 0.4s ease',
            }}
          />
        </div>

        {/* Remaining percentage */}
        <div style={{ fontSize: 13, color: mutedText }}>
          {totalSeconds > 0
            ? `Còn ${Math.round((1 - progress) * 100)}% thời gian · ${formatTime(secondsLeft)} còn lại`
            : 'Chưa thiết lập thời gian'}
        </div>

        {/* Exam title */}
        {examTitle && (
          <div
            style={{
              fontSize: 'clamp(16px, 2.5vw, 24px)',
              fontWeight: 700,
              color: sectionHeaderColor,
              textAlign: 'center',
              letterSpacing: '0.01em',
              maxWidth: '90%',
            }}
          >
            {examTitle}
          </div>
        )}

        {/* Current date/time */}
        <div style={{ fontSize: 13, color: mutedText, textAlign: 'center' }}>
          {currentDateTime}
        </div>

        {/* Warning indicators */}
        {(warnedAt5 || warnedAt1) && !finished && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {warnedAt5 && (
              <span
                style={{
                  fontSize: 12,
                  color: AMBER,
                  background: `${AMBER}15`,
                  border: `1px solid ${AMBER}44`,
                  borderRadius: 12,
                  padding: '2px 10px',
                  fontWeight: 600,
                }}
              >
                Đã cảnh báo {warningMinutes} phút
              </span>
            )}
            {warnedAt1 && (
              <span
                style={{
                  fontSize: 12,
                  color: RED,
                  background: `${RED}15`,
                  border: `1px solid ${RED}44`,
                  borderRadius: 12,
                  padding: '2px 10px',
                  fontWeight: 600,
                }}
              >
                Cảnh báo 1 phút!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
