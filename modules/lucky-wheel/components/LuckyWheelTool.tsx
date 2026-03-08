'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Modal } from 'antd';
import {
  EditOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';
import LuckyWheel from './LuckyWheel';

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';

const DEFAULT_NAMES = ['Tuấn', 'Hưng', 'Chánh', 'Cường', 'Thảo', 'Hoàng'];

function parseNames(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function LuckyWheelTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const panelBg = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const sectionHeaderColor = isDark ? '#e0e0e0' : '#111111';
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 200,
    resize: 'vertical',
    background: isDark ? '#141414' : '#f9fafb',
    color: isDark ? '#c9c9c9' : '#1a1a1a',
    border: `1px solid ${isDark ? '#333' : '#d9d9d9'}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    lineHeight: 1.7,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const metaTextColor = isDark ? '#888' : '#999';
  const readyTextColor = PRIMARY;
  const rightPanelBg = isDark ? '#1a1a1a' : '#f5f5f5';

  const [namesText, setNamesText] = useState(DEFAULT_NAMES.join('\n'));
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const names = parseNames(namesText);
  const validNames = names.filter((n) => n.length > 0);
  const canSpin = validNames.length >= 2 && !spinning;

  const handleShuffle = useCallback(() => {
    const arr = [...validNames];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setNamesText(arr.join('\n'));
    setWinner(null);
  }, [validNames]);

  const handleSort = useCallback(() => {
    const sorted = [...validNames].sort((a, b) =>
      a.localeCompare(b, 'vi', { sensitivity: 'base' })
    );
    setNamesText(sorted.join('\n'));
    setWinner(null);
  }, [validNames]);

  const handleSpin = useCallback(() => {
    if (!canSpin) return;
    setWinner(null);
    setSpinning(true);
  }, [canSpin]);

  const handleSpinEnd = useCallback((result: string) => {
    setSpinning(false);
    setWinner(result);
    setModalVisible(true);
  }, []);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canSpin) handleSpin();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canSpin, handleSpin]);

  const statusLine =
    validNames.length < 2
      ? `${validNames.length} mục (tối thiểu: 2, tối đa: 200)`
      : `${validNames.length} mục (tối thiểu: 2, tối đa: 200)`;

  const readyLine =
    validNames.length >= 2 ? 'Sẵn sàng quay!' : 'Cần ít nhất 2 tên để quay.';

  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        width: '100%',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          flex: '1 1 320px',
          minWidth: 280,
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          borderRadius: 12,
          padding: '20px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EditOutlined style={{ fontSize: 16, color: PRIMARY }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: sectionHeaderColor,
            }}
          >
            Nhập Tên
          </span>
        </div>

        {/* Textarea */}
        <div>
          <textarea
            ref={textareaRef}
            value={namesText}
            onChange={(e) => {
              setNamesText(e.target.value);
              setWinner(null);
            }}
            placeholder={'Tuấn\nHưng\nChánh\nCường\nThảo\nHoàng'}
            style={textareaStyle}
            maxLength={4000}
            spellCheck={false}
          />
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, color: metaTextColor }}>{statusLine}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: validNames.length >= 2 ? readyTextColor : '#e74c3c',
              }}
            >
              {readyLine}
            </span>
          </div>
        </div>

        {/* Shuffle + Sort row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleShuffle}
            disabled={spinning || validNames.length < 2}
            style={{ flex: 1 }}
          >
            Xáo Trộn
          </Button>
          <Button
            icon={<SortAscendingOutlined />}
            onClick={handleSort}
            disabled={spinning || validNames.length < 2}
            style={{ flex: 1 }}
          >
            Sắp Xếp A-Z
          </Button>
        </div>

        {/* Spin button */}
        <Button
          type="primary"
          size="large"
          icon={spinning ? <SyncOutlined spin /> : <PlayCircleOutlined />}
          onClick={handleSpin}
          disabled={!canSpin}
          style={{
            width: '100%',
            height: 48,
            fontSize: 16,
            fontWeight: 700,
            background: canSpin ? PRIMARY : undefined,
            borderColor: canSpin ? PRIMARY : undefined,
            color: canSpin ? '#fff' : undefined,
            letterSpacing: '0.02em',
          }}
        >
          {spinning ? 'Đang quay...' : 'Quay Vòng'}
        </Button>

        {/* Hint */}
        <p
          style={{
            fontSize: 12,
            color: metaTextColor,
            margin: 0,
            textAlign: 'center',
          }}
        >
          Nhấn <kbd
            style={{
              background: isDark ? '#2a2a2a' : '#f0f0f0',
              border: `1px solid ${isDark ? '#444' : '#ccc'}`,
              borderRadius: 4,
              padding: '1px 5px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: isDark ? '#aaa' : '#555',
            }}
          >Ctrl+Enter</kbd> (hoặc <kbd
            style={{
              background: isDark ? '#2a2a2a' : '#f0f0f0',
              border: `1px solid ${isDark ? '#444' : '#ccc'}`,
              borderRadius: 4,
              padding: '1px 5px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: isDark ? '#aaa' : '#555',
            }}
          >Cmd+Enter</kbd>) để quay
        </p>

        {/* Last winner inline display */}
        {winner && !modalVisible && (
          <div
            style={{
              background: PRIMARY_BG,
              border: `1px solid ${PRIMARY_BORDER}`,
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <TrophyOutlined style={{ fontSize: 20, color: PRIMARY, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 2 }}>
                NGƯỜI THẮNG CUỘC
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: PRIMARY }}>
                {winner}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          flex: '1 1 320px',
          minWidth: 280,
          background: rightPanelBg,
          border: `1px solid ${panelBorder}`,
          borderRadius: 12,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
        }}
      >
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
          <SyncOutlined style={{ fontSize: 16, color: PRIMARY }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: sectionHeaderColor,
            }}
          >
            Vòng Quay
          </span>
        </div>

        {/* Wheel */}
        <div style={{ width: '100%' }}>
          <LuckyWheel
            names={validNames.length >= 1 ? validNames : DEFAULT_NAMES}
            spinning={spinning}
            onSpinEnd={handleSpinEnd}
            currentAngle={wheelAngle}
            onAngleChange={setWheelAngle}
          />
        </div>
      </div>

      {/* ── Winner Modal ── */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="spin-again"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              setModalVisible(false);
              setWinner(null);
              handleSpin();
            }}
            disabled={!canSpin}
            style={{
              background: PRIMARY,
              borderColor: PRIMARY,
            }}
          >
            Quay lại
          </Button>,
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        centered
        width={400}
        styles={{
          content: {
            background: isDark ? '#1e1e1e' : '#ffffff',
            border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
            borderRadius: 16,
            padding: 0,
          },
          header: {
            background: 'transparent',
            borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`,
            padding: '16px 24px',
          },
          body: {
            padding: '28px 24px 20px',
          },
          footer: {
            background: 'transparent',
            borderTop: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`,
            padding: '12px 24px',
          },
        }}
        title={
          <span
            style={{
              color: sectionHeaderColor,
              fontWeight: 700,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TrophyOutlined style={{ color: PRIMARY }} />
            Kết quả
          </span>
        }
      >
        <div style={{ textAlign: 'center' }}>
          {/* Trophy icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: PRIMARY_BG,
              border: `2px solid ${PRIMARY_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <TrophyOutlined style={{ fontSize: 38, color: PRIMARY }} />
          </div>

          <p
            style={{
              fontSize: 13,
              color: isDark ? '#888' : '#999',
              margin: '0 0 8px',
              fontWeight: 500,
            }}
          >
            NGƯỜI THẮNG CUỘC
          </p>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: PRIMARY,
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            {winner}
          </div>
          <p
            style={{
              fontSize: 13,
              color: isDark ? '#666' : '#aaa',
              margin: 0,
            }}
          >
            Chúc mừng người thắng cuộc!
          </p>
        </div>
      </Modal>
    </div>
  );
}
