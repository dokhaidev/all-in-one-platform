'use client';

import React, { useState, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Modal, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ProjectOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface Task { id: string; title: string; desc: string; priority: 'low' | 'medium' | 'high'; tags: string[] }
interface Column { id: string; title: string; color: string; tasks: Task[] }

const PRIORITY_COLORS = { low: '#52c41a', medium: '#faad14', high: '#ff4d4f' };
const PRIORITY_LABELS = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };

const DEFAULT_COLS: Column[] = [
  { id: 'todo', title: 'To Do', color: '#444', tasks: [
    { id: '1', title: 'Thiết kế giao diện', desc: 'Tạo mockup cho trang chủ', priority: 'high', tags: ['Design'] },
    { id: '2', title: 'Viết tài liệu API', desc: '', priority: 'medium', tags: ['Backend', 'Docs'] },
  ]},
  { id: 'doing', title: 'In Progress', color: '#1677ff', tasks: [
    { id: '3', title: 'Implement auth module', desc: 'JWT + refresh token', priority: 'high', tags: ['Backend'] },
  ]},
  { id: 'review', title: 'Review', color: '#faad14', tasks: [] },
  { id: 'done', title: 'Done', color: '#52c41a', tasks: [
    { id: '4', title: 'Setup project structure', desc: '', priority: 'low', tags: [] },
  ]},
];

let nextTaskId = 10;

function load(): Column[] {
  try {
    const raw = localStorage.getItem('toolhub_kanban');
    return raw ? JSON.parse(raw) : DEFAULT_COLS;
  } catch { return DEFAULT_COLS; }
}

function save(cols: Column[]) {
  localStorage.setItem('toolhub_kanban', JSON.stringify(cols));
}

export default function KanbanBoardTool() {
  const [cols, setCols] = useState<Column[]>(() => load());
  const [dragging, setDragging] = useState<{ taskId: string; fromCol: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; colId: string; task?: Task }>({ open: false, colId: 'todo' });
  const [form, setForm] = useState({ title: '', desc: '', priority: 'medium' as Task['priority'], tags: '' });

  const update = useCallback((newCols: Column[]) => {
    setCols(newCols);
    save(newCols);
  }, []);

  const openAdd = (colId: string) => {
    setForm({ title: '', desc: '', priority: 'medium', tags: '' });
    setModal({ open: true, colId });
  };

  const openEdit = (colId: string, task: Task) => {
    setForm({ title: task.title, desc: task.desc, priority: task.priority, tags: task.tags.join(', ') });
    setModal({ open: true, colId, task });
  };

  const saveTask = () => {
    if (!form.title.trim()) { message.warning('Nhập tiêu đề task!'); return; }
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const newCols = cols.map(col => {
      if (col.id !== modal.colId) return col;
      if (modal.task) {
        return { ...col, tasks: col.tasks.map(t => t.id === modal.task!.id ? { ...t, ...form, tags } : t) };
      }
      return { ...col, tasks: [...col.tasks, { id: String(nextTaskId++), title: form.title, desc: form.desc, priority: form.priority, tags }] };
    });
    update(newCols);
    setModal({ open: false, colId: 'todo' });
  };

  const deleteTask = (colId: string, taskId: string) => {
    update(cols.map(col => col.id === colId ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) } : col));
  };

  const moveTask = (taskId: string, fromColId: string, toColId: string) => {
    if (fromColId === toColId) return;
    let task: Task | undefined;
    const newCols = cols.map(col => {
      if (col.id === fromColId) { task = col.tasks.find(t => t.id === taskId); return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }; }
      return col;
    }).map(col => {
      if (col.id === toColId && task) return { ...col, tasks: [...col.tasks, task] };
      return col;
    });
    update(newCols);
  };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <ProjectOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Kanban Board
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Quản lý task kiểu Kanban — kéo thả hoặc di chuyển cột
      </Text>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {cols.map(col => (
          <div key={col.id}
            style={{ minWidth: 260, flex: '0 0 260px', background: '#1e1e1e', borderRadius: 10, border: `1px solid ${dark.border}`, padding: 12 }}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDrop={() => {
              if (dragging) { moveTask(dragging.taskId, dragging.fromCol, col.id); setDragging(null); setDragOver(null); }
            }}
            onDragLeave={() => setDragOver(null)}
          >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
              <Text style={{ color: '#e0e0e0', fontWeight: 600, flex: 1 }}>{col.title}</Text>
              <Tag style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: '#888', fontSize: 11 }}>
                {col.tasks.length}
              </Tag>
            </div>

            {/* Tasks */}
            <div style={{ minHeight: dragOver === col.id ? 60 : 0, borderRadius: 6, border: dragOver === col.id ? `2px dashed ${dark.primary}` : '2px dashed transparent', transition: 'all 0.2s' }}>
              {col.tasks.map(task => (
                <div key={task.id}
                  draggable
                  onDragStart={() => setDragging({ taskId: task.id, fromCol: col.id })}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                  style={{
                    background: dark.card, borderRadius: 8, padding: 12, marginBottom: 8,
                    border: `1px solid ${dark.border}`, cursor: 'grab',
                    opacity: dragging?.taskId === task.id ? 0.4 : 1,
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ color: '#e0e0e0', fontWeight: 500, flex: 1, marginRight: 8 }}>{task.title}</Text>
                    <Space size={2}>
                      <Button size="small" icon={<EditOutlined />} type="text" style={{ color: '#888' }} onClick={() => openEdit(col.id, task)} />
                      <Button size="small" icon={<DeleteOutlined />} type="text" danger onClick={() => deleteTask(col.id, task.id)} />
                    </Space>
                  </div>
                  {task.desc && <Text style={{ color: '#666', fontSize: 12, display: 'block', marginTop: 4 }}>{task.desc}</Text>}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Tag style={{ background: `${PRIORITY_COLORS[task.priority]}22`, border: `1px solid ${PRIORITY_COLORS[task.priority]}44`, color: PRIORITY_COLORS[task.priority], fontSize: 11 }}>
                      {PRIORITY_LABELS[task.priority]}
                    </Tag>
                    {task.tags.map(tag => <Tag key={tag} style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: '#888', fontSize: 11 }}>{tag}</Tag>)}
                  </div>
                  {/* Move buttons */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {cols.filter(c => c.id !== col.id).map(c => (
                      <Button key={c.id} size="small" onClick={() => moveTask(task.id, col.id, c.id)}
                        style={{ fontSize: 10, background: '#2a2a2a', border: `1px solid ${dark.border}`, color: '#888', padding: '0 6px' }}>
                        → {c.title}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button icon={<PlusOutlined />} onClick={() => openAdd(col.id)} block
              style={{ marginTop: 4, border: `1px dashed ${dark.border}`, background: 'transparent', color: '#666' }}>
              Thêm task
            </Button>
          </div>
        ))}
      </div>

      <Modal
        open={modal.open}
        title={<Text style={{ color: '#e0e0e0' }}>{modal.task ? 'Sửa task' : 'Thêm task mới'}</Text>}
        onCancel={() => setModal({ open: false, colId: 'todo' })}
        onOk={saveTask}
        okText="Lưu"
        cancelText="Hủy"
        styles={{ content: { background: dark.card, border: `1px solid ${dark.border}` }, header: { background: dark.card }, footer: { background: dark.card } }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Tiêu đề *</Text>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Mô tả</Text>
            <TextArea rows={3} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Độ ưu tiên</Text>
            <Select value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} style={{ width: '100%' }} dropdownStyle={{ background: '#1e1e1e' }}>
              <Option value="low">Thấp</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="high">Cao</Option>
            </Select>
          </div>
          <div>
            <Text style={{ color: '#888', display: 'block', marginBottom: 4 }}>Tags (cách nhau bằng dấu phẩy)</Text>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="VD: Frontend, Backend, Bug"
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
