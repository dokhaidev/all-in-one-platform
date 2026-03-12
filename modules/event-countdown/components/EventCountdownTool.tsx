'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Select,
  Progress,
  Tooltip,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';
import dayjs, { Dayjs } from 'dayjs';

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorTheme = 'emerald' | 'blue' | 'purple' | 'orange' | 'pink';

interface EventItem {
  id: string;
  name: string;
  emoji: string;
  targetDate: string;   // ISO string
  createdAt: string;    // ISO string
  colorTheme: ColorTheme;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
  progress: number; // 0-100, % elapsed
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'toolhub_event_countdown_events';

const COLOR_THEMES: Record<ColorTheme, { primary: string; bg: string; border: string; label: string }> = {
  emerald: { primary: '#50C878', bg: 'rgba(80,200,120,0.07)', border: 'rgba(80,200,120,0.35)', label: 'Xanh lá' },
  blue:    { primary: '#3b82f6', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.35)', label: 'Xanh dương' },
  purple:  { primary: '#a855f7', bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.35)', label: 'Tím' },
  orange:  { primary: '#f97316', bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.35)', label: 'Cam' },
  pink:    { primary: '#ec4899', bg: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.35)', label: 'Hồng' },
};

const PRESET_EVENTS: Omit<EventItem, 'id' | 'createdAt'>[] = [
  {
    name: 'Tết Nguyên Đán 2026',
    emoji: '🎆',
    targetDate: new Date('2026-02-17T00:00:00').toISOString(),
    colorTheme: 'emerald',
  },
  {
    name: 'Ngày Valentine',
    emoji: '💕',
    targetDate: (() => {
      const d = new Date();
      const next = new Date(d.getFullYear() + (d.getMonth() > 1 || (d.getMonth() === 1 && d.getDate() > 14) ? 1 : 0), 1, 14, 0, 0, 0);
      return next.toISOString();
    })(),
    colorTheme: 'pink',
  },
  {
    name: 'Giáng sinh',
    emoji: '🎄',
    targetDate: (() => {
      const d = new Date();
      const next = new Date(d.getMonth() === 11 && d.getDate() > 25 ? d.getFullYear() + 1 : d.getFullYear(), 11, 25, 0, 0, 0);
      return next.toISOString();
    })(),
    colorTheme: 'orange',
  },
];

const EMOJI_OPTIONS = ['🎉', '🎂', '🎄', '🎆', '✈️', '📅', '🏆', '💼', '❤️', '💕', '🌟', '🔥', '🎓', '🏖️', '🎁', '🌍', '⏰', '🚀', '🎊', '📌'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadEvents(): EventItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveEvents(events: EventItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(events));
  } catch { /* ignore */ }
}

function calcCountdown(targetISO: string, createdISO: string): Countdown {
  const now = Date.now();
  const target = new Date(targetISO).getTime();
  const created = new Date(createdISO).getTime();

  const diff = target - now;
  const isPast = diff <= 0;

  if (isPast) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: true, progress: 100 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // progress = elapsed / total * 100
  const total = target - created;
  const elapsed = now - created;
  const progress = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;

  return { days, hours, minutes, seconds, totalSeconds, isPast: false, progress };
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: EventItem;
  countdown: Countdown;
  isDark: boolean;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string) => void;
  onShare: (event: EventItem, countdown: Countdown) => void;
}

function EventCard({ event, countdown, isDark, onEdit, onDelete, onShare }: EventCardProps) {
  const theme = COLOR_THEMES[event.colorTheme];
  const cardBg = isDark ? '#222222' : '#ffffff';
  const textColor = isDark ? '#e0e0e0' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const border = countdown.isPast
    ? isDark ? '1px solid #3a3a3a' : '1px solid #e8e8e8'
    : `1.5px solid ${theme.border}`;
  const bg = countdown.isPast ? cardBg : (isDark ? theme.bg : theme.bg);

  const targetDate = new Date(event.targetDate);
  const dateStr = targetDate.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = targetDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      style={{
        background: bg,
        border,
        borderRadius: 14,
        padding: '20px 20px 16px',
        boxShadow: countdown.isPast
          ? isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)'
          : `0 0 0 1px ${theme.border.replace('0.35', '0.1')}, 0 2px 12px ${theme.bg}`,
        opacity: countdown.isPast ? 0.7 : 1,
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{event.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: textColor, fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.name}
            </div>
            <div style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {dateStr} · {timeStr}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onShare(event, countdown)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subColor, padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#50C878'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = subColor; }}
            title="Chia sẻ"
          >
            <CopyOutlined style={{ fontSize: 13 }} />
          </button>
          <button
            onClick={() => onEdit(event)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subColor, padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#50C878'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = subColor; }}
            title="Chỉnh sửa"
          >
            <EditOutlined style={{ fontSize: 13 }} />
          </button>
          <Popconfirm
            title="Xóa sự kiện?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => onDelete(event.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subColor, padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e05555'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = subColor; }}
              title="Xóa"
            >
              <DeleteOutlined style={{ fontSize: 13 }} />
            </button>
          </Popconfirm>
        </div>
      </div>

      {/* Countdown or "Đã qua" */}
      {countdown.isPast ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircleOutlined style={{ color: '#50C878', fontSize: 18 }} />
          <span style={{ color: '#50C878', fontWeight: 700, fontSize: 18 }}>Đã qua</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'nowrap', overflowX: 'auto' }}>
          {[
            { val: countdown.days,    label: 'ngày' },
            { val: countdown.hours,   label: 'giờ' },
            { val: countdown.minutes, label: 'phút' },
            { val: countdown.seconds, label: 'giây' },
          ].map(({ val, label }) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: 52,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                borderRadius: 8,
                padding: '8px 6px 6px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: theme.primary,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.5px',
                }}
              >
                {pad2(val)}
              </div>
              <div style={{ fontSize: 10, color: subColor, marginTop: 3, fontWeight: 500 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: subColor }}>Tiến độ</span>
          <span style={{ fontSize: 11, color: theme.primary, fontWeight: 600 }}>
            {countdown.progress.toFixed(1)}%
          </span>
        </div>
        <Progress
          percent={Math.round(countdown.progress)}
          showInfo={false}
          strokeColor={theme.primary}
          trailColor={isDark ? '#2e2e2e' : '#f0f0f0'}
          size={['100%', 6]}
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface EventModalProps {
  open: boolean;
  editing: EventItem | null;
  isDark: boolean;
  onClose: () => void;
  onSave: (data: Omit<EventItem, 'id' | 'createdAt'>) => void;
}

function EventModal({ open, editing, isDark, onClose, onSave }: EventModalProps) {
  const [form] = Form.useForm();
  const textColor = isDark ? '#e0e0e0' : '#111';
  const subColor = isDark ? '#888' : '#777';

  useEffect(() => {
    if (open) {
      if (editing) {
        const d = dayjs(editing.targetDate);
        form.setFieldsValue({
          name: editing.name,
          emoji: editing.emoji,
          colorTheme: editing.colorTheme,
          date: d,
          time: d,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ emoji: '🎉', colorTheme: 'emerald' });
      }
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const date: Dayjs = values.date;
      const time: Dayjs = values.time;
      const combined = date
        .hour(time ? time.hour() : 0)
        .minute(time ? time.minute() : 0)
        .second(0);
      onSave({
        name: values.name.trim(),
        emoji: values.emoji || '🎉',
        colorTheme: values.colorTheme,
        targetDate: combined.toDate().toISOString(),
      });
    } catch { /* validation failed */ }
  };

  const modalStyles = {
    content: { background: isDark ? '#1e1e1e' : '#fff', borderRadius: 12 },
    header: { background: isDark ? '#1e1e1e' : '#fff', borderBottom: isDark ? '1px solid #2e2e2e' : '1px solid #f0f0f0' },
    footer: { background: isDark ? '#1e1e1e' : '#fff', borderTop: isDark ? '1px solid #2e2e2e' : '1px solid #f0f0f0' },
    mask: { backdropFilter: 'blur(3px)' },
  };

  return (
    <Modal
      title={<span style={{ color: textColor, fontWeight: 700 }}>{editing ? 'Sửa sự kiện' : 'Tạo sự kiện mới'}</span>}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={editing ? 'Lưu' : 'Tạo'}
      cancelText="Hủy"
      okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
      styles={modalStyles}
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
          <Form.Item label={<span style={{ color: subColor, fontSize: 12 }}>Emoji</span>} name="emoji">
            <Select
              options={EMOJI_OPTIONS.map((e) => ({ value: e, label: e }))}
              style={{ fontSize: 20 }}
            />
          </Form.Item>
          <Form.Item
            label={<span style={{ color: subColor, fontSize: 12 }}>Tên sự kiện</span>}
            name="name"
            rules={[{ required: true, message: 'Nhập tên sự kiện' }]}
          >
            <Input placeholder="VD: Sinh nhật của tôi..." />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            label={<span style={{ color: subColor, fontSize: 12 }}>Ngày</span>}
            name="date"
            rules={[{ required: true, message: 'Chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            label={<span style={{ color: subColor, fontSize: 12 }}>Giờ</span>}
            name="time"
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </div>

        <Form.Item
          label={<span style={{ color: subColor, fontSize: 12 }}>Màu sắc</span>}
          name="colorTheme"
        >
          <Select
            options={Object.entries(COLOR_THEMES).map(([key, val]) => ({
              value: key,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: val.primary }} />
                  {val.label}
                </div>
              ),
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventCountdownTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [events, setEvents] = useState<EventItem[]>(() => loadEvents());
  const [countdowns, setCountdowns] = useState<Record<string, Countdown>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);

  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '1px solid #2e2e2e' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e0e0e0' : '#111';
  const subColor = isDark ? '#888' : '#777';

  // Update countdowns every second
  useEffect(() => {
    const tick = () => {
      const next: Record<string, Countdown> = {};
      for (const ev of events) {
        next[ev.id] = calcCountdown(ev.targetDate, ev.createdAt);
      }
      setCountdowns(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [events]);

  const sortedEvents = [...events].sort((a, b) => {
    const ca = countdowns[a.id];
    const cb = countdowns[b.id];
    if (!ca || !cb) return 0;
    if (ca.isPast && !cb.isPast) return 1;
    if (!ca.isPast && cb.isPast) return -1;
    return ca.totalSeconds - cb.totalSeconds;
  });

  const handleSave = useCallback((data: Omit<EventItem, 'id' | 'createdAt'>) => {
    if (editing) {
      setEvents((prev) => {
        const next = prev.map((e) => e.id === editing.id ? { ...e, ...data } : e);
        saveEvents(next);
        return next;
      });
      message.success('Đã cập nhật sự kiện');
    } else {
      const newEvent: EventItem = {
        id: `ev_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      setEvents((prev) => {
        const next = [...prev, newEvent];
        saveEvents(next);
        return next;
      });
      message.success('Đã tạo sự kiện mới');
    }
    setModalOpen(false);
    setEditing(null);
  }, [editing]);

  const handleDelete = useCallback((id: string) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveEvents(next);
      return next;
    });
    message.success('Đã xóa sự kiện');
  }, []);

  const handleEdit = useCallback((event: EventItem) => {
    setEditing(event);
    setModalOpen(true);
  }, []);

  const handleShare = useCallback((event: EventItem, countdown: Countdown) => {
    let text: string;
    if (countdown.isPast) {
      text = `[${event.emoji} ${event.name}] đã diễn ra rồi!`;
    } else {
      text = `Còn ${countdown.days} ngày đến ${event.emoji} ${event.name}!`;
    }
    navigator.clipboard.writeText(text).then(() => {
      message.success('Đã sao chép vào clipboard!');
    });
  }, []);

  const handleAddPreset = (preset: Omit<EventItem, 'id' | 'createdAt'>) => {
    const newEvent: EventItem = {
      id: `ev_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...preset,
    };
    setEvents((prev) => {
      const next = [...prev, newEvent];
      saveEvents(next);
      return next;
    });
    message.success(`Đã thêm "${preset.name}"`);
  };

  return (
    <div style={{ width: '100%' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: '#50C878', fontSize: 18 }} />
          <span style={{ color: textColor, fontWeight: 600, fontSize: 15 }}>
            {events.length} sự kiện
          </span>
          <Tag color="green" style={{ fontSize: 11 }}>
            Sắp xếp: gần nhất trước
          </Tag>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditing(null); setModalOpen(true); }}
          style={{ background: '#50C878', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600 }}
        >
          Tạo sự kiện mới
        </Button>
      </div>

      {/* ── Preset events ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <StarOutlined style={{ color: '#50C878' }} />
          <span style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>Sự kiện gợi ý nhanh</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESET_EVENTS.map((preset) => {
            const theme = COLOR_THEMES[preset.colorTheme];
            return (
              <button
                key={preset.name}
                onClick={() => handleAddPreset(preset)}
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 20,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: theme.primary,
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
                <PlusOutlined style={{ fontSize: 10 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Event grid ── */}
      {sortedEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: subColor }}>
          <CalendarOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
          <div style={{ fontSize: 15 }}>Chưa có sự kiện nào. Hãy tạo sự kiện đầu tiên!</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditing(null); setModalOpen(true); }}
            style={{ marginTop: 16, background: '#50C878', border: 'none' }}
          >
            Tạo ngay
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              countdown={countdowns[event.id] ?? { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: false, progress: 0 }}
              isDark={isDark}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <EventModal
        open={modalOpen}
        editing={editing}
        isDark={isDark}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
