'use client';

import React, { useState, useCallback } from 'react';
import { DashboardOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type UnitSystem = 'metric' | 'imperial';

interface BmiCategory {
  label: string;
  range: string;
  color: string;
  description: string;
  min: number;
  max: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BMI_CATEGORIES: BmiCategory[] = [
  {
    label: 'Thiếu cân',
    range: 'BMI < 18.5',
    color: '#3b82f6',
    description: 'Cân nặng dưới mức bình thường. Nên tăng cường dinh dưỡng và tham khảo ý kiến bác sĩ.',
    min: 0,
    max: 18.5,
  },
  {
    label: 'Cân nặng hợp lý',
    range: 'BMI 18.5 – 24.9',
    color: '#50C878',
    description: 'Cân nặng trong phạm vi khỏe mạnh. Duy trì chế độ ăn cân bằng và luyện tập đều đặn.',
    min: 18.5,
    max: 25,
  },
  {
    label: 'Thừa cân',
    range: 'BMI 25 – 29.9',
    color: '#f59e0b',
    description: 'Cân nặng hơi cao. Tăng cường hoạt động thể chất và điều chỉnh chế độ ăn uống.',
    min: 25,
    max: 30,
  },
  {
    label: 'Béo phì',
    range: 'BMI ≥ 30',
    color: '#ef4444',
    description: 'Cân nặng vượt ngưỡng béo phì. Nên tham khảo chuyên gia y tế để có kế hoạch giảm cân phù hợp.',
    min: 30,
    max: Infinity,
  },
];

// BMI display range for the indicator bar
const BAR_MIN = 10;
const BAR_MAX = 40;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategory(bmi: number): BmiCategory {
  return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

function calcBmiMetric(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function calcBmiImperial(weightLb: number, heightFt: number, heightIn: number): number {
  const totalInches = heightFt * 12 + heightIn;
  return (703 * weightLb) / (totalInches * totalInches);
}

function bmiToBarPercent(bmi: number): number {
  const clamped = Math.min(Math.max(bmi, BAR_MIN), BAR_MAX);
  return ((clamped - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100;
}

function getAdvice(category: BmiCategory): string {
  switch (category.label) {
    case 'Thiếu cân':
      return 'Hãy bổ sung thêm các thực phẩm giàu protein, chất béo lành mạnh và carbohydrate phức hợp để tăng cân một cách khoa học.';
    case 'Cân nặng hợp lý':
      return 'Tuyệt vời! Hãy duy trì chế độ ăn uống lành mạnh và luyện tập thể dục ít nhất 150 phút mỗi tuần.';
    case 'Thừa cân':
      return 'Hãy tăng cường vận động hàng ngày và giảm tiêu thụ thực phẩm chế biến sẵn, đường và chất béo bão hòa.';
    case 'Béo phì':
      return 'Tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng để có kế hoạch giảm cân an toàn và hiệu quả.';
    default:
      return '';
  }
}

// ─── BMI Indicator Bar ────────────────────────────────────────────────────────

interface IndicatorBarProps {
  bmi: number;
  isDark: boolean;
}

function IndicatorBar({ bmi, isDark }: IndicatorBarProps) {
  const percent = bmiToBarPercent(bmi);
  // Zone widths as % of 10–40 range (30 units total)
  // Thiếu cân: 10–18.5 = 8.5 units
  // Hợp lý: 18.5–25 = 6.5 units
  // Thừa cân: 25–30 = 5 units
  // Béo phì: 30–40 = 10 units
  const total = BAR_MAX - BAR_MIN; // 30
  const zones = [
    { color: '#3b82f6', width: ((18.5 - BAR_MIN) / total) * 100 },
    { color: '#50C878', width: ((25 - 18.5) / total) * 100 },
    { color: '#f59e0b', width: ((30 - 25) / total) * 100 },
    { color: '#ef4444', width: ((BAR_MAX - 30) / total) * 100 },
  ];

  return (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      {/* Zone labels */}
      <div style={{ display: 'flex', marginBottom: 4 }}>
        {BMI_CATEGORIES.map((cat, i) => (
          <div
            key={i}
            style={{
              width: `${zones[i].width}%`,
              fontSize: 10,
              color: isDark ? '#666' : '#999',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </div>
        ))}
      </div>

      {/* Bar */}
      <div
        style={{
          position: 'relative',
          height: 14,
          borderRadius: 7,
          overflow: 'visible',
          display: 'flex',
        }}
      >
        {zones.map((zone, i) => (
          <div
            key={i}
            style={{
              width: `${zone.width}%`,
              background: zone.color,
              opacity: 0.8,
              borderRadius: i === 0 ? '7px 0 0 7px' : i === zones.length - 1 ? '0 7px 7px 0' : 0,
            }}
          />
        ))}

        {/* Marker */}
        <div
          style={{
            position: 'absolute',
            left: `${percent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#ffffff',
            border: `3px solid ${getCategory(bmi).color}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            zIndex: 2,
            transition: 'left 0.3s ease',
          }}
        />
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[10, 18.5, 25, 30, 40].map((v) => (
          <span key={v} style={{ fontSize: 10, color: isDark ? '#555' : '#bbb' }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BmiCalculatorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [unit, setUnit] = useState<UnitSystem>('metric');
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightLb, setWeightLb] = useState<string>('');
  const [heightFt, setHeightFt] = useState<string>('');
  const [heightIn, setHeightIn] = useState<string>('');

  // ─── theme tokens ───────────────────────────────────────────────────────────
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #272727' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#f9f9f9';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const sectionBg = isDark ? '#1a1a1a' : '#f5f5f5';

  // ─── Compute BMI ────────────────────────────────────────────────────────────
  const bmi = useCallback((): number | null => {
    if (unit === 'metric') {
      const w = parseFloat(weightKg);
      const h = parseFloat(heightCm);
      if (!w || !h || w <= 0 || h <= 0) return null;
      const result = calcBmiMetric(w, h);
      return isFinite(result) ? result : null;
    } else {
      const w = parseFloat(weightLb);
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (!w || w <= 0 || (ft === 0 && inc === 0)) return null;
      const result = calcBmiImperial(w, ft, inc);
      return isFinite(result) ? result : null;
    }
  }, [unit, weightKg, heightCm, weightLb, heightFt, heightIn]);

  const bmiValue = bmi();
  const category = bmiValue !== null ? getCategory(bmiValue) : null;
  const hasResult = bmiValue !== null && category !== null;

  const handleReset = () => {
    setWeightKg('');
    setHeightCm('');
    setWeightLb('');
    setHeightFt('');
    setHeightIn('');
  };

  // ─── Input style ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    color: textColor,
    outline: 'none',
    colorScheme: isDark ? 'dark' : 'light',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: subColor,
    marginBottom: 6,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  // ─── Unit toggle button style ───────────────────────────────────────────
  const unitBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '9px 12px',
    border: active ? `2px solid #50C878` : `1px solid ${inputBorder}`,
    borderRadius: 8,
    background: active
      ? isDark
        ? 'rgba(80,200,120,0.1)'
        : 'rgba(80,200,120,0.06)'
      : inputBg,
    color: active ? '#50C878' : subColor,
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.18s',
    textAlign: 'center',
  });

  return (
    <div style={{ width: '100%' }}>
      {/* ── Two-column layout ── */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginBottom: 28,
        }}
      >
        {/* ── Left panel: Inputs ── */}
        <div
          style={{
            flex: 1,
            minWidth: 280,
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '24px 24px 20px',
          }}
        >
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <DashboardOutlined style={{ fontSize: 18, color: '#50C878' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
              Thông số đo
            </span>
          </div>

          {/* Unit selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Hệ đo lường</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={unitBtnStyle(unit === 'metric')} onClick={() => setUnit('metric')}>
                Hệ mét (kg, cm)
              </button>
              <button style={unitBtnStyle(unit === 'imperial')} onClick={() => setUnit('imperial')}>
                Hệ Imperial (lb, ft, in)
              </button>
            </div>
          </div>

          {/* Weight input */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Cân nặng ({unit === 'metric' ? 'kg' : 'lb'})
            </label>
            {unit === 'metric' ? (
              <input
                type="number"
                min={1}
                max={500}
                placeholder="VD: 70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <input
                type="number"
                min={1}
                max={1100}
                placeholder="VD: 154"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                style={inputStyle}
              />
            )}
          </div>

          {/* Height input */}
          <div style={{ marginBottom: 24 }}>
            {unit === 'metric' ? (
              <>
                <label style={labelStyle}>Chiều cao (cm)</label>
                <input
                  type="number"
                  min={50}
                  max={300}
                  placeholder="VD: 170"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  style={inputStyle}
                />
              </>
            ) : (
              <>
                <label style={labelStyle}>Chiều cao (ft &amp; in)</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      min={0}
                      max={9}
                      placeholder="ft"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: subColor, marginTop: 3, display: 'block' }}>feet</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      placeholder="in"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: subColor, marginTop: 3, display: 'block' }}>inches</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '9px 0',
              background: 'transparent',
              border: `1px solid ${inputBorder}`,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: subColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#50C878';
              (e.currentTarget as HTMLButtonElement).style.color = '#50C878';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = inputBorder;
              (e.currentTarget as HTMLButtonElement).style.color = subColor;
            }}
          >
            <ReloadOutlined />
            Đặt lại
          </button>
        </div>

        {/* ── Right panel: Result ── */}
        <div
          style={{
            flex: 1,
            minWidth: 280,
            background: cardBg,
            border: cardBorder,
            borderRadius: 14,
            padding: '24px 24px 20px',
          }}
        >
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
              Kết quả BMI của bạn
            </span>
          </div>

          {!hasResult ? (
            /* Placeholder */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                color: subColor,
                textAlign: 'center',
                gap: 12,
              }}
            >
              <DashboardOutlined style={{ fontSize: 40, color: isDark ? '#333' : '#ccc' }} />
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                Nhập cân nặng và chiều cao để tính BMI.
              </p>
            </div>
          ) : (
            /* Result content */
            <div>
              {/* BMI value */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    color: category!.color,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-1px',
                  }}
                >
                  {bmiValue!.toFixed(1)}
                </div>

                {/* Category badge */}
                <div style={{ marginTop: 12 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 16px',
                      borderRadius: 20,
                      background: `${category!.color}22`,
                      border: `1.5px solid ${category!.color}55`,
                      color: category!.color,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {category!.label}
                  </span>
                </div>

                {/* Advice */}
                <p
                  style={{
                    margin: '14px 0 0',
                    fontSize: 13,
                    color: subColor,
                    lineHeight: 1.7,
                  }}
                >
                  {getAdvice(category!)}
                </p>
              </div>

              {/* Indicator bar */}
              <IndicatorBar bmi={bmiValue!} isDark={isDark} />
            </div>
          )}
        </div>
      </div>

      {/* ── BMI Categories section ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 14,
          padding: '24px 24px 16px',
        }}
      >
        <h2
          style={{
            margin: '0 0 18px',
            fontSize: 16,
            fontWeight: 700,
            color: textColor,
          }}
        >
          Các nhóm BMI
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {BMI_CATEGORIES.map((cat) => {
            const isActive = hasResult && category?.label === cat.label;

            return (
              <div
                key={cat.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                  background: isActive
                    ? isDark
                      ? `${cat.color}14`
                      : `${cat.color}0d`
                    : sectionBg,
                  borderRadius: 10,
                  border: isActive
                    ? `1px solid ${cat.color}44`
                    : isDark
                    ? '1px solid #272727'
                    : '1px solid #efefef',
                  borderLeft: isActive ? `4px solid ${cat.color}` : undefined,
                  transition: 'all 0.2s',
                }}
              >
                {/* Color dot */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? cat.color : textColor }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 12, color: subColor, marginTop: 2, lineHeight: 1.5 }}>
                    {cat.description}
                  </div>
                </div>

                {/* BMI range */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: cat.color,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {cat.range}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p
          style={{
            margin: '16px 0 0',
            fontSize: 11,
            color: isDark ? '#444' : '#bbb',
            lineHeight: 1.6,
          }}
        >
          * BMI là chỉ số tham khảo và không thay thế được đánh giá y tế chuyên nghiệp. Kết quả có thể không chính xác với vận động viên, phụ nữ mang thai hoặc người cao tuổi.
        </p>
      </div>
    </div>
  );
}
