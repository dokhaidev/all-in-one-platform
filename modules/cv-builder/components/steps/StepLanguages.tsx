'use client';

import { Input, Button, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Language, FLUENCY_LEVELS } from '../../types';

interface Props {
  languages: Language[];
  onChange: (languages: Language[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const newLang = (): Language => ({ id: uid(), language: '', fluency: '' });
const labelStyle: React.CSSProperties = { color: '#888', fontSize: 12, marginBottom: 4 };

export default function StepLanguages({ languages, onChange }: Props) {
  const add = () => onChange([...languages, newLang()]);
  const remove = (id: string) => onChange(languages.filter((l) => l.id !== id));
  const update = (id: string, patch: Partial<Language>) =>
    onChange(languages.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div>
      {languages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#444', fontSize: 13 }}>
          Chưa có ngôn ngữ nào
        </div>
      )}

      {languages.map((lang, idx) => (
        <div
          key={lang.id}
          style={{
            background: '#1e1e1e',
            border: '1px solid #2e2e2e',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 10,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Ngôn ngữ</div>
            <Input
              value={lang.language}
              onChange={(e) => update(lang.id, { language: e.target.value })}
              placeholder="Tiếng Anh, Tiếng Nhật..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Trình độ</div>
            <Select
              value={lang.fluency || undefined}
              onChange={(val) => update(lang.id, { fluency: val })}
              style={{ width: '100%' }}
              placeholder="Chọn trình độ"
              options={FLUENCY_LEVELS.map((f) => ({ label: f, value: f }))}
              allowClear
            />
          </div>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => remove(lang.id)}
            style={{ flexShrink: 0 }}
          />
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} block onClick={add} style={{ marginTop: 4 }}>
        Thêm ngôn ngữ
      </Button>
    </div>
  );
}
