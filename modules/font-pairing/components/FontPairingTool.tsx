'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Row, Col, Select, Input, Slider, Button, message } from 'antd';
import { FontColorsOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const dark = { bg: '#1a1a1a', card: '#222', border: '#2e2e2e', text: '#c9c9c9', primary: '#50C878' };

interface Pairing { heading: string; body: string; tag: string; desc: string }

const PAIRINGS: Pairing[] = [
  { heading: 'Playfair Display', body: 'Lato', tag: 'Elegant', desc: 'Classic serif + modern sans — tạp chí, thời trang' },
  { heading: 'Montserrat', body: 'Merriweather', tag: 'Corporate', desc: 'Bold sans + readable serif — doanh nghiệp, báo cáo' },
  { heading: 'Raleway', body: 'Roboto', tag: 'Modern', desc: 'Geometric + neutral — ứng dụng, startup' },
  { heading: 'Oswald', body: 'Open Sans', tag: 'Bold', desc: 'Condensed + clean — tiêu đề nổi bật, landing page' },
  { heading: 'Libre Baskerville', body: 'Source Sans 3', tag: 'Editorial', desc: 'Literary serif + functional sans — blog, editorial' },
  { heading: 'Nunito', body: 'Nunito Sans', tag: 'Friendly', desc: 'Rounded pair — ứng dụng trẻ em, casual app' },
  { heading: 'Poppins', body: 'Poppins', tag: 'Minimal', desc: 'Single family — đơn giản, nhất quán' },
  { heading: 'Archivo Black', body: 'Archivo', tag: 'Impact', desc: 'Heavy + light trong cùng family — contrast mạnh' },
  { heading: 'Abril Fatface', body: 'Poppins', tag: 'Display', desc: 'Decorative + clean — poster, hero section' },
  { heading: 'Space Grotesk', body: 'Inter', tag: 'Tech', desc: 'Tech-forward + workhorse — SaaS, developer tools' },
  { heading: 'Cormorant Garamond', body: 'Proza Libre', tag: 'Luxury', desc: 'High-contrast serif + humanist — luxury brands' },
  { heading: 'Bebas Neue', body: 'Roboto Condensed', tag: 'Sport', desc: 'All-caps display + condensed — sport, gaming' },
];

const SAMPLE_TEXTS = {
  heading: 'Tạo nên những điều tuyệt vời',
  subheading: 'Thiết kế không chỉ là vẻ đẹp bên ngoài',
  body: 'Typography tốt giúp truyền tải thông điệp rõ ràng và tạo ra trải nghiệm đọc dễ chịu. Lựa chọn font phù hợp là nền tảng của mọi thiết kế chuyên nghiệp.',
  quote: '"Nghệ thuật không có quy tắc, chỉ có nguyên tắc." — Thiết kế viên',
};

function loadFont(family: string) {
  const id = `gfont-${family.replace(/\s+/g, '-')}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  }
}

export default function FontPairingTool() {
  const [selected, setSelected] = useState(PAIRINGS[0]);
  const [headingSize, setHeadingSize] = useState(36);
  const [bodySize, setBodySize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [customHeading, setCustomHeading] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [bgMode, setBgMode] = useState<'dark' | 'light' | 'paper'>('light');
  const [customText, setCustomText] = useState('');

  const headingFont = customHeading || selected.heading;
  const bodyFont = customBody || selected.body;

  useEffect(() => {
    loadFont(headingFont);
    loadFont(bodyFont);
  }, [headingFont, bodyFont]);

  const bgColors = { dark: '#1a1a1a', light: '#ffffff', paper: '#f5f0eb' };
  const textColors = { dark: '#e0e0e0', light: '#1a1a1a', paper: '#2d2419' };
  const bg = bgColors[bgMode];
  const tc = textColors[bgMode];

  const cssOutput = `/* Heading */
font-family: '${headingFont}', serif;
font-size: ${headingSize}px;
font-weight: 700;

/* Body */
font-family: '${bodyFont}', sans-serif;
font-size: ${bodySize}px;
line-height: ${lineHeight};

/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@700&family=${encodeURIComponent(bodyFont)}:wght@400;600&display=swap');`;

  const copy = () => { navigator.clipboard.writeText(cssOutput); message.success('Đã copy CSS!'); };

  const cardStyle = { background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 8 };

  return (
    <div style={{ padding: 24, background: dark.bg, minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#e0e0e0', marginBottom: 4 }}>
        <FontColorsOutlined style={{ color: dark.primary, marginRight: 8 }} />
        Font Pairing Tool
      </Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Chọn cặp font đẹp từ Google Fonts, preview trực tiếp
      </Text>

      <Row gutter={16}>
        {/* Pairings list */}
        <Col xs={24} md={8}>
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Gợi ý cặp font ({PAIRINGS.length})</Text>}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {PAIRINGS.map(p => (
                <div key={p.heading}
                  onClick={() => { setSelected(p); setCustomHeading(''); setCustomBody(''); }}
                  style={{
                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 6,
                    background: selected.heading === p.heading ? '#2a2a2a' : 'transparent',
                    border: `1px solid ${selected.heading === p.heading ? dark.primary : 'transparent'}`,
                    transition: 'all 0.2s',
                  }}>
                  <Space>
                    <Tag color={selected.heading === p.heading ? 'success' : undefined}>{p.tag}</Tag>
                  </Space>
                  <div>
                    <Text style={{ color: '#e0e0e0', fontWeight: 600, display: 'block' }}>{p.heading}</Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>+ {p.body}</Text>
                  </div>
                  <Text style={{ color: '#666', fontSize: 11 }}>{p.desc}</Text>
                </div>
              ))}
            </div>
          </Card>

          {/* Custom */}
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>Font tùy chỉnh</Text>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Heading font</Text>
                <Input value={customHeading} onChange={e => setCustomHeading(e.target.value)} placeholder={selected.heading}
                  style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
              </div>
              <div>
                <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Body font</Text>
                <Input value={customBody} onChange={e => setCustomBody(e.target.value)} placeholder={selected.body}
                  style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
              </div>
              <Text style={{ color: '#555', fontSize: 11 }}>Nhập tên font Google Fonts chính xác</Text>
            </Space>
          </Card>
        </Col>

        {/* Preview */}
        <Col xs={24} md={16}>
          {/* Controls */}
          <Card style={{ ...cardStyle, marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Heading size: {headingSize}px</Text>
                <Slider min={20} max={80} value={headingSize} onChange={setHeadingSize}
                  trackStyle={{ background: dark.primary }} handleStyle={{ borderColor: dark.primary }} />
              </Col>
              <Col span={8}>
                <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Body size: {bodySize}px</Text>
                <Slider min={12} max={24} value={bodySize} onChange={setBodySize}
                  trackStyle={{ background: dark.primary }} handleStyle={{ borderColor: dark.primary }} />
              </Col>
              <Col span={8}>
                <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Line height: {lineHeight}</Text>
                <Slider min={1.2} max={2.4} step={0.1} value={lineHeight} onChange={setLineHeight}
                  trackStyle={{ background: dark.primary }} handleStyle={{ borderColor: dark.primary }} />
              </Col>
            </Row>
            <Space>
              {(['light', 'dark', 'paper'] as const).map(m => (
                <Tag key={m} onClick={() => setBgMode(m)}
                  style={{ cursor: 'pointer', background: bgMode === m ? dark.primary : '#2a2a2a', border: `1px solid ${bgMode === m ? dark.primary : dark.border}`, color: bgMode === m ? '#000' : dark.text }}>
                  {m}
                </Tag>
              ))}
            </Space>
          </Card>

          {/* Preview area */}
          <Card style={{ ...cardStyle, marginBottom: 16 }}
            title={<Text style={{ color: '#e0e0e0' }}>Preview — {headingFont} + {bodyFont}</Text>}>
            <div style={{ background: bg, borderRadius: 8, padding: 32, transition: 'all 0.3s' }}>
              <div style={{ fontFamily: `'${headingFont}', serif`, fontSize: headingSize, fontWeight: 700, color: tc, marginBottom: 8, lineHeight: 1.2 }}>
                {customText || SAMPLE_TEXTS.heading}
              </div>
              <div style={{ fontFamily: `'${headingFont}', serif`, fontSize: headingSize * 0.55, fontWeight: 600, color: tc, opacity: 0.75, marginBottom: 16 }}>
                {SAMPLE_TEXTS.subheading}
              </div>
              <div style={{ fontFamily: `'${bodyFont}', sans-serif`, fontSize: bodySize, color: tc, lineHeight, opacity: 0.85, marginBottom: 16 }}>
                {SAMPLE_TEXTS.body}
              </div>
              <div style={{ fontFamily: `'${bodyFont}', sans-serif`, fontSize: bodySize, color: tc, fontStyle: 'italic', opacity: 0.65, borderLeft: `3px solid ${dark.primary}`, paddingLeft: 16 }}>
                {SAMPLE_TEXTS.quote}
              </div>
            </div>
          </Card>

          {/* Custom text */}
          <Card style={{ ...cardStyle, marginBottom: 16 }} title={<Text style={{ color: '#e0e0e0' }}>Text tùy chỉnh</Text>}>
            <TextArea rows={2} value={customText} onChange={e => setCustomText(e.target.value)}
              placeholder="Nhập text để xem preview với font đã chọn..."
              style={{ background: '#2a2a2a', border: `1px solid ${dark.border}`, color: dark.text }} />
          </Card>

          {/* CSS output */}
          <Card style={cardStyle} title={<Text style={{ color: '#e0e0e0' }}>CSS Output</Text>}>
            <div style={{ background: '#2a2a2a', borderRadius: 6, padding: 12, fontFamily: 'monospace', fontSize: 12, color: dark.text, whiteSpace: 'pre-wrap', marginBottom: 8 }}>
              {cssOutput}
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
