'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Switch,
  Select,
  Space,
  Tooltip,
  Typography,
  Divider,
  Tag,
} from 'antd';
import {
  PlayCircleOutlined,
  SaveOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CodeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

type EditorTab = 'html' | 'css' | 'js';

interface CodeState {
  html: string;
  css: string;
  js: string;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS: Record<string, CodeState> = {
  'Hello World': {
    html: `<div class="container">
  <h1>Hello, World!</h1>
  <p>Welcome to Code Playground</p>
  <button onclick="greet()">Click me!</button>
</div>`,
    css: `body {
  font-family: 'Segoe UI', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: #1a1a2e;
  color: #eee;
}

.container {
  text-align: center;
  padding: 40px;
}

h1 {
  font-size: 2.5rem;
  color: #50C878;
  margin-bottom: 10px;
}

button {
  margin-top: 16px;
  padding: 10px 24px;
  background: #50C878;
  border: none;
  border-radius: 6px;
  color: #000;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover { opacity: 0.85; }`,
    js: `function greet() {
  const names = ['World', 'Developer', 'Coder', 'Friend'];
  const name = names[Math.floor(Math.random() * names.length)];
  document.querySelector('h1').textContent = 'Hello, ' + name + '!';
}`,
  },
  Counter: {
    html: `<div class="counter">
  <h2>Counter</h2>
  <div class="display" id="count">0</div>
  <div class="buttons">
    <button onclick="change(-1)">−</button>
    <button onclick="reset()">Reset</button>
    <button onclick="change(1)">+</button>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #111;
  font-family: 'Segoe UI', sans-serif;
}

.counter {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 40px 60px;
  text-align: center;
}

h2 { color: #aaa; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px; }

.display {
  font-size: 80px;
  font-weight: 700;
  color: #50C878;
  margin: 20px 0;
  min-width: 140px;
  transition: transform 0.1s;
}

.buttons { display: flex; gap: 12px; justify-content: center; }

button {
  padding: 12px 24px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #2a2a2a;
  color: #eee;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.15s;
}

button:hover { background: #3a3a3a; border-color: #50C878; color: #50C878; }`,
    js: `let count = 0;

function update() {
  const el = document.getElementById('count');
  el.textContent = count;
  el.style.color = count > 0 ? '#50C878' : count < 0 ? '#ff6b6b' : '#50C878';
  el.style.transform = 'scale(1.2)';
  setTimeout(() => el.style.transform = 'scale(1)', 100);
}

function change(n) { count += n; update(); }
function reset() { count = 0; update(); }`,
  },
  'Todo List': {
    html: `<div class="app">
  <h1>My Todos</h1>
  <div class="input-row">
    <input id="input" type="text" placeholder="Add a task..." onkeydown="if(event.key==='Enter')add()"/>
    <button onclick="add()">Add</button>
  </div>
  <ul id="list"></ul>
  <p id="empty" class="empty">No tasks yet. Add one above!</p>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0f0f0f;
  color: #eee;
  padding: 40px 20px;
}

.app { max-width: 480px; margin: 0 auto; }

h1 { font-size: 28px; color: #50C878; margin-bottom: 24px; }

.input-row { display: flex; gap: 8px; margin-bottom: 20px; }

input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #1e1e1e;
  color: #eee;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

input:focus { border-color: #50C878; }

button {
  padding: 10px 20px;
  background: #50C878;
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  cursor: pointer;
}

ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }

li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

li.done { opacity: 0.5; text-decoration: line-through; }
li span { flex: 1; }
li .del { color: #ff6b6b; font-size: 18px; cursor: pointer; }
.empty { color: #555; text-align: center; margin-top: 32px; font-size: 14px; }`,
    js: `const todos = [];

function render() {
  const ul = document.getElementById('list');
  const empty = document.getElementById('empty');
  ul.innerHTML = '';
  todos.forEach((t, i) => {
    const li = document.createElement('li');
    if (t.done) li.classList.add('done');
    li.innerHTML = \`<span onclick="toggle(\${i})">\${t.text}</span><span class="del" onclick="remove(\${i})">×</span>\`;
    ul.appendChild(li);
  });
  empty.style.display = todos.length ? 'none' : 'block';
}

function add() {
  const input = document.getElementById('input');
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ text, done: false });
  input.value = '';
  render();
}

function toggle(i) { todos[i].done = !todos[i].done; render(); }
function remove(i) { todos.splice(i, 1); render(); }
render();`,
  },
  'Flexbox Layout': {
    html: `<header>Header</header>
<div class="layout">
  <aside>Sidebar</aside>
  <main>
    <div class="grid">
      <div class="card">Card 1</div>
      <div class="card">Card 2</div>
      <div class="card">Card 3</div>
      <div class="card">Card 4</div>
      <div class="card">Card 5</div>
      <div class="card">Card 6</div>
    </div>
  </main>
</div>
<footer>Footer</footer>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #111; color: #eee; min-height: 100vh; display: flex; flex-direction: column; }

header, footer {
  background: #1e1e1e;
  border-bottom: 1px solid #2e2e2e;
  padding: 16px 24px;
  font-weight: 600;
  color: #50C878;
  letter-spacing: 1px;
}

footer { border-top: 1px solid #2e2e2e; border-bottom: none; text-align: center; }

.layout { display: flex; flex: 1; }

aside {
  width: 180px;
  background: #161616;
  border-right: 1px solid #2e2e2e;
  padding: 20px 16px;
  font-size: 14px;
  color: #888;
}

main { flex: 1; padding: 20px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.card {
  background: #1e1e1e;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  padding: 24px 16px;
  text-align: center;
  font-size: 14px;
  color: #aaa;
  transition: border-color 0.2s, transform 0.15s;
  cursor: default;
}

.card:hover { border-color: #50C878; transform: translateY(-2px); color: #eee; }`,
    js: `// Flexbox & Grid demo — no JS needed!
// Hover the cards to see the effect.
console.log('Layout loaded!');`,
  },
};

const STORAGE_KEY = 'toolhub_code_playground';

const INITIAL_CODE: CodeState = {
  html: PRESETS['Hello World'].html,
  css: PRESETS['Hello World'].css,
  js: PRESETS['Hello World'].js,
};

// ─── Build srcDoc ─────────────────────────────────────────────────────────────

function buildSrcDoc(code: CodeState): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
${code.css}
</style>
</head>
<body>
${code.html}
<script>
try {
${code.js}
} catch(e) {
  document.body.insertAdjacentHTML('beforeend',
    '<div style="position:fixed;bottom:0;left:0;right:0;background:#2a0000;color:#ff6b6b;padding:8px 12px;font-family:monospace;font-size:13px;border-top:1px solid #ff4d4f;">JS Error: ' + e.message + '</div>'
  );
}
<\/script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodePlaygroundTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const editorBg = isDark ? '#1a1a1a' : '#f5f5f5';
  const previewBg = isDark ? '#ffffff' : '#ffffff';

  const [code, setCode] = useState<CodeState>(INITIAL_CODE);
  const [activeTab, setActiveTab] = useState<EditorTab>('html');
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [autoRun, setAutoRun] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial render
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { code: CodeState };
        if (parsed.code) setCode(parsed.code);
      } catch {
        // ignore
      }
    }
    setSrcDoc(buildSrcDoc(INITIAL_CODE));
  }, []);

  // Auto-run
  useEffect(() => {
    if (!autoRun) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSrcDoc(buildSrcDoc(code));
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, autoRun]);

  const handleRun = useCallback(() => {
    setSrcDoc(buildSrcDoc(code));
  }, [code]);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code }));
    const now = new Date().toLocaleTimeString('vi-VN');
    setLastSaved(now);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(INITIAL_CODE);
    setSrcDoc(buildSrcDoc(INITIAL_CODE));
    setLastSaved(null);
  }, []);

  const handlePreset = useCallback((presetName: string) => {
    const p = PRESETS[presetName];
    if (p) {
      setCode({ ...p });
      setSrcDoc(buildSrcDoc(p));
    }
  }, []);

  const tabMeta: { key: EditorTab; label: string; lang: string; color: string }[] = [
    { key: 'html', label: 'HTML', lang: 'html', color: '#e34c26' },
    { key: 'css', label: 'CSS', lang: 'css', color: '#264de4' },
    { key: 'js', label: 'JS', lang: 'javascript', color: '#f0db4f' },
  ];

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    flex: 1,
    background: editorBg,
    border: 'none',
    color: textColor,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontSize: 13,
    lineHeight: 1.65,
    padding: '16px',
    resize: 'none',
    outline: 'none',
    tabSize: 2,
  };

  return (
    <div>
      {/* Toolbar */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '10px 16px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Space size={6} wrap>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={handleRun}
              style={{ background: '#50C878', borderColor: '#50C878', color: '#000', fontWeight: 600 }}
            >
              Run
            </Button>
            <Divider type="vertical" style={{ borderColor, height: 20 }} />
            <Text style={{ color: mutedColor, fontSize: 12 }}>Auto-run</Text>
            <Switch
              checked={autoRun}
              onChange={setAutoRun}
              size="small"
              style={autoRun ? { background: '#50C878' } : {}}
            />
            <Divider type="vertical" style={{ borderColor, height: 20 }} />
            <Select
              placeholder="Load preset"
              size="small"
              style={{ width: 150 }}
              onChange={handlePreset}
              options={Object.keys(PRESETS).map((k) => ({ value: k, label: k }))}
              value={null}
            />
            <Divider type="vertical" style={{ borderColor, height: 20 }} />
            <Tooltip title="Save to localStorage">
              <Button
                icon={<SaveOutlined />}
                size="small"
                onClick={handleSave}
                style={{ borderColor, color: textColor, background: 'transparent' }}
              >
                Save
              </Button>
            </Tooltip>
            <Tooltip title="Reset to default">
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={handleReset}
                style={{ borderColor: '#ff4d4f', color: '#ff4d4f', background: 'transparent' }}
              >
                Reset
              </Button>
            </Tooltip>
          </Space>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastSaved && (
              <Text style={{ color: '#50C878', fontSize: 11 }}>Saved {lastSaved}</Text>
            )}
            {autoRun && (
              <Tag color="success" style={{ fontSize: 11 }}>
                <ThunderboltOutlined /> Auto
              </Tag>
            )}
          </div>
        </div>
      </Card>

      {/* Main Editor + Preview */}
      <div style={{ display: 'flex', gap: 16, height: 580 }}>
        {/* Left: Editor Panel */}
        <Card
          style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, flex: '0 0 50%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${borderColor}`,
              background: isDark ? '#1a1a1a' : '#f0f0f0',
            }}
          >
            {tabMeta.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderBottom: activeTab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
                  background: 'transparent',
                  color: activeTab === t.key ? t.color : mutedColor,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: activeTab === t.key ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CodeOutlined style={{ fontSize: 12 }} />
                {t.label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 12, gap: 4 }}>
              {tabMeta.map((t) => (
                <span
                  key={t.key}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: t.color,
                    opacity: activeTab === t.key ? 1 : 0.25,
                    transition: 'opacity 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <textarea
              key={activeTab}
              style={textareaStyle}
              value={code[activeTab]}
              onChange={(e) => setCode((prev) => ({ ...prev, [activeTab]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const newVal = el.value.substring(0, start) + '  ' + el.value.substring(end);
                  setCode((prev) => ({ ...prev, [activeTab]: newVal }));
                  requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = start + 2;
                  });
                }
              }}
              spellCheck={false}
              placeholder={`Enter ${activeTab.toUpperCase()} code here...`}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '6px 16px',
              borderTop: `1px solid ${borderColor}`,
              background: isDark ? '#1a1a1a' : '#f0f0f0',
              display: 'flex',
              gap: 12,
            }}
          >
            {tabMeta.map((t) => (
              <Text key={t.key} style={{ color: mutedColor, fontSize: 11 }}>
                <span style={{ color: t.color }}>{t.label}</span>{' '}
                {code[t.key].split('\n').length}L
              </Text>
            ))}
          </div>
        </Card>

        {/* Right: Preview Panel */}
        <Card
          style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${borderColor}`,
              background: isDark ? '#1a1a1a' : '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
            </div>
            <Text style={{ color: mutedColor, fontSize: 12, marginLeft: 6 }}>Preview</Text>
            <div style={{ marginLeft: 'auto' }}>
              <Button
                icon={<PlayCircleOutlined />}
                size="small"
                onClick={handleRun}
                style={{ borderColor, color: '#50C878', background: 'transparent', fontSize: 11 }}
              >
                Refresh
              </Button>
            </div>
          </div>
          <iframe
            key={srcDoc}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            title="preview"
            style={{
              flex: 1,
              border: 'none',
              background: previewBg,
            }}
          />
        </Card>
      </div>

      {/* Tips */}
      <Card
        style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginTop: 16 }}
        bodyStyle={{ padding: '10px 16px' }}
      >
        <Space size={16} wrap>
          <Text style={{ color: mutedColor, fontSize: 12 }}>
            <kbd style={{ background: isDark ? '#333' : '#e0e0e0', border: `1px solid ${borderColor}`, borderRadius: 3, padding: '1px 5px', fontSize: 11 }}>Tab</kbd>
            {' '} — 2-space indent
          </Text>
          <Text style={{ color: mutedColor, fontSize: 12 }}>Auto-run triggers 600ms after you stop typing</Text>
          <Text style={{ color: mutedColor, fontSize: 12 }}>Save stores your code in browser localStorage</Text>
          <Text style={{ color: mutedColor, fontSize: 12 }}>JS errors shown as overlay in preview</Text>
        </Space>
      </Card>
    </div>
  );
}
