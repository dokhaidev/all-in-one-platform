'use client';

import React, { useState, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Row, Col, Select, Slider, message } from 'antd';
import { BgColorsOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface ColorStop { id: number; color: string; position: number }

const PRESETS = [
  { label: 'Sunset', stops: [{ color: '#ff6b6b', pos: 0 }, { color: '#feca57', pos: 100 }] },
  { label: 'Ocean', stops: [{ color: '#0099f7', pos: 0 }, { color: '#f11712', pos: 100 }] },
  { label: 'Forest', stops: [{ color: '#134e5e', pos: 0 }, { color: '#71b280', pos: 100 }] },
  { label: 'Purple', stops: [{ color: '#8e2de2', pos: 0 }, { color: '#4a00e0', pos: 100 }] },
  { label: 'Candy', stops: [{ color: '#f953c6', pos: 0 }, { color: '#b91d73', pos: 100 }] },
  { label: 'Peach', stops: [{ color: '#ED4264', pos: 0 }, { color: '#FFEDBC', pos: 100 }] },
  { label: 'Aurora', stops: [{ color: '#00C9FF', pos: 0 }, { color: '#92FE9D', pos: 100 }] },
  { label: 'Fire', stops: [{ color: '#f12711', pos: 0 }, { color: '#f5af19', pos: 100 }] },
  { label: 'Mint', stops: [{ color: '#00b09b', pos: 0 }, { color: '#96c93d', pos: 100 }] },
  { label: 'Twilight', stops: [{ color: '#0f0c29', pos: 0 }, { color: '#302b63', pos: 50 }, { color: '#24243e', pos: 100 }] },
];

let nextId = 3;

export default function GradientGeneratorTool() {
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, color: '#50C878', position: 0 },
    { id: 2, color: '#1677ff', position: 100 },
  ]);

  const gradientCSS = useCallback(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
    if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsStr})`;
    if (type === 'radial') return `radial-gradient(circle, ${stopsStr})`;
    return `conic-gradient(from ${angle}deg, ${stopsStr})`;
  }, [type, angle, stops]);

  const cssValue = gradientCSS();
  const fullCSS = `background: ${cssValue};`;

  const addStop = () => {
    setStops(prev => [...prev, { id: nextId++, color: '#ffffff', position: 50 }]);
  };

  const removeStop = (id: number) => {
    if (stops.length <= 2) return;
    setStops(prev => prev.filter(s => s.id !== id));
  };

  const updateStop = (id: number, field: 'color' | 'position', val: string | number) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    nextId = preset.stops.length + 1;
    setStops(preset.stops.map((s, i) => ({ id: i + 1, color: s.color, position: s.pos })));
  };

  const copy = () => { navigator.clipboard.writeText(fullCSS); message.success('Đã copy CSS!'); };
  const copyValue = () => { navigator.clipboard.writeText(cssValue); message.success('Đã copy!'); };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <BgColorsOutlined style={{ color: dark.primary, marginRight: 8 }} />
        CSS Gradient Generator
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Tạo gradient đẹp, copy CSS ngay lập tức
      </Text>

      {/* Preview */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ height: 160, borderRadius: 8, background: cssValue, transition: 'all 0.3s', marginBottom: 12 }} />
        <Space.Compact style={{ width: '100%' }}>
          <Input readOnly value={fullCSS} style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.primary, fontFamily: 'monospace' }} />
          <Button icon={<CopyOutlined />} onClick={copy} type="primary" style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
            Copy CSS
          </Button>
        </Space.Compact>
      </Card>

      <Row gutter={16}>
        {/* Controls */}
        <Col xs={24} md={14}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Cài đặt</Text>}>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text style={{ color: '#888', display: 'block', marginBottom: 6 }}>Loại gradient</Text>
                <Select value={type} onChange={v => setType(v as 'linear' | 'radial' | 'conic')} style={{ width: '100%' }} dropdownStyle={{ background: '#1e1e1e' }}>
                  <Option value="linear">Linear</Option>
                  <Option value="radial">Radial</Option>
                  <Option value="conic">Conic</Option>
                </Select>
              </Col>
              {(type === 'linear' || type === 'conic') && (
                <Col span={12}>
                  <Text style={{ color: '#888', display: 'block', marginBottom: 6 }}>Góc: {angle}°</Text>
                  <Slider min={0} max={360} value={angle} onChange={setAngle}
                    trackStyle={{ background: dark.primary }} handleStyle={{ borderColor: dark.primary }} />
                </Col>
              )}
            </Row>

            {/* Color stops */}
            <Text style={{ color: '#888', display: 'block', marginBottom: 8 }}>Color stops</Text>
            {stops.map((stop, i) => (
              <div key={stop.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: '#666', width: 20, textAlign: 'center' }}>{i + 1}</span>
                <input
                  type="color"
                  value={stop.color}
                  onChange={e => updateStop(stop.id, 'color', e.target.value)}
                  style={{ width: 48, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }}
                />
                <Input
                  value={stop.color}
                  onChange={e => updateStop(stop.id, 'color', e.target.value)}
                  style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text, width: 100, fontFamily: 'monospace' }}
                />
                <div style={{ flex: 1 }}>
                  <Slider min={0} max={100} value={stop.position} onChange={v => updateStop(stop.id, 'position', v)}
                    trackStyle={{ background: dark.primary }} handleStyle={{ borderColor: dark.primary }} />
                </div>
                <Text style={{ color: dark.text, width: 40 }}>{stop.position}%</Text>
                <Button size="small" icon={<DeleteOutlined />} danger onClick={() => removeStop(stop.id)} disabled={stops.length <= 2} />
              </div>
            ))}
            <Button icon={<PlusOutlined />} onClick={addStop} style={{ border: `1px dashed ${dark.border}`, background: 'transparent', color: dark.text, width: '100%' }}>
              Thêm color stop
            </Button>
          </Card>

          {/* Direction shortcuts */}
          {type === 'linear' && (
            <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Hướng nhanh</Text>}>
              <Space wrap>
                {[{ label: '→', deg: 90 }, { label: '←', deg: 270 }, { label: '↓', deg: 180 }, { label: '↑', deg: 0 },
                  { label: '↘', deg: 135 }, { label: '↗', deg: 45 }, { label: '↙', deg: 225 }, { label: '↖', deg: 315 }].map(d => (
                  <Button key={d.deg} onClick={() => setAngle(d.deg)}
                    style={{ background: angle === d.deg ? dark.primary : '#2a2a2a', border: `1px solid ${angle === d.deg ? dark.primary : dark.border}`, color: angle === d.deg ? '#000' : dark.text, width: 48 }}>
                    {d.label} {d.deg}°
                  </Button>
                ))}
              </Space>
            </Card>
          )}
        </Col>

        {/* Presets */}
        <Col xs={24} md={10}>
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Presets</Text>}>
            <Row gutter={[8, 8]}>
              {PRESETS.map(p => (
                <Col span={12} key={p.label}>
                  <div style={{ cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: `1px solid ${dark.border}` }}
                    onClick={() => loadPreset(p)}>
                    <div style={{
                      height: 48,
                      background: `linear-gradient(135deg, ${p.stops.map(s => `${s.color} ${s.pos}%`).join(', ')})`
                    }} />
                    <div style={{ padding: '4px 8px', background: '#2a2a2a' }}>
                      <Text style={{ color: dark.text, fontSize: 12 }}>{p.label}</Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* CSS output */}
          <Card style={{ ...cardStyle, marginTop: 16 }} title={<Text style={{ color: '#e0e0e0' }}>CSS Output</Text>}>
            <div style={{ background: '#2a2a2a', borderRadius: 6, padding: 12, fontFamily: 'monospace', fontSize: 12, color: dark.text, whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: 8 }}>
              {`background: ${cssValue};`}
            </div>
            <Space>
              <Button size="small" icon={<CopyOutlined />} onClick={copy} style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>Copy CSS</Button>
              <Button size="small" icon={<CopyOutlined />} onClick={copyValue} style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>Copy value</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
