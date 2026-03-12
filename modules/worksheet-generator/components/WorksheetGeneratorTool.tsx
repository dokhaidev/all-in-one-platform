'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Select,
  InputNumber,
  Modal,
  Space,
  Typography,
  Tooltip,
  message,
  Popconfirm,
  Tag,
  Divider,
  Switch,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  EyeOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckSquareOutlined,
  AlignLeftOutlined,
  FormOutlined,
  UnorderedListOutlined,
  CopyOutlined,
  FileTextOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.2)';
const STORAGE_KEY = 'toolhub_worksheet_v1';

type QuestionType = 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MCOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  required: boolean;
  options: MCOption[]; // only for multiple-choice
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  blankLines?: number; // for fill-blank / short-answer
}

interface WorksheetMeta {
  title: string;
  subject: string;
  grade: string;
  timeLimit: number; // minutes
  teacherName: string;
  date: string;
  schoolName: string;
  instructions: string;
}

interface Worksheet {
  id: string;
  meta: WorksheetMeta;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

interface SavedWorksheet {
  id: string;
  name: string;
  subject: string;
  questionCount: number;
  savedAt: string;
  data: Worksheet;
}

interface StorageData {
  saved: SavedWorksheet[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 11);
}

function loadStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { saved: [] };
    return JSON.parse(raw) as StorageData;
  } catch {
    return { saved: [] };
  }
}

function saveStorage(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function defaultMeta(): WorksheetMeta {
  return {
    title: 'PHIẾU BÀI TẬP',
    subject: '',
    grade: '',
    timeLimit: 45,
    teacherName: '',
    date: new Date().toLocaleDateString('vi-VN'),
    schoolName: '',
    instructions: 'Học sinh đọc kỹ yêu cầu và trả lời các câu hỏi sau:',
  };
}

function defaultQuestion(type: QuestionType): Question {
  return {
    id: genId(),
    type,
    text: '',
    points: 1,
    required: true,
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ],
    correctAnswer: undefined,
    blankLines: 3,
  };
}

const typeLabels: Record<QuestionType, string> = {
  'multiple-choice': 'Trắc nghiệm',
  'fill-blank': 'Điền vào chỗ trống',
  'short-answer': 'Trả lời ngắn',
  'essay': 'Tự luận',
};

const typeIcons: Record<QuestionType, React.ReactNode> = {
  'multiple-choice': <CheckSquareOutlined />,
  'fill-blank': <FormOutlined />,
  'short-answer': <AlignLeftOutlined />,
  'essay': <UnorderedListOutlined />,
};

const typeColors: Record<QuestionType, string> = {
  'multiple-choice': '#50C878',
  'fill-blank': '#4da6ff',
  'short-answer': '#faad14',
  'essay': '#b37feb',
};

// ─── Print styles injected once ───────────────────────────────────────────────

const PRINT_STYLE = `
@media print {
  .no-print { display: none !important; }
  .print-area { display: block !important; }
  body { background: #fff !important; color: #000 !important; font-size: 13pt; }
  .worksheet-preview-root { background: #fff !important; padding: 0 !important; }
  @page { margin: 20mm; }
}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionTypeButton({
  type,
  onClick,
  isDark,
}: {
  type: QuestionType;
  onClick: () => void;
  isDark: boolean;
}) {
  const color = typeColors[type];
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 6px',
        borderRadius: 8,
        border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
        background: isDark ? '#1a1a1a' : '#fafafa',
        cursor: 'pointer',
        color: isDark ? '#888' : '#666',
        fontSize: 11,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = color;
        el.style.color = color;
        el.style.background = `${color}12`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = isDark ? '#333' : '#e0e0e0';
        el.style.color = isDark ? '#888' : '#666';
        el.style.background = isDark ? '#1a1a1a' : '#fafafa';
      }}
    >
      <span style={{ fontSize: 18 }}>{typeIcons[type]}</span>
      <span style={{ textAlign: 'center', lineHeight: 1.3 }}>{typeLabels[type]}</span>
    </button>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDark,
}: {
  question: Question;
  index: number;
  total: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isDark: boolean;
}) {
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const inputBg = isDark ? '#1a1a1a' : '#fff';
  const mutedColor = isDark ? '#666' : '#aaa';
  const color = typeColors[question.type];
  const [expanded, setExpanded] = useState(true);

  const update = (partial: Partial<Question>) => onChange({ ...question, ...partial });
  const updateOption = (key: 'A' | 'B' | 'C' | 'D', text: string) => {
    const newOptions = question.options.map((o) =>
      o.key === key ? { ...o, text } : o
    );
    update({ options: newOptions });
  };

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: isDark ? '#282828' : '#f9f9f9',
          borderBottom: expanded ? `1px solid ${cardBorder}` : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ fontSize: 13, color }}>{typeIcons[question.type]}</span>
        <Text style={{ color: textColor, fontWeight: 600, fontSize: 13, flex: 1 }}>
          Câu {index + 1}
          {question.text ? `: ${question.text.slice(0, 50)}${question.text.length > 50 ? '...' : ''}` : ''}
        </Text>
        <Tag
          style={{
            background: `${color}14`,
            color,
            border: `1px solid ${color}40`,
            fontSize: 11,
            borderRadius: 5,
            lineHeight: '18px',
          }}
        >
          {typeLabels[question.type]}
        </Tag>
        <Tag
          style={{
            background: isDark ? '#2a2a2a' : '#f0f0f0',
            color: mutedColor,
            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            fontSize: 11,
            borderRadius: 5,
          }}
        >
          {question.points}đ
        </Tag>
        <Space size={2} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Lên">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              style={{
                background: 'transparent', border: 'none', cursor: index === 0 ? 'default' : 'pointer',
                color: index === 0 ? (isDark ? '#333' : '#ddd') : mutedColor, fontSize: 13, padding: '2px 4px',
              }}
            >
              <ArrowUpOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Xuống">
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              style={{
                background: 'transparent', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer',
                color: index === total - 1 ? (isDark ? '#333' : '#ddd') : mutedColor, fontSize: 13, padding: '2px 4px',
              }}
            >
              <ArrowDownOutlined />
            </button>
          </Tooltip>
          <Popconfirm title="Xóa câu hỏi này?" onConfirm={onDelete} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: 13, padding: '2px 4px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#e05555'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
            >
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </Space>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Question text */}
          <div>
            <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 5 }}>Nội dung câu hỏi *</Text>
            <TextArea
              value={question.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Nhập câu hỏi..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ background: inputBg, borderColor: cardBorder, color: textColor, fontSize: 13, resize: 'vertical' }}
            />
          </div>

          {/* Settings row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: mutedColor, fontSize: 12 }}>Điểm:</Text>
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                value={question.points}
                onChange={(v) => update({ points: v ?? 1 })}
                size="small"
                style={{ width: 70, background: inputBg, borderColor: cardBorder }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: mutedColor, fontSize: 12 }}>Bắt buộc:</Text>
              <Switch
                checked={question.required}
                onChange={(v) => update({ required: v })}
                size="small"
                style={{ background: question.required ? PRIMARY : undefined }}
              />
            </div>
            {(question.type === 'fill-blank' || question.type === 'short-answer' || question.type === 'essay') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: mutedColor, fontSize: 12 }}>Dòng trống:</Text>
                <InputNumber
                  min={1}
                  max={20}
                  value={question.blankLines ?? 3}
                  onChange={(v) => update({ blankLines: v ?? 3 })}
                  size="small"
                  style={{ width: 60, background: inputBg, borderColor: cardBorder }}
                />
              </div>
            )}
          </div>

          {/* Multiple choice options */}
          {question.type === 'multiple-choice' && (
            <div>
              <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 8 }}>
                Phương án trả lời
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {question.options.map((opt) => (
                  <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background:
                          question.correctAnswer === opt.key ? `${PRIMARY}20` : (isDark ? '#2a2a2a' : '#f5f5f5'),
                        border: `2px solid ${question.correctAnswer === opt.key ? PRIMARY : (isDark ? '#3a3a3a' : '#ddd')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        color: question.correctAnswer === opt.key ? PRIMARY : mutedColor,
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => update({ correctAnswer: question.correctAnswer === opt.key ? undefined : opt.key })}
                      title="Nhấp để đánh dấu đáp án đúng"
                    >
                      {opt.key}
                    </div>
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(opt.key, e.target.value)}
                      placeholder={`Phương án ${opt.key}...`}
                      size="small"
                      style={{
                        background: inputBg,
                        borderColor: question.correctAnswer === opt.key ? `${PRIMARY}60` : cardBorder,
                        color: textColor,
                        fontSize: 13,
                      }}
                    />
                  </div>
                ))}
                {question.correctAnswer && (
                  <Text style={{ color: PRIMARY, fontSize: 11 }}>
                    Đáp án đúng: {question.correctAnswer}
                  </Text>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Preview component ────────────────────────────────────────────────────────

function WorksheetPreview({ meta, questions, isDark }: { meta: WorksheetMeta; questions: Question[]; isDark: boolean }) {
  const previewBg = '#ffffff';
  const previewText = '#111111';
  const previewMuted = '#444444';
  const previewBorder = '#cccccc';

  const totalPoints = questions.reduce((s, q) => s + q.points, 0);

  return (
    <div
      className="worksheet-preview-root"
      style={{
        background: previewBg,
        color: previewText,
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: 13,
        lineHeight: 1.7,
        padding: '24px 28px',
        minHeight: 500,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 12, borderBottom: `2px solid ${previewBorder}`, paddingBottom: 12 }}>
        {meta.schoolName && (
          <div style={{ fontSize: 12, fontWeight: 600, color: previewMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {meta.schoolName}
          </div>
        )}
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: previewText,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '6px 0 4px',
          }}
        >
          {meta.title || 'PHIẾU BÀI TẬP'}
        </div>
        <div style={{ fontSize: 12, color: previewMuted }}>
          {[meta.subject && `Môn: ${meta.subject}`, meta.grade && `Lớp: ${meta.grade}`, meta.timeLimit && `Thời gian: ${meta.timeLimit} phút`]
            .filter(Boolean)
            .join('  |  ')}
        </div>
      </div>

      {/* Info row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: previewMuted,
          marginBottom: 10,
          borderBottom: `1px solid ${previewBorder}`,
          paddingBottom: 8,
        }}
      >
        <span>Họ và tên: <span style={{ display: 'inline-block', width: 200, borderBottom: `1px solid ${previewBorder}` }}>&nbsp;</span></span>
        <span>Lớp: <span style={{ display: 'inline-block', width: 80, borderBottom: `1px solid ${previewBorder}` }}>&nbsp;</span></span>
        <span>Điểm: <span style={{ display: 'inline-block', width: 60, borderBottom: `1px solid ${previewBorder}` }}>&nbsp;</span></span>
      </div>

      {/* Meta info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: previewMuted, marginBottom: 14 }}>
        {meta.teacherName && <span>Giáo viên: {meta.teacherName}</span>}
        {meta.date && <span>Ngày: {meta.date}</span>}
        <span>Tổng điểm: {totalPoints}đ</span>
      </div>

      {/* Instructions */}
      {meta.instructions && (
        <div
          style={{
            fontStyle: 'italic',
            fontSize: 12,
            color: previewMuted,
            background: '#f9f9f9',
            border: `1px solid ${previewBorder}`,
            borderRadius: 4,
            padding: '6px 10px',
            marginBottom: 16,
          }}
        >
          {meta.instructions}
        </div>
      )}

      {/* Questions */}
      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '32px 0' }}>
          Chưa có câu hỏi nào. Thêm câu hỏi ở panel bên trái.
        </div>
      ) : (
        questions.map((q, idx) => (
          <div key={q.id} style={{ marginBottom: 20 }}>
            {/* Question text */}
            <div style={{ display: 'flex', gap: 6, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                Câu {idx + 1}
                {q.points > 0 && ` (${q.points}đ)`}:
              </span>
              <span style={{ fontWeight: 400 }}>{q.text || <em style={{ color: '#bbb' }}>Chưa có nội dung</em>}</span>
            </div>

            {/* Multiple choice */}
            {q.type === 'multiple-choice' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', paddingLeft: 16 }}>
                {q.options.map((opt) => (
                  <div key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{opt.key}.</span>
                    <span>{opt.text || <em style={{ color: '#bbb' }}>...</em>}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Fill blank / short answer / essay */}
            {(q.type === 'fill-blank' || q.type === 'short-answer' || q.type === 'essay') && (
              <div style={{ paddingLeft: 16, marginTop: 4 }}>
                {Array.from({ length: q.blankLines ?? 3 }).map((_, lineIdx) => (
                  <div
                    key={lineIdx}
                    style={{
                      borderBottom: `1px solid ${previewBorder}`,
                      height: 24,
                      marginBottom: 6,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 12,
          borderTop: `1px solid ${previewBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: previewMuted,
        }}
      >
        <span>— Hết —</span>
        <span>Tổng: {questions.length} câu / {totalPoints}đ</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorksheetGeneratorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme colors
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const headingColor = isDark ? '#e0e0e0' : '#111';
  const mutedColor = isDark ? '#666' : '#aaa';
  const inputBg = isDark ? '#1a1a1a' : '#fff';
  const sideBg = isDark ? '#1e1e1e' : '#fafafa';
  const sideBorder = isDark ? '#282828' : '#e0e0e0';

  // Worksheet state
  const [meta, setMeta] = useState<WorksheetMeta>(defaultMeta());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');

  // Storage state
  const [storage, setStorage] = useState<StorageData>({ saved: [] });
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  // Print style injection
  useEffect(() => {
    const existing = document.getElementById('worksheet-print-style');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'worksheet-print-style';
      style.textContent = PRINT_STYLE;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById('worksheet-print-style');
      if (el) el.remove();
    };
  }, []);

  // Load storage
  useEffect(() => {
    const s = loadStorage();
    setStorage(s);
  }, []);

  const updateMeta = (partial: Partial<WorksheetMeta>) => setMeta((m) => ({ ...m, ...partial }));

  // ── Questions ─────────────────────────────────────────────────────────────

  const addQuestion = (type: QuestionType) => {
    const q = defaultQuestion(type);
    setQuestions((qs) => [...qs, q]);
    if (activeView === 'preview') setActiveView('edit');
  };

  const updateQuestion = useCallback((updated: Question) => {
    setQuestions((qs) => qs.map((q) => (q.id === updated.id ? updated : q)));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setQuestions((qs) => {
      const arr = [...qs];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setQuestions((qs) => {
      if (index >= qs.length - 1) return qs;
      const arr = [...qs];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }, []);

  // ── Save / Load ───────────────────────────────────────────────────────────

  const handleSave = () => {
    const name = saveName.trim() || meta.title || 'Phiếu bài tập';
    const worksheet: Worksheet = {
      id: genId(),
      meta,
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved: SavedWorksheet = {
      id: genId(),
      name,
      subject: meta.subject,
      questionCount: questions.length,
      savedAt: new Date().toLocaleString('vi-VN'),
      data: worksheet,
    };
    const newStorage: StorageData = { saved: [saved, ...storage.saved].slice(0, 20) };
    setStorage(newStorage);
    saveStorage(newStorage);
    setSaveModalOpen(false);
    setSaveName('');
    messageApi.success(`Đã lưu phiếu "${name}"`);
  };

  const handleLoad = (saved: SavedWorksheet) => {
    setMeta(saved.data.meta);
    setQuestions(saved.data.questions);
    setLoadModalOpen(false);
    messageApi.success(`Đã tải phiếu "${saved.name}"`);
  };

  const handleDeleteSaved = (id: string) => {
    const newStorage: StorageData = { saved: storage.saved.filter((s) => s.id !== id) };
    setStorage(newStorage);
    saveStorage(newStorage);
    messageApi.success('Đã xóa phiếu');
  };

  const handleDuplicate = (saved: SavedWorksheet) => {
    const copy: SavedWorksheet = {
      ...saved,
      id: genId(),
      name: `${saved.name} (bản sao)`,
      savedAt: new Date().toLocaleString('vi-VN'),
    };
    const newStorage: StorageData = { saved: [copy, ...storage.saved].slice(0, 20) };
    setStorage(newStorage);
    saveStorage(newStorage);
    messageApi.success('Đã nhân bản phiếu');
  };

  // ── Print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    window.print();
  };

  // ── New worksheet ─────────────────────────────────────────────────────────

  const handleNew = () => {
    Modal.confirm({
      title: 'Tạo phiếu mới?',
      content: 'Nội dung hiện tại sẽ bị xóa.',
      okText: 'Tạo mới',
      cancelText: 'Hủy',
      onOk: () => {
        setMeta(defaultMeta());
        setQuestions([]);
        messageApi.success('Đã tạo phiếu mới');
      },
    });
  };

  const totalPoints = questions.reduce((s, q) => s + q.points, 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ background: bg }}>
      {contextHolder}

      {/* ── Toolbar ── */}
      <div
        className="no-print"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6, background: isDark ? '#1a1a1a' : '#f5f5f5', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setActiveView('edit')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: activeView === 'edit' ? 600 : 400,
              background: activeView === 'edit' ? (isDark ? '#2e2e2e' : '#fff') : 'transparent',
              color: activeView === 'edit' ? (isDark ? '#e0e0e0' : '#111') : mutedColor,
              boxShadow: activeView === 'edit' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <EditOutlined />
            Soạn thảo
          </button>
          <button
            onClick={() => setActiveView('preview')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: activeView === 'preview' ? 600 : 400,
              background: activeView === 'preview' ? (isDark ? '#2e2e2e' : '#fff') : 'transparent',
              color: activeView === 'preview' ? (isDark ? '#e0e0e0' : '#111') : mutedColor,
              boxShadow: activeView === 'preview' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <EyeOutlined />
            Xem trước
          </button>
        </div>

        <Divider type="vertical" style={{ height: 24, borderColor: cardBorder }} />

        <Space size={8} wrap>
          <Button
            icon={<FileTextOutlined />}
            size="middle"
            onClick={handleNew}
            style={{ borderColor: cardBorder, color: textColor }}
          >
            Mới
          </Button>
          <Button
            icon={<SaveOutlined />}
            size="middle"
            onClick={() => { setSaveName(meta.title || 'Phiếu bài tập'); setSaveModalOpen(true); }}
            style={{ background: PRIMARY_BG, borderColor: PRIMARY_BORDER, color: PRIMARY }}
          >
            Lưu
          </Button>
          <Button
            icon={<FolderOpenOutlined />}
            size="middle"
            onClick={() => setLoadModalOpen(true)}
            style={{ borderColor: cardBorder, color: textColor }}
          >
            Tải ({storage.saved.length})
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="middle"
            onClick={handlePrint}
            style={{ background: isDark ? '#222' : '#f5f5f5', borderColor: cardBorder, color: textColor }}
          >
            In / PDF
          </Button>
        </Space>

        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Tag style={{ background: PRIMARY_BG, color: PRIMARY, border: `1px solid ${PRIMARY_BORDER}`, borderRadius: 6 }}>
            {questions.length} câu hỏi
          </Tag>
          <Tag style={{ background: isDark ? '#2a2a2a' : '#f5f5f5', color: mutedColor, border: `1px solid ${cardBorder}`, borderRadius: 6 }}>
            {totalPoints}đ
          </Tag>
        </div>
      </div>

      {/* ── Main layout ── */}
      {activeView === 'edit' ? (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Left panel: Meta + Add questions */}
          <div
            className="no-print"
            style={{
              width: 320,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Worksheet info */}
            <div
              style={{
                background: sideBg,
                border: `1px solid ${sideBorder}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <FileTextOutlined style={{ color: PRIMARY, fontSize: 14 }} />
                <Text style={{ color: headingColor, fontWeight: 600, fontSize: 13 }}>Thông tin phiếu</Text>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Tiêu đề</Text>
                  <Input
                    value={meta.title}
                    onChange={(e) => updateMeta({ title: e.target.value })}
                    placeholder="PHIẾU BÀI TẬP"
                    size="small"
                    style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Môn học</Text>
                    <Input
                      value={meta.subject}
                      onChange={(e) => updateMeta({ subject: e.target.value })}
                      placeholder="Toán, Lý, Hóa..."
                      size="small"
                      style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
                    />
                  </div>
                  <div>
                    <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Lớp</Text>
                    <Input
                      value={meta.grade}
                      onChange={(e) => updateMeta({ grade: e.target.value })}
                      placeholder="10A1, 11B2..."
                      size="small"
                      style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
                    />
                  </div>
                </div>

                <div>
                  <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Trường</Text>
                  <Input
                    value={meta.schoolName}
                    onChange={(e) => updateMeta({ schoolName: e.target.value })}
                    placeholder="Tên trường..."
                    size="small"
                    style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Thời gian (phút)</Text>
                    <InputNumber
                      value={meta.timeLimit}
                      onChange={(v) => updateMeta({ timeLimit: v ?? 45 })}
                      min={1}
                      max={240}
                      size="small"
                      style={{ width: '100%', background: inputBg, borderColor: cardBorder }}
                    />
                  </div>
                  <div>
                    <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Ngày</Text>
                    <Input
                      value={meta.date}
                      onChange={(e) => updateMeta({ date: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      size="small"
                      style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
                    />
                  </div>
                </div>

                <div>
                  <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Giáo viên</Text>
                  <Input
                    value={meta.teacherName}
                    onChange={(e) => updateMeta({ teacherName: e.target.value })}
                    placeholder="Họ tên giáo viên..."
                    size="small"
                    style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
                  />
                </div>

                <div>
                  <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginBottom: 4 }}>Hướng dẫn</Text>
                  <TextArea
                    value={meta.instructions}
                    onChange={(e) => updateMeta({ instructions: e.target.value })}
                    placeholder="Hướng dẫn làm bài..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    style={{ background: inputBg, borderColor: cardBorder, color: textColor, fontSize: 12, resize: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Add question */}
            <div
              style={{
                background: sideBg,
                border: `1px solid ${sideBorder}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <PlusOutlined style={{ color: PRIMARY, fontSize: 14 }} />
                <Text style={{ color: headingColor, fontWeight: 600, fontSize: 13 }}>Thêm câu hỏi</Text>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                {(['multiple-choice', 'fill-blank', 'short-answer', 'essay'] as QuestionType[]).map((type) => (
                  <QuestionTypeButton key={type} type={type} onClick={() => addQuestion(type)} isDark={isDark} />
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Question editor */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {questions.length === 0 ? (
              <div
                style={{
                  background: cardBg,
                  border: `2px dashed ${cardBorder}`,
                  borderRadius: 12,
                  padding: '60px 24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 14, color: mutedColor }}>
                  <FormOutlined />
                </div>
                <Text style={{ color: mutedColor, fontSize: 14, display: 'block', marginBottom: 8 }}>
                  Chưa có câu hỏi nào
                </Text>
                <Text style={{ color: isDark ? '#444' : '#bbb', fontSize: 12 }}>
                  Chọn loại câu hỏi ở bên trái để bắt đầu thêm câu hỏi
                </Text>
              </div>
            ) : (
              <div>
                {questions.map((q, idx) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    index={idx}
                    total={questions.length}
                    onChange={updateQuestion}
                    onDelete={() => deleteQuestion(q.id)}
                    onMoveUp={() => moveUp(idx)}
                    onMoveDown={() => moveDown(idx)}
                    isDark={isDark}
                  />
                ))}

                {/* Add more CTA */}
                <div
                  style={{
                    border: `2px dashed ${isDark ? '#333' : '#e0e0e0'}`,
                    borderRadius: 10,
                    padding: '14px',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: mutedColor, fontSize: 12 }}>
                    Thêm câu hỏi từ panel bên trái
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Preview mode */
        <div>
          <div
            className="no-print"
            style={{
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: PRIMARY_BG,
              border: `1px solid ${PRIMARY_BORDER}`,
              borderRadius: 10,
            }}
          >
            <EyeOutlined style={{ color: PRIMARY }} />
            <Text style={{ color: PRIMARY, fontSize: 13 }}>
              Đây là bản xem trước. Nhấn <strong>In / PDF</strong> để in hoặc lưu PDF.
            </Text>
          </div>
          <div
            className="print-area"
            style={{
              background: isDark ? '#2a2a2a' : '#e8e8e8',
              padding: 24,
              borderRadius: 12,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                maxWidth: 794,
                margin: '0 auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <WorksheetPreview meta={meta} questions={questions} isDark={isDark} />
            </div>
          </div>
        </div>
      )}

      {/* ── Save Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SaveOutlined style={{ color: PRIMARY }} />
            <Text style={{ color: headingColor, fontWeight: 700 }}>Lưu phiếu bài tập</Text>
          </div>
        }
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ style: { background: PRIMARY, borderColor: PRIMARY } }}
        styles={{
          content: { background: cardBg, border: `1px solid ${cardBorder}` },
          header: { background: cardBg, borderBottom: `1px solid ${cardBorder}` },
          footer: { background: cardBg, borderTop: `1px solid ${cardBorder}` },
        }}
      >
        <div style={{ marginTop: 8 }}>
          <Text style={{ color: mutedColor, fontSize: 12, display: 'block', marginBottom: 6 }}>
            Tên phiếu
          </Text>
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onPressEnter={handleSave}
            placeholder="Nhập tên để lưu..."
            style={{ background: inputBg, borderColor: cardBorder, color: textColor }}
          />
          <Text style={{ color: mutedColor, fontSize: 11, display: 'block', marginTop: 8 }}>
            {questions.length} câu hỏi · {totalPoints}đ · {meta.subject || 'Không rõ môn'}
          </Text>
        </div>
      </Modal>

      {/* ── Load Modal ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpenOutlined style={{ color: PRIMARY }} />
            <Text style={{ color: headingColor, fontWeight: 700 }}>Phiếu đã lưu</Text>
          </div>
        }
        open={loadModalOpen}
        onCancel={() => setLoadModalOpen(false)}
        footer={null}
        width={620}
        styles={{
          content: { background: cardBg, border: `1px solid ${cardBorder}` },
          header: { background: cardBg, borderBottom: `1px solid ${cardBorder}` },
        }}
      >
        {storage.saved.length === 0 ? (
          <Empty description={<Text style={{ color: mutedColor }}>Chưa có phiếu nào được lưu</Text>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
            {storage.saved.map((s) => (
              <div
                key={s.id}
                style={{
                  background: sideBg,
                  border: `1px solid ${sideBorder}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: headingColor, fontWeight: 600, fontSize: 13, display: 'block' }}>
                    {s.name}
                  </Text>
                  <Text style={{ color: mutedColor, fontSize: 11 }}>
                    {[s.subject && `Môn: ${s.subject}`, `${s.questionCount} câu`, `Lưu: ${s.savedAt}`]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </Text>
                </div>
                <Space size={6}>
                  <Tooltip title="Nhân bản">
                    <button
                      onClick={() => handleDuplicate(s)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: 14, padding: 4 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = PRIMARY; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
                    >
                      <CopyOutlined />
                    </button>
                  </Tooltip>
                  <Button
                    size="small"
                    onClick={() => handleLoad(s)}
                    style={{ background: PRIMARY_BG, borderColor: PRIMARY_BORDER, color: PRIMARY, fontSize: 12 }}
                  >
                    Tải
                  </Button>
                  <Popconfirm
                    title="Xóa phiếu này?"
                    onConfirm={() => handleDeleteSaved(s.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: 14, padding: 4 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#e05555'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </Space>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
