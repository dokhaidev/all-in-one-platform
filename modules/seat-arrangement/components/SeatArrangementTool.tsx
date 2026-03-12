'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Select, Checkbox, Tooltip } from 'antd';
import {
  ReloadOutlined,
  ClearOutlined,
  PrinterOutlined,
  EditOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';
const STORAGE_KEY = 'toolhub_seats_v1';

const DEFAULT_NAMES = [
  'Nguyễn An',
  'Trần Bình',
  'Lê Châu',
  'Phạm Dũng',
  'Hoàng Em',
  'Đặng Fang',
  'Bùi Giang',
  'Vũ Hà',
  'Đỗ Inh',
  'Ngô Khánh',
  'Lý Lan',
  'Trịnh Mai',
];

type ColumnCount = 2 | 3 | 4;

interface SeatingState {
  namesText: string;
  columns: ColumnCount;
  allowEmpty: boolean;
  arranged: string[];
}

function parseNames(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadState(): Partial<SeatingState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveState(s: SeatingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export default function SeatArrangementTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme tokens
  const panelBg = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const rightPanelBg = isDark ? '#1a1a1a' : '#f5f5f5';
  const sectionHeaderColor = isDark ? '#e0e0e0' : '#111111';
  const metaTextColor = isDark ? '#888' : '#999';
  const textColor = isDark ? '#c9c9c9' : '#1a1a1a';
  const labelColor = isDark ? '#aaa' : '#555';
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 220,
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

  // State
  const [namesText, setNamesText] = useState(DEFAULT_NAMES.join('\n'));
  const [columns, setColumns] = useState<ColumnCount>(3);
  const [allowEmpty, setAllowEmpty] = useState(false);
  const [arranged, setArranged] = useState<string[]>([]);
  const [hasArranged, setHasArranged] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved.namesText !== undefined) setNamesText(saved.namesText);
    if (saved.columns !== undefined) setColumns(saved.columns as ColumnCount);
    if (saved.allowEmpty !== undefined) setAllowEmpty(saved.allowEmpty);
    if (saved.arranged !== undefined && saved.arranged.length > 0) {
      setArranged(saved.arranged);
      setHasArranged(true);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    saveState({ namesText, columns, allowEmpty, arranged });
  }, [namesText, columns, allowEmpty, arranged]);

  const names = parseNames(namesText);
  const studentCount = names.length;

  // Calculate grid dimensions
  const rowsPerColumn = studentCount > 0 ? Math.ceil(studentCount / columns) : 0;
  const totalSlots = rowsPerColumn * columns;

  const handleArrange = useCallback(() => {
    const shuffled = shuffle(names);
    // Pad to fill all slots with empty strings if needed
    const result: string[] = [...shuffled];
    while (result.length < totalSlots) {
      result.push('');
    }
    setArranged(result);
    setHasArranged(true);
  }, [names, totalSlots]);

  const handleReset = useCallback(() => {
    setArranged([]);
    setHasArranged(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Build the grid: columns × rows
  // arranged[col * rowsPerColumn + row] = student name at (col, row)
  const getSlot = (col: number, row: number): string => {
    if (!hasArranged || arranged.length === 0) return '';
    const idx = col * rowsPerColumn + row;
    return arranged[idx] ?? '';
  };

  // Desk style
  const deskStyle = (occupied: boolean, isEmpty: boolean): React.CSSProperties => ({
    width: 108,
    height: 52,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: occupied ? 600 : 400,
    textAlign: 'center',
    padding: '0 8px',
    boxSizing: 'border-box',
    border: isEmpty
      ? `1.5px dashed ${isDark ? '#444' : '#ccc'}`
      : `1px solid ${isDark ? '#333' : '#d9d9d9'}`,
    background: isEmpty
      ? 'transparent'
      : isDark
      ? '#222222'
      : '#ffffff',
    color: isEmpty
      ? isDark ? '#444' : '#ccc'
      : textColor,
    transition: 'all 0.2s',
    userSelect: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  const columnOptions = [
    { value: 2, label: '2 cột' },
    { value: 3, label: '3 cột' },
    { value: 4, label: '4 cột' },
  ];

  // Determine which slots to show:
  // If allowEmpty is false and there's a remainder, all slots shown (even blank ones)
  // If allowEmpty is true, the last slot(s) can be kept blank/hidden
  const visibleRows = rowsPerColumn;

  // Show empty slot or not
  const shouldShowSlot = (col: number, row: number): boolean => {
    const name = getSlot(col, row);
    if (name !== '') return true;
    // It's empty — check allowEmpty
    if (!allowEmpty) return true; // show dashed seat
    return false; // hide this slot (skip it)
  };

  return (
    <>
      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #seat-chart-printable,
          #seat-chart-printable * { visibility: visible !important; }
          #seat-chart-printable {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            background: #fff !important;
            padding: 24px !important;
          }
        }
      `}</style>

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
            flex: '1 1 300px',
            minWidth: 260,
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 12,
            padding: '20px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ fontSize: 16, color: PRIMARY }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
              Danh Sách Học Sinh
            </span>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              value={namesText}
              onChange={(e) => {
                setNamesText(e.target.value);
                setHasArranged(false);
                setArranged([]);
              }}
              placeholder={DEFAULT_NAMES.slice(0, 6).join('\n')}
              style={textareaStyle}
              maxLength={8000}
              spellCheck={false}
            />
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserOutlined style={{ fontSize: 12, color: PRIMARY }} />
              <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600 }}>
                {studentCount} học sinh
              </span>
              {studentCount === 0 && (
                <span style={{ fontSize: 12, color: '#e05555' }}>
                  — Nhập ít nhất 1 tên
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: isDark ? '#2a2a2a' : '#f0f0f0' }} />

          {/* Layout config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TableOutlined style={{ fontSize: 16, color: PRIMARY }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
                Cấu Hình Lớp
              </span>
            </div>

            {/* Columns selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: labelColor, fontWeight: 500 }}>
                Số cột bàn
              </span>
              <Select
                value={columns}
                onChange={(val) => {
                  setColumns(val as ColumnCount);
                  setHasArranged(false);
                  setArranged([]);
                }}
                options={columnOptions}
                style={{ width: '100%' }}
                size="middle"
              />
            </div>

            {/* Rows info */}
            <div
              style={{
                background: PRIMARY_BG,
                border: `1px solid ${PRIMARY_BORDER}`,
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: labelColor }}>Số hàng mỗi cột:</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>
                {studentCount > 0 ? rowsPerColumn : '—'}
              </span>
            </div>

            {/* Allow empty checkbox */}
            <Checkbox
              checked={allowEmpty}
              onChange={(e) => setAllowEmpty(e.target.checked)}
              style={{ color: textColor, fontSize: 13 }}
            >
              Để trống ghế cuối nếu lẻ
            </Checkbox>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: isDark ? '#2a2a2a' : '#f0f0f0' }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleArrange}
              disabled={studentCount === 0}
              style={{
                width: '100%',
                height: 48,
                fontSize: 15,
                fontWeight: 700,
                background: studentCount > 0 ? PRIMARY : undefined,
                borderColor: studentCount > 0 ? PRIMARY : undefined,
                color: studentCount > 0 ? '#fff' : undefined,
                letterSpacing: '0.02em',
              }}
            >
              Xếp Ngẫu Nhiên
            </Button>

            <div style={{ display: 'flex', gap: 10 }}>
              <Tooltip title="Xóa sơ đồ hiện tại">
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleReset}
                  disabled={!hasArranged}
                  style={{ flex: 1 }}
                >
                  Đặt lại
                </Button>
              </Tooltip>
              <Tooltip title="In sơ đồ chỗ ngồi">
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  disabled={!hasArranged}
                  style={{ flex: 1 }}
                >
                  In sơ đồ
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Hint */}
          <p style={{ fontSize: 12, color: metaTextColor, margin: 0, lineHeight: 1.6 }}>
            Nhập tên học sinh (mỗi dòng một tên), chọn số cột và nhấn{' '}
            <strong style={{ color: PRIMARY }}>Xếp Ngẫu Nhiên</strong> để tạo sơ đồ.
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          id="seat-chart-printable"
          style={{
            flex: '1 1 340px',
            minWidth: 300,
            background: rightPanelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 12,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            alignItems: 'center',
          }}
        >
          {/* Section header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
            }}
          >
            <TableOutlined style={{ fontSize: 16, color: PRIMARY }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
              Sơ Đồ Lớp Học
            </span>
          </div>

          {/* Blackboard */}
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: isDark ? '#1a3a2a' : '#2d6a4f',
              border: `2px solid ${isDark ? '#2a5a3a' : '#1b4332'}`,
              borderRadius: 8,
              padding: '10px 0',
              textAlign: 'center',
              color: '#d8f3dc',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Bảng
          </div>

          {/* Seating Grid */}
          {!hasArranged || studentCount === 0 ? (
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px dashed ${isDark ? '#333' : '#ddd'}`,
                borderRadius: 10,
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <TableOutlined style={{ fontSize: 36, color: isDark ? '#333' : '#ccc' }} />
              <span style={{ fontSize: 13, color: isDark ? '#444' : '#bbb', fontWeight: 500 }}>
                Nhấn &ldquo;Xếp Ngẫu Nhiên&rdquo; để tạo sơ đồ
              </span>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {/* Grid: columns displayed side by side */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                {Array.from({ length: columns }, (_, col) => (
                  <div
                    key={col}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    {/* Column label */}
                    <span
                      style={{
                        fontSize: 11,
                        color: metaTextColor,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Cột {col + 1}
                    </span>

                    {Array.from({ length: visibleRows }, (_, row) => {
                      const name = getSlot(col, row);
                      const isEmpty = name === '';
                      const shouldShow = shouldShowSlot(col, row);

                      if (!shouldShow) {
                        // Reserve space but render nothing visible
                        return (
                          <div
                            key={row}
                            style={{ width: 108, height: 52, flexShrink: 0 }}
                          />
                        );
                      }

                      return (
                        <div key={row} style={deskStyle(!isEmpty, isEmpty)}>
                          {isEmpty ? (
                            <span style={{ fontSize: 20, lineHeight: 1 }}>·</span>
                          ) : (
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                display: 'block',
                                textAlign: 'center',
                              }}
                            >
                              {name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher desk */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 140,
                height: 44,
                borderRadius: 8,
                background: PRIMARY_BG,
                border: `2px solid ${PRIMARY_BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: PRIMARY,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              Giáo viên
            </div>
            <span style={{ fontSize: 11, color: metaTextColor }}>Bàn giáo viên</span>
          </div>

          {/* Stats */}
          {hasArranged && studentCount > 0 && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'Học sinh', value: studentCount },
                { label: 'Cột', value: columns },
                { label: 'Hàng', value: rowsPerColumn },
                {
                  label: 'Ghế trống',
                  value: totalSlots - studentCount,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: isDark ? '#222' : '#fff',
                    border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
                    borderRadius: 8,
                    padding: '8px 16px',
                    textAlign: 'center',
                    minWidth: 72,
                  }}
                >
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, lineHeight: 1.2 }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: metaTextColor, marginTop: 2 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
