'use client';

import { Input, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Project } from '../../types';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const newProject = (): Project => ({
  id: uid(),
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  url: '',
  highlights: [],
});

const labelStyle: React.CSSProperties = { color: '#888', fontSize: 12, marginBottom: 4 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export default function StepProjects({ projects, onChange }: Props) {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? '#1e1e1e' : '#fafafa';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const titleColor = isDark ? '#bbb' : '#333';
  const emptyColor = isDark ? '#444' : '#bbb';
  const add = () => onChange([...projects, newProject()]);
  const remove = (id: string) => onChange(projects.filter((p) => p.id !== id));
  const update = (id: string, patch: Partial<Project>) =>
    onChange(projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addHighlight = (id: string) =>
    update(id, {
      highlights: [...(projects.find((p) => p.id === id)?.highlights ?? []), ''],
    });
  const removeHighlight = (id: string, idx: number) =>
    update(id, {
      highlights: (projects.find((p) => p.id === id)?.highlights ?? []).filter((_, i) => i !== idx),
    });
  const updateHighlight = (id: string, idx: number, val: string) =>
    update(id, {
      highlights: (projects.find((p) => p.id === id)?.highlights ?? []).map((h, i) =>
        i === idx ? val : h
      ),
    });

  return (
    <div>
      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: emptyColor, fontSize: 13 }}>
          Chưa có dự án nào
        </div>
      )}

      {projects.map((proj, idx) => (
        <div
          key={proj.id}
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 8,
            padding: '16px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ color: titleColor, fontSize: 13, fontWeight: 600 }}>Dự án {idx + 1}</div>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(proj.id)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Tên dự án</div>
            <Input
              value={proj.name}
              onChange={(e) => update(proj.id, { name: e.target.value })}
              placeholder="Tên dự án..."
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Mô tả</div>
            <Input.TextArea
              value={proj.description}
              onChange={(e) => update(proj.id, { description: e.target.value })}
              placeholder="Mô tả ngắn về dự án..."
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Ngày bắt đầu</div>
              <Input
                type="month"
                value={proj.startDate}
                onChange={(e) => update(proj.id, { startDate: e.target.value })}
              />
            </div>
            <div>
              <div style={labelStyle}>Ngày kết thúc</div>
              <Input
                type="month"
                value={proj.endDate}
                onChange={(e) => update(proj.id, { endDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>URL dự án</div>
            <Input
              value={proj.url}
              onChange={(e) => update(proj.id, { url: e.target.value })}
              placeholder="https://github.com/..."
            />
          </div>

          {/* Highlights */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div style={labelStyle}>Thành tựu chính</div>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => addHighlight(proj.id)}
                style={{ fontSize: 11 }}
              >
                Thêm thành tựu
              </Button>
            </div>
            {proj.highlights.map((h, hi) => (
              <div key={hi} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <Input
                  value={h}
                  onChange={(e) => updateHighlight(proj.id, hi, e.target.value)}
                  placeholder="Thành tựu nổi bật..."
                  size="small"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => removeHighlight(proj.id, hi)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} block onClick={add} style={{ marginTop: 4 }}>
        Thêm dự án
      </Button>
    </div>
  );
}
