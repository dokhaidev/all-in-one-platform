'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Tag,
  Switch,
  Tooltip,
  Empty,
  Badge,
  Divider,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  TeamOutlined,
  UserOutlined,
  EditOutlined,
  ClearOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ─────────────────────────────────────────────────────────────────

interface StudentClass {
  id: string;
  name: string;
  students: string[];
}

interface PickRecord {
  id: string;
  names: string[];
  timestamp: Date;
  classId: string;
  className: string;
}

// ─── Web Audio ─────────────────────────────────────────────────────────────

function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // silently fail if Web Audio not supported
  }
}

// ─── Storage ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'toolhub_name_picker';

function loadClasses(): StudentClass[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveClasses(classes: StudentClass[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch {
    // ignore
  }
}

// ─── Seed data ─────────────────────────────────────────────────────────────

function getDefaultClass(): StudentClass {
  return {
    id: crypto.randomUUID(),
    name: 'Lớp mẫu 10A1',
    students: [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thị Dung',
      'Hoàng Văn Em', 'Đặng Thị Phương', 'Bùi Quang Huy', 'Ngô Thị Lan',
      'Vũ Minh Khang', 'Đinh Thị Hoa',
    ],
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface SpinDisplayProps {
  spinningName: string | null;
  winners: string[];
  isSpinning: boolean;
  hasStarted: boolean;
  isDark: boolean;
}

function SpinDisplay({ spinningName, winners, isSpinning, hasStarted, isDark }: SpinDisplayProps) {
  const cardBg = isDark ? '#1a1a1a' : '#f8f8f8';
  const borderColor = isSpinning ? '#50C878' : winners.length > 0 ? '#50C878' : (isDark ? '#2e2e2e' : '#e0e0e0');
  const glowStyle = winners.length > 0 && !isSpinning
    ? { boxShadow: '0 0 32px rgba(80,200,120,0.35)' }
    : isSpinning
    ? { boxShadow: '0 0 16px rgba(80,200,120,0.2)' }
    : {};

  const displayName = isSpinning ? spinningName : winners.length > 0 ? winners.join('  •  ') : null;

  return (
    <div
      style={{
        minHeight: 220,
        borderRadius: 16,
        border: `2px solid ${borderColor}`,
        background: cardBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        ...glowStyle,
        padding: '32px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background pulse when spinning */}
      {isSpinning && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(80,200,120,0.06) 0%, transparent 70%)',
            animation: 'none',
          }}
        />
      )}

      {!hasStarted && !isSpinning && winners.length === 0 && (
        <div style={{ textAlign: 'center' }}>
          <ThunderboltOutlined style={{ fontSize: 48, color: isDark ? '#333' : '#ccc', marginBottom: 16, display: 'block' }} />
          <div style={{ color: isDark ? '#555' : '#aaa', fontSize: 16 }}>
            Nhấn <strong style={{ color: '#50C878' }}>Bốc thăm!</strong> để bắt đầu
          </div>
        </div>
      )}

      {(isSpinning || displayName) && (
        <div
          style={{
            fontSize: isSpinning ? (displayName && displayName.length > 20 ? 24 : 32) : 36,
            fontWeight: 700,
            color: isSpinning ? '#50C878' : '#ffffff',
            textAlign: 'center',
            letterSpacing: isSpinning ? '0.05em' : '0.02em',
            transition: 'font-size 0.15s',
            lineHeight: 1.3,
            transform: winners.length > 0 && !isSpinning ? 'scale(1.05)' : 'scale(1)',
            transitionProperty: 'transform, color',
            transitionDuration: '0.4s',
          }}
        >
          {displayName}
        </div>
      )}

      {winners.length > 0 && !isSpinning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#50C878', fontSize: 14, marginTop: 8 }}>
          <TrophyOutlined />
          <span>Được chọn!</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function NamePickerTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // ── Theme tokens ───────────────────────────────────────────────────────
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const labelColor = isDark ? '#aaa' : '#555';

  // ── State ──────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState<string | null>(null);
  const [winners, setWinners] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [history, setHistory] = useState<PickRecord[]>([]);
  const [excludePicked, setExcludePicked] = useState(false);
  const [pickCount, setPickCount] = useState<number>(1);
  const [pickedInSession, setPickedInSession] = useState<Set<string>>(new Set());

  // Class management modals
  const [addClassModal, setAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [editClassModal, setEditClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<StudentClass | null>(null);
  const [editClassName, setEditClassName] = useState('');

  // Student management
  const [addStudentInput, setAddStudentInput] = useState('');
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // ── Load from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    let stored = loadClasses();
    if (stored.length === 0) {
      const def = getDefaultClass();
      stored = [def];
      saveClasses(stored);
    }
    setClasses(stored);
    setSelectedClassId(stored[0].id);
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────
  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  const availableStudents = selectedClass
    ? excludePicked
      ? selectedClass.students.filter((s) => !pickedInSession.has(s))
      : selectedClass.students
    : [];

  // ── Class CRUD ─────────────────────────────────────────────────────────
  const handleAddClass = () => {
    const name = newClassName.trim();
    if (!name) return;
    const nc: StudentClass = { id: crypto.randomUUID(), name, students: [] };
    const updated = [...classes, nc];
    setClasses(updated);
    saveClasses(updated);
    setSelectedClassId(nc.id);
    setNewClassName('');
    setAddClassModal(false);
    messageApi.success(`Đã tạo lớp "${name}"`);
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    saveClasses(updated);
    if (selectedClassId === id) {
      setSelectedClassId(updated[0]?.id ?? '');
    }
    messageApi.success('Đã xóa lớp');
  };

  const handleSaveEditClass = () => {
    if (!editingClass) return;
    const name = editClassName.trim();
    if (!name) return;
    const updated = classes.map((c) => c.id === editingClass.id ? { ...c, name } : c);
    setClasses(updated);
    saveClasses(updated);
    setEditClassModal(false);
    setEditingClass(null);
  };

  // ── Student CRUD ───────────────────────────────────────────────────────
  const addStudents = useCallback((names: string[]) => {
    const filtered = names.map((n) => n.trim()).filter(Boolean);
    if (!filtered.length || !selectedClassId) return 0;
    setClasses((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        const existing = new Set(c.students);
        const newOnes = filtered.filter((n) => !existing.has(n));
        return { ...c, students: [...c.students, ...newOnes] };
      });
      saveClasses(updated);
      return updated;
    });
    return filtered.length;
  }, [selectedClassId]);

  const handleAddStudent = () => {
    const name = addStudentInput.trim();
    if (!name) return;
    const added = addStudents([name]);
    if (added) {
      setAddStudentInput('');
      messageApi.success(`Đã thêm "${name}"`);
    } else {
      messageApi.warning('Tên đã tồn tại trong lớp');
    }
  };

  const handleDeleteStudent = (name: string) => {
    setClasses((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        return { ...c, students: c.students.filter((s) => s !== name) };
      });
      saveClasses(updated);
      return updated;
    });
  };

  const handleImport = () => {
    const names = importText.split('\n').map((n) => n.trim()).filter(Boolean);
    if (!names.length) { messageApi.warning('Danh sách trống'); return; }
    addStudents(names);
    messageApi.success(`Đã nhập ${names.length} tên`);
    setImportText('');
    setImportModal(false);
  };

  // ── Spin logic ─────────────────────────────────────────────────────────
  const handleSpin = () => {
    if (isSpinning) return;
    if (!selectedClass || availableStudents.length === 0) {
      messageApi.warning(
        availableStudents.length === 0 && excludePicked
          ? 'Tất cả học sinh đã được chọn. Hãy reset phiên.'
          : 'Lớp không có học sinh nào. Hãy thêm học sinh trước.'
      );
      return;
    }

    const count = Math.min(pickCount, availableStudents.length);

    setIsSpinning(true);
    setWinners([]);
    setHasStarted(true);

    // Pick the winners upfront
    const shuffled = [...availableStudents].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);

    // Cycling animation: start fast, slow down
    let elapsed = 0;
    const TOTAL_MS = 2200;
    const allStudents = selectedClass.students;

    const tick = () => {
      elapsed += 1;
      const progress = elapsed / 20; // calls so far in the schedule

      // Show a random name while spinning
      const rnd = allStudents[Math.floor(Math.random() * allStudents.length)];
      setSpinningName(rnd);

      // Schedule next tick with increasing delay
      const delay =
        progress < 5 ? 60 :
        progress < 10 ? 100 :
        progress < 15 ? 160 :
        progress < 18 ? 260 :
        400;

      const totalPlanned = elapsed * delay;
      if (totalPlanned < TOTAL_MS) {
        intervalRef.current = setTimeout(tick, delay);
      } else {
        // Reveal winners
        setIsSpinning(false);
        setSpinningName(null);
        setWinners(chosen);
        playDing();

        const record: PickRecord = {
          id: crypto.randomUUID(),
          names: chosen,
          timestamp: new Date(),
          classId: selectedClassId,
          className: selectedClass.name,
        };
        setHistory((prev) => [record, ...prev].slice(0, 50));

        if (excludePicked) {
          setPickedInSession((prev) => {
            const next = new Set(prev);
            chosen.forEach((n) => next.add(n));
            return next;
          });
        }
      }
    };

    intervalRef.current = setTimeout(tick, 60);
  };

  const handleResetSession = () => {
    setPickedInSession(new Set());
    setWinners([]);
    setHasStarted(false);
    setHistory([]);
    messageApi.success('Đã reset phiên bốc thăm');
  };

  // ── Cleanup ────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: bg }}>
      {contextHolder}

      {/* Settings bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          marginBottom: 20,
          padding: '14px 20px',
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
        }}
      >
        {/* Class selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px' }}>
          <TeamOutlined style={{ color: '#50C878', fontSize: 16 }} />
          <span style={{ color: labelColor, fontSize: 13, whiteSpace: 'nowrap' }}>Lớp học:</span>
          <Select
            value={selectedClassId || undefined}
            onChange={(v) => { setSelectedClassId(v); setWinners([]); setHasStarted(false); }}
            style={{ flex: 1, minWidth: 150 }}
            placeholder="Chọn lớp"
            options={classes.map((c) => ({
              label: `${c.name} (${c.students.length} HS)`,
              value: c.id,
            }))}
          />
        </div>

        <div style={{ width: 1, height: 24, background: borderColor }} />

        {/* Pick count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: labelColor, fontSize: 13, whiteSpace: 'nowrap' }}>Số lượng bốc:</span>
          <Select
            value={pickCount}
            onChange={setPickCount}
            style={{ width: 70 }}
            options={[
              { label: '1', value: 1 },
              { label: '2', value: 2 },
              { label: '3', value: 3 },
            ]}
          />
        </div>

        <div style={{ width: 1, height: 24, background: borderColor }} />

        {/* Exclude toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            size="small"
            checked={excludePicked}
            onChange={setExcludePicked}
            style={{ background: excludePicked ? '#50C878' : undefined }}
          />
          <span style={{ color: labelColor, fontSize: 13 }}>Loại trừ đã chọn</span>
          {excludePicked && pickedInSession.size > 0 && (
            <Tag color="warning" style={{ margin: 0 }}>
              {pickedInSession.size} đã chọn
            </Tag>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Tooltip title="Reset phiên bốc thăm">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetSession}
              size="small"
              style={{ borderColor, color: mutedColor }}
            >
              Reset
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Main content: 2 columns */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* LEFT: Class/student management */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <Card
            size="small"
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: '16px' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: textColor, fontSize: 14, fontWeight: 600 }}>
                  Quản lý lớp học
                </span>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddClassModal(true)}
                  style={{ background: '#50C878', border: 'none', fontSize: 12 }}
                >
                  Thêm lớp
                </Button>
              </div>
            }
          >
            {/* Class list */}
            <div style={{ marginBottom: 16 }}>
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => { setSelectedClassId(cls.id); setWinners([]); setHasStarted(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: 'pointer',
                    background: cls.id === selectedClassId
                      ? 'rgba(80,200,120,0.12)'
                      : 'transparent',
                    border: cls.id === selectedClassId
                      ? '1px solid rgba(80,200,120,0.3)'
                      : `1px solid transparent`,
                    transition: 'background 0.15s',
                  }}
                >
                  <div>
                    <div style={{ color: cls.id === selectedClassId ? '#50C878' : textColor, fontWeight: 600, fontSize: 13 }}>
                      {cls.name}
                    </div>
                    <div style={{ color: mutedColor, fontSize: 11 }}>{cls.students.length} học sinh</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Đổi tên">
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        style={{ color: mutedColor, padding: '0 4px', height: 24 }}
                        onClick={() => {
                          setEditingClass(cls);
                          setEditClassName(cls.name);
                          setEditClassModal(true);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa lớp">
                      <Popconfirm
                        title="Xóa lớp này?"
                        onConfirm={() => handleDeleteClass(cls.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          type="text"
                          icon={<DeleteOutlined />}
                          style={{ color: '#e05555', padding: '0 4px', height: 24 }}
                        />
                      </Popconfirm>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>

            <Divider style={{ margin: '12px 0', borderColor }} />

            {/* Student list for selected class */}
            {selectedClass ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: labelColor, fontSize: 13, fontWeight: 600 }}>
                    Danh sách HS ({availableStudents.length}/{selectedClass.students.length})
                  </span>
                  <Button
                    size="small"
                    icon={<ImportOutlined />}
                    onClick={() => setImportModal(true)}
                    style={{ borderColor, color: mutedColor, fontSize: 11 }}
                  >
                    Nhập
                  </Button>
                </div>

                {/* Add student input */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <Input
                    placeholder="Tên học sinh..."
                    value={addStudentInput}
                    onChange={(e) => setAddStudentInput(e.target.value)}
                    onPressEnter={handleAddStudent}
                    size="small"
                    style={{ flex: 1, background: isDark ? '#1a1a1a' : '#f9f9f9', borderColor, color: textColor }}
                    prefix={<UserOutlined style={{ color: mutedColor, fontSize: 11 }} />}
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddStudent}
                    style={{ background: '#50C878', border: 'none', padding: '0 10px' }}
                  />
                </div>

                {/* Student tags */}
                <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selectedClass.students.length === 0 ? (
                    <Empty
                      description={<span style={{ color: mutedColor, fontSize: 12 }}>Chưa có học sinh</span>}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ margin: '12px auto' }}
                    />
                  ) : (
                    selectedClass.students.map((name) => {
                      const isPicked = pickedInSession.has(name);
                      return (
                        <Tag
                          key={name}
                          closable
                          onClose={() => handleDeleteStudent(name)}
                          style={{
                            background: isPicked
                              ? 'rgba(80,200,120,0.15)'
                              : isDark ? '#1a1a1a' : '#f0f0f0',
                            borderColor: isPicked ? 'rgba(80,200,120,0.4)' : borderColor,
                            color: isPicked ? '#50C878' : textColor,
                            fontSize: 12,
                            margin: 0,
                            opacity: (excludePicked && isPicked) ? 0.5 : 1,
                          }}
                        >
                          {name}
                        </Tag>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <Empty
                description={<span style={{ color: mutedColor, fontSize: 12 }}>Tạo lớp học để bắt đầu</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </div>

        {/* RIGHT: Picker interface */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Spin display */}
          <SpinDisplay
            spinningName={spinningName}
            winners={winners}
            isSpinning={isSpinning}
            hasStarted={hasStarted}
            isDark={isDark}
          />

          {/* Spin button */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleSpin}
              loading={isSpinning}
              disabled={!selectedClass || availableStudents.length === 0}
              style={{
                background: isSpinning ? '#3aa362' : '#50C878',
                border: 'none',
                height: 56,
                paddingLeft: 40,
                paddingRight: 40,
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 12,
                boxShadow: isSpinning ? 'none' : '0 4px 20px rgba(80,200,120,0.4)',
                transition: 'all 0.3s',
              }}
            >
              {isSpinning ? 'Đang bốc thăm...' : 'Bốc thăm!'}
            </Button>

            {selectedClass && (
              <div style={{ color: mutedColor, fontSize: 12, marginTop: 8 }}>
                {availableStudents.length} học sinh có thể được chọn
                {excludePicked && pickedInSession.size > 0 && ` (đã loại ${pickedInSession.size})`}
              </div>
            )}
          </div>

          {/* History */}
          <Card
            size="small"
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
            bodyStyle={{ padding: '16px' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HistoryOutlined style={{ color: '#50C878' }} />
                  <span style={{ color: textColor, fontSize: 14, fontWeight: 600 }}>Lịch sử phiên</span>
                  {history.length > 0 && <Badge count={history.length} style={{ background: '#50C878' }} />}
                </div>
                {history.length > 0 && (
                  <Button
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleResetSession}
                    style={{ borderColor, color: mutedColor, fontSize: 12 }}
                  >
                    Xóa lịch sử
                  </Button>
                )}
              </div>
            }
          >
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: mutedColor, fontSize: 13 }}>
                Chưa có lịch sử bốc thăm trong phiên này
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((record, idx) => (
                  <div
                    key={record.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: idx === 0
                        ? 'rgba(80,200,120,0.08)'
                        : isDark ? '#1a1a1a' : '#f8f8f8',
                      border: `1px solid ${idx === 0 ? 'rgba(80,200,120,0.25)' : borderColor}`,
                    }}
                  >
                    <div style={{ color: mutedColor, fontSize: 11, minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                      #{history.length - idx}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {record.names.map((n) => (
                          <span
                            key={n}
                            style={{
                              color: idx === 0 ? '#50C878' : textColor,
                              fontWeight: idx === 0 ? 700 : 500,
                              fontSize: 14,
                            }}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                      <div style={{ color: mutedColor, fontSize: 11, marginTop: 2 }}>
                        {record.className}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: mutedColor, fontSize: 11 }}>
                      <ClockCircleOutlined style={{ fontSize: 10 }} />
                      {record.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Add class */}
      <Modal
        title={<span style={{ color: textColor }}>Thêm lớp học mới</span>}
        open={addClassModal}
        onOk={handleAddClass}
        onCancel={() => { setAddClassModal(false); setNewClassName(''); }}
        okText="Tạo lớp"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
        styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
      >
        <Input
          placeholder="Tên lớp (ví dụ: 10A1, 11B2...)"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          onPressEnter={handleAddClass}
          style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor }}
          autoFocus
        />
      </Modal>

      {/* Edit class name */}
      <Modal
        title={<span style={{ color: textColor }}>Đổi tên lớp</span>}
        open={editClassModal}
        onOk={handleSaveEditClass}
        onCancel={() => { setEditClassModal(false); setEditingClass(null); }}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
        styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
      >
        <Input
          placeholder="Tên lớp mới"
          value={editClassName}
          onChange={(e) => setEditClassName(e.target.value)}
          onPressEnter={handleSaveEditClass}
          style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor }}
          autoFocus
        />
      </Modal>

      {/* Import students */}
      <Modal
        title={<span style={{ color: textColor }}>Nhập danh sách học sinh</span>}
        open={importModal}
        onOk={handleImport}
        onCancel={() => { setImportModal(false); setImportText(''); }}
        okText="Nhập"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
        styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
        width={500}
      >
        <div style={{ color: mutedColor, fontSize: 12, marginBottom: 10 }}>
          Dán danh sách tên học sinh, mỗi dòng một tên. Tên trùng sẽ bị bỏ qua.
        </div>
        <Input.TextArea
          rows={10}
          placeholder={'Nguyễn Văn An\nTrần Thị Bình\nLê Hoàng Cường\n...'}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          style={{
            background: isDark ? '#1a1a1a' : '#fff',
            borderColor,
            color: textColor,
            fontFamily: 'monospace',
            fontSize: 13,
            resize: 'vertical',
          }}
          autoFocus
        />
        {importText && (
          <div style={{ color: '#50C878', fontSize: 12, marginTop: 6 }}>
            {importText.split('\n').filter((l) => l.trim()).length} tên sẽ được nhập
          </div>
        )}
      </Modal>
    </div>
  );
}
