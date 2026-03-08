'use client';

import { Input, Button, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { WorkExperience } from '../../types';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  experience: WorkExperience[];
  onChange: (experience: WorkExperience[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const newEntry = (): WorkExperience => ({
  id: uid(),
  position: '',
  company: '',
  startDate: '',
  endDate: '',
  currently: false,
  website: '',
  summary: '',
  highlights: [],
});

const labelStyle: React.CSSProperties = { color: '#888', fontSize: 12, marginBottom: 4 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export default function StepExperience({ experience, onChange }: Props) {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? '#1e1e1e' : '#fafafa';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const titleColor = isDark ? '#bbb' : '#333';
  const emptyColor = isDark ? '#444' : '#bbb';
  const add = () => onChange([...experience, newEntry()]);
  const remove = (id: string) => onChange(experience.filter((e) => e.id !== id));
  const update = (id: string, patch: Partial<WorkExperience>) =>
    onChange(experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const addHighlight = (id: string) =>
    update(id, {
      highlights: [...(experience.find((e) => e.id === id)?.highlights ?? []), ''],
    });
  const removeHighlight = (id: string, idx: number) =>
    update(id, {
      highlights: (experience.find((e) => e.id === id)?.highlights ?? []).filter(
        (_, i) => i !== idx
      ),
    });
  const updateHighlight = (id: string, idx: number, val: string) =>
    update(id, {
      highlights: (experience.find((e) => e.id === id)?.highlights ?? []).map((h, i) =>
        i === idx ? val : h
      ),
    });

  return (
    <div>
      {experience.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: emptyColor,
            fontSize: 13,
          }}
        >
          Chưa có kinh nghiệm làm việc nào
        </div>
      )}

      {experience.map((exp, exIdx) => (
        <div
          key={exp.id}
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
            <div style={{ color: titleColor, fontSize: 13, fontWeight: 600 }}>
              Vị trí {exIdx + 1}
            </div>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => remove(exp.id)}
            />
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Chức vụ / Vị trí</div>
              <Input
                value={exp.position}
                onChange={(e) => update(exp.id, { position: e.target.value })}
                placeholder="Senior Developer..."
              />
            </div>
            <div>
              <div style={labelStyle}>Tên công ty</div>
              <Input
                value={exp.company}
                onChange={(e) => update(exp.id, { company: e.target.value })}
                placeholder="Tên công ty"
              />
            </div>
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Ngày bắt đầu</div>
              <Input
                type="month"
                value={exp.startDate}
                onChange={(e) => update(exp.id, { startDate: e.target.value })}
              />
            </div>
            <div>
              <div style={labelStyle}>Ngày kết thúc</div>
              <Input
                type="month"
                value={exp.endDate}
                onChange={(e) => update(exp.id, { endDate: e.target.value })}
                disabled={exp.currently}
                placeholder={exp.currently ? 'Hiện tại' : ''}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Checkbox
              checked={exp.currently}
              onChange={(e) => update(exp.id, { currently: e.target.checked })}
            >
              <span style={{ color: titleColor, fontSize: 13 }}>Đang làm hiện tại</span>
            </Checkbox>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Website công ty</div>
            <Input
              value={exp.website}
              onChange={(e) => update(exp.id, { website: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Tóm tắt công việc</div>
            <Input.TextArea
              value={exp.summary}
              onChange={(e) => update(exp.id, { summary: e.target.value })}
              placeholder="Mô tả ngắn về vai trò và trách nhiệm..."
              rows={2}
              style={{ resize: 'none' }}
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
                onClick={() => addHighlight(exp.id)}
                style={{ fontSize: 11 }}
              >
                Thêm thành tựu
              </Button>
            </div>
            {exp.highlights.map((h, hi) => (
              <div
                key={hi}
                style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}
              >
                <Input
                  value={h}
                  onChange={(e) => updateHighlight(exp.id, hi, e.target.value)}
                  placeholder="Thành tựu nổi bật..."
                  size="small"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => removeHighlight(exp.id, hi)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        block
        onClick={add}
        style={{ marginTop: 4 }}
      >
        Thêm kinh nghiệm
      </Button>
    </div>
  );
}
