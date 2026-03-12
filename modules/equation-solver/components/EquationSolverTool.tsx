'use client';

import React, { useState } from 'react';
import {
  Tabs,
  Button,
  InputNumber,
  Typography,
  Divider,
  Tag,
  Empty,
  Row,
  Col,
} from 'antd';
import {
  FunctionOutlined,
  CalculatorOutlined,
  HistoryOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text, Title } = Typography;

// ─── Constants ──────────────────────────────────────────────────────────────
const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';

// ─── Types ──────────────────────────────────────────────────────────────────
type SolutionType = 'unique' | 'infinite' | 'none' | 'two' | 'one' | 'complex';

interface Step {
  text: string;
  math?: string;
  highlight?: boolean;
  type?: 'normal' | 'result' | 'warning' | 'info';
}

interface Solution {
  type: SolutionType;
  steps: Step[];
  result?: string;
  x1?: number;
  x2?: number;
  x?: number;
  xVal?: number;
  yVal?: number;
}

interface HistoryEntry {
  id: number;
  kind: 'linear' | 'quadratic' | 'system';
  label: string;
  result: string;
  time: string;
}

// ─── Math Helpers ────────────────────────────────────────────────────────────
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

function toFraction(num: number, denom: number): string {
  if (denom === 0) return 'undefined';
  const sign = (num < 0) !== (denom < 0) ? '-' : '';
  const absNum = Math.abs(num);
  const absDenom = Math.abs(denom);
  const g = gcd(absNum, absDenom);
  const n = absNum / g;
  const d = absDenom / g;
  if (d === 1) return `${sign}${n}`;
  return `${sign}${n}/${d}`;
}

function formatNum(n: number): string {
  if (!isFinite(n)) return 'undefined';
  if (Number.isInteger(n)) return String(n);
  // Try fraction representation with small denominators
  for (let d = 2; d <= 100; d++) {
    const num = n * d;
    if (Math.abs(Math.round(num) - num) < 1e-9) {
      return toFraction(Math.round(num), d);
    }
  }
  return n.toFixed(4).replace(/\.?0+$/, '');
}

function formatCoeff(a: number, varName: string, first: boolean): string {
  if (a === 0) return '';
  if (a === 1) return first ? varName : ` + ${varName}`;
  if (a === -1) return first ? `-${varName}` : ` - ${varName}`;
  if (a > 0) return first ? `${a}${varName}` : ` + ${a}${varName}`;
  return first ? `${a}${varName}` : ` - ${Math.abs(a)}${varName}`;
}

function sqrt(n: number): string {
  if (n < 0) return `√(${n})`;
  const s = Math.sqrt(n);
  if (Number.isInteger(s)) return String(s);
  // Simplify √n = a√b
  for (let a = Math.floor(s); a >= 2; a--) {
    if (Number.isInteger(n / (a * a))) {
      const b = n / (a * a);
      if (b === 1) return String(a);
      return `${a}√${b}`;
    }
  }
  return `√${n}`;
}

// ─── Solver Functions ────────────────────────────────────────────────────────

// Linear: ax + b = cx + d  →  (a-c)x = (d-b)  →  x = (d-b)/(a-c)
function solveLinear(a: number, b: number, c: number, d: number): Solution {
  // ax + b = cx + d
  const A = a - c; // coefficient of x
  const B = d - b; // right-hand side

  const steps: Step[] = [];

  // Build original equation string
  const lhs = (() => {
    const xPart = formatCoeff(a, 'x', true);
    const cPart = b !== 0 ? (b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`) : '';
    return (xPart || '0') + cPart;
  })();
  const rhs = (() => {
    const xPart = formatCoeff(c, 'x', true);
    const cPart = d !== 0 ? (d > 0 ? ` + ${d}` : ` - ${Math.abs(d)}`) : '';
    return (xPart || '0') + cPart;
  })();

  steps.push({ text: 'Phương trình đã cho:', math: `${lhs} = ${rhs}` });

  // Move x-terms to left, constants to right
  if (c !== 0 || d !== 0) {
    const leftX = formatCoeff(A, 'x', true) || '0';
    const rightNum = B;
    steps.push({
      text: 'Chuyển vế — x về trái, hằng số về phải:',
      math: `${leftX} = ${rightNum}`,
    });
  }

  if (A === 0) {
    if (B === 0) {
      steps.push({
        text: 'Ta có 0 = 0 — đẳng thức luôn đúng.',
        type: 'info',
        math: '⇒ Phương trình có vô số nghiệm',
        highlight: true,
      });
      return { type: 'infinite', steps, result: 'Vô số nghiệm (∀x ∈ ℝ)' };
    } else {
      steps.push({
        text: `Ta có 0 = ${B} — mâu thuẫn.`,
        type: 'warning',
        math: '⇒ Phương trình vô nghiệm',
        highlight: true,
      });
      return { type: 'none', steps, result: 'Vô nghiệm' };
    }
  }

  const xNum = formatNum(B / A);
  steps.push({
    text: `Chia cả hai vế cho ${A}:`,
    math: `x = ${B} ÷ ${A} = ${xNum}`,
  });
  steps.push({
    text: 'Nghiệm của phương trình:',
    math: `x = ${xNum}`,
    highlight: true,
    type: 'result',
  });

  return { type: 'unique', steps, result: `x = ${xNum}`, x: B / A };
}

// Quadratic: ax² + bx + c = 0
function solveQuadratic(a: number, b: number, c: number): Solution {
  const steps: Step[] = [];

  const xSq = formatCoeff(a, 'x²', true);
  const xLin = formatCoeff(b, 'x', !xSq);
  const con = c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : '';
  const eq = (xSq || '') + (xLin || '') + con || '0';

  steps.push({ text: 'Phương trình đã cho:', math: `${eq} = 0` });

  if (a === 0) {
    steps.push({
      text: `Vì a = 0, đây là phương trình bậc 1. Giải: ${b}x + ${c} = 0`,
      type: 'warning',
    });
    return solveLinear(b, c, 0, 0);
  }

  const delta = b * b - 4 * a * c;
  steps.push({
    text: 'Tính biệt thức Δ:',
    math: `Δ = b² - 4ac = (${b})² - 4·(${a})·(${c}) = ${b * b} - ${4 * a * c} = ${delta}`,
  });

  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const sqrtStr = sqrt(delta);
    steps.push({
      text: `Δ = ${delta} > 0 → Phương trình có 2 nghiệm phân biệt.`,
      type: 'info',
      math: `√Δ = ${sqrtStr}`,
    });

    const x1 = (-b + sqrtDelta) / (2 * a);
    const x2 = (-b - sqrtDelta) / (2 * a);

    // Show fraction form
    const x1Num = -b + sqrtDelta;
    const x1Den = 2 * a;
    const x2Num = -b - sqrtDelta;

    steps.push({
      text: 'Nghiệm thứ nhất:',
      math: `x₁ = (-b + √Δ) / (2a) = (${-b} + ${sqrtStr}) / (${x1Den}) = ${formatNum(x1)}`,
    });
    steps.push({
      text: 'Nghiệm thứ hai:',
      math: `x₂ = (-b - √Δ) / (2a) = (${-b} - ${sqrtStr}) / (${x1Den}) = ${formatNum(x2)}`,
    });
    steps.push({
      text: 'Kết quả:',
      math: `x₁ = ${formatNum(x1)},  x₂ = ${formatNum(x2)}`,
      highlight: true,
      type: 'result',
    });

    return {
      type: 'two',
      steps,
      result: `x₁ = ${formatNum(x1)},  x₂ = ${formatNum(x2)}`,
      x1,
      x2,
    };
  } else if (delta === 0) {
    const x = -b / (2 * a);
    steps.push({
      text: `Δ = 0 → Phương trình có nghiệm kép.`,
      type: 'info',
    });
    steps.push({
      text: 'Nghiệm kép:',
      math: `x = -b / (2a) = ${-b} / ${2 * a} = ${formatNum(x)}`,
      highlight: true,
      type: 'result',
    });
    return { type: 'one', steps, result: `x = ${formatNum(x)} (nghiệm kép)`, x };
  } else {
    steps.push({
      text: `Δ = ${delta} < 0 → Phương trình vô nghiệm thực.`,
      type: 'warning',
      math: '⇒ Phương trình vô nghiệm trong ℝ',
      highlight: true,
    });
    const realPart = formatNum(-b / (2 * a));
    const imagPart = formatNum(Math.sqrt(-delta) / (2 * Math.abs(a)));
    steps.push({
      text: 'Nghiệm phức (mở rộng):',
      math: `x₁ = ${realPart} + ${imagPart}i,  x₂ = ${realPart} - ${imagPart}i`,
      type: 'info',
    });
    return { type: 'complex', steps, result: 'Vô nghiệm thực' };
  }
}

// System: a1x + b1y = c1 and a2x + b2y = c2
function solveSystem(
  a1: number, b1: number, c1: number,
  a2: number, b2: number, c2: number
): Solution {
  const steps: Step[] = [];

  const eq1 = `${formatCoeff(a1, 'x', true)}${formatCoeff(b1, 'y', !a1)} = ${c1}`;
  const eq2 = `${formatCoeff(a2, 'x', true)}${formatCoeff(b2, 'y', !a2)} = ${c2}`;

  steps.push({ text: 'Hệ phương trình:', math: `(1): ${eq1}` });
  steps.push({ text: '', math: `(2): ${eq2}` });

  // Cramer's rule: D = a1*b2 - a2*b1
  const D = a1 * b2 - a2 * b1;
  const Dx = c1 * b2 - c2 * b1;
  const Dy = a1 * c2 - a2 * c1;

  steps.push({
    text: 'Tính định thức D (quy tắc Cramer):',
    math: `D = a₁·b₂ - a₂·b₁ = (${a1})(${b2}) - (${a2})(${b1}) = ${a1 * b2} - ${a2 * b1} = ${D}`,
  });

  if (D === 0) {
    // Check consistency
    if (Dx === 0 && Dy === 0) {
      steps.push({
        text: 'D = 0 và Dₓ = Dᵧ = 0 → Hệ có vô số nghiệm.',
        type: 'info',
        math: '⇒ Hệ phương trình có vô số nghiệm',
        highlight: true,
      });
      return { type: 'infinite', steps, result: 'Vô số nghiệm' };
    } else {
      steps.push({
        text: `D = 0 nhưng Dₓ = ${Dx} ≠ 0 → Hệ vô nghiệm.`,
        type: 'warning',
        math: '⇒ Hệ phương trình vô nghiệm',
        highlight: true,
      });
      return { type: 'none', steps, result: 'Vô nghiệm' };
    }
  }

  // Elimination method explanation in steps
  steps.push({ text: 'Dùng phương pháp khử — nhân và trừ để loại x:' });
  steps.push({
    text: `Nhân (1) với ${a2}, nhân (2) với ${a1}:`,
    math: `(1'): ${a2}·(${eq1})  →  ${a1 * a2}x${formatCoeff(b1 * a2, 'y', false)} = ${c1 * a2}`,
  });
  steps.push({
    text: '',
    math: `(2'): ${a1}·(${eq2})  →  ${a1 * a2}x${formatCoeff(b2 * a1, 'y', false)} = ${c2 * a1}`,
  });

  const elimB = b1 * a2 - b2 * a1;
  const elimC = c1 * a2 - c2 * a1;
  steps.push({
    text: 'Lấy (1\') trừ (2\') để loại x:',
    math: `${formatCoeff(elimB, 'y', true)} = ${elimC}`,
  });

  const yVal = Dy / D;
  steps.push({
    text: 'Giải tìm y:',
    math: `y = ${elimC} ÷ ${elimB} = ${formatNum(yVal)}`,
  });

  // Substitute back
  const xVal = Dx / D;
  // Pick simpler equation to show substitution
  const subEq = a1 !== 0 ? `${a1}x = ${c1} - (${b1})(${formatNum(yVal)}) = ${formatNum(c1 - b1 * yVal)}` : `${a2}x = ${c2} - (${b2})(${formatNum(yVal)}) = ${formatNum(c2 - b2 * yVal)}`;
  steps.push({
    text: 'Thay y vào phương trình (1) để tìm x:',
    math: subEq,
  });
  steps.push({
    text: '',
    math: `x = ${formatNum(xVal)}`,
  });

  // Verify
  const check1 = Math.abs(a1 * xVal + b1 * yVal - c1) < 1e-9;
  const check2 = Math.abs(a2 * xVal + b2 * yVal - c2) < 1e-9;
  steps.push({
    text: 'Kiểm tra lại:',
    math: `(1): ${a1}·(${formatNum(xVal)}) + ${b1}·(${formatNum(yVal)}) = ${formatNum(a1 * xVal + b1 * yVal)} ${check1 ? '= ' + c1 + ' ✓' : '≠ ' + c1 + ' ✗'}`,
    type: check1 && check2 ? 'info' : 'warning',
  });
  steps.push({
    text: '',
    math: `(2): ${a2}·(${formatNum(xVal)}) + ${b2}·(${formatNum(yVal)}) = ${formatNum(a2 * xVal + b2 * yVal)} ${check2 ? '= ' + c2 + ' ✓' : '≠ ' + c2 + ' ✗'}`,
  });

  steps.push({
    text: 'Nghiệm của hệ:',
    math: `x = ${formatNum(xVal)},  y = ${formatNum(yVal)}`,
    highlight: true,
    type: 'result',
  });

  return {
    type: 'unique',
    steps,
    result: `x = ${formatNum(xVal)},  y = ${formatNum(yVal)}`,
    xVal,
    yVal,
  };
}

// ─── Step display component ──────────────────────────────────────────────────
function StepList({ steps, isDark }: { steps: Step[]; isDark: boolean }) {
  const textColor = isDark ? '#c9c9c9' : '#444';
  const mutedColor = isDark ? '#666' : '#aaa';
  const codeBg = isDark ? '#181818' : '#f5f5f5';
  const codeBorder = isDark ? '#2a2a2a' : '#e8e8e8';

  let stepNum = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((step, idx) => {
        const isLabeled = step.text !== '';
        if (isLabeled) stepNum++;

        const bgColor =
          step.highlight && step.type === 'result'
            ? PRIMARY_BG
            : step.type === 'warning'
            ? 'rgba(250,173,20,0.08)'
            : step.type === 'info'
            ? isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
            : 'transparent';

        const borderLeft =
          step.highlight && step.type === 'result'
            ? `3px solid ${PRIMARY}`
            : step.type === 'warning'
            ? '3px solid #faad14'
            : step.type === 'info'
            ? `3px solid ${isDark ? '#333' : '#ddd'}`
            : 'none';

        return (
          <div
            key={idx}
            style={{
              background: bgColor,
              borderLeft,
              borderRadius: step.highlight ? 8 : 4,
              padding: step.highlight ? '12px 16px' : '4px 8px',
              transition: 'all 0.15s',
            }}
          >
            {isLabeled && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: step.math ? 6 : 0,
                }}
              >
                {step.highlight ? (
                  step.type === 'result' ? (
                    <CheckCircleOutlined style={{ color: PRIMARY, fontSize: 14, marginTop: 2 }} />
                  ) : step.type === 'warning' ? (
                    <WarningOutlined style={{ color: '#faad14', fontSize: 14, marginTop: 2 }} />
                  ) : (
                    <InfoCircleOutlined style={{ color: isDark ? '#555' : '#aaa', fontSize: 14, marginTop: 2 }} />
                  )
                ) : (
                  <span
                    style={{
                      color: mutedColor,
                      fontSize: 11,
                      fontWeight: 700,
                      minWidth: 20,
                      paddingTop: 2,
                      flexShrink: 0,
                    }}
                  >
                    {stepNum}.
                  </span>
                )}
                <Text
                  style={{
                    color: step.type === 'result' ? PRIMARY : step.type === 'warning' ? '#faad14' : textColor,
                    fontSize: 13,
                    fontWeight: step.highlight ? 600 : 400,
                    lineHeight: 1.5,
                  }}
                >
                  {step.text}
                </Text>
              </div>
            )}

            {step.math && (
              <div
                style={{
                  background: step.highlight && step.type === 'result' ? 'transparent' : codeBg,
                  border: step.highlight && step.type === 'result' ? 'none' : `1px solid ${codeBorder}`,
                  borderRadius: 6,
                  padding: step.highlight && step.type === 'result' ? '4px 0 0' : '8px 14px',
                  marginLeft: isLabeled ? 28 : 0,
                  fontFamily: '"Courier New", Courier, monospace',
                  fontSize: step.highlight ? 16 : 14,
                  color: step.type === 'result' ? PRIMARY : step.type === 'warning' ? '#faad14' : textColor,
                  fontWeight: step.highlight ? 700 : 500,
                  letterSpacing: '0.01em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {step.math}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────
function HistoryPanel({
  entries,
  onClear,
  isDark,
}: {
  entries: HistoryEntry[];
  onClear: () => void;
  isDark: boolean;
}) {
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const mutedColor = isDark ? '#555' : '#bbb';
  const textColor = isDark ? '#c9c9c9' : '#444';

  const kindLabel: Record<string, string> = {
    linear: 'Bậc 1',
    quadratic: 'Bậc 2',
    system: 'Hệ PT',
  };
  const kindColor: Record<string, string> = {
    linear: 'blue',
    quadratic: 'purple',
    system: 'cyan',
  };

  if (entries.length === 0) {
    return (
      <Empty
        description={<span style={{ color: mutedColor }}>Chưa có lịch sử</span>}
        style={{ padding: '32px 0' }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: isDark ? '#aaa' : '#555', fontSize: 13, fontWeight: 600 }}>
          {entries.length} phép giải gần nhất
        </span>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={onClear}
          type="text"
        >
          Xóa tất cả
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e) => (
          <div
            key={e.id}
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Tag color={kindColor[e.kind]} style={{ flexShrink: 0, fontSize: 11 }}>
              {kindLabel[e.kind]}
            </Tag>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: textColor,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.label}
              </div>
              <div style={{ color: PRIMARY, fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                {e.result}
              </div>
            </div>
            <div style={{ color: mutedColor, fontSize: 11, flexShrink: 0 }}>{e.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Result Box ──────────────────────────────────────────────────────────────
function ResultBox({
  solution,
  isDark,
}: {
  solution: Solution | null;
  isDark: boolean;
}) {
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const mutedColor = isDark ? '#555' : '#bbb';

  if (!solution) {
    return (
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          gap: 12,
        }}
      >
        <FunctionOutlined style={{ fontSize: 36, color: mutedColor }} />
        <Text style={{ color: mutedColor, fontSize: 14 }}>
          Nhập hệ số và nhấn "Giải" để xem lời giải từng bước
        </Text>
      </div>
    );
  }

  const statusColor =
    solution.type === 'unique' || solution.type === 'two' || solution.type === 'one'
      ? PRIMARY
      : solution.type === 'infinite'
      ? '#52c41a'
      : solution.type === 'complex'
      ? '#722ed1'
      : '#ff7875';

  const statusLabel =
    solution.type === 'unique'
      ? 'Nghiệm duy nhất'
      : solution.type === 'two'
      ? 'Hai nghiệm phân biệt'
      : solution.type === 'one'
      ? 'Nghiệm kép'
      : solution.type === 'infinite'
      ? 'Vô số nghiệm'
      : solution.type === 'complex'
      ? 'Nghiệm phức'
      : 'Vô nghiệm';

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Status header */}
      <div
        style={{
          background: isDark ? '#181818' : '#fafafa',
          borderBottom: `1px solid ${cardBorder}`,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />
          <Text style={{ color: statusColor, fontWeight: 700, fontSize: 14 }}>
            {statusLabel}
          </Text>
        </div>
        <Tag
          style={{
            background: `${statusColor}15`,
            border: `1px solid ${statusColor}40`,
            color: statusColor,
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 700,
            padding: '3px 10px',
          }}
        >
          {solution.result}
        </Tag>
      </div>

      {/* Steps */}
      <div style={{ padding: '20px 20px 24px' }}>
        <div style={{ color: isDark ? '#888' : '#666', fontSize: 12, marginBottom: 14, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Các bước giải
        </div>
        <StepList steps={solution.steps} isDark={isDark} />
      </div>
    </div>
  );
}

// ─── Linear Tab ──────────────────────────────────────────────────────────────
function LinearTab({
  isDark,
  onSolve,
}: {
  isDark: boolean;
  onSolve: (entry: Omit<HistoryEntry, 'id'>) => void;
}) {
  const [a, setA] = useState<number>(2);
  const [b, setB] = useState<number>(6);
  const [c, setC] = useState<number>(0);
  const [d, setD] = useState<number>(0);
  const [solution, setSolution] = useState<Solution | null>(null);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const mutedColor = isDark ? '#555' : '#bbb';
  const labelColor = isDark ? '#aaa' : '#555';

  const handleSolve = () => {
    const sol = solveLinear(a, b, c, d);
    setSolution(sol);
    const label = `${a}x + ${b} = ${c}x + ${d}`;
    onSolve({ kind: 'linear', label, result: sol.result ?? '', time: new Date().toLocaleTimeString('vi-VN') });
  };

  const handleReset = () => {
    setA(2); setB(6); setC(0); setD(0); setSolution(null);
  };

  const inputStyle: React.CSSProperties = {
    width: 90,
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={10}>
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <Title level={5} style={{ color: isDark ? '#e0e0e0' : '#222', marginTop: 0, marginBottom: 20 }}>
            Nhập hệ số — dạng ax + b = cx + d
          </Title>

          {/* Visual equation builder */}
          <div
            style={{
              background: isDark ? '#141414' : '#f8f8f8',
              border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
              fontFamily: 'monospace',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
              color: isDark ? '#c9c9c9' : '#444',
            }}
          >
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{a ?? 0}</span>
            <span style={{ color: mutedColor }}>x</span>
            <span style={{ color: mutedColor }}>{(b ?? 0) >= 0 ? '+' : '-'}</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{Math.abs(b ?? 0)}</span>
            <span style={{ color: mutedColor, margin: '0 6px' }}>=</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{c ?? 0}</span>
            <span style={{ color: mutedColor }}>x</span>
            <span style={{ color: mutedColor }}>{(d ?? 0) >= 0 ? '+' : '-'}</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{Math.abs(d ?? 0)}</span>
          </div>

          {/* Input grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ color: labelColor, fontSize: 12, marginBottom: 6 }}>Hệ số a (của x bên trái)</div>
              <InputNumber
                value={a}
                onChange={(v) => setA(v ?? 0)}
                style={inputStyle}
                controls
              />
            </div>
            <div>
              <div style={{ color: labelColor, fontSize: 12, marginBottom: 6 }}>Hằng số b (bên trái)</div>
              <InputNumber
                value={b}
                onChange={(v) => setB(v ?? 0)}
                style={inputStyle}
                controls
              />
            </div>
            <div>
              <div style={{ color: labelColor, fontSize: 12, marginBottom: 6 }}>Hệ số c (của x bên phải)</div>
              <InputNumber
                value={c}
                onChange={(v) => setC(v ?? 0)}
                style={inputStyle}
                controls
              />
            </div>
            <div>
              <div style={{ color: labelColor, fontSize: 12, marginBottom: 6 }}>Hằng số d (bên phải)</div>
              <InputNumber
                value={d}
                onChange={(v) => setD(v ?? 0)}
                style={inputStyle}
                controls
              />
            </div>
          </div>

          <Divider style={{ borderColor: isDark ? '#2a2a2a' : '#eee', margin: '20px 0' }} />

          {/* Quick examples */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: mutedColor, fontSize: 12, marginBottom: 8 }}>Ví dụ nhanh:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: '3x + 6 = 0', a: 3, b: 6, c: 0, d: 0 },
                { label: '2x − 4 = x + 1', a: 2, b: -4, c: 1, d: 1 },
                { label: '5x = 15', a: 5, b: 0, c: 0, d: 15 },
                { label: '0x + 3 = 0 (VN)', a: 0, b: 3, c: 0, d: 0 },
              ].map((ex) => (
                <Button
                  key={ex.label}
                  size="small"
                  onClick={() => { setA(ex.a); setB(ex.b); setC(ex.c); setD(ex.d); setSolution(null); }}
                  style={{ fontSize: 11 }}
                >
                  {ex.label}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleSolve}
              style={{ background: PRIMARY, borderColor: PRIMARY, flex: 1, height: 44, fontWeight: 700 }}
            >
              Giải
            </Button>
            <Button onClick={handleReset} style={{ height: 44 }}>
              Reset
            </Button>
          </div>
        </div>
      </Col>

      <Col xs={24} lg={14}>
        <ResultBox solution={solution} isDark={isDark} />
      </Col>
    </Row>
  );
}

// ─── Quadratic Tab ───────────────────────────────────────────────────────────
function QuadraticTab({
  isDark,
  onSolve,
}: {
  isDark: boolean;
  onSolve: (entry: Omit<HistoryEntry, 'id'>) => void;
}) {
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(-5);
  const [c, setC] = useState<number>(6);
  const [solution, setSolution] = useState<Solution | null>(null);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const mutedColor = isDark ? '#555' : '#bbb';
  const labelColor = isDark ? '#aaa' : '#555';

  const handleSolve = () => {
    const sol = solveQuadratic(a, b, c);
    setSolution(sol);
    const label = `${a}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = 0`;
    onSolve({ kind: 'quadratic', label, result: sol.result ?? '', time: new Date().toLocaleTimeString('vi-VN') });
  };

  const handleReset = () => { setA(1); setB(-5); setC(6); setSolution(null); };

  const delta = b * b - 4 * a * c;
  const deltaColor =
    a === 0 ? mutedColor :
    delta > 0 ? PRIMARY :
    delta === 0 ? '#faad14' :
    '#ff7875';
  const deltaLabel =
    a === 0 ? 'a = 0' :
    delta > 0 ? '2 nghiệm phân biệt' :
    delta === 0 ? 'Nghiệm kép' :
    'Vô nghiệm thực';

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={10}>
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <Title level={5} style={{ color: isDark ? '#e0e0e0' : '#222', marginTop: 0, marginBottom: 20 }}>
            Nhập hệ số — dạng ax² + bx + c = 0
          </Title>

          {/* Visual equation */}
          <div
            style={{
              background: isDark ? '#141414' : '#f8f8f8',
              border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 16,
              fontFamily: 'monospace',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
              color: isDark ? '#c9c9c9' : '#444',
            }}
          >
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{a ?? 0}</span>
            <span style={{ color: mutedColor }}>x²</span>
            <span style={{ color: mutedColor }}>{(b ?? 0) >= 0 ? '+' : '-'}</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{Math.abs(b ?? 0)}</span>
            <span style={{ color: mutedColor }}>x</span>
            <span style={{ color: mutedColor }}>{(c ?? 0) >= 0 ? '+' : '-'}</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>{Math.abs(c ?? 0)}</span>
            <span style={{ color: mutedColor, margin: '0 4px' }}>=</span>
            <span style={{ color: mutedColor }}>0</span>
          </div>

          {/* Delta preview */}
          {a !== 0 && (
            <div
              style={{
                background: `${deltaColor}12`,
                border: `1px solid ${deltaColor}35`,
                borderRadius: 8,
                padding: '8px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ color: deltaColor, fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>
                Δ = {delta}
              </span>
              <span style={{ color: deltaColor, fontSize: 12 }}>→ {deltaLabel}</span>
            </div>
          )}

          {/* Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'a (x²)', value: a, set: setA },
              { label: 'b (x)', value: b, set: setB },
              { label: 'c (hằng số)', value: c, set: setC },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <div style={{ color: labelColor, fontSize: 11, marginBottom: 6 }}>{label}</div>
                <InputNumber
                  value={value}
                  onChange={(v) => set(v ?? 0)}
                  style={{ width: '100%' }}
                  controls
                />
              </div>
            ))}
          </div>

          <Divider style={{ borderColor: isDark ? '#2a2a2a' : '#eee', margin: '16px 0' }} />

          {/* Quick examples */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: mutedColor, fontSize: 12, marginBottom: 8 }}>Ví dụ nhanh:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: 'x²−5x+6=0 (Δ>0)', a: 1, b: -5, c: 6 },
                { label: 'x²−4x+4=0 (Δ=0)', a: 1, b: -4, c: 4 },
                { label: 'x²+x+1=0 (Δ<0)', a: 1, b: 1, c: 1 },
                { label: '2x²−8=0', a: 2, b: 0, c: -8 },
              ].map((ex) => (
                <Button
                  key={ex.label}
                  size="small"
                  onClick={() => { setA(ex.a); setB(ex.b); setC(ex.c); setSolution(null); }}
                  style={{ fontSize: 11 }}
                >
                  {ex.label}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleSolve}
              style={{ background: PRIMARY, borderColor: PRIMARY, flex: 1, height: 44, fontWeight: 700 }}
            >
              Giải
            </Button>
            <Button onClick={handleReset} style={{ height: 44 }}>Reset</Button>
          </div>
        </div>
      </Col>

      <Col xs={24} lg={14}>
        <ResultBox solution={solution} isDark={isDark} />
      </Col>
    </Row>
  );
}

// ─── System Tab ──────────────────────────────────────────────────────────────
function SystemTab({
  isDark,
  onSolve,
}: {
  isDark: boolean;
  onSolve: (entry: Omit<HistoryEntry, 'id'>) => void;
}) {
  const [a1, setA1] = useState<number>(2);
  const [b1, setB1] = useState<number>(3);
  const [c1, setC1] = useState<number>(12);
  const [a2, setA2] = useState<number>(4);
  const [b2, setB2] = useState<number>(-1);
  const [c2, setC2] = useState<number>(5);
  const [solution, setSolution] = useState<Solution | null>(null);

  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e8';
  const mutedColor = isDark ? '#555' : '#bbb';
  const labelColor = isDark ? '#aaa' : '#555';
  const eqBg = isDark ? '#141414' : '#f8f8f8';

  const handleSolve = () => {
    const sol = solveSystem(a1, b1, c1, a2, b2, c2);
    setSolution(sol);
    const label = `${a1}x+${b1}y=${c1}, ${a2}x+${b2}y=${c2}`;
    onSolve({ kind: 'system', label, result: sol.result ?? '', time: new Date().toLocaleTimeString('vi-VN') });
  };

  const handleReset = () => {
    setA1(2); setB1(3); setC1(12); setA2(4); setB2(-1); setC2(5); setSolution(null);
  };

  const inputW: React.CSSProperties = { width: 80 };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={11}>
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <Title level={5} style={{ color: isDark ? '#e0e0e0' : '#222', marginTop: 0, marginBottom: 20 }}>
            Nhập hệ số — hệ 2 phương trình 2 ẩn
          </Title>

          {/* Visual system */}
          <div
            style={{
              background: eqBg,
              border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
              borderRadius: 10,
              padding: '14px 20px',
              marginBottom: 20,
              fontFamily: 'monospace',
              fontSize: 16,
            }}
          >
            {[
              { a: a1, b: b1, c: c1, label: '①' },
              { a: a2, b: b2, c: c2, label: '②' },
            ].map((eq, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i === 0 ? 8 : 0 }}>
                <span style={{ color: mutedColor, fontSize: 12, minWidth: 16 }}>{eq.label}</span>
                <span style={{ color: PRIMARY, fontWeight: 700 }}>{eq.a ?? 0}</span>
                <span style={{ color: mutedColor }}>x</span>
                <span style={{ color: mutedColor }}>{(eq.b ?? 0) >= 0 ? '+' : '-'}</span>
                <span style={{ color: PRIMARY, fontWeight: 700 }}>{Math.abs(eq.b ?? 0)}</span>
                <span style={{ color: mutedColor }}>y</span>
                <span style={{ color: mutedColor, margin: '0 4px' }}>=</span>
                <span style={{ color: isDark ? '#e0e0e0' : '#222', fontWeight: 700 }}>{eq.c ?? 0}</span>
              </div>
            ))}
          </div>

          {/* Equation 1 */}
          <div
            style={{
              background: isDark ? '#1a1a1a' : '#f9f9f9',
              border: `1px solid ${isDark ? '#2a2a2a' : '#eee'}`,
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 12,
            }}
          >
            <div style={{ color: PRIMARY, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              Phương trình (1): a₁x + b₁y = c₁
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                { label: 'a₁', value: a1, set: setA1 },
                { label: 'b₁', value: b1, set: setB1 },
                { label: 'c₁', value: c1, set: setC1 },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <div style={{ color: labelColor, fontSize: 11, marginBottom: 4 }}>{label}</div>
                  <InputNumber value={value} onChange={(v) => set(v ?? 0)} style={inputW} controls />
                </div>
              ))}
            </div>
          </div>

          {/* Equation 2 */}
          <div
            style={{
              background: isDark ? '#1a1a1a' : '#f9f9f9',
              border: `1px solid ${isDark ? '#2a2a2a' : '#eee'}`,
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ color: '#52c41a', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              Phương trình (2): a₂x + b₂y = c₂
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                { label: 'a₂', value: a2, set: setA2 },
                { label: 'b₂', value: b2, set: setB2 },
                { label: 'c₂', value: c2, set: setC2 },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <div style={{ color: labelColor, fontSize: 11, marginBottom: 4 }}>{label}</div>
                  <InputNumber value={value} onChange={(v) => set(v ?? 0)} style={inputW} controls />
                </div>
              ))}
            </div>
          </div>

          {/* Quick examples */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: mutedColor, fontSize: 12, marginBottom: 8 }}>Ví dụ nhanh:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: 'Nghiệm duy nhất', a1: 2, b1: 3, c1: 12, a2: 4, b2: -1, c2: 5 },
                { label: 'Vô nghiệm', a1: 2, b1: 4, c1: 6, a2: 1, b2: 2, c2: 5 },
                { label: 'Vô số nghiệm', a1: 1, b1: 2, c1: 3, a2: 2, b2: 4, c2: 6 },
              ].map((ex) => (
                <Button
                  key={ex.label}
                  size="small"
                  onClick={() => {
                    setA1(ex.a1); setB1(ex.b1); setC1(ex.c1);
                    setA2(ex.a2); setB2(ex.b2); setC2(ex.c2);
                    setSolution(null);
                  }}
                  style={{ fontSize: 11 }}
                >
                  {ex.label}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleSolve}
              style={{ background: PRIMARY, borderColor: PRIMARY, flex: 1, height: 44, fontWeight: 700 }}
            >
              Giải
            </Button>
            <Button onClick={handleReset} style={{ height: 44 }}>Reset</Button>
          </div>
        </div>
      </Col>

      <Col xs={24} lg={13}>
        <ResultBox solution={solution} isDark={isDark} />
      </Col>
    </Row>
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────
let historyId = 0;

export default function EquationSolverTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleSolve = (entry: Omit<HistoryEntry, 'id'>) => {
    setHistory((prev) => [{ ...entry, id: ++historyId }, ...prev].slice(0, 10));
  };

  const tabItems = [
    {
      key: 'linear',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FunctionOutlined />
          Bậc 1
        </span>
      ),
      children: <LinearTab isDark={isDark} onSolve={handleSolve} />,
    },
    {
      key: 'quadratic',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FunctionOutlined />
          Bậc 2
        </span>
      ),
      children: <QuadraticTab isDark={isDark} onSolve={handleSolve} />,
    },
    {
      key: 'system',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalculatorOutlined />
          Hệ phương trình
        </span>
      ),
      children: <SystemTab isDark={isDark} onSolve={handleSolve} />,
    },
    {
      key: 'history',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HistoryOutlined />
          Lịch sử
          {history.length > 0 && (
            <span
              style={{
                background: PRIMARY,
                color: '#fff',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                marginLeft: 2,
              }}
            >
              {history.length}
            </span>
          )}
        </span>
      ),
      children: (
        <HistoryPanel
          entries={history}
          onClear={() => setHistory([])}
          isDark={isDark}
        />
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Tabs
        defaultActiveKey="linear"
        items={tabItems}
        size="large"
        style={{ width: '100%' }}
        tabBarStyle={{ marginBottom: 24 }}
      />
    </div>
  );
}
