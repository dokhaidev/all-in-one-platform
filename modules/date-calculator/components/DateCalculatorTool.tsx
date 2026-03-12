'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, DatePicker, message, Tag, Empty } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  MinusOutlined,
  FieldTimeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

dayjs.locale('vi');

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deadline {
  id: string;
  name: string;
  targetDate: string; // ISO string
  color: string;
}

interface CountdownDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: 'Ma Kết', symbol: '♑', start: [12, 22], end: [1, 19] },
  { name: 'Bảo Bình', symbol: '♒', start: [1, 20], end: [2, 18] },
  { name: 'Song Ngư', symbol: '♓', start: [2, 19], end: [3, 20] },
  { name: 'Bạch Dương', symbol: '♈', start: [3, 21], end: [4, 19] },
  { name: 'Kim Ngưu', symbol: '♉', start: [4, 20], end: [5, 20] },
  { name: 'Song Tử', symbol: '♊', start: [5, 21], end: [6, 20] },
  { name: 'Cự Giải', symbol: '♋', start: [6, 21], end: [7, 22] },
  { name: 'Sư Tử', symbol: '♌', start: [7, 23], end: [8, 22] },
  { name: 'Xử Nữ', symbol: '♍', start: [8, 23], end: [9, 22] },
  { name: 'Thiên Bình', symbol: '♎', start: [9, 23], end: [10, 22] },
  { name: 'Bọ Cạp', symbol: '♏', start: [10, 23], end: [11, 21] },
  { name: 'Nhân Mã', symbol: '♐', start: [11, 22], end: [12, 21] },
];

const WEEKDAY_VI = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const DEADLINE_COLORS = ['#50C878', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STORAGE_KEY = 'toolhub_deadlines';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getZodiac(month: number, day: number): { name: string; symbol: string } {
  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return sign;
    } else if (sm < em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return sign;
    } else {
      // Wraps year (Capricorn: Dec 22 – Jan 19)
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return sign;
    }
  }
  return ZODIAC_SIGNS[0];
}

function calcDateDiff(from: Dayjs, to: Dayjs): { days: number; weeks: number; months: number; years: number; yearsPart: number; monthsPart: number; daysPart: number } {
  const start = from.isBefore(to) ? from : to;
  const end = from.isBefore(to) ? to : from;

  const totalDays = end.diff(start, 'day');
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = end.diff(start, 'month');
  const totalYears = end.diff(start, 'year');

  let yearsPart = totalYears;
  let afterYears = start.add(yearsPart, 'year');
  let monthsPart = afterYears.diff(end, 'month');
  if (monthsPart < 0) monthsPart = -monthsPart;
  let afterMonths = afterYears.add(monthsPart, 'month');
  let daysPart = end.diff(afterMonths, 'day');
  if (daysPart < 0) daysPart = 0;

  return { days: totalDays, weeks: totalWeeks, months: totalMonths, years: totalYears, yearsPart, monthsPart, daysPart };
}

function calcAge(birthDate: Dayjs, now: Dayjs): { years: number; months: number; days: number } {
  let years = now.diff(birthDate, 'year');
  let afterYears = birthDate.add(years, 'year');
  let months = now.diff(afterYears, 'month');
  let afterMonths = afterYears.add(months, 'month');
  let days = now.diff(afterMonths, 'day');
  return { years, months, days };
}

function getNextBirthday(birthDate: Dayjs, now: Dayjs): { date: Dayjs; daysLeft: number } {
  let next = birthDate.year(now.year());
  if (next.isBefore(now, 'day') || next.isSame(now, 'day')) {
    next = next.add(1, 'year');
  }
  return { date: next, daysLeft: next.diff(now, 'day') };
}

function calcCountdown(targetDateStr: string): CountdownDisplay {
  const target = dayjs(targetDateStr);
  const now = dayjs();
  const diffMs = target.diff(now, 'millisecond');

  if (diffMs <= 0) {
    const past = Math.abs(diffMs);
    const totalSeconds = Math.floor(past / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      isPast: true,
      totalSeconds,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
    totalSeconds,
  };
}

function loadDeadlines(): Deadline[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeadlines(deadlines: Deadline[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deadlines));
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

interface StatBoxProps {
  value: string | number;
  label: string;
  color: string;
  isDark: boolean;
}

function StatBox({ value, label, color, isDark }: StatBoxProps) {
  return (
    <div style={{
      background: isDark ? '#1a1a1a' : '#f5f5f5',
      border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
      borderRadius: 10,
      padding: '14px 16px',
      textAlign: 'center',
      flex: '1 1 100px',
      minWidth: 90,
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: isDark ? '#666' : '#aaa', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Countdown Block ─────────────────────────────────────────────────────────

interface CountdownBlockProps {
  countdown: CountdownDisplay;
  color: string;
  isDark: boolean;
}

function CountdownBlock({ countdown, color, isDark }: CountdownBlockProps) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {[
        { val: countdown.days, unit: 'Ngày' },
        { val: countdown.hours, unit: 'Giờ' },
        { val: countdown.minutes, unit: 'Phút' },
        { val: countdown.seconds, unit: 'Giây' },
      ].map(({ val, unit }) => (
        <div
          key={unit}
          style={{
            flex: '1 1 56px',
            minWidth: 52,
            background: bg,
            border: `1px solid ${border}`,
            borderBottom: `3px solid ${color}`,
            borderRadius: 8,
            padding: '10px 6px 8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {unit === 'Ngày' ? val : pad(val)}
          </div>
          <div style={{ fontSize: 10, color: isDark ? '#555' : '#bbb', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB 1: Date Difference ───────────────────────────────────────────────────

interface CommonTabProps {
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subColor: string;
  inputBorder: string;
}

function Tab1DateDiff({ isDark, cardBg, cardBorder, textColor, subColor, inputBorder }: CommonTabProps) {
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());

  const diff = fromDate && toDate ? calcDateDiff(fromDate, toDate) : null;
  const isAfter = fromDate && toDate ? toDate.isAfter(fromDate) : true;

  return (
    <div style={{ padding: '20px 0 0' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Ngày bắt đầu
          </label>
          <DatePicker
            value={fromDate}
            onChange={setFromDate}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày bắt đầu"
            allowClear
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Ngày kết thúc
          </label>
          <DatePicker
            value={toDate}
            onChange={setToDate}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày kết thúc"
            allowClear
          />
        </div>
      </div>

      {diff && (
        <>
          {/* Highlight breakdown */}
          <div style={{
            background: isDark ? 'rgba(80,200,120,0.06)' : 'rgba(80,200,120,0.04)',
            border: '1.5px solid rgba(80,200,120,0.2)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: '#50C878', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Khoảng cách chi tiết
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: textColor, lineHeight: 1.4 }}>
              {diff.yearsPart > 0 && <span>{diff.yearsPart} năm<span style={{ color: subColor, fontWeight: 400, fontSize: 14 }}> </span></span>}
              {diff.monthsPart > 0 && <span>{diff.monthsPart} tháng<span style={{ color: subColor, fontWeight: 400, fontSize: 14 }}> </span></span>}
              <span>{diff.daysPart} ngày</span>
            </div>
            <div style={{ fontSize: 12, color: subColor, marginTop: 6 }}>
              Từ {(fromDate!.isBefore(toDate!) ? fromDate : toDate)!.format('DD/MM/YYYY')} đến {(fromDate!.isBefore(toDate!) ? toDate : fromDate)!.format('DD/MM/YYYY')}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatBox value={diff.days.toLocaleString('vi-VN')} label="Ngày" color="#50C878" isDark={isDark} />
            <StatBox value={diff.weeks.toLocaleString('vi-VN')} label="Tuần" color="#3b82f6" isDark={isDark} />
            <StatBox value={diff.months.toLocaleString('vi-VN')} label="Tháng" color="#f59e0b" isDark={isDark} />
            <StatBox value={diff.years.toLocaleString('vi-VN')} label="Năm" color="#8b5cf6" isDark={isDark} />
          </div>

          {/* Extra stats */}
          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatBox value={(diff.days * 24).toLocaleString('vi-VN')} label="Giờ" color="#ec4899" isDark={isDark} />
            <StatBox value={(diff.days * 24 * 60).toLocaleString('vi-VN')} label="Phút" color="#06b6d4" isDark={isDark} />
          </div>
        </>
      )}

      {!diff && (
        <div style={{ textAlign: 'center', padding: '32px', color: subColor }}>
          <CalendarOutlined style={{ fontSize: 36, marginBottom: 8, color: isDark ? '#333' : '#ddd' }} />
          <p style={{ margin: 0 }}>Chọn hai ngày để tính khoảng cách</p>
        </div>
      )}
    </div>
  );
}

// ─── TAB 2: Age Calculator ────────────────────────────────────────────────────

function Tab2Age({ isDark, textColor, subColor }: CommonTabProps) {
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);

  const today = dayjs();
  const age = birthDate ? calcAge(birthDate, today) : null;
  const nextBday = birthDate ? getNextBirthday(birthDate, today) : null;
  const zodiac = birthDate ? getZodiac(birthDate.month() + 1, birthDate.date()) : null;

  const totalDays = birthDate ? today.diff(birthDate, 'day') : null;

  return (
    <div style={{ padding: '20px 0 0' }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Ngày sinh của bạn
        </label>
        <DatePicker
          value={birthDate}
          onChange={setBirthDate}
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày sinh"
          disabledDate={(d) => d.isAfter(today)}
          allowClear
        />
      </div>

      {age && nextBday && zodiac && birthDate && (
        <>
          {/* Age highlight */}
          <div style={{
            background: isDark ? 'rgba(80,200,120,0.06)' : 'rgba(80,200,120,0.04)',
            border: '1.5px solid rgba(80,200,120,0.2)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: '#50C878', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Tuổi của bạn
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: textColor, lineHeight: 1.3 }}>
              {age.years} tuổi {age.months > 0 && `${age.months} tháng`} {age.days > 0 && `${age.days} ngày`}
            </div>
            <div style={{ fontSize: 12, color: subColor, marginTop: 6 }}>
              Sinh ngày {birthDate.format('DD/MM/YYYY')} ({WEEKDAY_VI[birthDate.day()]})
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatBox value={age.years} label="Tuổi" color="#50C878" isDark={isDark} />
            <StatBox value={(totalDays ?? 0).toLocaleString('vi-VN')} label="Ngày đã sống" color="#3b82f6" isDark={isDark} />
            <StatBox value={nextBday.daysLeft} label="Ngày đến sinh nhật" color="#f59e0b" isDark={isDark} />
          </div>

          {/* Birthday & Zodiac info */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              background: isDark ? '#1a1a1a' : '#f5f5f5',
              border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Sinh nhật kế tiếp
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                {nextBday.date.format('DD/MM/YYYY')}
              </div>
              <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
                {WEEKDAY_VI[nextBday.date.day()]} — còn {nextBday.daysLeft} ngày
              </div>
            </div>

            <div style={{
              flex: 1,
              background: isDark ? '#1a1a1a' : '#f5f5f5',
              border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Cung hoàng đạo
              </div>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{zodiac.symbol}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginTop: 4 }}>{zodiac.name}</div>
            </div>
          </div>
        </>
      )}

      {!birthDate && (
        <div style={{ textAlign: 'center', padding: '32px', color: subColor }}>
          <CalendarOutlined style={{ fontSize: 36, marginBottom: 8, color: isDark ? '#333' : '#ddd' }} />
          <p style={{ margin: 0 }}>Chọn ngày sinh để tính tuổi</p>
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: Add/Subtract Days ─────────────────────────────────────────────────

function Tab3AddSubtract({ isDark, textColor, subColor }: CommonTabProps) {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [days, setDays] = useState<string>('30');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');

  const daysNum = parseInt(days) || 0;
  const resultDate = startDate
    ? operation === 'add'
      ? startDate.add(daysNum, 'day')
      : startDate.subtract(daysNum, 'day')
    : null;

  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const inputBg = isDark ? '#141414' : '#f9f9f9';

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 12px',
    border: active ? '2px solid #50C878' : `1px solid ${inputBorder}`,
    borderRadius: 8,
    background: active ? (isDark ? 'rgba(80,200,120,0.1)' : 'rgba(80,200,120,0.06)') : inputBg,
    color: active ? '#50C878' : subColor,
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.18s',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  });

  return (
    <div style={{ padding: '20px 0 0' }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Ngày bắt đầu
        </label>
        <DatePicker
          value={startDate}
          onChange={setStartDate}
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày bắt đầu"
          allowClear
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Thao tác
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={toggleStyle(operation === 'add') as React.CSSProperties} onClick={() => setOperation('add')}>
            <PlusOutlined /> Cộng thêm
          </button>
          <button style={toggleStyle(operation === 'subtract') as React.CSSProperties} onClick={() => setOperation('subtract')}>
            <MinusOutlined /> Trừ đi
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Số ngày
        </label>
        <input
          type="number"
          min={0}
          max={36500}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="VD: 30"
          style={{
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
          }}
        />
      </div>

      {resultDate && startDate && (
        <div style={{
          background: isDark ? 'rgba(80,200,120,0.06)' : 'rgba(80,200,120,0.04)',
          border: '1.5px solid rgba(80,200,120,0.2)',
          borderRadius: 10,
          padding: '20px',
        }}>
          <div style={{ fontSize: 11, color: '#50C878', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Ngày kết quả
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {resultDate.format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: 14, color: subColor, marginBottom: 12 }}>
            {WEEKDAY_VI[resultDate.day()]}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color="green">Ngày {resultDate.date()}</Tag>
            <Tag color="blue">Tháng {resultDate.month() + 1}</Tag>
            <Tag color="purple">Năm {resultDate.year()}</Tag>
            <Tag color="orange">Tuần {Math.ceil((resultDate.toDate().getTime() - new Date(resultDate.year(), 0, 1).getTime()) / (7 * 86400000) + 1)}</Tag>
            <Tag>{WEEKDAY_VI[resultDate.day()]}</Tag>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: subColor }}>
            {startDate.format('DD/MM/YYYY')} {operation === 'add' ? '+' : '−'} {daysNum} ngày = {resultDate.format('DD/MM/YYYY')}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 4: Deadline Countdown ────────────────────────────────────────────────

function Tab4Deadlines({ isDark, textColor, subColor }: CommonTabProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState<Dayjs | null>(null);
  const [tick, setTick] = useState(0);

  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const inputBg = isDark ? '#141414' : '#f9f9f9';

  // Load from localStorage
  useEffect(() => {
    setDeadlines(loadDeadlines());
  }, []);

  // Tick every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = () => {
    if (!newName.trim() || !newDate) {
      message.warning('Vui lòng nhập tên và ngày mục tiêu.');
      return;
    }
    const entry: Deadline = {
      id: Date.now().toString(),
      name: newName.trim(),
      targetDate: newDate.toISOString(),
      color: DEADLINE_COLORS[deadlines.length % DEADLINE_COLORS.length],
    };
    const updated = [...deadlines, entry];
    setDeadlines(updated);
    saveDeadlines(updated);
    setNewName('');
    setNewDate(null);
    message.success(`Đã thêm deadline: ${entry.name}`);
  };

  const handleDelete = (id: string) => {
    const updated = deadlines.filter((d) => d.id !== id);
    setDeadlines(updated);
    saveDeadlines(updated);
  };

  return (
    <div style={{ padding: '20px 0 0' }}>
      {/* Add form */}
      <div style={{
        background: isDark ? '#1a1a1a' : '#f5f5f5',
        border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
        borderRadius: 10,
        padding: '16px',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrophyOutlined style={{ color: '#50C878' }} />
          Thêm deadline mới
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Tên deadline (VD: Nộp báo cáo)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            style={{
              flex: '1 1 180px',
              padding: '9px 14px',
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: 8,
              fontSize: 14,
              color: textColor,
              outline: 'none',
              colorScheme: isDark ? 'dark' : 'light',
              boxSizing: 'border-box',
            }}
          />
          <DatePicker
            value={newDate}
            onChange={setNewDate}
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            placeholder="Ngày & giờ mục tiêu"
            style={{ flex: '1 1 180px' }}
            allowClear
          />
          <button
            onClick={handleAdd}
            style={{
              padding: '9px 20px',
              background: '#50C878',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <PlusOutlined />
            Thêm
          </button>
        </div>
      </div>

      {/* Deadlines list */}
      {deadlines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: subColor }}>
          <FieldTimeOutlined style={{ fontSize: 36, marginBottom: 8, color: isDark ? '#333' : '#ddd' }} />
          <p style={{ margin: 0 }}>Chưa có deadline nào. Hãy thêm deadline đầu tiên!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deadlines.map((dl) => {
            const countdown = calcCountdown(dl.targetDate);
            const targetDay = dayjs(dl.targetDate);
            return (
              <div
                key={dl.id}
                style={{
                  background: isDark ? '#1e1e1e' : '#ffffff',
                  border: `1px solid ${isDark ? '#272727' : '#e8e8e8'}`,
                  borderLeft: `4px solid ${dl.color}`,
                  borderRadius: 10,
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 4 }}>{dl.name}</div>
                    <div style={{ fontSize: 12, color: subColor }}>
                      Mục tiêu: {targetDay.format('DD/MM/YYYY HH:mm')} ({WEEKDAY_VI[targetDay.day()]})
                    </div>
                    {countdown.isPast && (
                      <Tag color="red" style={{ marginTop: 4 }}>Đã qua hạn</Tag>
                    )}
                    {!countdown.isPast && countdown.days <= 3 && (
                      <Tag color="orange" style={{ marginTop: 4 }}>Sắp đến hạn!</Tag>
                    )}
                    {!countdown.isPast && countdown.days > 3 && (
                      <Tag color="green" style={{ marginTop: 4 }}>Đang đếm ngược</Tag>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(dl.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDark ? '#444' : '#ccc',
                      padding: '4px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#444' : '#ccc'; }}
                  >
                    <DeleteOutlined />
                  </button>
                </div>

                <CountdownBlock countdown={countdown} color={countdown.isPast ? '#ef4444' : dl.color} isDark={isDark} />

                {countdown.isPast && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                    Đã qua hạn {countdown.days} ngày {countdown.hours} giờ {countdown.minutes} phút
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DateCalculatorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBorder = isDark ? '#333' : '#d9d9d9';

  const commonProps: CommonTabProps = { isDark, cardBg, cardBorder, textColor, subColor, inputBorder };

  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined />
          Khoảng cách 2 ngày
        </span>
      ),
      children: <Tab1DateDiff {...commonProps} />,
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined />
          Tính tuổi
        </span>
      ),
      children: <Tab2Age {...commonProps} />,
    },
    {
      key: '3',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PlusOutlined />
          Cộng/trừ ngày
        </span>
      ),
      children: <Tab3AddSubtract {...commonProps} />,
    },
    {
      key: '4',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FieldTimeOutlined />
          Đếm ngược deadline
        </span>
      ),
      children: <Tab4Deadlines {...commonProps} />,
    },
  ];

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 14,
        padding: '24px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <CalendarOutlined style={{ fontSize: 18, color: '#50C878' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Công cụ tính ngày</span>
      </div>

      <Tabs items={tabItems} type="line" size="middle" />
    </div>
  );
}
