'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Typography, Button, Tag, Tooltip, Row, Col, Divider, message } from 'antd';
import { CopyOutlined, CheckOutlined, BgColorsOutlined, HistoryOutlined, EyeOutlined, CodeOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.2)';

// ── Color Conversion Utilities ──────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// ── Contrast & WCAG ──────────────────────────────────────────────────────────

function relativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

// ── Named CSS Colors ─────────────────────────────────────────────────────────

const CSS_NAMED_COLORS: Record<string, string> = {
  '#ff0000': 'red', '#00ff00': 'lime', '#0000ff': 'blue', '#ffff00': 'yellow',
  '#ff00ff': 'fuchsia', '#00ffff': 'cyan', '#ffffff': 'white', '#000000': 'black',
  '#808080': 'gray', '#c0c0c0': 'silver', '#800000': 'maroon', '#808000': 'olive',
  '#008000': 'green', '#800080': 'purple', '#008080': 'teal', '#000080': 'navy',
  '#ffa500': 'orange', '#a52a2a': 'brown', '#ffc0cb': 'pink', '#add8e6': 'lightblue',
  '#90ee90': 'lightgreen', '#ffb6c1': 'lightpink', '#20b2aa': 'lightseagreen',
  '#f08080': 'lightcoral', '#e0e0e0': 'gainsboro', '#dc143c': 'crimson',
  '#ff6347': 'tomato', '#ff4500': 'orangered', '#daa520': 'goldenrod',
  '#b8860b': 'darkgoldenrod', '#9acd32': 'yellowgreen', '#32cd32': 'limegreen',
  '#00fa9a': 'mediumspringgreen', '#00ff7f': 'springgreen', '#4682b4': 'steelblue',
  '#1e90ff': 'dodgerblue', '#6495ed': 'cornflowerblue', '#7b68ee': 'mediumslateblue',
  '#9370db': 'mediumpurple', '#8a2be2': 'blueviolet', '#a0522d': 'sienna',
  '#d2691e': 'chocolate', '#f4a460': 'sandybrown', '#deb887': 'burlywood',
};

// ── Palette Generation ────────────────────────────────────────────────────────

function generatePalette(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  const complementary = [hslToHex((h + 180) % 360, s, l)];

  const triadic = [
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l),
  ];

  const analogous = [
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h - 30 + 360) % 360, s, l),
  ];

  const monochromatic = [20, 35, 50, 65, 80].map((shade) => hslToHex(h, s, shade));

  const splitComplementary = [
    hslToHex((h + 150) % 360, s, l),
    hslToHex((h + 210) % 360, s, l),
  ];

  return { complementary, triadic, analogous, monochromatic, splitComplementary };
}

// ── Copy helper ──────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      message.success('Copied!', 1);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);
  return { copied, copy };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ColorSwatch({ hex, size = 32, onClick }: { hex: string; size?: number; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: 6, background: hex,
        border: '1px solid rgba(255,255,255,0.1)', cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0, transition: 'transform 0.15s',
      }}
      title={hex}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    />
  );
}

function CopyRow({ label, value, copyKey, copied, onCopy, isDark }: {
  label: string; value: string; copyKey: string; copied: string | null; onCopy: (v: string, k: string) => void; isDark: boolean;
}) {
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const bg = isDark ? '#1e1e1e' : '#fafafa';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const labelColor = isDark ? '#666' : '#999';
  const isCopied = copied === copyKey;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, marginBottom: 8 }}>
      <span style={{ color: labelColor, fontSize: 11, fontWeight: 600, width: 44, flexShrink: 0 }}>{label}</span>
      <span style={{ color: textColor, fontSize: 13, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      <Tooltip title={isCopied ? 'Copied!' : 'Copy'}>
        <Button
          type="text" size="small"
          icon={isCopied ? <CheckOutlined style={{ color: PRIMARY }} /> : <CopyOutlined />}
          onClick={() => onCopy(value, copyKey)}
          style={{ flexShrink: 0 }}
        />
      </Tooltip>
    </div>
  );
}

function PaletteRow({ label, colors, copied, onCopy }: {
  label: string; colors: string[]; copied: string | null; onCopy: (v: string, k: string) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, color: '#777', fontWeight: 600, display: 'block', marginBottom: 8 }}>{label}</Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {colors.map((hex, i) => {
          const key = `palette-${label}-${i}`;
          const isCopied = copied === key;
          return (
            <Tooltip key={hex + i} title={isCopied ? 'Copied!' : hex}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                onClick={() => onCopy(hex, key)}
              >
                <div style={{ width: 40, height: 40, borderRadius: 8, background: hex, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isCopied && <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />}
                </div>
                <span style={{ fontSize: 9, color: '#666', fontFamily: 'monospace' }}>{hex.toUpperCase()}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ColorPickerTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const [color, setColor] = useState('#50C878');
  const [history, setHistory] = useState<string[]>([]);
  const { copied, copy } = useCopy();
  const inputRef = useRef<HTMLInputElement>(null);

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const heading = isDark ? '#e0e0e0' : '#111';
  const textColor = isDark ? '#c9c9c9' : '#333';

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('toolhub_color_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setHistory((prev) => {
      const filtered = prev.filter((c) => c !== newColor);
      const next = [newColor, ...filtered].slice(0, 12);
      localStorage.setItem('toolhub_color_history', JSON.stringify(next));
      return next;
    });
  };

  const { r, g, b } = hexToRgb(color);
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);
  const cmyk = rgbToCmyk(r, g, b);

  const rgbStr = `rgb(${r}, ${g}, ${b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const hsvStr = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
  const cmykStr = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

  const lum = relativeLuminance(r, g, b);
  const whiteLum = relativeLuminance(255, 255, 255);
  const blackLum = relativeLuminance(0, 0, 0);
  const contrastWhite = contrastRatio(lum, whiteLum);
  const contrastBlack = contrastRatio(lum, blackLum);

  const palette = generatePalette(color);

  const namedColor = CSS_NAMED_COLORS[color.toLowerCase()];

  const cssSnippet = `:root {
  --color-base: ${color.toUpperCase()};
  --color-rgb: ${rgbStr};
  --color-hsl: ${hslStr};
  --color-complementary: ${palette.complementary[0].toUpperCase()};
  --color-triadic-1: ${palette.triadic[0].toUpperCase()};
  --color-triadic-2: ${palette.triadic[1].toUpperCase()};
  --color-analogous-1: ${palette.analogous[0].toUpperCase()};
  --color-analogous-2: ${palette.analogous[1].toUpperCase()};
}`;

  const wcagBadge = (ratio: number, against: string) => {
    const aaLarge = ratio >= 3;
    const aa = ratio >= 4.5;
    const aaa = ratio >= 7;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: against === 'white' ? '#fff' : '#000', border: '1px solid #444', flexShrink: 0 }} />
        <Text style={{ color: textColor, fontSize: 13, minWidth: 60 }}>vs {against}: <strong>{ratio}:1</strong></Text>
        <Tag color={aa ? 'success' : 'error'} style={{ fontSize: 10 }}>AA {aa ? 'PASS' : 'FAIL'}</Tag>
        <Tag color={aaa ? 'success' : 'error'} style={{ fontSize: 10 }}>AAA {aaa ? 'PASS' : 'FAIL'}</Tag>
        <Tag color={aaLarge ? 'success' : 'error'} style={{ fontSize: 10 }}>AA Large {aaLarge ? 'PASS' : 'FAIL'}</Tag>
      </div>
    );
  };

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <Row gutter={[20, 20]}>
        {/* Left Column: Picker + Formats */}
        <Col xs={24} lg={10}>
          {/* Color Picker Card */}
          <Card
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 20 }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <BgColorsOutlined style={{ color: PRIMARY, fontSize: 18 }} />
              <Title level={5} style={{ color: heading, margin: 0 }}>Color Picker</Title>
              {namedColor && (
                <Tag color="green" style={{ marginLeft: 'auto', fontSize: 11 }}>{namedColor}</Tag>
              )}
            </div>

            {/* Large preview swatch */}
            <div
              style={{ width: '100%', height: 120, borderRadius: 12, background: color, border: `1px solid ${border}`, marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => inputRef.current?.click()}
            >
              <Text style={{ color: lum > 0.4 ? '#000' : '#fff', fontSize: 13, opacity: 0.7 }}>Click to pick</Text>
            </div>

            {/* Native color input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                ref={inputRef}
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{ width: 48, height: 48, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2, background: 'transparent' }}
              />
              <input
                type="text"
                value={color.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(val)) handleColorChange(val);
                  else if (/^[0-9a-fA-F]{6}$/.test(val)) handleColorChange('#' + val);
                }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${border}`,
                  background: isDark ? '#1a1a1a' : '#f5f5f5', color: textColor,
                  fontFamily: 'monospace', fontSize: 15, fontWeight: 700, outline: 'none',
                }}
              />
            </div>
          </Card>

          {/* Format Conversions Card */}
          <Card
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 20 }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ color: heading, margin: '0 0 16px' }}>Color Formats</Title>
            <CopyRow label="HEX" value={color.toUpperCase()} copyKey="hex" copied={copied} onCopy={copy} isDark={isDark} />
            <CopyRow label="RGB" value={rgbStr} copyKey="rgb" copied={copied} onCopy={copy} isDark={isDark} />
            <CopyRow label="HSL" value={hslStr} copyKey="hsl" copied={copied} onCopy={copy} isDark={isDark} />
            <CopyRow label="HSV" value={hsvStr} copyKey="hsv" copied={copied} onCopy={copy} isDark={isDark} />
            <CopyRow label="CMYK" value={cmykStr} copyKey="cmyk" copied={copied} onCopy={copy} isDark={isDark} />
          </Card>

          {/* Contrast Checker */}
          <Card
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 20 }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <EyeOutlined style={{ color: PRIMARY }} />
              <Title level={5} style={{ color: heading, margin: 0 }}>Contrast Checker (WCAG)</Title>
            </div>
            {wcagBadge(contrastWhite, 'white')}
            {wcagBadge(contrastBlack, 'black')}
            <Text style={{ color: '#666', fontSize: 11, display: 'block', marginTop: 8 }}>
              AA: 4.5:1 normal · 3:1 large text · AAA: 7:1 normal · 4.5:1 large
            </Text>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card
              style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <HistoryOutlined style={{ color: PRIMARY }} />
                <Title level={5} style={{ color: heading, margin: 0 }}>Color History</Title>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {history.map((h, i) => (
                  <Tooltip key={h + i} title={h.toUpperCase()}>
                    <ColorSwatch hex={h} size={36} onClick={() => handleColorChange(h)} />
                  </Tooltip>
                ))}
              </div>
            </Card>
          )}
        </Col>

        {/* Right Column: Palette + CSS */}
        <Col xs={24} lg={14}>
          {/* Palette Generator */}
          <Card
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 20 }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ color: heading, margin: '0 0 20px' }}>Palette Generator</Title>
            <PaletteRow label="Complementary" colors={palette.complementary} copied={copied} onCopy={copy} />
            <Divider style={{ borderColor: border, margin: '12px 0' }} />
            <PaletteRow label="Triadic" colors={palette.triadic} copied={copied} onCopy={copy} />
            <Divider style={{ borderColor: border, margin: '12px 0' }} />
            <PaletteRow label="Analogous" colors={palette.analogous} copied={copied} onCopy={copy} />
            <Divider style={{ borderColor: border, margin: '12px 0' }} />
            <PaletteRow label="Monochromatic (5 shades)" colors={palette.monochromatic} copied={copied} onCopy={copy} />
            <Divider style={{ borderColor: border, margin: '12px 0' }} />
            <PaletteRow label="Split-Complementary" colors={palette.splitComplementary} copied={copied} onCopy={copy} />
          </Card>

          {/* CSS Snippet */}
          <Card
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CodeOutlined style={{ color: PRIMARY }} />
                <Title level={5} style={{ color: heading, margin: 0 }}>CSS Variables</Title>
              </div>
              <Button
                size="small"
                icon={copied === 'css' ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => copy(cssSnippet, 'css')}
                style={{ borderColor: PRIMARY, color: PRIMARY }}
              >
                {copied === 'css' ? 'Copied!' : 'Copy CSS'}
              </Button>
            </div>
            <pre
              style={{
                background: isDark ? '#161616' : '#f8f8f8',
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '16px',
                fontSize: 12,
                fontFamily: 'monospace',
                color: textColor,
                overflow: 'auto',
                margin: 0,
                lineHeight: 1.8,
              }}
            >
              {cssSnippet}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
