'use client';

import React, { useState, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Modal, Progress, Row, Col, message } from 'antd';
import { CheckCircleOutlined, PlusOutlined, DeleteOutlined, FireOutlined, CheckCircleOutlined as CheckIcon } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface Habit { id: string; name: string; emoji: string; color: string; completions: string[] }

const EMOJIS = ['🏃', '📚', '💧', '🧘', '🎯', '💪', '🍎', '😴', '✍️', '🎵', '🌱', '🧹'];
const COLORS = ['#50C878', '#1677ff', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

function dateKey(d: Date) { return d.toISOString().slice(0, 10); }

function getLast30Days(): Date[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });
}

function getStreak(completions: string[]): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    if (completions.includes(dateKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    else break;
    if (streak > 365) break;
  }
  return streak;
}

function load(): Habit[] {
  try { return JSON.parse(localStorage.getItem('toolhub_habits') || '[]'); }
  catch { return []; }
}

function save(h: Habit[]) { localStorage.setItem('toolhub_habits', JSON.stringify(h)); }

let nextId = Date.now();

export default function HabitTrackerTool() {
  const [habits, setHabits] = useState<Habit[]>(() => load());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '🎯', color: COLORS[0] });
  const today = dateKey(new Date());
  const days = getLast30Days();

  const update = useCallback((h: Habit[]) => { setHabits(h); save(h); }, []);

  const toggle = (id: string) => {
    update(habits.map(h => {
      if (h.id !== id) return h;
      const has = h.completions.includes(today);
      return { ...h, completions: has ? h.completions.filter(c => c !== today) : [...h.completions, today] };
    }));
  };

  const addHabit = () => {
    if (!form.name.trim()) { message.warning('Nhập tên habit!'); return; }
    const newHabit: Habit = { id: String(nextId++), name: form.name, emoji: form.emoji, color: form.color, completions: [] };
    update([...habits, newHabit]);
    setModal(false);
    setForm({ name: '', emoji: '🎯', color: COLORS[0] });
  };

  const deleteHabit = (id: string) => update(habits.filter(h => h.id !== id));

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  const completedToday = habits.filter(h => h.completions.includes(today)).length;
  const totalHabits = habits.length;

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <CheckCircleOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Habit Tracker
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Theo dõi thói quen hàng ngày, xây dựng streak
      </Text>

      {/* Summary */}
      {totalHabits > 0 && (
        <Card style={{ ...cardStyle, marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex={1}>
              <Text style={{ color: '#888' }}>Hôm nay: </Text>
              <Text style={{ color: dark.primary, fontWeight: 700, fontSize: 18 }}>{completedToday}/{totalHabits}</Text>
              <Text style={{ color: '#888' }}> habit hoàn thành</Text>
            </Col>
            <Col style={{ flex: 2 }}>
              <Progress
                percent={totalHabits ? Math.round(completedToday / totalHabits * 100) : 0}
                strokeColor={dark.primary}
                trailColor="#2a2a2a"
                showInfo
              />
            </Col>
          </Row>
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#e0e0e0', fontWeight: 600 }}>{habits.length} habits</Text>
        <Button icon={<PlusOutlined />} onClick={() => setModal(true)} type="primary"
          style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
          Thêm habit
        </Button>
      </div>

      {habits.length === 0 && (
        <Card style={cardStyle}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text style={{ color: '#555', fontSize: 48, display: 'block' }}>🎯</Text>
            <Text style={{ color: '#888' }}>Chưa có habit nào. Bắt đầu xây dựng thói quen tốt!</Text>
          </div>
        </Card>
      )}

      {habits.map(habit => {
        const streak = getStreak(habit.completions);
        const doneToday = habit.completions.includes(today);
        const rate30 = Math.round(habit.completions.filter(c => days.some(d => dateKey(d) === c)).length / 30 * 100);

        return (
          <Card key={habit.id} style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${habit.color}` }}>
            <Row gutter={16} align="middle">
              <Col>
                <Button
                  shape="circle"
                  style={{
                    width: 48, height: 48, fontSize: 20, border: `2px solid ${doneToday ? habit.color : dark.border}`,
                    background: doneToday ? `${habit.color}22` : '#2a2a2a',
                  }}
                  onClick={() => toggle(habit.id)}
                >
                  {habit.emoji}
                </Button>
              </Col>
              <Col flex={1}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 15 }}>{habit.name}</Text>
                  {doneToday && <Tag color="success"><CheckIcon /> Xong!</Tag>}
                  {streak > 0 && <Tag color="orange"><FireOutlined /> {streak} ngày streak</Tag>}
                </div>
                {/* 30-day calendar */}
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {days.map(d => {
                    const key = dateKey(d);
                    const done = habit.completions.includes(key);
                    const isToday = key === today;
                    return (
                      <div key={key} title={key}
                        style={{
                          width: 14, height: 14, borderRadius: 3,
                          background: done ? habit.color : '#2a2a2a',
                          border: isToday ? `1px solid ${habit.color}` : '1px solid transparent',
                          opacity: done ? 1 : 0.4,
                        }}
                      />
                    );
                  })}
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: 'center', marginBottom: 4 }}>
                  <Text style={{ color: habit.color, fontWeight: 700, fontSize: 18 }}>{rate30}%</Text>
                  <Text style={{ color: '#555', display: 'block', fontSize: 11 }}>30 ngày</Text>
                </div>
                <Button size="small" icon={<DeleteOutlined />} danger type="text" onClick={() => deleteHabit(habit.id)} />
              </Col>
            </Row>
          </Card>
        );
      })}

      <Modal
        open={modal}
        title={<Text style={{ color: '#e0e0e0' }}>Thêm habit mới</Text>}
        onCancel={() => setModal(false)}
        onOk={addHabit}
        okText="Thêm"
        cancelText="Hủy"
        styles={{ content: { background: dark.card }, header: { background: dark.card }, footer: { background: dark.card } }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Tên habit *</Text>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Đọc sách 20 phút"
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 6 }}>Chọn emoji</Text>
            <Space wrap>
              {EMOJIS.map(e => (
                <Button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ background: form.emoji === e ? '#333' : 'transparent', border: `1px solid ${form.emoji === e ? dark.primary : dark.border}`, fontSize: 18 }}>
                  {e}
                </Button>
              ))}
            </Space>
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 6 }}>Màu sắc</Text>
            <Space wrap>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${form.color === c ? '#fff' : 'transparent'}` }} />
              ))}
            </Space>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
