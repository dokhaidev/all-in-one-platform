'use client';

import { Select } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { CvDesign, COLOR_OPTIONS, FONT_OPTIONS, TEMPLATE_OPTIONS } from '../../types';

interface Props {
  design: CvDesign;
  onChange: (design: CvDesign) => void;
}

export default function StepDesign({ design, onChange }: Props) {
  const set = (patch: Partial<CvDesign>) => onChange({ ...design, ...patch });

  return (
    <div>
      {/* Template */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#999', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
          Kiểu mẫu
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {TEMPLATE_OPTIONS.map((t) => {
            const active = design.template === t.value;
            return (
              <div
                key={t.value}
                onClick={() => set({ template: t.value })}
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  background: active ? 'rgba(80,200,120,0.08)' : '#252525',
                  border: `2px solid ${active ? '#50C878' : '#333'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.18s',
                }}
              >
                <div
                  style={{
                    color: active ? '#50C878' : '#888',
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  {t.label}
                </div>
                <div style={{ color: '#555', fontSize: 11 }}>{t.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#999', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
          Màu chủ đạo
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {COLOR_OPTIONS.map((c) => {
            const active = design.primaryColor === c.value;
            return (
              <div
                key={c.value}
                title={c.label}
                onClick={() => set({ primaryColor: c.value })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: c.value,
                  cursor: 'pointer',
                  border: `3px solid ${active ? '#fff' : 'transparent'}`,
                  outline: active ? `2px solid ${c.value}` : 'none',
                  outlineOffset: 2,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active && (
                  <CheckOutlined style={{ color: '#fff', fontSize: 14, fontWeight: 700 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Font */}
      <div>
        <div style={{ color: '#999', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
          Phông chữ
        </div>
        <Select
          value={design.font}
          onChange={(val) => set({ font: val })}
          style={{ width: '100%' }}
          size="large"
          options={FONT_OPTIONS.map((f) => ({
            label: <span style={{ fontFamily: f.value, fontSize: 14 }}>{f.label}</span>,
            value: f.value,
          }))}
        />
      </div>
    </div>
  );
}
