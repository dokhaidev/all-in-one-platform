'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Typography, Space, Tag, Progress, Select, Row, Col } from 'antd';
import { TrophyOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

const TEXTS = {
  vi: [
    'Lập trình là nghệ thuật biến ý tưởng thành hiện thực thông qua ngôn ngữ máy tính.',
    'Mỗi dòng code đều mang theo ý nghĩa và mục đích của người viết ra nó.',
    'Thực hành mỗi ngày là chìa khóa để trở thành lập trình viên giỏi.',
    'Đừng sợ sai lầm vì mỗi lỗi là một bài học quý giá trong hành trình lập trình.',
    'Kiên nhẫn và không ngừng học hỏi sẽ giúp bạn vượt qua mọi khó khăn trong code.',
  ],
  en: [
    'The best way to learn programming is to write code every single day without exception.',
    'Clean code is not written by following a set of rules but by learning and practicing craft.',
    'A good programmer is someone who always looks both ways before crossing a one-way street.',
    'Programming is not about typing fast but about thinking clearly and solving problems.',
    'The most important skill in programming is the ability to break down complex problems.',
  ],
  quote: [
    'Talk is cheap. Show me the code. — Linus Torvalds',
    'First, solve the problem. Then, write the code. — John Johnson',
    'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    'Simplicity is the soul of efficiency. — Austin Freeman',
    'Make it work, make it right, make it fast. — Kent Beck',
  ],
};

type Mode = 'vi' | 'en' | 'quote';
type Status = 'idle' | 'running' | 'done';

export default function TypingRaceTool() {
  const [mode, setMode] = useState<Mode>('vi');
  const [text, setText] = useState(TEXTS.vi[0]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('toolhub_race_best') || '0'));
  const [history, setHistory] = useState<{ wpm: number; acc: number; mode: string }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const getRandomText = useCallback((m: Mode) => {
    const arr = TEXTS[m];
    return arr[Math.floor(Math.random() * arr.length)];
  }, []);

  const restart = useCallback((m?: Mode) => {
    const newMode = m || mode;
    clearInterval(timerRef.current);
    setText(getRandomText(newMode));
    setInput('');
    setStatus('idle');
    setElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    if (m) setMode(m);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [mode, getRandomText]);

  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        const e = (Date.now() - startTime) / 1000;
        setElapsed(e);
        const words = input.trim().split(/\s+/).length;
        setWpm(Math.round(words / (e / 60)));
      }, 200);
    }
    return () => clearInterval(timerRef.current);
  }, [status, startTime, input]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (status === 'idle') { setStartTime(Date.now()); setStatus('running'); }
    if (status === 'done') return;

    setInput(val);

    // Accuracy
    let errs = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== text[i]) errs++;
    }
    setErrors(errs);
    const acc = Math.max(0, Math.round((1 - errs / Math.max(val.length, 1)) * 100));
    setAccuracy(acc);

    // Done
    if (val === text) {
      clearInterval(timerRef.current);
      setStatus('done');
      const finalElapsed = (Date.now() - startTime) / 1000;
      const words = text.trim().split(/\s+/).length;
      const finalWpm = Math.round(words / (finalElapsed / 60));
      setWpm(finalWpm);
      setHistory(h => [{ wpm: finalWpm, acc, mode }, ...h].slice(0, 10));
      if (finalWpm > best) {
        setBest(finalWpm);
        localStorage.setItem('toolhub_race_best', String(finalWpm));
      }
    }
  };

  const progress = Math.min(100, Math.round(input.length / text.length * 100));

  // Render text with color
  const renderText = () => {
    return text.split('').map((char, i) => {
      let color = '#555';
      let bg = 'transparent';
      if (i < input.length) {
        color = input[i] === char ? '#52c41a' : '#ff4d4f';
        if (input[i] !== char) bg = '#3d1515';
      } else if (i === input.length) {
        bg = '#2a2a2a';
        color = '#e0e0e0';
      }
      return (
        <span key={i} style={{ color, background: bg, borderRadius: 2, position: 'relative' }}>
          {char}
          {i === input.length && <span style={{ position: 'absolute', left: 0, borderLeft: `2px solid ${dark.primary}`, height: '1.2em', animation: 'blink 1s infinite', top: 0 }} />}
        </span>
      );
    });
  };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <TrophyOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Typing Race
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Đua tốc độ gõ phím — đo WPM và độ chính xác
      </Text>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: 'WPM', value: wpm, color: dark.primary },
          { label: 'Chính xác', value: `${accuracy}%`, color: accuracy >= 90 ? '#52c41a' : accuracy >= 70 ? '#faad14' : '#ff4d4f' },
          { label: 'Thời gian', value: `${elapsed.toFixed(1)}s`, color: '#1677ff' },
          { label: 'Kỷ lục', value: best, color: '#faad14' },
        ].map(s => (
          <Col xs={12} sm={6} key={s.label}>
            <Card style={{ ...cardStyle, textAlign: 'center' }}>
              <Text style={{ color: '#888', fontSize: 12, display: 'block' }}>{s.label}</Text>
              <Text style={{ color: s.color, fontWeight: 700, fontSize: 22 }}>{s.value}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Progress */}
      <Progress percent={progress} strokeColor={dark.primary} trailColor="#2a2a2a" style={{ marginBottom: 12 }} />

      {/* Controls */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Text style={{ color: '#888' }}>Ngôn ngữ:</Text>
        {(['vi', 'en', 'quote'] as Mode[]).map(m => (
          <Tag key={m} onClick={() => restart(m)}
            style={{ cursor: 'pointer', background: mode === m ? dark.primary : '#2a2a2a', border: `1px solid ${mode === m ? dark.primary : dark.border}`, color: mode === m ? '#000' : dark.text }}>
            {m === 'vi' ? 'Tiếng Việt' : m === 'en' ? 'English' : 'Quotes'}
          </Tag>
        ))}
        <Button icon={<ReloadOutlined />} onClick={() => restart()} size="small"
          style={{ border: `1px solid ${dark.border}`, background: '#2a2a2a', color: dark.text }}>
          Đổi text
        </Button>
      </Space>

      {/* Text display */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 18, lineHeight: 2, letterSpacing: 0.5, minHeight: 100 }}>
          {renderText()}
        </div>
      </Card>

      {/* Input */}
      <Card style={cardStyle}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInput}
          disabled={status === 'done'}
          placeholder={status === 'idle' ? 'Bắt đầu gõ để bắt đầu đua...' : ''}
          style={{
            width: '100%', background: '#1e1e1e', border: `1px solid ${status === 'done' ? dark.primary : dark.border}`,
            borderRadius: 6, color: dark.text, fontFamily: 'monospace', fontSize: 16, lineHeight: 1.6,
            padding: 12, resize: 'none', outline: 'none', minHeight: 80,
          }}
          autoFocus
        />
        {status === 'done' && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Text style={{ color: dark.primary, fontSize: 20, fontWeight: 700, display: 'block' }}>
              🎉 {wpm} WPM · {accuracy}% chính xác
            </Text>
            {wpm === best && <Tag color="warning" style={{ marginTop: 4 }}><TrophyOutlined /> Kỷ lục mới!</Tag>}
            <Button type="primary" onClick={() => restart()} style={{ marginTop: 12, background: dark.primary, borderColor: dark.primary, color: '#000' }}>
              Thử lại
            </Button>
          </div>
        )}
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card style={{ ...cardStyle, marginTop: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Lịch sử</Text>}>
          <Space wrap>
            {history.map((h, i) => (
              <Tag key={i} style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}>
                #{i + 1} {h.wpm} WPM · {h.acc}%
              </Tag>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
}
