'use client';

import React, { useState, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Row, Col, Slider, Switch, message } from 'antd';
import { BorderOutlined, CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface Shadow { id: number; x: number; y: number; blur: number; spread: number; color: string; opacity: number; inset: boolean }

const PRESETS = [
  { label: 'Nhẹ nhàng', shadows: [{ x: 0, y: 2, blur: 8, spread: 0, color: '#000000', opacity: 20, inset: false }] },
  { label: 'Nổi bật', shadows: [{ x: 0, y: 10, blur: 30, spread: 0, color: '#000000', opacity: 30, inset: false }] },
  { label: 'Neon Xanh', shadows: [{ x: 0, y: 0, blur: 20, spread: 0, color: '#50C878', opacity: 80, inset: false }] },
  { label: 'Neon Đỏ', shadows: [{ x: 0, y: 0, blur: 20, spread: 0, color: '#ff4d4f', opacity: 80, inset: false }] },
  { label: 'Multi-layer', shadows: [
    { x: 0, y: 4, blur: 6, spread: -1, color: '#000000', opacity: 10, inset: false },
    { x: 0, y: 10, blur: 15, spread: -3, color: '#000000', opacity: 10, inset: false },
  ]},
  { label: 'Inset', shadows: [{ x: 0, y: 2, blur: 8, spread: 0, color: '#000000', opacity: 30, inset: true }] },
];

let nextId = 2;

function shadowToCSS(s: Shadow): string {
  const hex = s.color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = (s.opacity / 100).toFixed(2);
  const color = `rgba(${r},${g},${b},${a})`;
  return `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${color}`;
}

export default function BoxShadowGeneratorTool() {
  const [shadows, setShadows] = useState<Shadow[]>([
    { id: 1, x: 0, y: 8, blur: 24, spread: 0, color: '#000000', opacity: 25, inset: false },
  ]);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [boxColor, setBoxColor] = useState('#ffffff');

  const cssValue = shadows.map(shadowToCSS).join(',\n     ');
  const fullCSS = `box-shadow: ${cssValue};`;

  const addShadow = () => {
    setShadows(prev => [...prev, { id: nextId++, x: 0, y: 4, blur: 12, spread: 0, color: '#000000', opacity: 20, inset: false }]);
  };

  const removeShadow = (id: number) => {
    if (shadows.length <= 1) return;
    setShadows(prev => prev.filter(s => s.id !== id));
  };

  const update = (id: number, field: keyof Shadow, val: number | string | boolean) => {
    setShadows(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    nextId = preset.shadows.length + 1;
    setShadows(preset.shadows.map((s, i) => ({ ...s, id: i + 1 })));
  };

  const copy = () => { navigator.clipboard.writeText(fullCSS); message.success('Đã copy CSS!'); };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };
  const sliderProps = { trackStyle: { background: dark.primary }, handleStyle: { borderColor: dark.primary } };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <BorderOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Box Shadow Generator
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Tạo CSS box-shadow đẹp với multi-layer, inset, neon effects
      </Text>

      <Row gutter={16}>
        {/* Preview */}
        <Col xs={24} md={10}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Preview</Text>}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <Space>
                <Text style={{ color: '#888', fontSize: 12 }}>Background:</Text>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 36, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
              </Space>
              <Space>
                <Text style={{ color: '#888', fontSize: 12 }}>Box:</Text>
                <input type="color" value={boxColor} onChange={e => setBoxColor(e.target.value)} style={{ width: 36, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
              </Space>
            </div>
            <div style={{ background: bgColor, borderRadius: 8, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, transition: 'all 0.3s' }}>
              <div style={{
                width: 120, height: 80, borderRadius: 8, background: boxColor,
                boxShadow: shadows.map(shadowToCSS).join(', '),
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#888', fontSize: 11 }}>Box</Text>
              </div>
            </div>
          </Card>

          {/* Presets */}
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Presets</Text>}>
            <Space wrap>
              {PRESETS.map(p => (
                <Tag key={p.label} style={{ cursor: 'pointer', background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }}
                  onClick={() => loadPreset(p)}>
                  {p.label}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Controls */}
        <Col xs={24} md={14}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={
            <Space>
              <Text style={{ color: '#e0e0e0' }}>Layers ({shadows.length})</Text>
              <Button size="small" icon={<PlusOutlined />} onClick={addShadow}
                style={{ border: `1px solid ${dark.border}`, background: 'transparent', color: dark.text }}>
                Thêm layer
              </Button>
            </Space>
          }>
            {shadows.map((s, i) => (
              <div key={s.id} style={{ marginBottom: 16, padding: 12, background: '#2a2a2a', borderRadius: 8, border: `1px solid ${dark.border}` }}>
                <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
                  <Col><Tag color="blue">Layer {i + 1}</Tag></Col>
                  <Col flex={1}>
                    <Space>
                      <Text style={{ color: '#888', fontSize: 12 }}>Inset:</Text>
                      <Switch checked={s.inset} onChange={v => update(s.id, 'inset', v)} size="small" />
                      <input type="color" value={s.color} onChange={e => update(s.id, 'color', e.target.value)}
                        style={{ width: 32, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    </Space>
                  </Col>
                  <Col>
                    <Button size="small" icon={<DeleteOutlined />} danger onClick={() => removeShadow(s.id)} disabled={shadows.length <= 1} />
                  </Col>
                </Row>
                {[
                  { label: `X: ${s.x}px`, field: 'x' as keyof Shadow, min: -100, max: 100, val: s.x },
                  { label: `Y: ${s.y}px`, field: 'y' as keyof Shadow, min: -100, max: 100, val: s.y },
                  { label: `Blur: ${s.blur}px`, field: 'blur' as keyof Shadow, min: 0, max: 100, val: s.blur },
                  { label: `Spread: ${s.spread}px`, field: 'spread' as keyof Shadow, min: -50, max: 50, val: s.spread },
                  { label: `Opacity: ${s.opacity}%`, field: 'opacity' as keyof Shadow, min: 0, max: 100, val: s.opacity },
                ].map(ctrl => (
                  <Row key={ctrl.field} gutter={8} align="middle" style={{ marginBottom: 4 }}>
                    <Col style={{ width: 110 }}><Text style={{ color: '#888', fontSize: 12 }}>{ctrl.label}</Text></Col>
                    <Col flex={1}>
                      <Slider min={ctrl.min} max={ctrl.max} value={ctrl.val as number}
                        onChange={v => update(s.id, ctrl.field, v)} {...sliderProps} style={{ margin: 0 }} />
                    </Col>
                  </Row>
                ))}
              </div>
            ))}
          </Card>

          {/* CSS Output */}
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>CSS Output</Text>}>
            <div style={{ background: '#2a2a2a', borderRadius: 6, padding: 12, fontFamily: 'monospace', fontSize: 12, color: dark.text, whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: 8 }}>
              {`box-shadow:\n  ${shadows.map(shadowToCSS).join(',\n  ')};`}
            </div>
            <Button icon={<CopyOutlined />} onClick={copy} type="primary"
              style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>
              Copy CSS
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
