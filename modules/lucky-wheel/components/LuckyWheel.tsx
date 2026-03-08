'use client';

import React, { useRef, useEffect, useCallback } from 'react';

const SEGMENT_COLORS = [
  '#e74c3c',
  '#e67e22',
  '#f1c40f',
  '#2ecc71',
  '#1abc9c',
  '#3498db',
  '#9b59b6',
  '#e91e63',
  '#00bcd4',
  '#ff5722',
];

interface LuckyWheelProps {
  names: string[];
  spinning: boolean;
  onSpinEnd: (winner: string) => void;
  currentAngle: number;
  onAngleChange: (angle: number) => void;
}

function drawWheel(
  canvas: HTMLCanvasElement,
  names: string[],
  angle: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const segCount = names.length;
  const segAngle = (2 * Math.PI) / segCount;

  ctx.clearRect(0, 0, size, size);

  // Draw segments
  for (let i = 0; i < segCount; i++) {
    const startAngle = angle + i * segAngle;
    const endAngle = startAngle + segAngle;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Segment border
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw text along the slice
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + segAngle / 2);

    const textRadius = radius * 0.62;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Dynamic font size based on segment angle and segment count
    const maxFontSize = Math.max(10, Math.min(18, Math.floor(radius * segAngle * 0.38)));
    const fontSize = segCount <= 6 ? Math.min(maxFontSize, 16) : Math.min(maxFontSize, 13);
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    // Truncate long names
    let label = names[i];
    const maxWidth = radius * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;

    // Measure and truncate if needed
    while (ctx.measureText(label).width > maxWidth && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== names[i]) label = label.slice(0, -1) + '…';

    ctx.fillText(label, textRadius, 0);
    ctx.restore();
  }

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center circle
  const centerRadius = Math.max(14, radius * 0.1);
  ctx.beginPath();
  ctx.arc(cx, cy, centerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, centerRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw pointer on the RIGHT side (3 o'clock, pointing left)
  const pointerX = cx + radius + 8;
  const pointerY = cy;
  const pointerSize = Math.max(14, radius * 0.09);

  ctx.beginPath();
  ctx.moveTo(pointerX + pointerSize, pointerY);
  ctx.lineTo(pointerX - pointerSize * 0.4, pointerY - pointerSize * 0.65);
  ctx.lineTo(pointerX - pointerSize * 0.4, pointerY + pointerSize * 0.65);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export default function LuckyWheel({
  names,
  spinning,
  onSpinEnd,
  currentAngle,
  onAngleChange,
}: LuckyWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const spinStateRef = useRef<{
    startAngle: number;
    targetAngle: number;
    startTime: number;
    duration: number;
    names: string[];
  } | null>(null);

  // Resize canvas to container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const size = Math.min(container.clientWidth, container.clientHeight, 480);
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    drawWheel(canvas, names.length > 0 ? names : ['?'], currentAngle);
  }, [names, currentAngle]);

  // Observe container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    resizeCanvas();
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // Redraw when names or angle changes (not spinning)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spinning) return;
    drawWheel(canvas, names.length > 0 ? names : ['?'], currentAngle);
  }, [names, currentAngle, spinning]);

  // Easing: ease-out cubic
  function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // Start spin animation
  useEffect(() => {
    if (!spinning) return;
    if (names.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any previous animation
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const segCount = names.length;
    const segAngle = (2 * Math.PI) / segCount;

    // We want the pointer (at 0 rad = 3 o'clock) to point at the winning segment.
    // Pick a random winner index
    const winnerIndex = Math.floor(Math.random() * segCount);

    // The center of the winning segment should be at angle 0 (right/3 o'clock).
    // Segment i occupies [i*segAngle, (i+1)*segAngle] in wheel-local coords.
    // When the wheel is at angle `a`, segment i's center is at a + i*segAngle + segAngle/2.
    // We want: a + winnerIndex*segAngle + segAngle/2 ≡ 0 (mod 2π)
    // => a = -(winnerIndex*segAngle + segAngle/2)
    const targetLocalAngle = -(winnerIndex * segAngle + segAngle / 2);

    // Add random extra full rotations (5-10)
    const extraRotations = 5 + Math.floor(Math.random() * 6);
    const targetAngle = currentAngle + extraRotations * 2 * Math.PI +
      ((targetLocalAngle - currentAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const duration = 3000 + Math.random() * 2000; // 3-5 seconds
    const startTime = performance.now();
    const startAngle = currentAngle;

    spinStateRef.current = {
      startAngle,
      targetAngle,
      startTime,
      duration,
      names: [...names],
    };

    const animate = (now: number) => {
      const state = spinStateRef.current;
      if (!state) return;

      const elapsed = now - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);
      const eased = easeOut(progress);
      const angle = state.startAngle + (state.targetAngle - state.startAngle) * eased;

      drawWheel(canvas, state.names.length > 0 ? state.names : ['?'], angle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Normalize angle to [0, 2π)
        const finalAngle = angle % (2 * Math.PI);
        onAngleChange(finalAngle);
        spinStateRef.current = null;
        animRef.current = null;

        // Determine winner from final angle
        // At finalAngle, segment i center is at finalAngle + i*segAngle + segAngle/2
        // Winner is segment whose center is closest to 0 (mod 2π)
        let closestIndex = 0;
        let closestDist = Infinity;
        for (let i = 0; i < state.names.length; i++) {
          const segCenter = (finalAngle + i * segAngle + segAngle / 2) % (2 * Math.PI);
          // Distance from 0 (wrap around)
          const dist = Math.min(segCenter, 2 * Math.PI - segCenter);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
          }
        }
        onSpinEnd(state.names[closestIndex]);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '1 / 1',
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: '50%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}
      />
    </div>
  );
}
