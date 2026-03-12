'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Input,
  InputNumber,
  Button,
  Table,
  Select,
  message,
  Tag,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  SaveOutlined,
  TrophyOutlined,
  UserAddOutlined,
  CalculatorOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Criterion {
  id: string;
  name: string;
  maxPoints: number;
  description: string;
  descriptionOpen: boolean;
}

interface Student {
  id: string;
  name: string;
  scores: Record<string, number>; // criterionId -> score
}

interface GradeThreshold {
  label: string;
  min: number;
  color: string;
}

type ScaleType = '10' | '100' | 'custom';

interface RubricData {
  title: string;
  criteria: Criterion[];
  students: Student[];
  scaleType: ScaleType;
  customMax: number;
  gradeThresholds: GradeThreshold[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'toolhub_rubric_v1';
const PRIMARY = '#50C878';

const DEFAULT_THRESHOLDS: GradeThreshold[] = [
  { label: 'Giỏi', min: 8, color: '#50C878' },
  { label: 'Khá', min: 6.5, color: '#1890ff' },
  { label: 'TB', min: 5, color: '#faad14' },
  { label: 'Yếu', min: 0, color: '#ff4d4f' },
];

const DEFAULT_CRITERIA: Criterion[] = [
  { id: 'c1', name: 'Nội dung', maxPoints: 4, description: '', descriptionOpen: false },
  { id: 'c2', name: 'Trình bày', maxPoints: 3, description: '', descriptionOpen: false },
  { id: 'c3', name: 'Ngôn ngữ', maxPoints: 3, description: '', descriptionOpen: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function calcTotal(student: Student, criteria: Criterion[]): number {
  return criteria.reduce((sum, c) => sum + (student.scores[c.id] ?? 0), 0);
}

function calcMaxTotal(criteria: Criterion[]): number {
  return criteria.reduce((sum, c) => sum + c.maxPoints, 0);
}

function getGrade(total: number, maxTotal: number, thresholds: GradeThreshold[], scaleType: ScaleType, customMax: number): string {
  const scale = scaleType === '10' ? 10 : scaleType === '100' ? 100 : customMax;
  const normalised = maxTotal > 0 ? (total / maxTotal) * scale : 0;
  const sorted = [...thresholds].sort((a, b) => b.min - a.min);
  for (const t of sorted) {
    if (normalised >= t.min) return t.label;
  }
  return sorted[sorted.length - 1]?.label ?? 'Yếu';
}

function getGradeColor(grade: string, thresholds: GradeThreshold[]): string {
  return thresholds.find((t) => t.label === grade)?.color ?? '#aaa';
}

function calcPercentage(total: number, maxTotal: number): string {
  if (maxTotal === 0) return '0%';
  return ((total / maxTotal) * 100).toFixed(1) + '%';
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportExcel(title: string, criteria: Criterion[], students: Student[], thresholds: GradeThreshold[], scaleType: ScaleType, customMax: number) {
  const maxTotal = calcMaxTotal(criteria);
  const rows = [...students]
    .map((s) => ({ ...s, total: calcTotal(s, criteria) }))
    .sort((a, b) => b.total - a.total);

  const criteriaHeaders = criteria.map((c) => `<Cell ss:StyleID="th"><Data ss:Type="String">${c.name} (/${c.maxPoints})</Data></Cell>`).join('');
  const dataRows = rows
    .map(
      (s) =>
        `<Row>
          <Cell><Data ss:Type="String">${s.name}</Data></Cell>
          ${criteria.map((c) => `<Cell><Data ss:Type="Number">${s.scores[c.id] ?? 0}</Data></Cell>`).join('')}
          <Cell><Data ss:Type="Number">${s.total}</Data></Cell>
          <Cell><Data ss:Type="String">${getGrade(s.total, maxTotal, thresholds, scaleType, customMax)}</Data></Cell>
          <Cell><Data ss:Type="String">${calcPercentage(s.total, maxTotal)}</Data></Cell>
        </Row>`
    )
    .join('');

  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="th">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#D9EAD3" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Kết quả">
    <Table>
      <Row>
        <Cell ss:MergeAcross="${2 + criteria.length}" ss:StyleID="th">
          <Data ss:Type="String">${title}</Data>
        </Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="th"><Data ss:Type="String">Học sinh</Data></Cell>
        ${criteriaHeaders}
        <Cell ss:StyleID="th"><Data ss:Type="String">Tổng (/${maxTotal})</Data></Cell>
        <Cell ss:StyleID="th"><Data ss:Type="String">Xếp loại</Data></Cell>
        <Cell ss:StyleID="th"><Data ss:Type="String">Phần trăm</Data></Cell>
      </Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'rubric'}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  isDark,
  extra,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isDark: boolean;
  extra?: React.ReactNode;
}) {
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #2a2a2a' : '1px solid #e8e8e8';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const dividerColor = isDark ? '#2a2a2a' : '#f0f0f0';

  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${dividerColor}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: PRIMARY, fontSize: 18 }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: textColor }}>{title}</span>
        </div>
        {extra && <div>{extra}</div>}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RubricBuilderTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const subColor = isDark ? '#888' : '#777';
  const inputBg = isDark ? '#141414' : '#fafafa';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const rowBg = isDark ? '#252525' : '#fafafa';
  const rowBorder = isDark ? '#2e2e2e' : '#ebebeb';
  const descBg = isDark ? '#1a1a1a' : '#f5f5f5';

  // ── State ─────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('Phiếu đánh giá thuyết trình');
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [students, setStudents] = useState<Student[]>([]);
  const [scaleType, setScaleType] = useState<ScaleType>('10');
  const [customMax, setCustomMax] = useState<number>(20);
  const [thresholds, setThresholds] = useState<GradeThreshold[]>(DEFAULT_THRESHOLDS);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: RubricData = JSON.parse(saved);
        setTitle(data.title ?? '');
        setCriteria(data.criteria ?? DEFAULT_CRITERIA);
        setStudents(data.students ?? []);
        setScaleType(data.scaleType ?? '10');
        setCustomMax(data.customMax ?? 20);
        setThresholds(data.gradeThresholds ?? DEFAULT_THRESHOLDS);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveData = useCallback(() => {
    const data: RubricData = { title, criteria, students, scaleType, customMax, gradeThresholds: thresholds };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    messageApi.success('Đã lưu dữ liệu!');
  }, [title, criteria, students, scaleType, customMax, thresholds, messageApi]);

  // ── Criteria helpers ──────────────────────────────────────────────────────
  const addCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      { id: uid(), name: '', maxPoints: 5, description: '', descriptionOpen: false },
    ]);
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: unknown) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const deleteCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    setStudents((prev) =>
      prev.map((s) => {
        const { [id]: _removed, ...rest } = s.scores;
        return { ...s, scores: rest };
      })
    );
  };

  const toggleDesc = (id: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, descriptionOpen: !c.descriptionOpen } : c))
    );
  };

  const maxTotal = calcMaxTotal(criteria);

  // ── Student helpers ───────────────────────────────────────────────────────
  const addStudent = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStudents((prev) => [...prev, { id: uid(), name: trimmed, scores: {} }]);
    setStudentNameInput('');
  };

  const addPastedStudents = () => {
    const names = pasteInput
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    setStudents((prev) => [
      ...prev,
      ...names.map((name) => ({ id: uid(), name, scores: {} })),
    ]);
    setPasteInput('');
    setShowPasteArea(false);
    messageApi.success(`Đã thêm ${names.length} học sinh!`);
  };

  const updateScore = (studentId: string, criterionId: string, value: number | null) => {
    const criterion = criteria.find((c) => c.id === criterionId);
    const max = criterion?.maxPoints ?? 0;
    const clamped = Math.max(0, Math.min(max, value ?? 0));
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, scores: { ...s.scores, [criterionId]: clamped } } : s
      )
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStudentName = (id: string, name: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  // ── Computed results ──────────────────────────────────────────────────────
  const studentsWithTotals = students.map((s) => ({
    ...s,
    total: calcTotal(s, criteria),
  }));
  const sorted = [...studentsWithTotals].sort((a, b) => b.total - a.total);
  const topScore = sorted[0]?.total ?? -1;
  const avgScore =
    students.length > 0
      ? studentsWithTotals.reduce((sum, s) => sum + s.total, 0) / students.length
      : 0;
  const highestScore = sorted[0]?.total ?? 0;
  const lowestScore = sorted[sorted.length - 1]?.total ?? 0;

  // ── Table columns ─────────────────────────────────────────────────────────
  const tableColumns = [
    {
      title: '#',
      key: 'rank',
      width: 44,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ color: subColor, fontSize: 12 }}>{index + 1}</span>
      ),
    },
    {
      title: 'Học sinh',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: (typeof sorted)[0]) => (
        <span style={{ fontWeight: record.total === topScore && topScore > 0 ? 700 : 400, color: record.total === topScore && topScore > 0 ? PRIMARY : textColor }}>
          {record.total === topScore && topScore > 0 && students.length > 1 && (
            <TrophyOutlined style={{ color: '#faad14', marginRight: 6 }} />
          )}
          {name}
        </span>
      ),
    },
    ...criteria.map((c) => ({
      title: (
        <Tooltip title={`Tối đa: ${c.maxPoints} điểm${c.description ? ' — ' + c.description : ''}`}>
          <span style={{ fontSize: 12 }}>{c.name || '(chưa đặt tên)'}</span>
        </Tooltip>
      ),
      key: c.id,
      width: 90,
      render: (_: unknown, record: (typeof sorted)[0]) => (
        <span style={{ color: textColor }}>{record.scores[c.id] ?? 0}</span>
      ),
    })),
    {
      title: `Tổng (/${maxTotal})`,
      key: 'total',
      width: 100,
      render: (_: unknown, record: (typeof sorted)[0]) => (
        <span style={{ fontWeight: 700, color: record.total === topScore && topScore > 0 ? PRIMARY : textColor }}>
          {record.total}
        </span>
      ),
    },
    {
      title: 'Xếp loại',
      key: 'grade',
      width: 90,
      render: (_: unknown, record: (typeof sorted)[0]) => {
        const grade = getGrade(record.total, maxTotal, thresholds, scaleType, customMax);
        return <Tag color={getGradeColor(grade, thresholds)}>{grade}</Tag>;
      },
    },
    {
      title: '%',
      key: 'pct',
      width: 72,
      render: (_: unknown, record: (typeof sorted)[0]) => (
        <span style={{ color: subColor, fontSize: 13 }}>{calcPercentage(record.total, maxTotal)}</span>
      ),
    },
  ];

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: inputBg,
    borderColor: inputBorder,
    color: textColor,
  };

  return (
    <div style={{ width: '100%' }}>
      {contextHolder}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #rubric-print-area, #rubric-print-area * { visibility: visible !important; }
          #rubric-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; }
        }
      `}</style>

      {/* ── Printable area ── */}
      <div id="rubric-print-area">

        {/* ── SECTION 1: Rubric Setup ── */}
        <Section title="Thiết lập phiếu đánh giá" icon={<EditOutlined />} isDark={isDark}
          extra={
            <Button icon={<SaveOutlined />} size="small" onClick={saveData}
              style={{ borderColor: PRIMARY, color: PRIMARY, background: 'transparent' }}>
              Lưu
            </Button>
          }
        >
          {/* Title input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tên phiếu đánh giá
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Phiếu đánh giá thuyết trình"
              size="large"
              style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
            />
          </div>

          {/* Scale + total */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Thang điểm
              </label>
              <Select
                value={scaleType}
                onChange={(v) => setScaleType(v)}
                options={[
                  { value: '10', label: 'Thang 10' },
                  { value: '100', label: 'Thang 100' },
                  { value: 'custom', label: 'Tùy chỉnh' },
                ]}
                style={{ width: 160 }}
              />
            </div>
            {scaleType === 'custom' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Điểm tối đa
                </label>
                <InputNumber
                  min={1}
                  value={customMax}
                  onChange={(v) => setCustomMax(v ?? 20)}
                  style={{ width: 120, ...inputStyle }}
                />
              </div>
            )}
            <div
              style={{
                background: isDark ? '#1a2a1e' : '#f0faf4',
                border: `1px solid ${PRIMARY}33`,
                borderRadius: 8,
                padding: '8px 16px',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <span style={{ color: subColor, fontSize: 13 }}>Tổng điểm tối đa:</span>
              <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 18 }}>{maxTotal}</span>
            </div>
          </div>

          {/* Criteria list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {criteria.map((c) => (
              <div key={c.id}
                style={{
                  background: rowBg,
                  border: `1px solid ${rowBorder}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                }}
              >
                {/* Main row */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Input
                    placeholder="Tên tiêu chí (VD: Nội dung)"
                    value={c.name}
                    onChange={(e) => updateCriterion(c.id, 'name', e.target.value)}
                    style={{ flex: '1 1 160px', minWidth: 120, ...inputStyle }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ color: subColor, fontSize: 13 }}>Điểm tối đa:</span>
                    <InputNumber
                      min={0}
                      max={1000}
                      value={c.maxPoints}
                      onChange={(v) => updateCriterion(c.id, 'maxPoints', v ?? 0)}
                      style={{ width: 80, ...inputStyle }}
                    />
                  </div>
                  <Tooltip title="Thêm/ẩn mô tả">
                    <Button
                      size="small"
                      icon={c.descriptionOpen ? <UpOutlined /> : <DownOutlined />}
                      onClick={() => toggleDesc(c.id)}
                      style={{ background: 'transparent', borderColor: inputBorder, color: subColor }}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Xoá tiêu chí này?"
                    onConfirm={() => deleteCriterion(c.id)}
                    okText="Xoá"
                    cancelText="Huỷ"
                  >
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      style={{ background: 'transparent' }}
                    />
                  </Popconfirm>
                </div>

                {/* Description (collapsible) */}
                {c.descriptionOpen && (
                  <div style={{ marginTop: 10 }}>
                    <Input.TextArea
                      placeholder="Mô tả tiêu chí (tùy chọn)"
                      value={c.description}
                      onChange={(e) => updateCriterion(c.id, 'description', e.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      style={{ ...inputStyle, background: descBg }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            icon={<PlusOutlined />}
            onClick={addCriterion}
            style={{ marginTop: 12, borderColor: PRIMARY, color: PRIMARY, background: 'transparent' }}
          >
            Thêm tiêu chí
          </Button>

          {/* Grade thresholds */}
          <div style={{ marginTop: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ngưỡng xếp loại (theo thang {scaleType === 'custom' ? customMax : scaleType})
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {thresholds.map((t, idx) => (
                <div key={idx}
                  style={{
                    background: rowBg,
                    border: `1px solid ${t.color}44`,
                    borderRadius: 8,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Tag color={t.color} style={{ margin: 0 }}>{t.label}</Tag>
                  <span style={{ color: subColor, fontSize: 13 }}>từ</span>
                  <InputNumber
                    min={0}
                    max={scaleType === '10' ? 10 : scaleType === '100' ? 100 : customMax}
                    step={0.5}
                    value={t.min}
                    onChange={(v) => {
                      setThresholds((prev) =>
                        prev.map((th, i) => (i === idx ? { ...th, min: v ?? 0 } : th))
                      );
                    }}
                    style={{ width: 80, ...inputStyle }}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── SECTION 2: Student Scoring ── */}
        <Section title="Chấm điểm học sinh" icon={<CalculatorOutlined />} isDark={isDark}>
          {/* Add student */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thêm học sinh
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Input
                placeholder="Tên học sinh"
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
                onPressEnter={() => addStudent(studentNameInput)}
                style={{ flex: '1 1 200px', maxWidth: 320, ...inputStyle }}
              />
              <Button
                icon={<UserAddOutlined />}
                onClick={() => addStudent(studentNameInput)}
                style={{ borderColor: PRIMARY, color: PRIMARY, background: 'transparent' }}
              >
                Thêm
              </Button>
              <Button
                onClick={() => setShowPasteArea((v) => !v)}
                style={{ borderColor: inputBorder, color: subColor, background: 'transparent' }}
              >
                Dán danh sách
              </Button>
            </div>

            {showPasteArea && (
              <div style={{ marginTop: 10 }}>
                <Input.TextArea
                  placeholder="Dán danh sách tên, mỗi tên một dòng hoặc cách nhau bởi dấu phẩy/chấm phẩy"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  style={{ ...inputStyle, background: descBg, marginBottom: 8 }}
                />
                <Button
                  size="small"
                  onClick={addPastedStudents}
                  style={{ borderColor: PRIMARY, color: PRIMARY, background: 'transparent' }}
                >
                  Thêm tất cả
                </Button>
              </div>
            )}
          </div>

          {/* Scoring rows */}
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', color: subColor, padding: '32px 0', fontSize: 14 }}>
              Chưa có học sinh nào. Thêm học sinh ở trên để bắt đầu chấm điểm.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `220px repeat(${criteria.length}, 1fr) 80px 90px 36px`,
                  gap: 8,
                  padding: '8px 12px',
                  background: isDark ? '#1a1a1a' : '#f5f5f5',
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: subColor, fontSize: 12, fontWeight: 600 }}>Học sinh</span>
                {criteria.map((c) => (
                  <span key={c.id} style={{ color: subColor, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                    {c.name || '?'}<br />
                    <span style={{ fontSize: 10, fontWeight: 400 }}>/{c.maxPoints}</span>
                  </span>
                ))}
                <span style={{ color: subColor, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Tổng</span>
                <span style={{ color: subColor, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Xếp loại</span>
                <span />
              </div>

              {students.map((s) => {
                const total = calcTotal(s, criteria);
                const grade = getGrade(total, maxTotal, thresholds, scaleType, customMax);
                const gradeColor = getGradeColor(grade, thresholds);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `220px repeat(${criteria.length}, 1fr) 80px 90px 36px`,
                      gap: 8,
                      padding: '10px 12px',
                      background: rowBg,
                      border: `1px solid ${rowBorder}`,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Input
                      value={s.name}
                      onChange={(e) => updateStudentName(s.id, e.target.value)}
                      style={{ ...inputStyle, fontWeight: 500 }}
                      size="small"
                    />
                    {criteria.map((c) => (
                      <InputNumber
                        key={c.id}
                        min={0}
                        max={c.maxPoints}
                        step={0.5}
                        value={s.scores[c.id] ?? 0}
                        onChange={(v) => updateScore(s.id, c.id, v)}
                        style={{ width: '100%', ...inputStyle }}
                        size="small"
                      />
                    ))}
                    <span style={{ fontWeight: 700, color: PRIMARY, textAlign: 'center', fontSize: 15 }}>
                      {total}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      <Tag color={gradeColor}>{grade}</Tag>
                    </div>
                    <Popconfirm title="Xoá học sinh này?" onConfirm={() => deleteStudent(s.id)} okText="Xoá" cancelText="Huỷ">
                      <Button size="small" icon={<DeleteOutlined />} danger style={{ background: 'transparent' }} />
                    </Popconfirm>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── SECTION 3: Results Table ── */}
        <Section title="Kết quả tổng hợp" icon={<TrophyOutlined />} isDark={isDark}
          extra={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                icon={<PrinterOutlined />}
                size="small"
                onClick={() => window.print()}
                style={{ borderColor: inputBorder, color: subColor, background: 'transparent' }}
              >
                Xuất PDF / In
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                size="small"
                onClick={() => exportExcel(title, criteria, students, thresholds, scaleType, customMax)}
                style={{ borderColor: '#1d8a00', color: '#52c41a', background: 'transparent' }}
              >
                Xuất Excel
              </Button>
            </div>
          }
        >
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', color: subColor, padding: '32px 0', fontSize: 14 }}>
              Chưa có dữ liệu. Thêm học sinh và chấm điểm ở mục trên.
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                  { label: 'Trung bình', value: avgScore.toFixed(2), color: PRIMARY },
                  { label: 'Cao nhất', value: highestScore, color: '#faad14' },
                  { label: 'Thấp nhất', value: lowestScore, color: '#ff7875' },
                  { label: 'Số học sinh', value: students.length, color: subColor },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: isDark ? '#1a1a1a' : '#f8f8f8',
                      border: `1px solid ${rowBorder}`,
                      borderRadius: 8,
                      padding: '10px 18px',
                      minWidth: 120,
                    }}
                  >
                    <div style={{ fontSize: 11, color: subColor, marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Grade distribution */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {thresholds.map((t) => {
                  const count = sorted.filter(
                    (s) => getGrade(s.total, maxTotal, thresholds, scaleType, customMax) === t.label
                  ).length;
                  return (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag color={t.color}>{t.label}</Tag>
                      <span style={{ color: subColor, fontSize: 13 }}>{count} em</span>
                    </div>
                  );
                })}
              </div>

              {/* Results table */}
              <Table
                dataSource={sorted.map((s, i) => ({ ...s, key: s.id, rank: i + 1 }))}
                columns={tableColumns}
                pagination={false}
                size="small"
                rowClassName={(record) =>
                  record.total === topScore && topScore > 0 && students.length > 1
                    ? 'rubric-top-row'
                    : ''
                }
                style={{ borderRadius: 8, overflow: 'hidden' }}
              />

              <style>{`
                .rubric-top-row td:first-child {
                  border-left: 3px solid #50C878 !important;
                }
              `}</style>
            </>
          )}
        </Section>

      </div>
      {/* end printable area */}
    </div>
  );
}
