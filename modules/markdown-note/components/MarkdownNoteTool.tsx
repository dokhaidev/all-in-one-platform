'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Select, Modal, message } from 'antd';
import { FileMarkdownOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface Note { id: string; title: string; content: string; updatedAt: string; tag: string }

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{6}\s(.+)$/gm, '<h6 style="color:#e0e0e0;margin:8px 0 4px">$1</h6>')
    .replace(/^#{5}\s(.+)$/gm, '<h5 style="color:#e0e0e0;margin:10px 0 4px">$1</h5>')
    .replace(/^#{4}\s(.+)$/gm, '<h4 style="color:#e0e0e0;margin:12px 0 4px">$1</h4>')
    .replace(/^#{3}\s(.+)$/gm, '<h3 style="color:#e0e0e0;margin:14px 0 6px">$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2 style="color:#e0e0e0;margin:16px 0 8px">$1</h2>')
    .replace(/^#{1}\s(.+)$/gm, '<h1 style="color:#e0e0e0;margin:20px 0 10px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code style="background:#2a2a2a;padding:2px 6px;border-radius:4px;font-family:monospace;color:#50C878">$1</code>')
    .replace(/^```[\w]*\n([\s\S]*?)```$/gm, '<pre style="background:#2a2a2a;padding:12px;border-radius:6px;overflow:auto;margin:8px 0"><code style="color:#c9c9c9;font-family:monospace">$1</code></pre>')
    .replace(/^\> (.+)$/gm, '<blockquote style="border-left:3px solid #50C878;margin:8px 0;padding:4px 12px;color:#a0a0a0">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li style="color:#c9c9c9;margin:2px 0">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="color:#c9c9c9;margin:2px 0">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:6px 0">$&</ul>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#50C878" target="_blank">$1</a>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #2e2e2e;margin:12px 0">')
    .replace(/\n\n/g, '</p><p style="color:#c9c9c9;margin:6px 0">')
    .replace(/\n/g, '<br>');
}

function load(): Note[] {
  try { return JSON.parse(localStorage.getItem('toolhub_notes') || '[]'); }
  catch { return []; }
}
function save(n: Note[]) { localStorage.setItem('toolhub_notes', JSON.stringify(n)); }

const DEFAULT: Note = {
  id: '0', title: 'Ghi chú đầu tiên', tag: 'general',
  updatedAt: new Date().toISOString(),
  content: `# Chào mừng đến Markdown Note!\n\nĐây là **trình soạn thảo Markdown** đơn giản.\n\n## Cú pháp hỗ trợ\n\n- **Bold** với \`**text**\`\n- *Italic* với \`*text*\`\n- \`Code inline\` với backtick\n- Headers H1-H6\n- Lists, blockquotes, links\n- Code blocks\n\n## Ví dụ code\n\n\`\`\`\nfunction hello() {\n  console.log("Hello World!");\n}\n\`\`\`\n\n> Ghi chú được lưu tự động vào localStorage.\n\n---\n\nBắt đầu viết ngay!`,
};

let nid = Date.now();

export default function MarkdownNoteTool() {
  const [notes, setNotes] = useState<Note[]>(() => { const saved = load(); return saved.length > 0 ? saved : [DEFAULT]; });
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '0');
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = notes.find(n => n.id === activeId) || notes[0];

  const update = useCallback((updated: Note[]) => { setNotes(updated); save(updated); }, []);

  const updateContent = (content: string) => {
    const updated = notes.map(n => n.id === activeId ? { ...n, content, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(updated), 1000);
  };

  const updateTitle = (title: string) => {
    update(notes.map(n => n.id === activeId ? { ...n, title, updatedAt: new Date().toISOString() } : n));
  };

  const addNote = () => {
    const note: Note = { id: String(nid++), title: 'Ghi chú mới', content: '', updatedAt: new Date().toISOString(), tag: 'general' };
    update([note, ...notes]);
    setActiveId(note.id);
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    if (remaining.length === 0) return;
    update(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <FileMarkdownOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Markdown Note
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 16 }}>
        Viết note Markdown, preview realtime — lưu tự động
      </Text>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)', minHeight: 500 }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}
          />
          <Button icon={<PlusOutlined />} onClick={addNote} block
            style={{ border: `1px dashed ${dark.border}`, background: 'transparent', color: dark.text }}>
            Ghi chú mới
          </Button>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredNotes.map(note => (
              <div key={note.id}
                onClick={() => setActiveId(note.id)}
                style={{
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                  background: note.id === activeId ? '#2a2a2a' : 'transparent',
                  border: `1px solid ${note.id === activeId ? dark.primary : 'transparent'}`,
                  position: 'relative',
                }}>
                <Text style={{ color: note.id === activeId ? '#e0e0e0' : dark.text, display: 'block', fontSize: 13, fontWeight: note.id === activeId ? 600 : 400 }}>
                  {note.title || 'Untitled'}
                </Text>
                <Text style={{ color: '#555', fontSize: 11 }}>{note.updatedAt.slice(0, 10)}</Text>
                {notes.length > 1 && (
                  <Button size="small" icon={<DeleteOutlined />} danger type="text"
                    style={{ position: 'absolute', top: 4, right: 4, opacity: 0.6 }}
                    onClick={e => { e.stopPropagation(); deleteNote(note.id); }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              value={active?.title || ''}
              onChange={e => updateTitle(e.target.value)}
              placeholder="Tiêu đề ghi chú"
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: '#e0e0e0', fontWeight: 600, fontSize: 16, flex: 1 }}
            />
            <Button
              icon={preview ? <EditOutlined /> : <EyeOutlined />}
              onClick={() => setPreview(!preview)}
              style={{ border: `1px solid ${dark.border}`, background: preview ? dark.primary : 'transparent', color: preview ? '#000' : dark.text }}>
              {preview ? 'Sửa' : 'Preview'}
            </Button>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            {/* Editor pane */}
            {!preview && (
              <TextArea
                value={active?.content || ''}
                onChange={e => updateContent(e.target.value)}
                style={{ flex: 1, background: '#1e1e1e', border: `1px solid ${dark.border}`, color: dark.text, fontFamily: 'monospace', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
                placeholder="Bắt đầu viết Markdown..."
              />
            )}
            {/* Preview pane */}
            {preview && (
              <div style={{ flex: 1, background: '#1e1e1e', border: `1px solid ${dark.border}`, borderRadius: 6, padding: '12px 16px', overflowY: 'auto', lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(active?.content || '') }}
              />
            )}
          </div>

          <Text style={{ color: '#555', fontSize: 11, textAlign: 'right' }}>
            {active?.content?.length || 0} ký tự · {active?.content?.split('\n').length || 0} dòng · Lưu tự động
          </Text>
        </div>
      </div>
    </div>
  );
}
