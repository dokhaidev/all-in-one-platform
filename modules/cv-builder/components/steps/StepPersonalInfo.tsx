'use client';

import { Input, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { PersonalInfo, Profile } from '../../types';

interface Props {
  personal: PersonalInfo;
  onChange: (personal: PersonalInfo) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 12,
};

const label: React.CSSProperties = { color: '#888', fontSize: 12, marginBottom: 4 };

function Field({
  label: l,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div style={label}>{l}</div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? l}
        size="middle"
      />
    </div>
  );
}

export default function StepPersonalInfo({ personal, onChange }: Props) {
  const set = (patch: Partial<PersonalInfo>) => onChange({ ...personal, ...patch });

  const addProfile = () =>
    set({ profiles: [...personal.profiles, { id: uid(), network: '', url: '' }] });

  const removeProfile = (id: string) =>
    set({ profiles: personal.profiles.filter((p) => p.id !== id) });

  const updateProfile = (id: string, patch: Partial<Profile>) =>
    set({
      profiles: personal.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });

  return (
    <div>
      <div style={grid2}>
        <Field label="Họ và tên *" value={personal.name} onChange={(v) => set({ name: v })} />
        <Field
          label="Chức danh / Vị trí"
          value={personal.title}
          onChange={(v) => set({ title: v })}
          placeholder="vd: Full Stack Developer"
        />
      </div>

      <div style={grid2}>
        <Field
          label="Địa chỉ Email *"
          value={personal.email}
          onChange={(v) => set({ email: v })}
          placeholder="email@example.com"
        />
        <Field
          label="Số điện thoại"
          value={personal.phone}
          onChange={(v) => set({ phone: v })}
          placeholder="+84 ..."
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <Field
          label="Website / Portfolio URL"
          value={personal.website}
          onChange={(v) => set({ website: v })}
          placeholder="https://yoursite.com"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={label}>Tóm tắt chuyên môn</div>
        <Input.TextArea
          value={personal.summary}
          onChange={(e) => set({ summary: e.target.value })}
          placeholder="Mô tả ngắn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp..."
          rows={4}
          style={{ resize: 'none' }}
        />
      </div>

      {/* Location */}
      <div
        style={{
          background: '#1e1e1e',
          border: '1px solid #2e2e2e',
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ color: '#777', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
          Địa điểm
        </div>
        <div style={grid2}>
          <Field label="Thành phố" value={personal.city} onChange={(v) => set({ city: v })} />
          <Field label="Tỉnh / Khu vực" value={personal.state} onChange={(v) => set({ state: v })} />
        </div>
        <div style={{ ...grid2, marginBottom: 0 }}>
          <Field label="Mã bưu điện" value={personal.zip} onChange={(v) => set({ zip: v })} />
          <Field label="Mã quốc gia" value={personal.country} onChange={(v) => set({ country: v })} placeholder="Việt Nam" />
        </div>
      </div>

      {/* Social Profiles */}
      <div
        style={{
          background: '#1e1e1e',
          border: '1px solid #2e2e2e',
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div style={{ color: '#777', fontSize: 12, fontWeight: 600 }}>Hồ sơ mạng xã hội</div>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            size="small"
            onClick={addProfile}
            style={{ fontSize: 12 }}
          >
            Thêm hồ sơ
          </Button>
        </div>

        {personal.profiles.length === 0 && (
          <div style={{ color: '#444', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
            Chưa có hồ sơ nào
          </div>
        )}

        {personal.profiles.map((p) => (
          <div
            key={p.id}
            style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}
          >
            <Input
              value={p.network}
              onChange={(e) => updateProfile(p.id, { network: e.target.value })}
              placeholder="LinkedIn, GitHub..."
              style={{ width: 130, flexShrink: 0 }}
            />
            <Input
              value={p.url}
              onChange={(e) => updateProfile(p.id, { url: e.target.value })}
              placeholder="https://..."
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => removeProfile(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
