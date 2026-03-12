'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Select,
  Table,
  Tag,
  Modal,
  Space,
  Typography,
  Tooltip,
  message,
  Popconfirm,
  Empty,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  CopyOutlined,
  HistoryOutlined,
  TeamOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.2)';
const ABSENT_COLOR = '#e05555';
const ABSENT_BG = 'rgba(224,85,85,0.1)';
const ABSENT_BORDER = 'rgba(224,85,85,0.25)';
const LATE_COLOR = '#faad14';
const LATE_BG = 'rgba(250,173,20,0.1)';
const LATE_BORDER = 'rgba(250,173,20,0.25)';
const STORAGE_KEY = 'toolhub_attendance';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'present' | 'absent' | 'late' | 'none';

interface Student {
  id: string;
  name: string;
}

interface ClassRecord {
  id: string;
  name: string;
  students: Student[];
}

interface AttendanceRecord {
  classId: string;
  date: string; // YYYY-MM-DD
  data: Record<string, AttendanceStatus>; // studentId → status
}

interface StorageData {
  classes: ClassRecord[];
  records: AttendanceRecord[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 11);
}

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { classes: [], records: [] };
    return JSON.parse(raw) as StorageData;
  } catch {
    return { classes: [], records: [] };
  }
}

function saveData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDate(date: string): string {
  // date is YYYY-MM-DD, convert to DD/MM/YYYY
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusButton({
  status,
  targetStatus,
  onClick,
  isDark,
}: {
  status: AttendanceStatus;
  targetStatus: AttendanceStatus;
  onClick: () => void;
  isDark: boolean;
}) {
  const isActive = status === targetStatus;

  const configs = {
    present: {
      icon: <CheckOutlined />,
      label: 'Có mặt',
      activeColor: PRIMARY,
      activeBg: PRIMARY_BG,
      activeBorder: PRIMARY_BORDER,
    },
    absent: {
      icon: <CloseOutlined />,
      label: 'Vắng',
      activeColor: ABSENT_COLOR,
      activeBg: ABSENT_BG,
      activeBorder: ABSENT_BORDER,
    },
    late: {
      icon: <ClockCircleOutlined />,
      label: 'Trễ',
      activeColor: LATE_COLOR,
      activeBg: LATE_BG,
      activeBorder: LATE_BORDER,
    },
    none: { icon: null, label: '', activeColor: '', activeBg: '', activeBorder: '' },
  };

  const cfg = configs[targetStatus];
  const inactiveBg = isDark ? 'transparent' : '#fafafa';
  const inactiveBorder = isDark ? '#333' : '#e0e0e0';
  const inactiveColor = isDark ? '#555' : '#bbb';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 7,
        border: `1px solid ${isActive ? cfg.activeBorder : inactiveBorder}`,
        background: isActive ? cfg.activeBg : inactiveBg,
        color: isActive ? cfg.activeColor : inactiveColor,
        fontWeight: isActive ? 600 : 400,
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}

function SummaryCard({
  label,
  count,
  color,
  bg,
  border,
  isDark,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
  border: string;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 100,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '14px 18px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 12, color: isDark ? '#888' : '#666', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendanceTrackerTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme-derived colors
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const headingColor = isDark ? '#e0e0e0' : '#111';
  const mutedColor = isDark ? '#666' : '#aaa';
  const inputBg = isDark ? '#1a1a1a' : '#fff';
  const sideBg = isDark ? '#1e1e1e' : '#fafafa';
  const sideBorder = isDark ? '#282828' : '#e0e0e0';

  // State
  const [data, setData] = useState<StorageData>({ classes: [], records: [] });
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [currentRecord, setCurrentRecord] = useState<Record<string, AttendanceStatus>>({});

  // UI state
  const [newClassName, setNewClassName] = useState('');
  const [addClassLoading, setAddClassLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [editClassModal, setEditClassModal] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  // Load from localStorage
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    if (loaded.classes.length > 0) {
      setSelectedClassId(loaded.classes[0].id);
    }
  }, []);

  // Sync current record when class or date changes
  useEffect(() => {
    if (!selectedClassId) return;
    const dateStr = selectedDate;
    const existing = data.records.find(
      (r) => r.classId === selectedClassId && r.date === dateStr
    );
    if (existing) {
      setCurrentRecord({ ...existing.data });
    } else {
      // Initialize all students as 'none'
      const cls = data.classes.find((c) => c.id === selectedClassId);
      if (cls) {
        const initial: Record<string, AttendanceStatus> = {};
        cls.students.forEach((s) => { initial[s.id] = 'none'; });
        setCurrentRecord(initial);
      }
    }
  }, [selectedClassId, selectedDate, data]);

  const persist = useCallback((newData: StorageData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const selectedClass = data.classes.find((c) => c.id === selectedClassId);

  // ── Class management ──────────────────────────────────────────────────────

  const handleAddClass = () => {
    const name = newClassName.trim();
    if (!name) { messageApi.warning('Vui lòng nhập tên lớp'); return; }
    if (data.classes.find((c) => c.name === name)) {
      messageApi.warning('Tên lớp đã tồn tại');
      return;
    }
    setAddClassLoading(true);
    const newClass: ClassRecord = { id: genId(), name, students: [] };
    const newData = { ...data, classes: [...data.classes, newClass] };
    persist(newData);
    setSelectedClassId(newClass.id);
    setNewClassName('');
    setAddClassLoading(false);
    messageApi.success(`Đã tạo lớp "${name}"`);
  };

  const handleDeleteClass = (classId: string) => {
    const newClasses = data.classes.filter((c) => c.id !== classId);
    const newRecords = data.records.filter((r) => r.classId !== classId);
    const newData = { classes: newClasses, records: newRecords };
    persist(newData);
    if (selectedClassId === classId) {
      setSelectedClassId(newClasses.length > 0 ? newClasses[0].id : '');
    }
    messageApi.success('Đã xóa lớp');
  };

  const handleEditClass = () => {
    const name = editClassName.trim();
    if (!name) return;
    const newClasses = data.classes.map((c) =>
      c.id === selectedClassId ? { ...c, name } : c
    );
    persist({ ...data, classes: newClasses });
    setEditClassModal(false);
    messageApi.success('Đã cập nhật tên lớp');
  };

  // ── Student management ────────────────────────────────────────────────────

  const handleAddStudent = () => {
    const name = newStudentName.trim();
    if (!name) { messageApi.warning('Vui lòng nhập tên học sinh'); return; }
    if (!selectedClassId) { messageApi.warning('Vui lòng chọn lớp trước'); return; }
    const cls = data.classes.find((c) => c.id === selectedClassId);
    if (!cls) return;
    if (cls.students.find((s) => s.name === name)) {
      messageApi.warning('Học sinh đã có trong danh sách');
      return;
    }
    setAddStudentLoading(true);
    const newStudent: Student = { id: genId(), name };
    const newClasses = data.classes.map((c) =>
      c.id === selectedClassId ? { ...c, students: [...c.students, newStudent] } : c
    );
    persist({ ...data, classes: newClasses });
    setNewStudentName('');
    setAddStudentLoading(false);
    messageApi.success(`Đã thêm học sinh "${name}"`);
  };

  const handleDeleteStudent = (studentId: string) => {
    const newClasses = data.classes.map((c) =>
      c.id === selectedClassId
        ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
        : c
    );
    persist({ ...data, classes: newClasses });
  };

  // ── Attendance management ─────────────────────────────────────────────────

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    const newRecord = { ...currentRecord, [studentId]: status };
    setCurrentRecord(newRecord);

    // Persist to records
    const dateStr = selectedDate;
    const existingIdx = data.records.findIndex(
      (r) => r.classId === selectedClassId && r.date === dateStr
    );
    let newRecords = [...data.records];
    const recordEntry: AttendanceRecord = {
      classId: selectedClassId,
      date: dateStr,
      data: newRecord,
    };
    if (existingIdx >= 0) {
      newRecords[existingIdx] = recordEntry;
    } else {
      newRecords = [...newRecords, recordEntry];
    }
    persist({ ...data, records: newRecords });
  };

  const markAll = (status: AttendanceStatus) => {
    if (!selectedClass) return;
    const newRecord: Record<string, AttendanceStatus> = {};
    selectedClass.students.forEach((s) => { newRecord[s.id] = status; });
    setCurrentRecord(newRecord);

    const dateStr = selectedDate;
    const existingIdx = data.records.findIndex(
      (r) => r.classId === selectedClassId && r.date === dateStr
    );
    let newRecords = [...data.records];
    const recordEntry: AttendanceRecord = {
      classId: selectedClassId,
      date: dateStr,
      data: newRecord,
    };
    if (existingIdx >= 0) {
      newRecords[existingIdx] = recordEntry;
    } else {
      newRecords = [...newRecords, recordEntry];
    }
    persist({ ...data, records: newRecords });
    messageApi.success(status === 'present' ? 'Đã điểm danh tất cả' : 'Đã đánh vắng tất cả');
  };

  // ── Statistics ────────────────────────────────────────────────────────────

  const stats = (() => {
    if (!selectedClass) return { present: 0, absent: 0, late: 0, none: 0, total: 0 };
    const total = selectedClass.students.length;
    let present = 0, absent = 0, late = 0, none = 0;
    selectedClass.students.forEach((s) => {
      const st = currentRecord[s.id] ?? 'none';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else none++;
    });
    return { present, absent, late, none, total };
  })();

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (!selectedClass) return;
    const dateStr = formatDate(selectedDate);
    const lines = [
      `DANH SÁCH ĐIỂM DANH`,
      `Lớp: ${selectedClass.name}`,
      `Ngày: ${dateStr}`,
      `Tổng số học sinh: ${stats.total}`,
      '',
      `CÓ MẶT (${stats.present}):`,
      ...selectedClass.students
        .filter((s) => (currentRecord[s.id] ?? 'none') === 'present')
        .map((s, i) => `  ${i + 1}. ${s.name}`),
      '',
      `VẮNG MẶT (${stats.absent}):`,
      ...selectedClass.students
        .filter((s) => (currentRecord[s.id] ?? 'none') === 'absent')
        .map((s, i) => `  ${i + 1}. ${s.name}`),
      '',
      `ĐI TRỄ (${stats.late}):`,
      ...selectedClass.students
        .filter((s) => (currentRecord[s.id] ?? 'none') === 'late')
        .map((s, i) => `  ${i + 1}. ${s.name}`),
      '',
      `CHƯA ĐIỂM DANH (${stats.none}):`,
      ...selectedClass.students
        .filter((s) => (currentRecord[s.id] ?? 'none') === 'none')
        .map((s, i) => `  ${i + 1}. ${s.name}`),
    ];
    setExportText(lines.join('\n'));
    setExportModalOpen(true);
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      messageApi.success('Đã sao chép vào clipboard');
    });
  };

  // ── History ───────────────────────────────────────────────────────────────

  const classHistory = selectedClass
    ? data.records
        .filter((r) => r.classId === selectedClassId)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns: ColumnsType<Student> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <Text style={{ color: mutedColor, fontSize: 13 }}>{index + 1}</Text>
      ),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Student) => {
        const st = currentRecord[record.id] ?? 'none';
        const nameColor =
          st === 'present' ? PRIMARY :
          st === 'absent' ? ABSENT_COLOR :
          st === 'late' ? LATE_COLOR :
          textColor;
        return <Text style={{ color: nameColor, fontWeight: st !== 'none' ? 600 : 400, fontSize: 14 }}>{name}</Text>;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 280,
      render: (_, record: Student) => {
        const st = currentRecord[record.id] ?? 'none';
        return (
          <Space size={6}>
            <StatusButton status={st} targetStatus="present" onClick={() => setStudentStatus(record.id, 'present')} isDark={isDark} />
            <StatusButton status={st} targetStatus="absent" onClick={() => setStudentStatus(record.id, 'absent')} isDark={isDark} />
            <StatusButton status={st} targetStatus="late" onClick={() => setStudentStatus(record.id, 'late')} isDark={isDark} />
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 48,
      align: 'center',
      render: (_, record: Student) => (
        <Popconfirm
          title="Xóa học sinh này?"
          onConfirm={() => handleDeleteStudent(record.id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Xóa học sinh">
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#444' : '#ccc',
                fontSize: 14,
                padding: 4,
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = ABSENT_COLOR; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#444' : '#ccc'; }}
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  // ── History table columns ─────────────────────────────────────────────────

  const historyColumns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <Text style={{ color: textColor }}>{formatDate(date)}</Text>,
    },
    {
      title: 'Có mặt',
      key: 'present',
      align: 'center',
      render: (_, record: AttendanceRecord) => {
        const count = Object.values(record.data).filter((v) => v === 'present').length;
        return <Tag color="success" style={{ minWidth: 32, textAlign: 'center' }}>{count}</Tag>;
      },
    },
    {
      title: 'Vắng',
      key: 'absent',
      align: 'center',
      render: (_, record: AttendanceRecord) => {
        const count = Object.values(record.data).filter((v) => v === 'absent').length;
        return <Tag color="error" style={{ minWidth: 32, textAlign: 'center' }}>{count}</Tag>;
      },
    },
    {
      title: 'Trễ',
      key: 'late',
      align: 'center',
      render: (_, record: AttendanceRecord) => {
        const count = Object.values(record.data).filter((v) => v === 'late').length;
        return <Tag color="warning" style={{ minWidth: 32, textAlign: 'center' }}>{count}</Tag>;
      },
    },
    {
      title: '',
      key: 'del',
      width: 48,
      align: 'center',
      render: (_, record: AttendanceRecord) => (
        <Popconfirm
          title="Xóa bản ghi ngày này?"
          onConfirm={() => {
            const newRecords = data.records.filter(
              (r) => !(r.classId === record.classId && r.date === record.date)
            );
            persist({ ...data, records: newRecords });
          }}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Xóa">
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#444' : '#ccc', fontSize: 14, padding: 4 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = ABSENT_COLOR; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#444' : '#ccc'; }}
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ background: bg }}>
      {contextHolder}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ── Left panel: Class & Student management ── */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            background: sideBg,
            border: `1px solid ${sideBorder}`,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Class selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <TeamOutlined style={{ color: PRIMARY, fontSize: 14 }} />
              <Text style={{ color: headingColor, fontWeight: 600, fontSize: 13 }}>Danh sách lớp</Text>
            </div>

            {/* Add class */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <Input
                placeholder="Tên lớp mới..."
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onPressEnter={handleAddClass}
                size="small"
                style={{ background: inputBg, borderColor: cardBorder, color: textColor, fontSize: 13 }}
              />
              <Button
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddClass}
                loading={addClassLoading}
                style={{ background: PRIMARY_BG, borderColor: PRIMARY_BORDER, color: PRIMARY, flexShrink: 0 }}
              />
            </div>

            {/* Class list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.classes.length === 0 && (
                <Text style={{ color: mutedColor, fontSize: 12, padding: '8px 0' }}>
                  Chưa có lớp nào. Thêm lớp mới bên trên.
                </Text>
              )}
              {data.classes.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isSelected ? PRIMARY_BG : 'transparent',
                      border: `1px solid ${isSelected ? PRIMARY_BORDER : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? PRIMARY : textColor,
                        fontWeight: isSelected ? 600 : 400,
                        fontSize: 13,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cls.name}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Text style={{ color: mutedColor, fontSize: 11 }}>{cls.students.length}</Text>
                      {isSelected && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditClassName(cls.name); setEditClassModal(true); }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: 12, padding: 2 }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = PRIMARY; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
                          >
                            <EditOutlined />
                          </button>
                          <Popconfirm
                            title={`Xóa lớp "${cls.name}"?`}
                            description="Tất cả dữ liệu điểm danh của lớp sẽ bị xóa."
                            onConfirm={(e) => { e?.stopPropagation(); handleDeleteClass(cls.id); }}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              onClick={(e) => e.stopPropagation()}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: 12, padding: 2 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = ABSENT_COLOR; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
                            >
                              <DeleteOutlined />
                            </button>
                          </Popconfirm>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Divider style={{ margin: '0', borderColor: sideBorder }} />

          {/* Student management */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <UserAddOutlined style={{ color: PRIMARY, fontSize: 14 }} />
              <Text style={{ color: headingColor, fontWeight: 600, fontSize: 13 }}>
                Học sinh {selectedClass ? `(${selectedClass.students.length})` : ''}
              </Text>
            </div>

            {!selectedClass ? (
              <Text style={{ color: mutedColor, fontSize: 12 }}>Chọn lớp để quản lý học sinh</Text>
            ) : (
              <>
                {/* Add student */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <Input
                    placeholder="Tên học sinh..."
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    onPressEnter={handleAddStudent}
                    size="small"
                    style={{ background: inputBg, borderColor: cardBorder, color: textColor, fontSize: 13 }}
                  />
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={handleAddStudent}
                    loading={addStudentLoading}
                    style={{ background: PRIMARY_BG, borderColor: PRIMARY_BORDER, color: PRIMARY, flexShrink: 0 }}
                  />
                </div>

                {/* Student list (compact) */}
                <div
                  style={{
                    maxHeight: 260,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  {selectedClass.students.length === 0 && (
                    <Text style={{ color: mutedColor, fontSize: 12 }}>Chưa có học sinh nào.</Text>
                  )}
                  {selectedClass.students.map((s, idx) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`,
                      }}
                    >
                      <Text style={{ color: textColor, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: mutedColor, marginRight: 5 }}>{idx + 1}.</span>
                        {s.name}
                      </Text>
                      <Popconfirm
                        title="Xóa học sinh này?"
                        onConfirm={() => handleDeleteStudent(s.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#444' : '#ccc', fontSize: 11, padding: 2 }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = ABSENT_COLOR; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#444' : '#ccc'; }}
                        >
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right panel: Attendance ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top bar */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Date picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined style={{ color: PRIMARY, fontSize: 16 }} />
              <Text style={{ color: textColor, fontSize: 13, fontWeight: 500 }}>Ngày:</Text>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                style={{
                  background: inputBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 6,
                  color: textColor,
                  fontSize: 13,
                  padding: '5px 10px',
                  outline: 'none',
                  cursor: 'pointer',
                  colorScheme: isDark ? 'dark' : 'light',
                }}
              />
            </div>

            {/* Class selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ color: mutedColor, fontSize: 14 }} />
              <Text style={{ color: textColor, fontSize: 13, fontWeight: 500 }}>Lớp:</Text>
              <Select
                value={selectedClassId || undefined}
                onChange={setSelectedClassId}
                placeholder="Chọn lớp..."
                style={{ minWidth: 120 }}
                size="middle"
              >
                {data.classes.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </div>

            <div style={{ flex: 1 }} />

            {/* Quick actions */}
            <Space size={8}>
              <Button
                icon={<ThunderboltOutlined />}
                size="middle"
                onClick={() => markAll('present')}
                disabled={!selectedClass || selectedClass.students.length === 0}
                style={{ background: PRIMARY_BG, borderColor: PRIMARY_BORDER, color: PRIMARY, fontSize: 13 }}
              >
                Điểm danh tất cả
              </Button>
              <Button
                icon={<ExclamationCircleOutlined />}
                size="middle"
                onClick={() => markAll('absent')}
                disabled={!selectedClass || selectedClass.students.length === 0}
                style={{ background: ABSENT_BG, borderColor: ABSENT_BORDER, color: ABSENT_COLOR, fontSize: 13 }}
              >
                Vắng tất cả
              </Button>
              <Button
                icon={<HistoryOutlined />}
                size="middle"
                onClick={() => setHistoryModalOpen(true)}
                disabled={!selectedClass}
                style={{ borderColor: cardBorder, color: textColor }}
              >
                Lịch sử
              </Button>
              <Button
                icon={<CopyOutlined />}
                size="middle"
                onClick={handleExport}
                disabled={!selectedClass}
                style={{ borderColor: cardBorder, color: textColor }}
              >
                Xuất
              </Button>
            </Space>
          </div>

          {/* Summary stats */}
          {selectedClass && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <SummaryCard label="Tổng" count={stats.total} color={isDark ? '#888' : '#666'} bg={cardBg} border={cardBorder} isDark={isDark} />
              <SummaryCard label="Có mặt" count={stats.present} color={PRIMARY} bg={PRIMARY_BG} border={PRIMARY_BORDER} isDark={isDark} />
              <SummaryCard label="Vắng mặt" count={stats.absent} color={ABSENT_COLOR} bg={ABSENT_BG} border={ABSENT_BORDER} isDark={isDark} />
              <SummaryCard label="Đi trễ" count={stats.late} color={LATE_COLOR} bg={LATE_BG} border={LATE_BORDER} isDark={isDark} />
              <SummaryCard
                label="Chưa điểm danh"
                count={stats.none}
                color={isDark ? '#666' : '#999'}
                bg={isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'}
                border={isDark ? '#2a2a2a' : '#e0e0e0'}
                isDark={isDark}
              />
            </div>
          )}

          {/* Attendance table */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {!selectedClass ? (
              <div style={{ padding: 48 }}>
                <Empty
                  description={
                    <Text style={{ color: mutedColor }}>
                      Chọn hoặc tạo lớp để bắt đầu điểm danh
                    </Text>
                  }
                />
              </div>
            ) : selectedClass.students.length === 0 ? (
              <div style={{ padding: 48 }}>
                <Empty
                  description={
                    <Text style={{ color: mutedColor }}>
                      Lớp chưa có học sinh. Thêm học sinh ở cột bên trái.
                    </Text>
                  }
                />
              </div>
            ) : (
              <Table
                dataSource={selectedClass.students}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="middle"
                style={{ background: cardBg }}
                rowClassName={() => 'attendance-row'}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Class Name Modal ── */}
      <Modal
        title={<Text style={{ color: headingColor, fontWeight: 700 }}>Đổi tên lớp</Text>}
        open={editClassModal}
        onCancel={() => setEditClassModal(false)}
        onOk={handleEditClass}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ style: { background: PRIMARY, borderColor: PRIMARY } }}
        styles={{ content: { background: cardBg, border: `1px solid ${cardBorder}` }, header: { background: cardBg, borderBottom: `1px solid ${cardBorder}` }, footer: { background: cardBg, borderTop: `1px solid ${cardBorder}` } }}
      >
        <Input
          value={editClassName}
          onChange={(e) => setEditClassName(e.target.value)}
          onPressEnter={handleEditClass}
          placeholder="Tên lớp..."
          style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
        />
      </Modal>

      {/* ── History Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ color: PRIMARY }} />
            <Text style={{ color: headingColor, fontWeight: 700 }}>
              Lịch sử điểm danh – {selectedClass?.name}
            </Text>
          </div>
        }
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        width={600}
        styles={{ content: { background: cardBg, border: `1px solid ${cardBorder}` }, header: { background: cardBg, borderBottom: `1px solid ${cardBorder}` } }}
      >
        {classHistory.length === 0 ? (
          <Empty description={<Text style={{ color: mutedColor }}>Chưa có dữ liệu điểm danh</Text>} />
        ) : (
          <Table
            dataSource={classHistory}
            columns={historyColumns}
            rowKey={(r) => r.date}
            pagination={{ pageSize: 10 }}
            size="small"
            style={{ background: cardBg }}
          />
        )}
      </Modal>

      {/* ── Export Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CopyOutlined style={{ color: PRIMARY }} />
            <Text style={{ color: headingColor, fontWeight: 700 }}>Xuất danh sách điểm danh</Text>
          </div>
        }
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setExportModalOpen(false)}>Đóng</Button>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyExport}
              style={{ background: PRIMARY, borderColor: PRIMARY, color: '#fff' }}
            >
              Sao chép
            </Button>
          </Space>
        }
        width={500}
        styles={{ content: { background: cardBg, border: `1px solid ${cardBorder}` }, header: { background: cardBg, borderBottom: `1px solid ${cardBorder}` }, footer: { background: cardBg, borderTop: `1px solid ${cardBorder}` } }}
      >
        <textarea
          readOnly
          value={exportText}
          style={{
            width: '100%',
            height: 320,
            background: isDark ? '#161616' : '#f9f9f9',
            border: `1px solid ${cardBorder}`,
            borderRadius: 8,
            color: textColor,
            fontSize: 13,
            fontFamily: 'monospace',
            padding: 12,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </Modal>
    </div>
  );
}
