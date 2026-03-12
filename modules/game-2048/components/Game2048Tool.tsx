'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Typography, Space, Tag, message } from 'antd';
import { ReloadOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

type Grid = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: '#2a2a2a', text: 'transparent' },
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#50C878', text: '#fff' },
};

function createGrid(): Grid { return Array.from({ length: 4 }, () => Array(4).fill(0)); }

function addRandom(grid: Grid): Grid {
  const g = grid.map(r => [...r]);
  const empty: [number, number][] = [];
  g.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
}

function slide(row: number[]): [number[], number] {
  const nums = row.filter(Boolean);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      merged.push(nums[i] * 2);
      score += nums[i] * 2;
      i += 2;
    } else { merged.push(nums[i]); i++; }
  }
  return [[...merged, ...Array(4 - merged.length).fill(0)], score];
}

function move(grid: Grid, dir: string): [Grid, number, boolean] {
  let g = grid.map(r => [...r]);
  let totalScore = 0;
  let moved = false;

  if (dir === 'left' || dir === 'right') {
    g = g.map(row => {
      const r = dir === 'right' ? [...row].reverse() : row;
      const [slid, s] = slide(r);
      totalScore += s;
      const res = dir === 'right' ? slid.reverse() : slid;
      if (JSON.stringify(res) !== JSON.stringify(row)) moved = true;
      return res;
    });
  } else {
    for (let c = 0; c < 4; c++) {
      const col = g.map(r => r[c]);
      const r = dir === 'down' ? [...col].reverse() : col;
      const [slid, s] = slide(r);
      totalScore += s;
      const res = dir === 'down' ? slid.reverse() : slid;
      res.forEach((v, r2) => { if (v !== g[r2][c]) moved = true; g[r2][c] = v; });
    }
  }

  return [g, totalScore, moved];
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
    }
  return true;
}

function initGame(): Grid {
  let g = createGrid();
  g = addRandom(g);
  g = addRandom(g);
  return g;
}

export default function Game2048Tool() {
  const [grid, setGrid] = useState<Grid>(() => initGame());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('toolhub_2048_best') || '0'));
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const restart = () => {
    setGrid(initGame());
    setScore(0);
    setWon(false);
    setOver(false);
  };

  const handleMove = useCallback((dir: string) => {
    if (over) return;
    setGrid(prev => {
      const [newGrid, addScore, moved] = move(prev, dir);
      if (!moved) return prev;
      const withRandom = addRandom(newGrid);
      setScore(s => {
        const ns = s + addScore;
        setBest(b => {
          const nb = Math.max(b, ns);
          localStorage.setItem('toolhub_2048_best', String(nb));
          return nb;
        });
        return ns;
      });
      if (withRandom.some(r => r.includes(2048))) setWon(true);
      if (isGameOver(withRandom)) setOver(true);
      return withRandom;
    });
  }, [over]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
    else handleMove(dy > 0 ? 'down' : 'up');
    touchStart.current = null;
  };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const CELL = 68;

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        2048
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Ghép ô để đạt 2048 — dùng phím mũi tên hoặc vuốt
      </Text>

      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        {/* Score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          {[['ĐIỂM', score, dark.primary], ['CAO NHẤT', best, '#faad14']].map(([label, val, color]) => (
            <Card key={label as string} style={{ ...cardStyle, flex: 1, margin: '0 4px', textAlign: 'center' }}>
              <Text style={{ color: '#888', fontSize: 12, display: 'block' }}>{label}</Text>
              <Text style={{ color: color as string, fontWeight: 700, fontSize: 22 }}>{val}</Text>
            </Card>
          ))}
          <Button icon={<ReloadOutlined />} onClick={restart}
            style={{ border: `1px solid ${dark.border}`, background: '#2a2a2a', color: dark.text, height: 'auto', padding: '0 16px', margin: '0 4px' }}>
            Mới
          </Button>
        </div>

        {/* Game board */}
        <div
          style={{ background: '#3a3a3a', borderRadius: 10, padding: 8, userSelect: 'none', touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 8, marginBottom: r < 3 ? 8 : 0 }}>
              {row.map((val, c) => {
                const tileColor = TILE_COLORS[val] || { bg: '#50C878', text: '#fff' };
                return (
                  <div key={c} style={{
                    width: CELL, height: CELL, borderRadius: 6, background: tileColor.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: val >= 1000 ? 20 : val >= 100 ? 24 : 28,
                    fontWeight: 800, color: tileColor.text,
                    transition: 'background 0.1s',
                  }}>
                    {val || ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 16, maxWidth: 200, margin: '16px auto 0' }}>
          {[['', '↑', ''], ['←', '↓', '→']].flat().map((arrow, i) => (
            <Button key={i} disabled={!arrow}
              onClick={() => {
                const dirs = ['', 'up', '', 'left', 'down', 'right'];
                if (dirs[i]) handleMove(dirs[i]);
              }}
              style={{ background: arrow ? '#2a2a2a' : 'transparent', border: arrow ? `1px solid ${dark.border}` : 'none', color: dark.text, opacity: arrow ? 1 : 0 }}>
              {arrow}
            </Button>
          ))}
        </div>

        {(won || over) && (
          <Card style={{ ...cardStyle, marginTop: 16, textAlign: 'center', border: `1px solid ${won ? dark.primary : '#ff4d4f'}` }}>
            <Text style={{ color: won ? dark.primary : '#ff4d4f', fontSize: 24, fontWeight: 700, display: 'block' }}>
              {won ? '🎉 Bạn đã đạt 2048!' : '💀 Game Over!'}
            </Text>
            <Text style={{ color: '#888', display: 'block', marginBottom: 12 }}>Điểm: {score}</Text>
            <Button type="primary" onClick={restart}
              style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
              Chơi lại
            </Button>
          </Card>
        )}

        <Text style={{ color: '#555', fontSize: 12, display: 'block', marginTop: 12, textAlign: 'center' }}>
          Dùng phím mũi tên ↑↓←→ hoặc vuốt trên màn hình cảm ứng
        </Text>
      </div>
    </div>
  );
}
