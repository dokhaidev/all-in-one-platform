'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  InputNumber,
  message,
  Tooltip,
  Modal,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  grades: Record<string, number | null>; // subjectId → grade
}

type RankType = 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu' | '—';
type SortField = 'name' | 'avg' | null;
type SortDir = 'asc' | 'desc';

const PRIMARY = '#50C878';
const STORAGE_KEY = 'toolhub_gradebook_v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function calcAvg(student: Student, subjects: Subject[]): number | null {
  if (subjects.length === 0) return null;
  const vals = subjects
    .map((s) => student.grades[s.id])
    .filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
}

function getRank(avg: number | null): RankType {
  if (avg === null) return '—';
  if (avg >= 8.0) return 'Giỏi';
  if (avg >= 6.5) return 'Khá';
  if (avg >= 5.0) return 'Trung bình';
  return 'Yếu';
}

function rankColor(rank: RankType, isDark: boolean): string {
  switch (rank) {
    case 'Giỏi':       return isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)';
    case 'Khá':        return isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)';
    case 'Trung bình': return isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)';
    case 'Yếu':        return isDark ? 'rgba(239,68,68,0.12)'  : 'rgba(239,68,68,0.08)';
    default:           return 'transparent';
  }
}

function rankBadgeColor(rank: RankType): { bg: string; text: string } {
  switch (rank) {
    case 'Giỏi':       return { bg: 'rgba(16,185,129,0.18)',  text: '#10b981' };
    case 'Khá':        return { bg: 'rgba(59,130,246,0.18)',  text: '#3b82f6' };
    case 'Trung bình': return { bg: 'rgba(245,158,11,0.18)',  text: '#f59e0b' };
    case 'Yếu':        return { bg: 'rgba(239,68,68,0.18)',   text: '#ef4444' };
    default:           return { bg: 'transparent', text: '#888' };
  }
}

const RANK_STAT_COLORS: Record<RankType, { bg: string; border: string; text: string; bar: string }> = {
  'Giỏi':       { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.30)',  text: '#10b981', bar: '#10b981' },
  'Khá':        { bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.30)',  text: '#3b82f6', bar: '#3b82f6' },
  'Trung bình': { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)',  text: '#f59e0b', bar: '#f59e0b' },
  'Yếu':        { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.30)',   text: '#ef4444', bar: '#ef4444' },
  '—':          { bg: 'transparent', border: 'transparent', text: '#888', bar: '#888' },
};

// ─── Editable Grade Cell ──────────────────────────────────────────────────────

interface GradeCellProps {
  value: number | null;
  onChange: (v: number | null) => void;
  isDark: boolean;
}

function GradeCell({ value, onChange, isDark }: GradeCellProps) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState<number | null>(value);

  useEffect(() => { setLocal(value); }, [value]);

  const commit = () => {
    setEditing(false);
    onChange(local);
  };

  if (editing) {
    return (
      <InputNumber
        autoFocus
        min={0}
        max={10}
        step={0.1}
        precision={1}
        value={local ?? undefined}
        onChange={(v) => setLocal(v ?? null)}
        onBlur={commit}
        onPressEnter={commit}
        size="small"
        style={{ width: 72 }}
        placeholder="0–10"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: 'pointer',
        minWidth: 50,
        textAlign: 'center',
        padding: '2px 8px',
        borderRadius: 6,
        border: `1px dashed ${isDark ? '#3a3a3a' : '#d9d9d9'}`,
        color: value === null ? (isDark ? '#444' : '#ccc') : (isDark ? '#e0e0e0' : '#1a1a1a'),
        fontSize: 13,
        transition: 'border-color 0.15s, color 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = PRIMARY;
        (e.currentTarget as HTMLElement).style.color = PRIMARY;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#3a3a3a' : '#d9d9d9';
        (e.currentTarget as HTMLElement).style.color =
          value === null ? (isDark ? '#444' : '#ccc') : (isDark ? '#e0e0e0' : '#1a1a1a');
      }}
      title="Nhấp để chỉnh sửa"
    >
      {value !== null ? value.toFixed(1) : '—'}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GradeBookTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme tokens
  const outerBg    = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg     = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '1px solid #2a2a2a' : '1px solid #e8e8e8';
  const textColor  = isDark ? '#e8e8e8' : '#111111';
  const subColor   = isDark ? '#888' : '#777';
  const inputBg    = isDark ? '#141414' : '#ffffff';

  // State
  const [className, setClassName] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([{ id: genId(), name: '' }]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [messageApi, contextHolder] = message.useMessage();

  // ── Load from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.className !== undefined) setClassName(data.className);
      if (Array.isArray(data.subjects) && data.subjects.length > 0) setSubjects(data.subjects);
      if (Array.isArray(data.students)) setStudents(data.students);
    } catch {
      // ignore
    }
  }, []);

  // ── Save to localStorage ─────────────────────────────────────────────────
  const save = useCallback(
    (cn: string, subs: Subject[], studs: Student[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ className: cn, subjects: subs, students: studs }));
      } catch {
        // ignore
      }
    },
    [],
  );

  useEffect(() => { save(className, subjects, students); }, [className, subjects, students, save]);

  // ── Subject helpers ──────────────────────────────────────────────────────
  const addSubject = () => {
    if (subjects.length >= 10) { messageApi.warning('Tối đa 10 môn học'); return; }
    setSubjects((prev) => [...prev, { id: genId(), name: '' }]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) { messageApi.warning('Cần ít nhất 1 môn học'); return; }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setStudents((prev) =>
      prev.map((st) => {
        const g = { ...st.grades };
        delete g[id];
        return { ...st, grades: g };
      }),
    );
  };

  const updateSubjectName = (id: string, name: string) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  // ── Student helpers ──────────────────────────────────────────────────────
  const addStudent = () => {
    const newStudent: Student = { id: genId(), name: '', grades: {} };
    setStudents((prev) => [...prev, newStudent]);
  };

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStudentName = (id: string, name: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const updateGrade = (studentId: string, subjectId: string, value: number | null) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, grades: { ...s.grades, [subjectId]: value } }
          : s,
      ),
    );
  };

  // ── Paste names ──────────────────────────────────────────────────────────
  const handlePasteNames = () => {
    const names = pasteText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) { messageApi.warning('Không có tên hợp lệ'); return; }
    const newStudents: Student[] = names.map((name) => ({ id: genId(), name, grades: {} }));
    setStudents((prev) => [...prev, ...newStudents]);
    setPasteText('');
    setPasteOpen(false);
    messageApi.success(`Đã thêm ${names.length} học sinh`);
  };

  // ── Sorted data ──────────────────────────────────────────────────────────
  const displayStudents = [...students].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'name') {
      const cmp = a.name.localeCompare(b.name, 'vi');
      return sortDir === 'asc' ? cmp : -cmp;
    }
    if (sortField === 'avg') {
      const avgA = calcAvg(a, subjects) ?? -1;
      const avgB = calcAvg(b, subjects) ?? -1;
      return sortDir === 'asc' ? avgA - avgB : avgB - avgA;
    }
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const total = students.length;
  const rankCounts: Record<RankType, number> = { Giỏi: 0, Khá: 0, 'Trung bình': 0, Yếu: 0, '—': 0 };
  students.forEach((s) => {
    const avg = calcAvg(s, subjects);
    const rank = getRank(avg);
    rankCounts[rank]++;
  });

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: ColumnsType<Student> = [
    {
      title: 'STT',
      width: 56,
      align: 'center',
      render: (_: unknown, __: Student, index: number) => (
        <span style={{ color: subColor, fontSize: 13 }}>{index + 1}</span>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Họ tên</span>
          <Tooltip title="Sắp xếp theo tên">
            <button
              onClick={() => handleSort('name')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: sortField === 'name' ? PRIMARY : subColor, fontSize: 12,
              }}
            >
              {sortField === 'name' && sortDir === 'desc'
                ? <SortDescendingOutlined />
                : <SortAscendingOutlined />}
            </button>
          </Tooltip>
        </div>
      ),
      dataIndex: 'name',
      width: 200,
      render: (name: string, record: Student) => (
        <Input
          value={name}
          onChange={(e) => updateStudentName(record.id, e.target.value)}
          placeholder="Tên học sinh"
          size="small"
          style={{ color: textColor, fontWeight: 500, padding: 0 }}
        />
      ),
    },
    ...subjects.map((subj) => ({
      title: (
        <span style={{ color: textColor, fontSize: 13 }}>
          {subj.name || <span style={{ color: '#555', fontStyle: 'italic' }}>Môn học</span>}
        </span>
      ),
      dataIndex: ['grades', subj.id],
      key: subj.id,
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: Student) => (
        <GradeCell
          value={record.grades[subj.id] ?? null}
          onChange={(v) => updateGrade(record.id, subj.id, v)}
          isDark={isDark}
        />
      ),
    })),
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Điểm TB</span>
          <Tooltip title="Sắp xếp theo điểm TB">
            <button
              onClick={() => handleSort('avg')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: sortField === 'avg' ? PRIMARY : subColor, fontSize: 12,
              }}
            >
              {sortField === 'avg' && sortDir === 'desc'
                ? <SortDescendingOutlined />
                : <SortAscendingOutlined />}
            </button>
          </Tooltip>
        </div>
      ),
      width: 90,
      align: 'center',
      render: (_: unknown, record: Student) => {
        const avg = calcAvg(record, subjects);
        return (
          <span style={{ fontWeight: 700, color: avg !== null ? PRIMARY : subColor, fontSize: 14 }}>
            {avg !== null ? avg.toFixed(2) : '—'}
          </span>
        );
      },
    },
    {
      title: 'Xếp loại',
      width: 110,
      align: 'center',
      render: (_: unknown, record: Student) => {
        const avg = calcAvg(record, subjects);
        const rank = getRank(avg);
        const { bg, text } = rankBadgeColor(rank);
        return (
          <span
            style={{
              background: bg,
              color: text,
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            {rank}
          </span>
        );
      },
    },
    {
      title: '',
      width: 40,
      align: 'center',
      render: (_: unknown, record: Student) => (
        <Tooltip title="Xóa học sinh">
          <button
            onClick={() => removeStudent(record.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isDark ? '#555' : '#ccc', fontSize: 14, padding: 4,
              borderRadius: 4, transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#555' : '#ccc'; }}
          >
            <DeleteOutlined />
          </button>
        </Tooltip>
      ),
    },
  ];

  // ── Export helpers ───────────────────────────────────────────────────────
  const buildCsvContent = () => {
    const headers = ['STT', 'Họ tên', ...subjects.map((s) => s.name || 'Môn học'), 'Điểm TB', 'Xếp loại'];
    const rows = displayStudents.map((st, i) => {
      const avg = calcAvg(st, subjects);
      const rank = getRank(avg);
      return [
        String(i + 1),
        st.name,
        ...subjects.map((s) => (st.grades[s.id] !== null && st.grades[s.id] !== undefined ? String(st.grades[s.id]) : '')),
        avg !== null ? avg.toFixed(2) : '',
        rank,
      ];
    });
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  };

  const exportCSV = () => {
    const csv = buildCsvContent();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diem-so-${className || 'lop'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    messageApi.success('Đã xuất CSV');
  };

  const exportExcel = () => {
    const subjectHeaders = subjects.map((s) => `<Cell><Data ss:Type="String">${s.name || 'Môn học'}</Data></Cell>`).join('');
    const headerRow = `<Row>
      <Cell><Data ss:Type="String">STT</Data></Cell>
      <Cell><Data ss:Type="String">Họ tên</Data></Cell>
      ${subjectHeaders}
      <Cell><Data ss:Type="String">Điểm TB</Data></Cell>
      <Cell><Data ss:Type="String">Xếp loại</Data></Cell>
    </Row>`;

    const dataRows = displayStudents.map((st, i) => {
      const avg = calcAvg(st, subjects);
      const rank = getRank(avg);
      const gradeCells = subjects
        .map((s) =>
          st.grades[s.id] !== null && st.grades[s.id] !== undefined
            ? `<Cell><Data ss:Type="Number">${st.grades[s.id]}</Data></Cell>`
            : `<Cell><Data ss:Type="String"></Data></Cell>`,
        )
        .join('');
      return `<Row>
        <Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
        <Cell><Data ss:Type="String">${st.name}</Data></Cell>
        ${gradeCells}
        <Cell><Data ss:Type="Number">${avg !== null ? avg.toFixed(2) : ''}</Data></Cell>
        <Cell><Data ss:Type="String">${rank}</Data></Cell>
      </Row>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${className || 'Điểm số'}">
    <Table>
      ${headerRow}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diem-so-${className || 'lop'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    messageApi.success('Đã xuất Excel');
  };

  // ── Rank stat cards list ─────────────────────────────────────────────────
  const rankList: RankType[] = ['Giỏi', 'Khá', 'Trung bình', 'Yếu'];

  // ── Distribution bar ─────────────────────────────────────────────────────
  const maxCount = Math.max(...rankList.map((r) => rankCounts[r]), 1);

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%' }}>
      {contextHolder}

      {/* ── Section 1: Class setup ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <UnorderedListOutlined style={{ color: PRIMARY, fontSize: 18 }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textColor }}>Thông tin lớp học</h2>
        </div>

        {/* Class name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tên lớp
          </label>
          <Input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="VD: Lớp 10A1 – Năm học 2025-2026"
            style={{ maxWidth: 400 }}
          />
        </div>

        {/* Subjects */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subColor, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Môn học ({subjects.length}/10)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {subjects.map((subj, idx) => (
              <div key={subj.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Input
                  value={subj.name}
                  onChange={(e) => updateSubjectName(subj.id, e.target.value)}
                  placeholder={`Môn ${idx + 1}`}
                  style={{ width: 140 }}
                  size="small"
                />
                <Tooltip title="Xóa môn">
                  <button
                    onClick={() => removeSubject(subj.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: isDark ? '#555' : '#ccc', fontSize: 14,
                      padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#555' : '#ccc'; }}
                  >
                    <DeleteOutlined />
                  </button>
                </Tooltip>
              </div>
            ))}
            {subjects.length < 10 && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={addSubject}
                style={{ borderStyle: 'dashed' }}
              >
                Thêm môn
              </Button>
            )}
          </div>
        </div>

        {/* Add student buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button
            icon={<UserAddOutlined />}
            onClick={addStudent}
            style={{ background: PRIMARY, borderColor: PRIMARY, color: '#fff', fontWeight: 600 }}
          >
            Thêm học sinh
          </Button>
          <Button
            icon={<UnorderedListOutlined />}
            onClick={() => setPasteOpen(true)}
          >
            Nhập từ danh sách
          </Button>
        </div>
      </div>

      {/* ── Section 2: Grade table ── */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: PRIMARY, fontSize: 18 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textColor }}>
              Bảng điểm{className ? ` — ${className}` : ''}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={exportCSV}
              disabled={students.length === 0}
            >
              Xuất CSV
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={exportExcel}
              disabled={students.length === 0}
              style={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              Xuất Excel
            </Button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <Table<Student>
            dataSource={displayStudents}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{
              emptyText: (
                <div style={{ padding: '32px 0', color: subColor, fontSize: 13 }}>
                  Chưa có học sinh. Nhấn "Thêm học sinh" để bắt đầu.
                </div>
              ),
            }}
            onRow={(record) => {
              const avg = calcAvg(record, subjects);
              const rank = getRank(avg);
              return {
                style: {
                  background: rankColor(rank, isDark),
                  transition: 'background 0.2s',
                },
              };
            }}
          />
        </div>
      </div>

      {/* ── Section 3: Summary stats ── */}
      {total > 0 && (
        <div
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: 12,
            padding: '24px 28px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <DownloadOutlined style={{ color: PRIMARY, fontSize: 18 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textColor }}>Thống kê</h2>
          </div>

          {/* Total card + 4 rank cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
            {/* Total */}
            <div
              style={{
                background: isDark ? '#252525' : '#f9f9f9',
                border: cardBorder,
                borderRadius: 10,
                padding: '16px 20px',
                minWidth: 120,
                flex: '0 0 auto',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: PRIMARY, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>Tổng học sinh</div>
            </div>

            {rankList.map((rank) => {
              const count = rankCounts[rank];
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              const c = RANK_STAT_COLORS[rank];
              return (
                <div
                  key={rank}
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 10,
                    padding: '16px 20px',
                    minWidth: 130,
                    flex: '1 1 130px',
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: c.text, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginTop: 2 }}>{rank}</div>
                  <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{pct}% tổng số</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 4: Distribution bar ── */}
      {total > 0 && (
        <div
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: 12,
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileTextOutlined style={{ color: PRIMARY, fontSize: 18 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textColor }}>Phân bố xếp loại</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rankList.map((rank) => {
              const count = rankCounts[rank];
              const pct = total > 0 ? (count / total) * 100 : 0;
              const barWidth = total > 0 ? (count / maxCount) * 100 : 0;
              const c = RANK_STAT_COLORS[rank];
              return (
                <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 80,
                      fontSize: 13,
                      fontWeight: 600,
                      color: c.text,
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    {rank}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: isDark ? '#2a2a2a' : '#f0f0f0',
                      borderRadius: 6,
                      height: 22,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth}%`,
                        background: c.bar,
                        height: '100%',
                        borderRadius: 6,
                        transition: 'width 0.4s ease',
                        minWidth: count > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 70,
                      fontSize: 12,
                      color: subColor,
                      flexShrink: 0,
                      textAlign: 'left',
                    }}
                  >
                    {count} ({pct.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Paste names modal ── */}
      <Modal
        open={pasteOpen}
        title="Nhập danh sách học sinh"
        okText="Thêm vào danh sách"
        cancelText="Hủy"
        onOk={handlePasteNames}
        onCancel={() => { setPasteOpen(false); setPasteText(''); }}
        styles={{
          content: { background: isDark ? '#1e1e1e' : '#ffffff' },
          header: { background: isDark ? '#1e1e1e' : '#ffffff' },
          footer: { background: isDark ? '#1e1e1e' : '#ffffff' },
        }}
      >
        <p style={{ color: subColor, fontSize: 13, marginBottom: 10 }}>
          Dán danh sách tên học sinh, mỗi tên một dòng. Dữ liệu sẽ được thêm vào cuối danh sách hiện tại.
        </p>
        <Input.TextArea
          rows={10}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Nam\n...'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Modal>
    </div>
  );
}
