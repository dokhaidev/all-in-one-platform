'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Select, Tag, Typography, Modal, Row, Col, Progress, Tooltip } from 'antd';
import {
  PlayCircleOutlined, ReloadOutlined, TrophyOutlined, ThunderboltOutlined,
  AimOutlined, ClockCircleOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.2)';

// ── Snippet Bank ──────────────────────────────────────────────────────────────

type Language = 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'sql' | 'bash';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Snippet {
  code: string;
  difficulty: Difficulty;
}

const SNIPPETS: Record<Language, Snippet[]> = {
  javascript: [
    { difficulty: 'easy', code: 'const greet = name => `Hello, ${name}!`;' },
    { difficulty: 'easy', code: 'const sum = (a, b) => a + b;' },
    { difficulty: 'easy', code: 'const arr = [1, 2, 3];\nconst doubled = arr.map(x => x * 2);' },
    { difficulty: 'easy', code: 'function isEven(n) {\n  return n % 2 === 0;\n}' },
    { difficulty: 'medium', code: 'const debounce = (fn, ms) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n};' },
    { difficulty: 'medium', code: 'const flatten = arr => arr.reduce((acc, val) =>\n  Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);' },
    { difficulty: 'medium', code: 'async function fetchData(url) {\n  try {\n    const res = await fetch(url);\n    return await res.json();\n  } catch (err) {\n    console.error(err);\n  }\n}' },
    { difficulty: 'medium', code: 'const memoize = fn => {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n};' },
    { difficulty: 'hard', code: 'class EventEmitter {\n  constructor() { this.events = {}; }\n  on(event, cb) {\n    (this.events[event] ||= []).push(cb);\n  }\n  emit(event, ...args) {\n    (this.events[event] || []).forEach(cb => cb(...args));\n  }\n}' },
    { difficulty: 'hard', code: 'function deepClone(obj) {\n  if (obj === null || typeof obj !== "object") return obj;\n  if (Array.isArray(obj)) return obj.map(deepClone);\n  return Object.fromEntries(\n    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])\n  );\n}' },
    { difficulty: 'hard', code: 'const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);\nconst add1 = x => x + 1;\nconst double = x => x * 2;\nconst result = pipe(add1, double, add1)(5);' },
  ],
  typescript: [
    { difficulty: 'easy', code: 'type Point = { x: number; y: number };\nconst distance = (a: Point, b: Point): number =>\n  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);' },
    { difficulty: 'easy', code: 'interface User {\n  id: number;\n  name: string;\n  email?: string;\n}' },
    { difficulty: 'easy', code: 'const greet = (name: string): string => `Hello, ${name}!`;' },
    { difficulty: 'medium', code: 'type Nullable<T> = T | null;\ntype Optional<T> = T | undefined;\ntype Maybe<T> = Nullable<T> | Optional<T>;' },
    { difficulty: 'medium', code: 'function identity<T>(arg: T): T {\n  return arg;\n}\nconst num = identity<number>(42);\nconst str = identity<string>("hello");' },
    { difficulty: 'medium', code: 'type Partial<T> = { [K in keyof T]?: T[K] };\ntype Required<T> = { [K in keyof T]-?: T[K] };\ntype Readonly<T> = { readonly [K in keyof T]: T[K] };' },
    { difficulty: 'hard', code: 'type DeepPartial<T> = {\n  [K in keyof T]?: T[K] extends object\n    ? DeepPartial<T[K]>\n    : T[K];\n};' },
    { difficulty: 'hard', code: 'type UnionToIntersection<U> =\n  (U extends unknown ? (x: U) => void : never) extends\n  (x: infer I) => void ? I : never;' },
    { difficulty: 'hard', code: 'function createReducer<S, A extends { type: string }>(initialState: S, handlers: {\n  [K in A["type"]]?: (state: S, action: Extract<A, { type: K }>) => S;\n}) {\n  return (state = initialState, action: A): S =>\n    handlers[action.type as A["type"]]?.(state, action as never) ?? state;\n}' },
    { difficulty: 'medium', code: 'enum Direction {\n  Up = "UP",\n  Down = "DOWN",\n  Left = "LEFT",\n  Right = "RIGHT",\n}\nconst move = (dir: Direction): void => console.log(`Moving ${dir}`);' },
  ],
  python: [
    { difficulty: 'easy', code: 'def greet(name: str) -> str:\n    return f"Hello, {name}!"' },
    { difficulty: 'easy', code: 'squares = [x ** 2 for x in range(10)]\nprint(squares)' },
    { difficulty: 'easy', code: 'def is_palindrome(s: str) -> bool:\n    return s == s[::-1]' },
    { difficulty: 'medium', code: 'from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fibonacci(n: int) -> int:\n    if n < 2:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)' },
    { difficulty: 'medium', code: 'def flatten(lst):\n    for item in lst:\n        if isinstance(item, list):\n            yield from flatten(item)\n        else:\n            yield item' },
    { difficulty: 'medium', code: 'class Stack:\n    def __init__(self):\n        self._data = []\n    def push(self, item):\n        self._data.append(item)\n    def pop(self):\n        return self._data.pop()\n    def peek(self):\n        return self._data[-1]' },
    { difficulty: 'hard', code: 'def memoize(fn):\n    cache = {}\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = fn(*args)\n        return cache[args]\n    return wrapper' },
    { difficulty: 'hard', code: 'from contextlib import contextmanager\n\n@contextmanager\ndef timer():\n    import time\n    start = time.time()\n    yield\n    print(f"Elapsed: {time.time() - start:.3f}s")' },
    { difficulty: 'hard', code: 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)' },
    { difficulty: 'easy', code: 'words = ["hello", "world", "python"]\ncounts = {w: len(w) for w in words}\nprint(counts)' },
  ],
  html: [
    { difficulty: 'easy', code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>' },
    { difficulty: 'easy', code: '<nav>\n  <ul>\n    <li><a href="/">Home</a></li>\n    <li><a href="/about">About</a></li>\n  </ul>\n</nav>' },
    { difficulty: 'easy', code: '<form action="/submit" method="post">\n  <input type="text" name="name" placeholder="Name" required>\n  <button type="submit">Send</button>\n</form>' },
    { difficulty: 'medium', code: '<figure>\n  <img src="photo.jpg" alt="A scenic view"\n    loading="lazy" width="800" height="600">\n  <figcaption>A beautiful mountain scene</figcaption>\n</figure>' },
    { difficulty: 'medium', code: '<table>\n  <thead>\n    <tr><th>Name</th><th>Age</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Alice</td><td>30</td></tr>\n  </tbody>\n</table>' },
    { difficulty: 'medium', code: '<details>\n  <summary>Click to expand</summary>\n  <p>Hidden content revealed on click.</p>\n</details>' },
    { difficulty: 'hard', code: '<template id="card">\n  <article class="card">\n    <header><slot name="title"></slot></header>\n    <div class="body"><slot></slot></div>\n  </article>\n</template>' },
    { difficulty: 'hard', code: '<dialog id="modal">\n  <form method="dialog">\n    <h2>Confirm</h2>\n    <p>Are you sure?</p>\n    <button value="cancel">Cancel</button>\n    <button value="confirm">OK</button>\n  </form>\n</dialog>' },
    { difficulty: 'easy', code: '<section aria-labelledby="heading">\n  <h2 id="heading">Section Title</h2>\n  <p>Content goes here.</p>\n</section>' },
    { difficulty: 'medium', code: '<input type="range" id="vol" min="0" max="100" value="50">\n<output for="vol">50</output>' },
  ],
  css: [
    { difficulty: 'easy', code: '.container {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n}' },
    { difficulty: 'easy', code: ':root {\n  --primary: #50C878;\n  --bg: #1a1a1a;\n  --text: #c9c9c9;\n}' },
    { difficulty: 'medium', code: '.card {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 20px;\n}' },
    { difficulty: 'medium', code: '@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(-10px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n.modal { animation: fadeIn 0.3s ease; }' },
    { difficulty: 'medium', code: '.btn {\n  position: relative;\n  overflow: hidden;\n}\n.btn::after {\n  content: "";\n  position: absolute;\n  inset: 0;\n  background: rgba(255,255,255,0.1);\n  opacity: 0;\n  transition: opacity 0.2s;\n}\n.btn:hover::after { opacity: 1; }' },
    { difficulty: 'hard', code: '.sidebar {\n  container-type: inline-size;\n}\n@container (min-width: 400px) {\n  .sidebar .item {\n    display: grid;\n    grid-template-columns: 1fr 2fr;\n  }\n}' },
    { difficulty: 'hard', code: '.masonry {\n  columns: 3 280px;\n  column-gap: 16px;\n}\n.masonry > * {\n  break-inside: avoid;\n  margin-bottom: 16px;\n}' },
    { difficulty: 'easy', code: 'a {\n  color: inherit;\n  text-decoration: none;\n}\na:hover {\n  text-decoration: underline;\n}' },
    { difficulty: 'medium', code: '.truncate {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.clamp {\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}' },
    { difficulty: 'hard', code: '@layer base, components, utilities;\n@layer components {\n  .btn-primary {\n    @apply bg-blue-500 text-white px-4 py-2 rounded;\n  }\n}' },
  ],
  sql: [
    { difficulty: 'easy', code: 'SELECT name, email\nFROM users\nWHERE active = 1\nORDER BY name ASC;' },
    { difficulty: 'easy', code: 'INSERT INTO products (name, price, stock)\nVALUES ("Widget", 9.99, 100);' },
    { difficulty: 'medium', code: 'SELECT u.name, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nHAVING COUNT(o.id) > 5\nORDER BY order_count DESC;' },
    { difficulty: 'medium', code: 'WITH monthly AS (\n  SELECT DATE_TRUNC("month", created_at) AS month,\n         SUM(amount) AS revenue\n  FROM orders\n  GROUP BY 1\n)\nSELECT *, LAG(revenue) OVER (ORDER BY month) AS prev\nFROM monthly;' },
    { difficulty: 'hard', code: 'SELECT p.name,\n       p.price,\n       AVG(p.price) OVER (PARTITION BY p.category_id) AS avg_cat_price,\n       RANK() OVER (PARTITION BY p.category_id ORDER BY p.price DESC) AS price_rank\nFROM products p;' },
    { difficulty: 'hard', code: 'WITH RECURSIVE org AS (\n  SELECT id, name, manager_id, 1 AS level\n  FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, e.manager_id, o.level + 1\n  FROM employees e JOIN org o ON e.manager_id = o.id\n)\nSELECT * FROM org ORDER BY level;' },
    { difficulty: 'easy', code: 'UPDATE users\nSET last_login = NOW()\nWHERE id = 42;' },
    { difficulty: 'medium', code: 'SELECT category,\n       SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) AS completed,\n       SUM(CASE WHEN status = "pending"   THEN amount ELSE 0 END) AS pending\nFROM orders\nGROUP BY category;' },
    { difficulty: 'easy', code: 'CREATE INDEX idx_users_email ON users (email);\nCREATE UNIQUE INDEX idx_users_username ON users (username);' },
    { difficulty: 'hard', code: 'EXPLAIN ANALYZE\nSELECT u.id, u.name, SUM(o.total)\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE o.created_at > NOW() - INTERVAL "30 days"\nGROUP BY u.id;' },
  ],
  bash: [
    { difficulty: 'easy', code: '#!/bin/bash\necho "Hello, $USER!"\ndate "+%Y-%m-%d %H:%M"' },
    { difficulty: 'easy', code: 'for file in *.txt; do\n  echo "Processing: $file"\ndone' },
    { difficulty: 'medium', code: '#!/bin/bash\nif [ -z "$1" ]; then\n  echo "Usage: $0 <filename>"\n  exit 1\nfi\nwc -l "$1"' },
    { difficulty: 'medium', code: 'find . -name "*.log" -mtime +7 -exec rm {} \\;\necho "Old logs cleaned up."' },
    { difficulty: 'hard', code: '#!/bin/bash\nset -euo pipefail\ntrap "echo Error on line $LINENO" ERR\n\nretry() {\n  local n=3\n  while ! "$@" && ((n-- > 0)); do sleep 2; done\n}' },
    { difficulty: 'medium', code: 'backup() {\n  local src="$1" dst="$2"\n  tar -czf "${dst}/backup_$(date +%Y%m%d).tar.gz" "$src"\n}' },
    { difficulty: 'easy', code: 'grep -r "TODO" src/ --include="*.ts" -n | sort' },
    { difficulty: 'hard', code: '#!/bin/bash\ndeploy() {\n  git pull origin main\n  npm ci\n  npm run build\n  pm2 reload app.json --update-env\n  echo "Deploy complete: $(date)"\n}' },
    { difficulty: 'medium', code: 'PORT=${PORT:-3000}\nexport NODE_ENV=production\nnpm start -- --port "$PORT" &\nPID=$!\necho "Started PID $PID on port $PORT"' },
    { difficulty: 'hard', code: 'watch_dir() {\n  local dir="$1" cmd="$2"\n  inotifywait -m -e modify,create,delete "$dir" | while read; do\n    eval "$cmd"\n  done\n}' },
  ],
};

type TimerMode = 'countup' | '30' | '60' | '120';

// ── Component ─────────────────────────────────────────────────────────────────

export default function CodeTypingSpeedTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const heading = isDark ? '#e0e0e0' : '#111';
  const muted = isDark ? '#555' : '#bbb';

  // Settings
  const [language, setLanguage] = useState<Language>('javascript');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timerMode, setTimerMode] = useState<TimerMode>('60');

  // Game state
  const [snippet, setSnippet] = useState<string>('');
  const [typed, setTyped] = useState<string>('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const [bestWpm, setBestWpm] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load best WPM
  useEffect(() => {
    const saved = localStorage.getItem('toolhub_typing_best');
    if (saved) setBestWpm(parseInt(saved, 10));
  }, []);

  const pickSnippet = useCallback((lang: Language, diff: Difficulty) => {
    const pool = SNIPPETS[lang].filter((s) => s.difficulty === diff);
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return chosen?.code ?? SNIPPETS[lang][0].code;
  }, []);

  useEffect(() => {
    setSnippet(pickSnippet(language, difficulty));
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, difficulty]);

  function resetGame() {
    setTyped('');
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startGame() {
    setStarted(true);
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - Date.now()) / 1000)); // overwritten below
    }, 200);
    inputRef.current?.focus();
  }

  // Timer tick
  useEffect(() => {
    if (!started || finished) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = (Date.now() - startTime) / 1000;
      setElapsed(secs);
      if (timerMode !== 'countup') {
        const limit = parseInt(timerMode, 10);
        if (secs >= limit) endGame(typed, secs);
      }
    }, 200);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, finished, startTime, timerMode]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (finished) return;
    const val = e.target.value;
    if (!started) {
      setStarted(true);
      setStartTime(Date.now());
    }
    setTyped(val);
    if (val === snippet) {
      endGame(val, (Date.now() - startTime) / 1000);
    }
  }

  function endGame(typedVal: string, elapsedSecs: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setFinished(true);
    const wpm = calcWpm(typedVal, elapsedSecs);
    if (wpm > bestWpm) {
      setBestWpm(wpm);
      localStorage.setItem('toolhub_typing_best', String(wpm));
    }
    setShowResults(true);
  }

  function calcWpm(typedVal: string, elapsedSecs: number): number {
    if (elapsedSecs < 0.1) return 0;
    let correct = 0;
    for (let i = 0; i < typedVal.length; i++) {
      if (typedVal[i] === snippet[i]) correct++;
    }
    return Math.round((correct / 5) / (elapsedSecs / 60));
  }

  function calcAccuracy(typedVal: string): number {
    if (!typedVal.length) return 100;
    let correct = 0;
    for (let i = 0; i < typedVal.length; i++) {
      if (typedVal[i] === snippet[i]) correct++;
    }
    return Math.round((correct / typedVal.length) * 100);
  }

  const currentWpm = calcWpm(typed, elapsed);
  const accuracy = calcAccuracy(typed);

  const timeLimit = timerMode === 'countup' ? null : parseInt(timerMode, 10);
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
  const displayTime = timerMode === 'countup'
    ? `${Math.floor(elapsed)}s`
    : `${Math.ceil(timeLeft ?? 0)}s`;

  const progress = snippet.length > 0 ? Math.min(100, Math.round((typed.length / snippet.length) * 100)) : 0;

  function newSnippet() {
    const s = pickSnippet(language, difficulty);
    setSnippet(s);
    resetGame();
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Character rendering ─────────────────────────────────────────────────────

  function renderChars() {
    const chars = snippet.split('');
    return chars.map((ch, i) => {
      let color = muted;
      let bg2 = 'transparent';
      if (i < typed.length) {
        color = typed[i] === ch ? '#50C878' : '#e05555';
        bg2 = typed[i] !== ch ? 'rgba(224,85,85,0.15)' : 'transparent';
      }
      // Cursor
      const isCursor = i === typed.length;
      return (
        <span key={i} style={{ position: 'relative' }}>
          {isCursor && (
            <span
              style={{
                position: 'absolute', left: -1, top: 0, bottom: 0, width: 2,
                background: PRIMARY, borderRadius: 1, animation: 'blink 1s step-end infinite',
              }}
            />
          )}
          <span style={{ color, background: bg2, whiteSpace: 'pre' }}>{ch}</span>
        </span>
      );
    });
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* Controls */}
      <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 20 }} bodyStyle={{ padding: 20 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Text style={{ color: muted, fontSize: 12, display: 'block', marginBottom: 4 }}>Language</Text>
            <Select
              value={language}
              onChange={(v) => setLanguage(v)}
              style={{ width: '100%' }}
              options={[
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'python', label: 'Python' },
                { value: 'html', label: 'HTML' },
                { value: 'css', label: 'CSS' },
                { value: 'sql', label: 'SQL' },
                { value: 'bash', label: 'Bash' },
              ]}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Text style={{ color: muted, fontSize: 12, display: 'block', marginBottom: 4 }}>Difficulty</Text>
            <Select
              value={difficulty}
              onChange={(v) => setDifficulty(v)}
              style={{ width: '100%' }}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Text style={{ color: muted, fontSize: 12, display: 'block', marginBottom: 4 }}>Timer</Text>
            <Select
              value={timerMode}
              onChange={(v) => { setTimerMode(v); resetGame(); }}
              style={{ width: '100%' }}
              options={[
                { value: 'countup', label: 'Count Up' },
                { value: '30', label: '30 seconds' },
                { value: '60', label: '60 seconds' },
                { value: '120', label: '120 seconds' },
              ]}
            />
          </Col>
          <Col xs={24} md={8} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {!started && !finished && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => { startGame(); inputRef.current?.focus(); }} style={{ background: PRIMARY, borderColor: PRIMARY }}>
                Start
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => { resetGame(); setSnippet(pickSnippet(language, difficulty)); }} style={{ borderColor: border }}>
              Restart
            </Button>
            <Button icon={<FileTextOutlined />} onClick={newSnippet} style={{ borderColor: border }}>
              New Snippet
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stats Bar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { icon: <ThunderboltOutlined />, label: 'WPM', value: started ? currentWpm : '—' },
          { icon: <AimOutlined />, label: 'Accuracy', value: started ? `${accuracy}%` : '—' },
          { icon: <ClockCircleOutlined />, label: timerMode === 'countup' ? 'Elapsed' : 'Time Left', value: started ? displayTime : '—' },
          { icon: <TrophyOutlined />, label: 'Best WPM', value: bestWpm > 0 ? bestWpm : '—' },
        ].map((stat) => (
          <Col key={stat.label} xs={12} sm={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10 }} bodyStyle={{ padding: '14px 18px' }}>
              <div style={{ color: PRIMARY, fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ color: heading, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: muted, fontSize: 11, marginTop: 4 }}>{stat.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Progress */}
      <div style={{ marginBottom: 12 }}>
        <Progress
          percent={progress}
          strokeColor={PRIMARY}
          trailColor={isDark ? '#2e2e2e' : '#e8e8e8'}
          showInfo={false}
          size={['100%', 6]}
        />
      </div>

      {/* Code Display */}
      <Card
        style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
            fontSize: 15, lineHeight: 1.9, letterSpacing: '0.02em',
            background: isDark ? '#161616' : '#f8f8f8',
            border: `1px solid ${border}`,
            borderRadius: 8, padding: '20px 24px',
            minHeight: 120, wordBreak: 'break-all', whiteSpace: 'pre-wrap',
            cursor: 'text', userSelect: 'none',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {renderChars()}
          {typed.length === snippet.length && snippet.length > 0 && (
            <span style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: PRIMARY, borderRadius: 1, animation: 'blink 1s step-end infinite' }} />
            </span>
          )}
        </div>
      </Card>

      {/* Hidden Textarea */}
      <textarea
        ref={inputRef}
        value={typed}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Tab') { e.preventDefault(); handleInput({ target: { value: typed + '  ' } } as React.ChangeEvent<HTMLTextAreaElement>); }
        }}
        disabled={finished}
        style={{ position: 'fixed', opacity: 0, pointerEvents: finished ? 'none' : 'all', top: -9999, left: -9999, width: 1, height: 1 }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <Text style={{ color: muted, fontSize: 12, display: 'block', textAlign: 'center' }}>
        {!started ? 'Click Start or begin typing to start the timer' : finished ? 'Test complete!' : 'Typing in progress…'}
      </Text>

      {/* Results Modal */}
      <Modal
        open={showResults}
        onCancel={() => setShowResults(false)}
        footer={null}
        title={null}
        centered
        styles={{ content: { background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 0 } }}
      >
        <div style={{ padding: 32, textAlign: 'center' }}>
          <TrophyOutlined style={{ fontSize: 48, color: '#ffd700', marginBottom: 16 }} />
          <Title level={3} style={{ color: heading, margin: '0 0 24px' }}>Test Complete!</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { label: 'WPM', value: calcWpm(typed, elapsed), color: PRIMARY },
              { label: 'Accuracy', value: `${calcAccuracy(typed)}%`, color: '#50C878' },
              { label: 'Time', value: `${Math.round(elapsed)}s`, color: '#888' },
              { label: 'Best WPM', value: bestWpm, color: '#ffd700' },
            ].map((s) => (
              <Col key={s.label} span={12}>
                <div style={{ background: isDark ? '#1a1a1a' : '#f5f5f5', borderRadius: 10, padding: 16 }}>
                  <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: muted, fontSize: 12, marginTop: 4 }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => { setShowResults(false); resetGame(); setSnippet(pickSnippet(language, difficulty)); setTimeout(() => inputRef.current?.focus(), 100); }}
              style={{ background: PRIMARY, borderColor: PRIMARY }}
            >
              Try Again
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => { setShowResults(false); newSnippet(); }} style={{ borderColor: border }}>
              New Snippet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
