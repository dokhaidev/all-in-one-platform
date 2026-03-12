'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Input, Button, Typography, Space, Row, Col, Tag, message } from 'antd';
import { ColumnWidthOutlined, CopyOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

const PRESETS = [
  { label: 'ease', values: [0.25, 0.1, 0.25, 1] },
  { label: 'ease-in', values: [0.42, 0, 1, 1] },
  { label: 'ease-out', values: [0, 0, 0.58, 1] },
  { label: 'ease-in-out', values: [0.42, 0, 0.58, 1] },
  { label: 'linear', values: [0, 0, 1, 1] },
  { label: 'bounce', values: [0.34, 1.56, 0.64, 1] },
  { label: 'snap', values: [0.85, 0, 0.15, 1] },
  { label: 'swift', values: [0.55, 0, 0.1, 1] },
  { label: 'back-in', values: [0.36, 0, 0.66, -0.56] },
  { label: 'back-out', values: [0.34, 1.56, 0.64, 1] },
  { label: 'elastic', values: [0.68, -0.6, 0.32, 1.6] },
  { label: 'expo-in', values: [0.95, 0.05, 0.795, 0.035] },
];

const SZ = 260;
const PAD = 30;
const INNER = SZ - PAD * 2;

function bezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

export default function CubicBezierTool() {
  const [pts, setPts] = useState([0.25, 0.1, 0.75, 0.9]);
  const [dragging, setDragging] = useState<0 | 1 | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animating, setAnimating] = useState(false);
  const animRef = useRef<number>(0);
  const [ballY, setBallY] = useState(0);

  const cssValue = `cubic-bezier(${pts.map(v => v.toFixed(3)).join(', ')})`;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, SZ, SZ);

    // Grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(PAD + (INNER / 4) * i, PAD);
      ctx.lineTo(PAD + (INNER / 4) * i, PAD + INNER);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD, PAD + (INNER / 4) * i);
      ctx.lineTo(PAD + INNER, PAD + (INNER / 4) * i);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, PAD + INNER); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, PAD + INNER); ctx.lineTo(PAD + INNER, PAD + INNER); ctx.stroke();

    // Control lines
    const p1x = PAD + pts[0] * INNER, p1y = PAD + INNER - pts[1] * INNER;
    const p2x = PAD + pts[2] * INNER, p2y = PAD + INNER - pts[3] * INNER;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PAD, PAD + INNER); ctx.lineTo(p1x, p1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD + INNER, PAD); ctx.lineTo(p2x, p2y); ctx.stroke();
    ctx.setLineDash([]);

    // Curve
    ctx.strokeStyle = dark.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD + INNER);
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = PAD + bezier(t, 0, pts[0], pts[2], 1) * INNER;
      const y = PAD + INNER - bezier(t, 0, pts[1], pts[3], 1) * INNER;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Control points
    [[p1x, p1y, '#faad14'], [p2x, p2y, '#1677ff']].forEach(([cx, cy, col]) => {
      ctx.fillStyle = col as string;
      ctx.beginPath(); ctx.arc(cx as number, cy as number, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx as number, cy as number, 7, 0, Math.PI * 2); ctx.stroke();
    });
  }, [pts]);

  useEffect(() => { draw(); }, [draw]);

  const toCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = SZ / rect.width;
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(e);
    const p1x = PAD + pts[0] * INNER, p1y = PAD + INNER - pts[1] * INNER;
    const p2x = PAD + pts[2] * INNER, p2y = PAD + INNER - pts[3] * INNER;
    const d1 = Math.hypot(x - p1x, y - p1y), d2 = Math.hypot(x - p2x, y - p2y);
    if (d1 < 14) setDragging(0);
    else if (d2 < 14) setDragging(1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return;
    const { x, y } = toCanvas(e);
    const nx = Math.max(0, Math.min(1, (x - PAD) / INNER));
    const ny = (PAD + INNER - y) / INNER;
    const clamped = Math.max(-1.5, Math.min(2.5, ny));
    setPts(prev => dragging === 0
      ? [nx, clamped, prev[2], prev[3]]
      : [prev[0], prev[1], nx, clamped]);
  };

  const handleMouseUp = () => setDragging(null);

  const parseInput = (val: string) => {
    const m = val.match(/cubic-bezier\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
    if (m) {
      const nums = [1, 2, 3, 4].map(i => parseFloat(m[i]));
      if (nums.every(n => !isNaN(n))) { setPts(nums); return; }
    }
    const parts = val.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 4 && parts.every(n => !isNaN(n))) setPts(parts);
  };

  const animate = () => {
    if (animating) return;
    setAnimating(true);
    setBallY(0);
    const start = performance.now();
    const dur = 1200;

    const frame = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const bx = bezier(t, 0, pts[1], pts[3], 1);
      setBallY(bx);
      if (t < 1) { animRef.current = requestAnimationFrame(frame); }
      else { setAnimating(false); }
    };
    animRef.current = requestAnimationFrame(frame);
  };

  const copy = () => { navigator.clipboard.writeText(`transition-timing-function: ${cssValue};`); message.success('Đã copy!'); };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <ColumnWidthOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Cubic Bezier Editor
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Kéo điểm để tạo easing curve, preview animation
      </Text>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Editor — kéo điểm màu vàng/xanh</Text>}>
            <canvas
              ref={canvasRef} width={SZ} height={SZ}
              style={{ width: '100%', cursor: dragging !== null ? 'grabbing' : 'default', borderRadius: 6, background: '#1e1e1e' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </Card>

          {/* Input */}
          <Card style={cardStyle}>
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input
                value={cssValue}
                onChange={e => parseInput(e.target.value)}
                style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.primary, fontFamily: 'monospace' }}
              />
              <Button icon={<CopyOutlined />} onClick={copy} style={{ border: `1px solid ${dark.border}`, background: '#333', color: dark.text }} />
            </Space.Compact>
            <Row gutter={8}>
              {['P1 X', 'P1 Y', 'P2 X', 'P2 Y'].map((label, i) => (
                <Col span={6} key={label}>
                  <Text style={{ color: '#888', fontSize: 11, display: 'block' }}>{label}</Text>
                  <Input
                    value={pts[i].toFixed(3)}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setPts(prev => prev.map((p, j) => j === i ? v : p));
                    }}
                    style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text, fontFamily: 'monospace', textAlign: 'center' }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          {/* Animation preview */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Preview animation</Text>}
            extra={<Button icon={<PlayCircleOutlined />} onClick={animate} disabled={animating} size="small"
              style={{ background: dark.primary, borderColor: dark.primary, color: '#000' }}>Play</Button>}>
            <div style={{ position: 'relative', height: 80, background: '#2a2a2a', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                position: 'absolute', left: `calc(${ballY * 100}% - 20px)`, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', background: dark.primary,
                transition: animating ? 'none' : undefined,
              }} />
            </div>
            <div style={{ background: '#1e1e1e', borderRadius: 6, padding: 12, fontFamily: 'monospace', fontSize: 12 }}>
              <Text style={{ color: '#888' }}>transition-timing-function:</Text>
              <Text style={{ color: dark.primary, display: 'block' }}>{cssValue};</Text>
            </div>
          </Card>

          {/* Presets */}
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Presets thông dụng</Text>}>
            <Row gutter={[8, 8]}>
              {PRESETS.map(p => (
                <Col span={12} key={p.label}>
                  <div
                    onClick={() => setPts(p.values)}
                    style={{
                      cursor: 'pointer', padding: '6px 10px', borderRadius: 6,
                      background: JSON.stringify(pts.map(v => parseFloat(v.toFixed(3)))) === JSON.stringify(p.values) ? dark.primary : '#2a2a2a',
                      border: `1px solid ${dark.border}`,
                      color: JSON.stringify(pts.map(v => parseFloat(v.toFixed(3)))) === JSON.stringify(p.values) ? '#000' : dark.text,
                    }}
                  >
                    <Text style={{ fontWeight: 600, display: 'block', fontSize: 13 }}>{p.label}</Text>
                    <Text style={{ fontSize: 10, opacity: 0.7, fontFamily: 'monospace' }}>({p.values.join(', ')})</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
