'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Slider, Tooltip } from 'antd';
import {
  SettingOutlined,
  CaretRightOutlined,
  PauseOutlined,
  ReloadOutlined,
  StepForwardOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'toolhub_pomodoro_v1';

const MODE_WORK = 'work';
const MODE_SHORT = 'short';
const MODE_LONG = 'long';
type PomodoroMode = typeof MODE_WORK | typeof MODE_SHORT | typeof MODE_LONG;

const MODE_LABELS: Record<PomodoroMode, string> = {
  [MODE_WORK]: 'Làm việc',
  [MODE_SHORT]: 'Nghỉ ngắn',
  [MODE_LONG]: 'Nghỉ dài',
};

const MODE_COLORS: Record<PomodoroMode, string> = {
  [MODE_WORK]: '#50C878',
  [MODE_SHORT]: '#3b82f6',
  [MODE_LONG]: '#8b5cf6',
};

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

interface PomodoroStats {
  todayPomodoros: number;
  todayFocusMinutes: number;
  todayDate: string;
  totalPomodoros: number;
  totalFocusMinutes: number;
}

interface PomodoroStorage {
  settings: typeof DEFAULT_SETTINGS;
  stats: PomodoroStats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStorage(): PomodoroStorage {
  if (typeof window === 'undefined') {
    return { settings: DEFAULT_SETTINGS, stats: { todayPomodoros: 0, todayFocusMinutes: 0, todayDate: todayKey(), totalPomodoros: 0, totalFocusMinutes: 0 } };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw) as PomodoroStorage;
    // Reset today stats if it's a new day
    if (parsed.stats.todayDate !== todayKey()) {
      parsed.stats.todayPomodoros = 0;
      parsed.stats.todayFocusMinutes = 0;
      parsed.stats.todayDate = todayKey();
    }
    return parsed;
  } catch {
    return {
      settings: DEFAULT_SETTINGS,
      stats: {
        todayPomodoros: 0,
        todayFocusMinutes: 0,
        todayDate: todayKey(),
        totalPomodoros: 0,
        totalFocusMinutes: 0,
      },
    };
  }
}

function saveStorage(data: PomodoroStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function playBeep(frequency = 440, duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PomodoroTimer() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme colors
  const panelBg = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const sectionHeaderColor = isDark ? '#e0e0e0' : '#111111';
  const bodyText = isDark ? '#c9c9c9' : '#1a1a1a';
  const mutedText = isDark ? '#888' : '#999';
  const statCardBg = isDark ? '#141414' : '#f5f5f5';
  const statCardBorder = isDark ? '#2a2a2a' : '#e0e0e0';
  const kbdBg = isDark ? '#2a2a2a' : '#f0f0f0';
  const kbdBorder = isDark ? '#444' : '#ccc';
  const kbdColor = isDark ? '#aaa' : '#555';
  const settingsBg = isDark ? '#141414' : '#f9fafb';
  const settingsBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const progressBg = isDark ? '#2a2a2a' : '#e8e8e8';
  const chipActiveBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const chipInactiveBg = 'transparent';

  // ── Persisted state ──────────────────────────────────────────────────────────
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<PomodoroStats>({
    todayPomodoros: 0,
    todayFocusMinutes: 0,
    todayDate: todayKey(),
    totalPomodoros: 0,
    totalFocusMinutes: 0,
  });

  // ── Timer state ───────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<PomodoroMode>(MODE_WORK);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Draft settings (edited in settings panel, applied on close)
  const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<PomodoroMode>(mode);
  const settingsRef = useRef(settings);
  const statsRef = useRef(stats);
  const completedRef = useRef(completedPomodoros);
  modeRef.current = mode;
  settingsRef.current = settings;
  statsRef.current = stats;
  completedRef.current = completedPomodoros;

  // ── Load from localStorage ───────────────────────────────────────────────────
  useEffect(() => {
    const stored = loadStorage();
    setSettings(stored.settings);
    setDraftSettings(stored.settings);
    setStats(stored.stats);
    setSecondsLeft(stored.settings.workDuration * 60);

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ── Save stats to localStorage whenever they change ──────────────────────────
  useEffect(() => {
    const stored = loadStorage();
    stored.stats = stats;
    saveStorage(stored);
  }, [stats]);

  // ── Total seconds for the current mode ───────────────────────────────────────
  const totalSeconds = useCallback(
    (m: PomodoroMode, s: typeof settings) => {
      if (m === MODE_WORK) return s.workDuration * 60;
      if (m === MODE_SHORT) return s.shortBreakDuration * 60;
      return s.longBreakDuration * 60;
    },
    []
  );

  // ── Session complete handler ──────────────────────────────────────────────────
  const handleSessionComplete = useCallback(
    (completedMode: PomodoroMode, currentCompleted: number, currentSettings: typeof DEFAULT_SETTINGS, currentStats: PomodoroStats) => {
      playBeep(440, 0.4);
      playBeep(550, 0.3);

      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(
            completedMode === MODE_WORK ? 'Pomodoro hoàn thành! Nghỉ ngơi thôi.' : 'Nghỉ ngơi xong! Bắt đầu làm việc.',
            { icon: '/favicon.ico' }
          );
        } catch {}
      }

      if (completedMode === MODE_WORK) {
        const newCompleted = currentCompleted + 1;
        const newStats: PomodoroStats = {
          ...currentStats,
          todayPomodoros: currentStats.todayPomodoros + 1,
          todayFocusMinutes: currentStats.todayFocusMinutes + currentSettings.workDuration,
          totalPomodoros: currentStats.totalPomodoros + 1,
          totalFocusMinutes: currentStats.totalFocusMinutes + currentSettings.workDuration,
          todayDate: todayKey(),
        };
        setStats(newStats);
        setCompletedPomodoros(newCompleted);

        const nextMode = newCompleted % currentSettings.longBreakInterval === 0 ? MODE_LONG : MODE_SHORT;
        setMode(nextMode);
        setSecondsLeft(totalSeconds(nextMode, currentSettings));
        setRunning(false);
        return;
      }

      // Break complete → back to work
      setMode(MODE_WORK);
      setSecondsLeft(totalSeconds(MODE_WORK, currentSettings));
      setRunning(false);
    },
    [totalSeconds]
  );

  // ── Interval tick ─────────────────────────────────────────────────────────────
  // Use a ref to track seconds so the interval can read the latest value
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;

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
      if (current <= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setSecondsLeft(0);
        setRunning(false);
        // Use refs to access latest values without stale closure
        handleSessionComplete(
          modeRef.current,
          completedRef.current,
          settingsRef.current,
          statsRef.current,
        );
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

  // ── Controls ──────────────────────────────────────────────────────────────────
  const handleStartPause = useCallback(() => setRunning((r) => !r), []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(totalSeconds(mode, settings));
  }, [mode, settings, totalSeconds]);

  const handleSkip = useCallback(() => {
    setRunning(false);
    if (mode === MODE_WORK) {
      const nextMode = (completedPomodoros + 1) % settings.longBreakInterval === 0 ? MODE_LONG : MODE_SHORT;
      setMode(nextMode);
      setSecondsLeft(totalSeconds(nextMode, settings));
    } else {
      setMode(MODE_WORK);
      setSecondsLeft(totalSeconds(MODE_WORK, settings));
    }
  }, [mode, completedPomodoros, settings, totalSeconds]);

  const handleModeChange = useCallback(
    (newMode: PomodoroMode) => {
      setRunning(false);
      setMode(newMode);
      setSecondsLeft(totalSeconds(newMode, settings));
    },
    [settings, totalSeconds]
  );

  // ── Settings apply ────────────────────────────────────────────────────────────
  const handleApplySettings = useCallback(() => {
    setSettings(draftSettings);
    setRunning(false);
    setSecondsLeft(totalSeconds(mode, draftSettings));
    setShowSettings(false);
    const stored = loadStorage();
    stored.settings = draftSettings;
    saveStorage(stored);
  }, [draftSettings, mode, totalSeconds]);

  // ── Reset stats ───────────────────────────────────────────────────────────────
  const handleResetStats = useCallback(() => {
    const cleared: PomodoroStats = {
      todayPomodoros: 0,
      todayFocusMinutes: 0,
      todayDate: todayKey(),
      totalPomodoros: 0,
      totalFocusMinutes: 0,
    };
    setStats(cleared);
    const stored = loadStorage();
    stored.stats = cleared;
    saveStorage(stored);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 's' || e.key === 'S') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleStartPause, handleReset, handleSkip]);

  // ── SVG circle math ───────────────────────────────────────────────────────────
  const total = totalSeconds(mode, settings);
  const progress = total > 0 ? (total - secondsLeft) / total : 0;
  const RADIUS = 110;
  const STROKE = 10;
  const SIZE = (RADIUS + STROKE) * 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const modeColor = MODE_COLORS[mode];

  // ── Render ────────────────────────────────────────────────────────────────────
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
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: '1 1 340px',
          minWidth: 300,
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          borderRadius: 12,
          padding: '20px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ fontSize: 16, color: modeColor }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
              {MODE_LABELS[mode]}
            </span>
          </div>
          <Tooltip title="Cài đặt thời gian">
            <button
              onClick={() => {
                setDraftSettings(settings);
                setShowSettings((v) => !v);
              }}
              style={{
                background: showSettings ? (isDark ? '#2a2a2a' : '#f0f0f0') : 'transparent',
                border: `1px solid ${showSettings ? (isDark ? '#444' : '#ccc') : 'transparent'}`,
                borderRadius: 6,
                cursor: 'pointer',
                padding: '4px 8px',
                color: showSettings ? modeColor : mutedText,
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s',
              }}
            >
              <SettingOutlined style={{ fontSize: 15 }} />
            </button>
          </Tooltip>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: isDark ? '#141414' : '#f0f0f0',
            borderRadius: 8,
            padding: 4,
          }}
        >
          {([MODE_WORK, MODE_SHORT, MODE_LONG] as PomodoroMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: mode === m ? 700 : 500,
                background: mode === m ? chipActiveBg : chipInactiveBg,
                color: mode === m ? MODE_COLORS[m] : mutedText,
                transition: 'all 0.15s',
                outline: mode === m ? `1px solid ${MODE_COLORS[m]}40` : 'none',
              }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div
            style={{
              background: settingsBg,
              border: `1px solid ${settingsBorder}`,
              borderRadius: 10,
              padding: '16px 16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: sectionHeaderColor }}>
              Cài đặt thời gian (phút)
            </div>

            {/* Work */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: bodyText }}>Làm việc</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: MODE_COLORS[MODE_WORK] }}>
                  {draftSettings.workDuration} phút
                </span>
              </div>
              <Slider
                min={5}
                max={60}
                step={5}
                value={draftSettings.workDuration}
                onChange={(v) => setDraftSettings((s) => ({ ...s, workDuration: v }))}
                styles={{ track: { background: MODE_COLORS[MODE_WORK] } }}
              />
            </div>

            {/* Short break */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: bodyText }}>Nghỉ ngắn</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: MODE_COLORS[MODE_SHORT] }}>
                  {draftSettings.shortBreakDuration} phút
                </span>
              </div>
              <Slider
                min={1}
                max={15}
                step={1}
                value={draftSettings.shortBreakDuration}
                onChange={(v) => setDraftSettings((s) => ({ ...s, shortBreakDuration: v }))}
                styles={{ track: { background: MODE_COLORS[MODE_SHORT] } }}
              />
            </div>

            {/* Long break */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: bodyText }}>Nghỉ dài</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: MODE_COLORS[MODE_LONG] }}>
                  {draftSettings.longBreakDuration} phút
                </span>
              </div>
              <Slider
                min={5}
                max={30}
                step={5}
                value={draftSettings.longBreakDuration}
                onChange={(v) => setDraftSettings((s) => ({ ...s, longBreakDuration: v }))}
                styles={{ track: { background: MODE_COLORS[MODE_LONG] } }}
              />
            </div>

            {/* Long break interval */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: bodyText }}>Nghỉ dài sau mỗi</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: modeColor }}>
                  {draftSettings.longBreakInterval} pomodoros
                </span>
              </div>
              <Slider
                min={2}
                max={8}
                step={1}
                value={draftSettings.longBreakInterval}
                onChange={(v) => setDraftSettings((s) => ({ ...s, longBreakInterval: v }))}
                styles={{ track: { background: modeColor } }}
              />
            </div>

            <Button
              type="primary"
              size="small"
              onClick={handleApplySettings}
              style={{
                background: modeColor,
                borderColor: modeColor,
                fontWeight: 600,
                alignSelf: 'flex-end',
              }}
            >
              Áp dụng
            </Button>
          </div>
        )}

        {/* Circular SVG timer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
          }}
        >
          <div style={{ position: 'relative', width: SIZE, height: SIZE, maxWidth: 260, maxHeight: 260 }}>
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
            >
              {/* Background ring */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={isDark ? '#2a2a2a' : '#e8e8e8'}
                strokeWidth={STROKE}
              />
              {/* Progress arc */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={modeColor}
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
              />
            </svg>

            {/* Center content */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(36px, 8vw, 52px)',
                  fontWeight: 800,
                  color: sectionHeaderColor,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {formatTime(secondsLeft)}
              </span>
              {running && (
                <span
                  style={{
                    fontSize: 11,
                    color: modeColor,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Đang chạy
                </span>
              )}
            </div>
          </div>

          {/* Completed pomodoros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleOutlined style={{ fontSize: 13, color: mutedText }} />
            <span style={{ fontSize: 13, color: mutedText }}>
              Pomodoros đã hoàn thành:{' '}
              <span style={{ fontWeight: 700, color: modeColor }}>{completedPomodoros}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              background: progressBg,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: modeColor,
                borderRadius: 2,
                transition: running ? 'width 1s linear' : 'none',
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="primary"
            size="large"
            icon={running ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={handleStartPause}
            style={{
              flex: 2,
              height: 44,
              fontSize: 15,
              fontWeight: 700,
              background: modeColor,
              borderColor: modeColor,
              color: '#fff',
            }}
          >
            {running ? 'Tạm dừng' : 'Bắt đầu'}
          </Button>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={handleReset}
            style={{ flex: 1, height: 44 }}
          >
            Đặt Lại
          </Button>
          <Button
            size="large"
            icon={<StepForwardOutlined />}
            onClick={handleSkip}
            style={{ flex: 1, height: 44 }}
          >
            Bỏ qua
          </Button>
        </div>

        {/* Keyboard hint */}
        <p style={{ fontSize: 12, color: mutedText, margin: 0, textAlign: 'center', lineHeight: 1.7 }}>
          Phím tắt:{' '}
          <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: kbdColor }}>Space</kbd>
          {' '}(Bắt đầu/Tạm dừng),{' '}
          <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: kbdColor }}>R</kbd>
          {' '}(Đặt lại),{' '}
          <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: kbdColor }}>S</kbd>
          {' '}(Bỏ qua)
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: '1 1 280px',
          minWidth: 260,
          background: isDark ? '#1a1a1a' : '#f5f5f5',
          border: `1px solid ${panelBorder}`,
          borderRadius: 12,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartOutlined style={{ fontSize: 16, color: modeColor }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
            Thống kê
          </span>
        </div>

        {/* Today stats */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: mutedText,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Hôm nay
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow
              label="Pomodoros hôm nay"
              value={String(stats.todayPomodoros)}
              accent={modeColor}
              bg={statCardBg}
              border={statCardBorder}
              textColor={bodyText}
              mutedColor={mutedText}
            />
            <StatRow
              label="Thời gian tập trung hôm nay"
              value={formatDuration(stats.todayFocusMinutes)}
              accent={modeColor}
              bg={statCardBg}
              border={statCardBorder}
              textColor={bodyText}
              mutedColor={mutedText}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: isDark ? '#252525' : '#e8e8e8' }} />

        {/* All-time stats */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: mutedText,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Tổng cộng
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow
              label="Tổng pomodoros"
              value={String(stats.totalPomodoros)}
              accent={modeColor}
              bg={statCardBg}
              border={statCardBorder}
              textColor={bodyText}
              mutedColor={mutedText}
            />
            <StatRow
              label="Tổng thời gian tập trung"
              value={formatDuration(stats.totalFocusMinutes)}
              accent={modeColor}
              bg={statCardBg}
              border={statCardBorder}
              textColor={bodyText}
              mutedColor={mutedText}
            />
          </div>
        </div>

        {/* Pomodoro dots visualization */}
        {stats.todayPomodoros > 0 && (
          <div>
            <div style={{ fontSize: 12, color: mutedText, marginBottom: 8 }}>
              Tiến độ hôm nay
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: Math.min(stats.todayPomodoros, 24) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: modeColor,
                    opacity: 0.85,
                  }}
                />
              ))}
              {stats.todayPomodoros > 24 && (
                <span style={{ fontSize: 11, color: mutedText, alignSelf: 'center' }}>
                  +{stats.todayPomodoros - 24}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Reset stats button */}
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleResetStats}
          style={{ width: '100%' }}
        >
          Đặt lại thống kê
        </Button>
      </div>
    </div>
  );
}

// ─── Subcomponent: StatRow ────────────────────────────────────────────────────

interface StatRowProps {
  label: string;
  value: string;
  accent: string;
  bg: string;
  border: string;
  textColor: string;
  mutedColor: string;
}

function StatRow({ label, value, accent, bg, border, textColor, mutedColor }: StatRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: '10px 14px',
      }}
    >
      <span style={{ fontSize: 13, color: mutedColor }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>{value}</span>
    </div>
  );
}
