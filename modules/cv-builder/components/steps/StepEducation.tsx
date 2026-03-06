'use client';

import { Input, Button, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Education } from '../../types';

interface Props {
  education: Education[];
  onChange: (education: Education[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const newEntry = (): Education => ({
  id: uid(),
  institution: '',
  area: '',
  studyType: '',
  startDate: '',
  endDate: '',
  gpa: '',
  website: '',
  courses: [],
});

const labelStyle: React.CSSProperties = { color: '#888', fontSize: 12, marginBottom: 4 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

const DEGREE_OPTIONS = [
  'Trung học phổ thông',
  'Cao đẳng',
  'Cử nhân',
  'Kỹ sư',
  'Thạc sĩ',
  'Tiến sĩ',
  'Chứng chỉ',
  'Khác',
];

export default function StepEducation({ education, onChange }: Props) {
  const add = () => onChange([...education, newEntry()]);
  const remove = (id: string) => onChange(education.filter((e) => e.id !== id));
  const update = (id: string, patch: Partial<Education>) =>
    onChange(education.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <div>
      {education.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#444', fontSize: 13 }}>
          Chưa có thông tin học vấn nào
        </div>
      )}

      {education.map((edu, idx) => (
        <div
          key={edu.id}
          style={{
            background: '#1e1e1e',
            border: '1px solid #2e2e2e',
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
            <div style={{ color: '#bbb', fontSize: 13, fontWeight: 600 }}>
              Học vấn {idx + 1}
            </div>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(edu.id)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Tên trường</div>
            <Input
              value={edu.institution}
              onChange={(e) => update(edu.id, { institution: e.target.value })}
              placeholder="Đại học..."
            />
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Loại bằng</div>
              <Select
                value={edu.studyType || undefined}
                onChange={(val) => update(edu.id, { studyType: val })}
                style={{ width: '100%' }}
                placeholder="Chọn loại bằng"
                options={DEGREE_OPTIONS.map((d) => ({ label: d, value: d }))}
                allowClear
              />
            </div>
            <div>
              <div style={labelStyle}>Chuyên ngành</div>
              <Input
                value={edu.area}
                onChange={(e) => update(edu.id, { area: e.target.value })}
                placeholder="Công nghệ thông tin..."
              />
            </div>
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Ngày bắt đầu</div>
              <Input
                type="month"
                value={edu.startDate}
                onChange={(e) => update(edu.id, { startDate: e.target.value })}
              />
            </div>
            <div>
              <div style={labelStyle}>Ngày kết thúc</div>
              <Input
                type="month"
                value={edu.endDate}
                onChange={(e) => update(edu.id, { endDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ ...grid2, marginBottom: 12 }}>
            <div>
              <div style={labelStyle}>Điểm trung bình / Điểm số</div>
              <Input
                value={edu.gpa}
                onChange={(e) => update(edu.id, { gpa: e.target.value })}
                placeholder="3.8 GPA"
              />
            </div>
            <div>
              <div style={labelStyle}>Website trường</div>
              <Input
                value={edu.website}
                onChange={(e) => update(edu.id, { website: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Khóa học liên quan</div>
            <Select
              mode="tags"
              value={edu.courses}
              onChange={(val) => update(edu.id, { courses: val })}
              style={{ width: '100%' }}
              placeholder="Nhập tên khóa học rồi Enter..."
              tokenSeparators={[',']}
              open={false}
            />
          </div>
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} block onClick={add} style={{ marginTop: 4 }}>
        Thêm học vấn
      </Button>
    </div>
  );
}
