'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Typography, Space, Tag, Select, Row, Col } from 'antd';
import { ReloadOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

const EMOJIS = {
  easy: ['🐶','🐱','🐻','🐸','🦊','🐨','🐯','🦁'],
  medium: ['🌸','🌺','🌻','🌹','🍀','🌴','🌵','🍄','🌊','🔥'],
  hard: ['🎸','🎺','🎻','🥁','🎷','🎹','🎵','🎶','🎤','🎼','🎯','🎪'],
};

type Difficulty = 'easy' | 'medium' | 'hard';
interface CardItem { id: number; emoji: string; flipped: boolean; matched: boolean }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(difficulty: Difficulty): CardItem[] {
  const emojis = EMOJIS[difficulty];
  const pairs = [...emojis, ...emojis];
  return shuffle(pairs).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

export default function MemoryCardTool() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cards, setCards] = useState<CardItem[]>(() => createCards('easy'));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState<Record<Difficulty, number>>(() => {
    try { return JSON.parse(localStorage.getItem('toolhub_memory_best') || '{"easy":0,"medium":0,"hard":0}'); }
    catch { return { easy: 0, medium: 0, hard: 0 }; }
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lockRef = useRef(false);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const restart = useCallback((diff?: Difficulty) => {
    const d = diff || difficulty;
    clearInterval(timerRef.current);
    setCards(createCards(d));
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
    lockRef.current = false;
    if (diff) setDifficulty(diff);
  }, [difficulty]);

  const flip = (id: number) => {
    if (lockRef.current) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    if (!running) setRunning(true);

    const newFlipped = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves(m => m + 1);
      const [a, b] = newFlipped.map(fid => cards.find(c => c.id === fid)!);
      if (a.emoji === b.emoji) {
        setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c));
        setFlipped([]);
        lockRef.current = false;
        // Check win
        setTimeout(() => {
          setCards(prev => {
            if (prev.every(c => c.matched || newFlipped.includes(c.id))) {
              setWon(true);
              setRunning(false);
              clearInterval(timerRef.current);
              setTime(t => {
                setBest(b => {
                  const nb = { ...b, [difficulty]: b[difficulty] === 0 ? t : Math.min(b[difficulty], t) };
                  localStorage.setItem('toolhub_memory_best', JSON.stringify(nb));
                  return nb;
                });
                return t;
              });
            }
            return prev;
          });
        }, 100);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
          lockRef.current = false;
        }, 1000);
      }
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const matched = cards.filter(c => c.matched).length / 2;
  const total = cards.length / 2;
  const cols = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        Memory Card
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Lật thẻ tìm cặp giống nhau — luyện trí nhớ
      </Text>

      {/* Controls */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text style={{ color: '#888' }}>Độ khó: </Text>
            <Select value={difficulty} onChange={d => restart(d)} style={{ width: 120 }} dropdownStyle={{ background: '#1e1e1e' }}>
              <Option value="easy">Dễ (4×4)</Option>
              <Option value="medium">Vừa (5×4)</Option>
              <Option value="hard">Khó (6×4)</Option>
            </Select>
          </Col>
          <Col><Tag color={running ? 'success' : 'default'}>{formatTime(time)}</Tag></Col>
          <Col><Tag style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}>Lượt: {moves}</Tag></Col>
          <Col><Tag color="blue">{matched}/{total} cặp</Tag></Col>
          {best[difficulty] > 0 && <Col><Tag color="warning"><TrophyOutlined /> Best: {formatTime(best[difficulty])}</Tag></Col>}
          <Col style={{ marginLeft: 'auto' }}>
            <Button icon={<ReloadOutlined />} onClick={() => restart()}
              style={{ border: `1px solid ${dark.border}`, background: '#2a2a2a', color: dark.text }}>
              Chơi lại
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
        maxWidth: cols * 90 + (cols - 1) * 10,
        margin: '0 auto',
      }}>
        {cards.map(card => (
          <div key={card.id}
            onClick={() => flip(card.id)}
            style={{
              aspectRatio: '1',
              borderRadius: 10,
              cursor: card.matched ? 'default' : 'pointer',
              background: card.flipped || card.matched ? (card.matched ? `${dark.primary}33` : '#2a2a2a') : '#2e2e2e',
              border: `2px solid ${card.matched ? dark.primary : card.flipped ? '#888' : dark.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
              transition: 'all 0.3s',
              transform: card.flipped || card.matched ? 'scale(1)' : 'scale(0.97)',
              opacity: card.matched ? 0.6 : 1,
            }}>
            {card.flipped || card.matched ? card.emoji : '?'}
          </div>
        ))}
      </div>

      {won && (
        <Card style={{ ...cardStyle, marginTop: 24, textAlign: 'center', border: `1px solid ${dark.primary}`, maxWidth: 380, margin: '24px auto 0' }}>
          <Text style={{ color: dark.primary, fontSize: 28, display: 'block' }}>🎉 Hoàn thành!</Text>
          <Text style={{ color: '#888', display: 'block' }}>Thời gian: {formatTime(time)} · Lượt: {moves}</Text>
          <Button type="primary" onClick={() => restart()} style={{ marginTop: 12, background: dark.primary, borderColor: dark.primary, color: '#000' }}>
            Chơi lại
          </Button>
        </Card>
      )}
    </div>
  );
}
