'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Typography, Space, Tag, Modal, message } from 'antd';
import { ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

// 5-letter Vietnamese words (Latin alphabet representation)
const WORDS = [
  'KHONG', 'DUONG', 'NUOC', 'NGAY', 'THANG', 'TRUOC', 'TRONG', 'NHIEU', 'CHUON', 'BUONG',
  'PHONG', 'VUNG', 'TUONG', 'XUONG', 'GIONG', 'LUONG', 'MUONG', 'RUONG', 'SUONG', 'CUONG',
  'MIENG', 'RIENG', 'TIENG', 'DIENG', 'GIENG', 'LIENG', 'NIENG', 'PIENG', 'QIENG', 'SIENG',
  'BANH', 'CANH', 'DANH', 'GANH', 'HANH', 'LANH', 'MANH', 'NANH', 'QANH', 'RANH',
  'BONG', 'CONG', 'DONG', 'GONG', 'HONG', 'LONG', 'MONG', 'NONG', 'PONG', 'RONG',
  'SANG', 'TANG', 'VANG', 'XANG', 'YANG', 'ZANG', 'BANG', 'CANG', 'DANG', 'GANG',
  'SACH', 'TACH', 'BACH', 'CACH', 'DACH', 'GACH', 'HACH', 'LACH', 'MACH', 'NACH',
  'BUOI', 'CUOI', 'DUOI', 'GUOI', 'HUOI', 'LUOI', 'MUOI', 'NUOI', 'PUOI', 'RUOI',
];

// English 5-letter fallback for better gameplay
const ENGLISH_WORDS = [
  'CRANE', 'SLATE', 'TRACE', 'CRATE', 'STARE', 'SNARE', 'SHARE', 'GLARE', 'FLARE', 'BLARE',
  'SCORE', 'STORE', 'SHORE', 'SWORE', 'ADORE', 'SPORE', 'SNORE', 'CHORE', 'ABORE', 'BDORE',
  'PLANT', 'SLANT', 'GRANT', 'CHANT', 'SCANT', 'RANT', 'WANTS', 'ANTS', 'PANTS', 'RANTS',
  'BRAVE', 'CRAVE', 'GRAVE', 'SHAVE', 'STAVE', 'WAVE', 'CAVE', 'DAVE', 'GAVE', 'HAVE',
  'BRING', 'CLING', 'FLING', 'SLING', 'STING', 'THING', 'WRING', 'SPRING', 'STRING', 'SWING',
  'PRIDE', 'BRIDE', 'GUIDE', 'SLIDE', 'GLIDE', 'ABIDE', 'CHIDE', 'ELIDE', 'SNIDE', 'TRIDE',
  'FLASH', 'CLASH', 'CRASH', 'BRASH', 'GNASH', 'GNASH', 'STASH', 'TRASH', 'LASH', 'RASH',
  'CLOCK', 'BLOCK', 'FLOCK', 'KNOCK', 'SHOCK', 'STOCK', 'SMOCK', 'STORK', 'SPOCK', 'CROOK',
  'DREAM', 'CREAM', 'STEAM', 'GLEAM', 'SCREAM', 'TEAM', 'BEAM', 'SEAM', 'TREAM', 'DJEAM',
  'LIGHT', 'NIGHT', 'RIGHT', 'TIGHT', 'MIGHT', 'FIGHT', 'SIGHT', 'BIGHT', 'WIGHT', 'AIGHT',
];

const ALL_WORDS = [...new Set([...ENGLISH_WORDS])].filter(w => w.length === 5);

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'active';

interface GuessRow { letters: string[]; states: LetterState[] }

function checkGuess(guess: string, answer: string): LetterState[] {
  const states: LetterState[] = Array(5).fill('absent');
  const ansArr = answer.split('');
  const remaining: (string | null)[] = [...ansArr];

  // First pass: exact matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) { states[i] = 'correct'; remaining[i] = null; }
  }
  // Second pass: present
  for (let i = 0; i < 5; i++) {
    if (states[i] === 'correct') continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) { states[i] = 'present'; remaining[idx] = null; }
  }
  return states;
}

const STATE_COLORS: Record<LetterState, { bg: string; border: string; text: string }> = {
  correct: { bg: '#538d4e', border: '#538d4e', text: '#fff' },
  present: { bg: '#b59f3b', border: '#b59f3b', text: '#fff' },
  absent: { bg: '#3a3a3c', border: '#3a3a3c', text: '#fff' },
  empty: { bg: 'transparent', border: '#3a3a3c', text: '#fff' },
  active: { bg: 'transparent', border: '#565758', text: '#fff' },
};

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

export default function WordleTool() {
  const [answer, setAnswer] = useState(() => ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [current, setCurrent] = useState('');
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [shake, setShake] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const maxGuesses = 6;

  const letterStates = useCallback((): Record<string, LetterState> => {
    const map: Record<string, LetterState> = {};
    guesses.forEach(g => {
      g.letters.forEach((l, i) => {
        const cur = map[l];
        const next = g.states[i];
        if (cur === 'correct') return;
        if (cur === 'present' && next === 'absent') return;
        map[l] = next;
      });
    });
    return map;
  }, [guesses]);

  const submit = useCallback(() => {
    if (current.length !== 5) { setShake(true); setTimeout(() => setShake(false), 500); message.warning('Nhập đủ 5 chữ!'); return; }

    const states = checkGuess(current, answer);
    const newGuess: GuessRow = { letters: current.split(''), states };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);
    setCurrent('');

    if (current === answer) { setWon(true); return; }
    if (newGuesses.length >= maxGuesses) setLost(true);
  }, [current, answer, guesses]);

  const pressKey = useCallback((key: string) => {
    if (won || lost) return;
    if (key === 'ENTER') { submit(); return; }
    if (key === '⌫' || key === 'BACKSPACE') { setCurrent(c => c.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key) && current.length < 5) setCurrent(c => c + key);
  }, [won, lost, current, submit]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => pressKey(e.key.toUpperCase());
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pressKey]);

  const restart = () => {
    setAnswer(ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]);
    setGuesses([]); setCurrent(''); setWon(false); setLost(false);
  };

  const lm = letterStates();

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const CELL = 56;

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ color: '#e0e0e0', margin: 0 }}>Wordle</Title>
        <Space>
          <Button icon={<QuestionCircleOutlined />} onClick={() => setHelpOpen(true)}
            style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }} />
          <Button icon={<ReloadOutlined />} onClick={restart}
            style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>
            Mới
          </Button>
        </Space>
      </div>

      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        {/* Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
          {Array.from({ length: maxGuesses }, (_, rowIdx) => {
            const guess = guesses[rowIdx];
            const isActive = rowIdx === guesses.length && !won && !lost;
            const letters = guess ? guess.letters : (isActive ? current.padEnd(5, '').split('') : Array(5).fill(''));
            const states: LetterState[] = guess ? guess.states : Array(5).fill(isActive && current.length > 0 ? 'active' : 'empty');

            return (
              <div key={rowIdx} style={{ display: 'flex', gap: 6, justifyContent: 'center', animation: isActive && shake ? 'shake 0.5s' : undefined }}>
                {letters.map((letter, ci) => {
                  const state = states[ci];
                  const { bg, border, text } = STATE_COLORS[state];
                  return (
                    <div key={ci} style={{
                      width: CELL, height: CELL, border: `2px solid ${border}`, borderRadius: 4,
                      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 800, color: text, transition: 'all 0.2s',
                    }}>
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {(won || lost) && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Text style={{ color: won ? dark.primary : '#ff4d4f', fontSize: 20, fontWeight: 700, display: 'block' }}>
              {won ? `🎉 Bạn đoán đúng! (${guesses.length}/${maxGuesses} lần)` : `💀 Đáp án là: ${answer}`}
            </Text>
            <Button type="primary" onClick={restart} style={{ marginTop: 8, background: dark.primary, borderColor: dark.primary, color: '#000' }}>
              Chơi lại
            </Button>
          </div>
        )}

        {/* Keyboard */}
        <div>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
              {row.map(key => {
                const state = lm[key];
                const { bg, text } = state ? STATE_COLORS[state] : { bg: '#818384', text: '#fff' };
                const isWide = key === 'ENTER' || key === '⌫';
                return (
                  <button key={key} onClick={() => pressKey(key)}
                    style={{
                      width: isWide ? 56 : 36, height: 52, borderRadius: 4, border: 'none',
                      background: bg, color: text, fontWeight: 700, fontSize: isWide ? 11 : 14,
                      cursor: 'pointer', transition: 'all 0.1s',
                    }}>
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Modal open={helpOpen} onCancel={() => setHelpOpen(false)} footer={null}
        title={<Text style={{ color: '#e0e0e0' }}>Cách chơi Wordle</Text>}
        styles={{ content: { background: dark.card }, header: { background: dark.card } }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text style={{ color: dark.text }}>Đoán từ tiếng Anh có 5 chữ cái trong 6 lần thử.</Text>
          <div>
            {[
              { state: 'correct' as LetterState, label: 'C', desc: 'Chữ đúng vị trí' },
              { state: 'present' as LetterState, label: 'A', desc: 'Chữ có trong từ nhưng sai vị trí' },
              { state: 'absent' as LetterState, label: 'Z', desc: 'Chữ không có trong từ' },
            ].map(({ state, label, desc }) => (
              <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: STATE_COLORS[state].bg, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>{label}</div>
                <Text style={{ color: dark.text }}>{desc}</Text>
              </div>
            ))}
          </div>
        </Space>
      </Modal>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-4px)} 20%,40%,60%,80%{transform:translateX(4px)} }`}</style>
    </div>
  );
}
