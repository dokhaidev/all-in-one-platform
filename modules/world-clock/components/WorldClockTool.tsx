'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Select,
  Input,
  Modal,
  message,
  Form,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  StarFilled,
  CopyOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityEntry {
  id: string;
  name: string;
  timezone: string;
  flag: string;
}

interface ClockTime {
  time: string;    // HH:MM:SS
  date: string;    // Weekday, DD Mon YYYY
  utcOffset: string; // e.g. UTC+7
  offsetHours: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CITIES: CityEntry[] = [
  { id: 'hanoi',    name: 'Hà Nội',    timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { id: 'tokyo',    name: 'Tokyo',     timezone: 'Asia/Tokyo',        flag: '🇯🇵' },
  { id: 'london',   name: 'London',    timezone: 'Europe/London',     flag: '🇬🇧' },
  { id: 'newyork',  name: 'New York',  timezone: 'America/New_York',  flag: '🇺🇸' },
  { id: 'sydney',   name: 'Sydney',    timezone: 'Australia/Sydney',  flag: '🇦🇺' },
  { id: 'paris',    name: 'Paris',     timezone: 'Europe/Paris',      flag: '🇫🇷' },
  { id: 'dubai',    name: 'Dubai',     timezone: 'Asia/Dubai',        flag: '🇦🇪' },
  { id: 'la',       name: 'Los Angeles', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
];

const LS_KEY = 'toolhub_world_clock_cities';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimezoneList(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (key: string) => string[] })
      .supportedValuesOf('timeZone');
  } catch {
    return ['Asia/Ho_Chi_Minh', 'Asia/Tokyo', 'Europe/London', 'America/New_York',
            'Australia/Sydney', 'Europe/Paris', 'Asia/Dubai', 'America/Los_Angeles'];
  }
}

function getClockTime(tz: string, now: Date): ClockTime {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    const hour = get('hour') === '24' ? '00' : get('hour');
    const minute = get('minute');
    const second = get('second');
    const time = `${hour}:${minute}:${second}`;

    // Get date
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const dateParts = dateFormatter.formatToParts(now);
    const weekday = dateParts.find((p) => p.type === 'weekday')?.value ?? '';
    const day = dateParts.find((p) => p.type === 'day')?.value ?? '';
    const month = dateParts.find((p) => p.type === 'month')?.value ?? '';
    const year = dateParts.find((p) => p.type === 'year')?.value ?? '';
    const date = `${weekday}, ${day} ${month} ${year}`;

    // UTC offset
    const offsetFormatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const offsetParts = offsetFormatter.formatToParts(now);
    const utcOffset = offsetParts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';

    // Numeric offset hours
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    const offsetHours = offsetMs / (1000 * 60 * 60);

    return { time, date, utcOffset, offsetHours };
  } catch {
    return { time: '--:--:--', date: '---', utcOffset: 'UTC', offsetHours: 0 };
  }
}

function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function loadCities(): CityEntry[] {
  if (typeof window === 'undefined') return DEFAULT_CITIES;
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_CITIES;
}

function saveCities(cities: CityEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cities));
  } catch { /* ignore */ }
}

function formatDiff(localOffset: number, cityOffset: number): string {
  const diff = cityOffset - localOffset;
  if (diff === 0) return 'Giờ địa phương';
  const sign = diff > 0 ? '+' : '';
  const abs = Math.abs(diff);
  if (abs % 1 === 0) return `${sign}${diff}h`;
  const h = Math.floor(Math.abs(diff));
  const m = Math.round((abs % 1) * 60);
  return `${sign}${diff < 0 ? '-' : ''}${h}h ${m}m`;
}

// Convert a time entered by user in one zone to all other zones
function convertTime(inputTime: string, fromTz: string, toTz: string, baseDate: Date): string {
  try {
    const [h, min] = inputTime.split(':').map(Number);
    const today = new Date(baseDate);
    const fromStr = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTz,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(today);
    const [month, day, year] = fromStr.split('/');
    const fromDateTime = new Date(`${year}-${month}-${day}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);

    const offset = (tz: string) => {
      const d = new Date(fromDateTime.toLocaleString('en-US', { timeZone: tz }));
      const u = new Date(fromDateTime.toLocaleString('en-US', { timeZone: 'UTC' }));
      return (d.getTime() - u.getTime()) / 60000;
    };

    const fromOffset = offset(fromTz);
    const toOffset = offset(toTz);
    const converted = new Date(fromDateTime.getTime() - (fromOffset - toOffset) * 60000);

    const hh = String(converted.getHours()).padStart(2, '0');
    const mm = String(converted.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '--:--';
  }
}

// ─── ClockCard ────────────────────────────────────────────────────────────────

interface ClockCardProps {
  city: CityEntry;
  clockTime: ClockTime;
  isLocal: boolean;
  localOffset: number;
  isDark: boolean;
  onDelete: (id: string) => void;
  convertedTime?: string; // from time converter
}

function ClockCard({ city, clockTime, isLocal, localOffset, isDark, onDelete, convertedTime }: ClockCardProps) {
  const cardBg = isLocal
    ? isDark ? 'rgba(80,200,120,0.07)' : 'rgba(80,200,120,0.05)'
    : isDark ? '#222222' : '#ffffff';
  const cardBorder = isLocal ? '1.5px solid #50C878' : isDark ? '1px solid #2e2e2e' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e0e0e0' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const timeColor = isLocal ? '#50C878' : isDark ? '#e0e0e0' : '#111';

  const diffLabel = formatDiff(localOffset, clockTime.offsetHours);

  const handleCopyTime = () => {
    navigator.clipboard.writeText(clockTime.time).then(() => {
      message.success(`Đã sao chép ${clockTime.time}`);
    });
  };

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 14,
        padding: '18px 20px 16px',
        position: 'relative',
        boxShadow: isLocal
          ? '0 0 0 1px rgba(80,200,120,0.12), 0 2px 12px rgba(80,200,120,0.07)'
          : isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Top row: flag + name + delete */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{city.flag}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: textColor, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {city.name}
              {isLocal && <StarFilled style={{ color: '#50C878', fontSize: 10, marginLeft: 5, verticalAlign: 'middle' }} />}
            </div>
            <div style={{ color: subColor, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {city.timezone}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(city.id)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: subColor,
            padding: '2px 4px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e05555'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = subColor; }}
          title="Xóa"
        >
          <DeleteOutlined style={{ fontSize: 13 }} />
        </button>
      </div>

      {/* Time */}
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          color: timeColor,
          letterSpacing: '-0.5px',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {clockTime.time}
      </div>

      {/* Date */}
      <div style={{ fontSize: 11, color: subColor, marginBottom: 10 }}>
        {clockTime.date}
      </div>

      {/* UTC offset + diff */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            color: '#50C878',
            background: isDark ? 'rgba(80,200,120,0.12)' : 'rgba(80,200,120,0.1)',
            border: '1px solid rgba(80,200,120,0.25)',
            borderRadius: 4,
            padding: '1px 7px',
            fontWeight: 600,
          }}
        >
          {clockTime.utcOffset}
        </span>
        <span style={{ fontSize: 11, color: isLocal ? '#50C878' : subColor, fontWeight: isLocal ? 600 : 400 }}>
          {diffLabel}
        </span>
      </div>

      {/* Converted time panel */}
      {convertedTime && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: isDark ? '1px solid #2e2e2e' : '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <SwapOutlined style={{ color: '#50C878', fontSize: 11 }} />
          <span style={{ fontSize: 12, color: subColor }}>Quy đổi:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#50C878', fontVariantNumeric: 'tabular-nums' }}>
            {convertedTime}
          </span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopyTime}
        style={{
          position: 'absolute',
          top: 16,
          right: 42,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: subColor,
          padding: '2px 4px',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#50C878'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = subColor; }}
        title="Sao chép giờ"
      >
        <CopyOutlined style={{ fontSize: 12 }} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorldClockTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [cities, setCities] = useState<CityEntry[]>(() => loadCities());
  const [now, setNow] = useState<Date>(new Date());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityTz, setNewCityTz] = useState('');
  const [newCityFlag, setNewCityFlag] = useState('🌐');
  const [convertTime_, setConvertTime_] = useState('12:00');
  const [convertFromTz, setConvertFromTz] = useState('');
  const [form] = Form.useForm();

  const localTz = getLocalTimezone();
  const tzList = useRef<string[]>(getTimezoneList());

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Init converter from tz to local tz
  useEffect(() => {
    setConvertFromTz(localTz);
  }, [localTz]);

  const clockTimes: Record<string, ClockTime> = {};
  for (const city of cities) {
    clockTimes[city.id] = getClockTime(city.timezone, now);
  }

  const localClock = getClockTime(localTz, now);
  const localOffset = localClock.offsetHours;

  const handleDeleteCity = useCallback((id: string) => {
    setCities((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCities(next);
      return next;
    });
  }, []);

  const handleAddCity = () => {
    if (!newCityName.trim() || !newCityTz) {
      message.warning('Vui lòng nhập tên thành phố và chọn múi giờ');
      return;
    }
    const id = `custom_${Date.now()}`;
    const newCity: CityEntry = {
      id,
      name: newCityName.trim(),
      timezone: newCityTz,
      flag: newCityFlag || '🌐',
    };
    setCities((prev) => {
      const next = [...prev, newCity];
      saveCities(next);
      return next;
    });
    setAddModalOpen(false);
    setNewCityName('');
    setNewCityTz('');
    setNewCityFlag('🌐');
    message.success(`Đã thêm ${newCity.name}`);
  };

  // ─── Converted times ────────────────────────────────────────────────────────

  const convertedTimes: Record<string, string> = {};
  if (converterOpen && convertFromTz && convertTime_) {
    for (const city of cities) {
      convertedTimes[city.id] = convertTime(convertTime_, convertFromTz, city.timezone, now);
    }
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '1px solid #2e2e2e' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e0e0e0' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#1a1a1a' : '#f9f9f9';

  const tzOptions = tzList.current.map((tz) => ({ value: tz, label: tz }));

  return (
    <div style={{ width: '100%' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: '#50C878', fontSize: 18 }} />
          <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>
            {cities.length} múi giờ đang hiển thị
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<SwapOutlined />}
            onClick={() => setConverterOpen((v) => !v)}
            style={{
              background: converterOpen ? 'rgba(80,200,120,0.12)' : isDark ? '#2a2a2a' : '#f5f5f5',
              border: converterOpen ? '1px solid #50C878' : isDark ? '1px solid #333' : '1px solid #ddd',
              color: converterOpen ? '#50C878' : textColor,
              borderRadius: 8,
            }}
          >
            Quy đổi giờ
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{ background: '#50C878', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600 }}
          >
            Thêm thành phố
          </Button>
        </div>
      </div>

      {/* ── Time converter panel ── */}
      {converterOpen && (
        <div
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <SwapOutlined style={{ color: '#50C878' }} />
            <span style={{ color: textColor, fontWeight: 600, fontSize: 14 }}>Quy đổi thời gian</span>
            <span style={{ color: subColor, fontSize: 12 }}>— chọn giờ và múi giờ nguồn để xem giờ tương ứng ở tất cả các thành phố bên dưới</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ color: subColor, fontSize: 11, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Giờ nguồn</div>
              <input
                type="time"
                value={convertTime_}
                onChange={(e) => setConvertTime_(e.target.value)}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#50C878',
                  background: inputBg,
                  border: isDark ? '1px solid #333' : '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: '8px 14px',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums',
                  colorScheme: isDark ? 'dark' : 'light',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: subColor, fontSize: 11, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Múi giờ nguồn</div>
              <Select
                showSearch
                value={convertFromTz}
                onChange={setConvertFromTz}
                options={tzOptions}
                style={{ width: '100%' }}
                placeholder="Chọn múi giờ"
                filterOption={(input, opt) =>
                  (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Clock grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {cities.map((city) => (
          <ClockCard
            key={city.id}
            city={city}
            clockTime={clockTimes[city.id]}
            isLocal={city.timezone === localTz}
            localOffset={localOffset}
            isDark={isDark}
            onDelete={handleDeleteCity}
            convertedTime={converterOpen ? convertedTimes[city.id] : undefined}
          />
        ))}
      </div>

      {cities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: subColor }}>
          <GlobalOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
          <div style={{ fontSize: 15 }}>Chưa có thành phố nào. Hãy thêm thành phố đầu tiên!</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{ marginTop: 16, background: '#50C878', border: 'none' }}
          >
            Thêm thành phố
          </Button>
        </div>
      )}

      {/* ── Add city modal ── */}
      <Modal
        title={<span style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>Thêm thành phố</span>}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddCity}
        okText="Thêm"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
        styles={{
          content: { background: isDark ? '#1e1e1e' : '#fff', borderRadius: 12 },
          header: { background: isDark ? '#1e1e1e' : '#fff', borderBottom: isDark ? '1px solid #2e2e2e' : '1px solid #f0f0f0' },
          footer: { background: isDark ? '#1e1e1e' : '#fff', borderTop: isDark ? '1px solid #2e2e2e' : '1px solid #f0f0f0' },
          mask: { backdropFilter: 'blur(3px)' },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          <div>
            <label style={{ color: subColor, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              EMOJI CỜ
            </label>
            <Input
              value={newCityFlag}
              onChange={(e) => setNewCityFlag(e.target.value)}
              placeholder="🌐"
              style={{ width: 80, background: inputBg, border: isDark ? '1px solid #333' : undefined, color: textColor, fontSize: 20 }}
              maxLength={2}
            />
          </div>
          <div>
            <label style={{ color: subColor, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              TÊN THÀNH PHỐ
            </label>
            <Input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="VD: Berlin, Singapore..."
              style={{ background: inputBg, border: isDark ? '1px solid #333' : undefined, color: textColor }}
            />
          </div>
          <div>
            <label style={{ color: subColor, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              MÚI GIỜ
            </label>
            <Select
              showSearch
              value={newCityTz || undefined}
              onChange={setNewCityTz}
              options={tzOptions}
              style={{ width: '100%' }}
              placeholder="Tìm múi giờ..."
              filterOption={(input, opt) =>
                (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
