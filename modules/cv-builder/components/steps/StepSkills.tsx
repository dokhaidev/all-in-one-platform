'use client';

import { Input, Button, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Skill, SKILL_LEVELS } from '../../types';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const newSkill = (): Skill => ({ id: uid(), name: '', level: '', keywords: [] });
const labelStyle: React.CSSProperties = { color: '#888', fontSize: 12, marginBottom: 4 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export default function StepSkills({ skills, onChange }: Props) {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? '#1e1e1e' : '#fafafa';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const titleColor = isDark ? '#bbb' : '#333';
  const emptyColor = isDark ? '#444' : '#bbb';
  const add = () => onChange([...skills, newSkill()]);
  const remove = (id: string) => onChange(skills.filter((s) => s.id !== id));
  const update = (id: string, patch: Partial<Skill>) =>
    onChange(skills.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div>
      {skills.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: emptyColor, fontSize: 13 }}>
          Chưa có kỹ năng nào
        </div>
      )}

      {skills.map((skill, idx) => (
        <div
          key={skill.id}
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
            <div style={{ color: titleColor, fontSize: 13, fontWeight: 600 }}>Kỹ năng {idx + 1}</div>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(skill.id)} />
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Danh mục kỹ năng</div>
              <Input
                value={skill.name}
                onChange={(e) => update(skill.id, { name: e.target.value })}
                placeholder="Frontend Development..."
              />
            </div>
            <div>
              <div style={labelStyle}>Trình độ thành thạo</div>
              <Select
                value={skill.level || undefined}
                onChange={(val) => update(skill.id, { level: val })}
                style={{ width: '100%' }}
                placeholder="Chọn trình độ"
                options={SKILL_LEVELS.map((l) => ({ label: l, value: l }))}
                allowClear
              />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Công nghệ / Từ khóa</div>
            <Select
              mode="tags"
              value={skill.keywords}
              onChange={(val) => update(skill.id, { keywords: val })}
              style={{ width: '100%' }}
              placeholder="React, Vue.js, TypeScript... (Enter để thêm)"
              tokenSeparators={[',']}
              open={false}
            />
          </div>
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} block onClick={add} style={{ marginTop: 4 }}>
        Thêm kỹ năng
      </Button>
    </div>
  );
}
