'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, InputNumber, Select, Radio, Tooltip, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SaveOutlined,
  DownloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SwapOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.25)';

const STORAGE_KEY = 'toolhub_quiz_v1';

type QuestionType = 'trac-nghiem' | 'dung-sai' | 'tu-luan';

interface AnswerOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: AnswerOption[]; // for trac-nghiem
  correctOption: string;   // option id for trac-nghiem, 'dung'/'sai' for dung-sai
  points: number;
}

interface ExamInfo {
  schoolName: string;
  title: string;
  subject: string;
  grade: string;
  timeLimit: number;
  totalPoints: number;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultOptions(): AnswerOption[] {
  return [
    { id: genId(), text: '' },
    { id: genId(), text: '' },
    { id: genId(), text: '' },
    { id: genId(), text: '' },
  ];
}

function defaultQuestion(): Question {
  const opts = defaultOptions();
  return {
    id: genId(),
    type: 'trac-nghiem',
    text: '',
    options: opts,
    correctOption: opts[0].id,
    points: 1,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Print styles injected into <head> once ──────────────────────────────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #quiz-preview-panel, #quiz-preview-panel * { visibility: visible !important; }
  #quiz-preview-panel {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    padding: 32px 48px !important;
    background: #fff !important;
    z-index: 99999 !important;
  }
  .no-print { display: none !important; }
}
`;

export default function QuizGeneratorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // ── Theme tokens ────────────────────────────────────────────────────────
  const panelBg = isDark ? '#1e1e1e' : '#ffffff';
  const panelBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const sectionHeaderColor = isDark ? '#e0e0e0' : '#111111';
  const textColor = isDark ? '#c9c9c9' : '#1a1a1a';
  const mutedColor = isDark ? '#777' : '#aaa';
  const inputBg = isDark ? '#141414' : '#f9fafb';
  const inputBorder = isDark ? '#333' : '#d9d9d9';
  const cardBg = isDark ? '#252525' : '#f7f7f7';
  const cardBorder = isDark ? '#333' : '#e0e0e0';
  const previewBg = isDark ? '#1a1a1a' : '#f5f5f5';
  const previewCardBg = isDark ? '#fff' : '#fff';
  const previewCardBorder = isDark ? '#ddd' : '#ddd';

  // ── State ───────────────────────────────────────────────────────────────
  const [examInfo, setExamInfo] = useState<ExamInfo>({
    schoolName: 'Trường THPT Ví Dụ',
    title: '',
    subject: '',
    grade: '',
    timeLimit: 45,
    totalPoints: 10,
  });
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion()]);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  // ── Inject print style once ─────────────────────────────────────────────
  useEffect(() => {
    const existing = document.getElementById('quiz-print-style');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'quiz-print-style';
      style.textContent = PRINT_STYLE;
      document.head.appendChild(style);
    }
    return () => {
      // leave style in DOM so it persists across re-mounts on same page
    };
  }, []);

  // ── LocalStorage persistence ────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.examInfo) setExamInfo(data.examInfo);
        if (data.questions && data.questions.length > 0) setQuestions(data.questions);
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ examInfo, questions }));
    } catch {
      // ignore storage quota errors
    }
  }, [examInfo, questions]);

  // ── Exam info helpers ────────────────────────────────────────────────────
  const updateExamInfo = (field: keyof ExamInfo, value: string | number) => {
    setExamInfo((prev) => ({ ...prev, [field]: value }));
  };

  // ── Question helpers ─────────────────────────────────────────────────────
  const addQuestion = () => {
    setQuestions((prev) => [...prev, defaultQuestion()]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...patch };
        // when switching type, reset relevant fields
        if (patch.type && patch.type !== q.type) {
          if (patch.type === 'trac-nghiem') {
            const opts = defaultOptions();
            updated.options = opts;
            updated.correctOption = opts[0].id;
          } else if (patch.type === 'dung-sai') {
            updated.options = [];
            updated.correctOption = 'dung';
          } else {
            updated.options = [];
            updated.correctOption = '';
          }
        }
        return updated;
      })
    );
  };

  const updateOption = (qId: string, optId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
        };
      })
    );
  };

  const shuffleQuestions = useCallback(() => {
    setQuestions((prev) => shuffleArray(prev));
  }, []);

  const shuffleAnswers = useCallback(() => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.type !== 'trac-nghiem') return q;
        return { ...q, options: shuffleArray(q.options) };
      })
    );
  }, []);

  // ── Export helpers ──────────────────────────────────────────────────────
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ examInfo, questions }));
      msgApi.success('Đã lưu đề!');
    } catch {
      msgApi.error('Không thể lưu.');
    }
  };

  const handleDownloadJSON = () => {
    const data = JSON.stringify({ examInfo, questions }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `de-kiem-tra-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    msgApi.success('Đã tải xuống JSON!');
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Shared input style ───────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: inputBg,
    borderColor: inputBorder,
    color: textColor,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: mutedColor,
    marginBottom: 4,
    display: 'block',
  };

  // ── Letter labels for options ────────────────────────────────────────────
  const LETTERS = ['A', 'B', 'C', 'D'];

  // ── Answer key text helper ────────────────────────────────────────────────
  const getAnswerKeyText = (q: Question): string => {
    if (q.type === 'trac-nghiem') {
      const idx = q.options.findIndex((o) => o.id === q.correctOption);
      if (idx === -1) return '—';
      return LETTERS[idx] ?? '—';
    }
    if (q.type === 'dung-sai') {
      return q.correctOption === 'dung' ? 'Đúng' : 'Sai';
    }
    return '(Tự luận)';
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {contextHolder}

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          width: '100%',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL — Editor
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="no-print"
          style={{
            flex: 1,
            minWidth: 320,
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 12,
            padding: '20px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ fontSize: 16, color: PRIMARY }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
              Thông tin đề &amp; Câu hỏi
            </span>
          </div>

          {/* ── Exam info ─────────────────────────────────────────────── */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 10,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: sectionHeaderColor }}>
              Thông tin đề thi
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Tên trường</label>
                <Input
                  size="small"
                  value={examInfo.schoolName}
                  onChange={(e) => updateExamInfo('schoolName', e.target.value)}
                  placeholder="Trường THPT..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tiêu đề đề</label>
                <Input
                  size="small"
                  value={examInfo.title}
                  onChange={(e) => updateExamInfo('title', e.target.value)}
                  placeholder="Đề kiểm tra 15 phút..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Môn học</label>
                <Input
                  size="small"
                  value={examInfo.subject}
                  onChange={(e) => updateExamInfo('subject', e.target.value)}
                  placeholder="Toán, Văn, Anh..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Lớp / Khối</label>
                <Input
                  size="small"
                  value={examInfo.grade}
                  onChange={(e) => updateExamInfo('grade', e.target.value)}
                  placeholder="Lớp 10A1..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Thời gian (phút)</label>
                <InputNumber
                  size="small"
                  min={1}
                  max={300}
                  value={examInfo.timeLimit}
                  onChange={(v) => updateExamInfo('timeLimit', v ?? 45)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Tổng điểm</label>
                <InputNumber
                  size="small"
                  min={1}
                  max={100}
                  value={examInfo.totalPoints}
                  onChange={(v) => updateExamInfo('totalPoints', v ?? 10)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* ── Question list ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, idx) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={idx}
                isDark={isDark}
                cardBg={cardBg}
                cardBorder={cardBorder}
                inputBg={inputBg}
                inputBorder={inputBorder}
                textColor={textColor}
                mutedColor={mutedColor}
                sectionHeaderColor={sectionHeaderColor}
                letters={LETTERS}
                onUpdate={(patch) => updateQuestion(q.id, patch)}
                onUpdateOption={(optId, text) => updateOption(q.id, optId, text)}
                onDelete={() => deleteQuestion(q.id)}
                canDelete={questions.length > 1}
              />
            ))}
          </div>

          {/* ── Action buttons ─────────────────────────────────────────── */}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addQuestion}
            style={{
              width: '100%',
              borderColor: PRIMARY,
              color: PRIMARY,
            }}
          >
            Thêm câu hỏi
          </Button>

          <div style={{ display: 'flex', gap: 10 }}>
            <Tooltip title="Xáo trộn thứ tự câu hỏi">
              <Button
                icon={<ReloadOutlined />}
                onClick={shuffleQuestions}
                disabled={questions.length < 2}
                style={{ flex: 1 }}
              >
                Xáo trộn câu hỏi
              </Button>
            </Tooltip>
            <Tooltip title="Xáo trộn đáp án A/B/C/D">
              <Button
                icon={<SwapOutlined />}
                onClick={shuffleAnswers}
                disabled={!questions.some((q) => q.type === 'trac-nghiem')}
                style={{ flex: 1 }}
              >
                Xáo trộn đáp án
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL — Preview & Export
        ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            minWidth: 320,
            background: previewBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 12,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ fontSize: 16, color: PRIMARY }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: sectionHeaderColor }}>
                Xem trước đề
              </span>
            </div>

            {/* Toolbar buttons */}
            <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                size="small"
                icon={showAnswerKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowAnswerKey((v) => !v)}
              >
                {showAnswerKey ? 'Ẩn đáp án' : 'Hiện đáp án'}
              </Button>
              <Button
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSave}
                style={{ color: PRIMARY, borderColor: PRIMARY }}
              >
                Lưu đề
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownloadJSON}
              >
                Tải JSON
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                style={{ background: PRIMARY, borderColor: PRIMARY }}
              >
                In / Xuất PDF
              </Button>
            </div>
          </div>

          {/* ── Preview card ─────────────────────────────────────────── */}
          <div
            id="quiz-preview-panel"
            style={{
              background: previewCardBg,
              border: `1px solid ${previewCardBorder}`,
              borderRadius: 8,
              padding: '28px 32px',
              color: '#1a1a1a',
              fontFamily: '"Times New Roman", Georgia, serif',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
                {examInfo.schoolName || 'Trường THPT Ví Dụ'}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
              >
                {examInfo.title || 'ĐỀ KIỂM TRA'}
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
                {[
                  examInfo.subject && `Môn: ${examInfo.subject}`,
                  examInfo.grade && `Lớp: ${examInfo.grade}`,
                  examInfo.timeLimit && `Thời gian: ${examInfo.timeLimit} phút`,
                  examInfo.totalPoints && `Tổng điểm: ${examInfo.totalPoints}`,
                ]
                  .filter(Boolean)
                  .join('  |  ')}
              </div>
              <div
                style={{
                  borderTop: '2px solid #1a1a1a',
                  borderBottom: '1px solid #1a1a1a',
                  margin: '12px 0 4px',
                  paddingBottom: 4,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Họ và tên: .................................................</span>
                <span>Lớp: ...............</span>
                <span>Điểm: ...............</span>
              </div>
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {questions.map((q, idx) => (
                <PreviewQuestion
                  key={q.id}
                  question={q}
                  index={idx}
                  letters={LETTERS}
                  showAnswerKey={showAnswerKey}
                  getAnswerKeyText={getAnswerKeyText}
                />
              ))}
            </div>

            {/* Answer key section */}
            {showAnswerKey && (
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px dashed #999',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Đáp án
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px 16px',
                    fontSize: 13,
                  }}
                >
                  {questions.map((q, idx) => (
                    <span key={q.id}>
                      <strong>Câu {idx + 1}:</strong> {getAnswerKeyText(q)}
                      {q.type !== 'tu-luan' && ` (${q.points}đ)`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Question Editor sub-component
// ════════════════════════════════════════════════════════════════════════════
interface QuestionEditorProps {
  question: Question;
  index: number;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  textColor: string;
  mutedColor: string;
  sectionHeaderColor: string;
  letters: string[];
  onUpdate: (patch: Partial<Question>) => void;
  onUpdateOption: (optId: string, text: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function QuestionEditor({
  question,
  index,
  isDark,
  cardBg,
  cardBorder,
  inputBg,
  inputBorder,
  textColor,
  mutedColor,
  sectionHeaderColor,
  letters,
  onUpdate,
  onUpdateOption,
  onDelete,
  canDelete,
}: QuestionEditorProps) {
  const inputStyle: React.CSSProperties = {
    background: inputBg,
    borderColor: inputBorder,
    color: textColor,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: mutedColor,
    marginBottom: 4,
    display: 'block',
  };

  const typeOptions = [
    { value: 'trac-nghiem', label: 'Trắc nghiệm' },
    { value: 'dung-sai', label: 'Đúng/Sai' },
    { value: 'tu-luan', label: 'Tự luận' },
  ];

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Question header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: sectionHeaderColor }}>
          Câu {index + 1}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select
            size="small"
            value={question.type}
            onChange={(v) => onUpdate({ type: v as QuestionType })}
            options={typeOptions}
            style={{ width: 140 }}
            popupMatchSelectWidth={false}
          />
          <Tooltip title="Xóa câu hỏi">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
              disabled={!canDelete}
            />
          </Tooltip>
        </div>
      </div>

      {/* Question text */}
      <div>
        <label style={labelStyle}>Nội dung câu hỏi</label>
        <Input.TextArea
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Nhập nội dung câu hỏi..."
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={inputStyle}
        />
      </div>

      {/* Type-specific fields */}
      {question.type === 'trac-nghiem' && (
        <div>
          <label style={labelStyle}>Đáp án (chọn đáp án đúng)</label>
          <Radio.Group
            value={question.correctOption}
            onChange={(e) => onUpdate({ correctOption: e.target.value })}
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {question.options.map((opt, i) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio value={opt.id} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: PRIMARY,
                      width: 20,
                      flexShrink: 0,
                    }}
                  >
                    {letters[i]}.
                  </span>
                  <Input
                    size="small"
                    value={opt.text}
                    onChange={(e) => onUpdateOption(opt.id, e.target.value)}
                    placeholder={`Đáp án ${letters[i]}`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </Radio.Group>
        </div>
      )}

      {question.type === 'dung-sai' && (
        <div>
          <label style={labelStyle}>Đáp án đúng</label>
          <Radio.Group
            value={question.correctOption}
            onChange={(e) => onUpdate({ correctOption: e.target.value })}
          >
            <Radio value="dung" style={{ color: textColor }}>
              Đúng
            </Radio>
            <Radio value="sai" style={{ color: textColor }}>
              Sai
            </Radio>
          </Radio.Group>
        </div>
      )}

      {question.type === 'tu-luan' && (
        <div
          style={{
            fontSize: 12,
            color: mutedColor,
            fontStyle: 'italic',
          }}
        >
          Câu tự luận — học sinh tự viết đáp án. Không có lựa chọn.
        </div>
      )}

      {/* Points */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Điểm:</label>
        <InputNumber
          size="small"
          min={0}
          max={100}
          step={0.25}
          value={question.points}
          onChange={(v) => onUpdate({ points: v ?? 1 })}
          style={{
            background: inputBg,
            borderColor: inputBorder,
            color: textColor,
            width: 80,
          }}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Preview Question sub-component
// ════════════════════════════════════════════════════════════════════════════
interface PreviewQuestionProps {
  question: Question;
  index: number;
  letters: string[];
  showAnswerKey: boolean;
  getAnswerKeyText: (q: Question) => string;
}

function PreviewQuestion({
  question,
  index,
  letters,
  showAnswerKey,
  getAnswerKeyText,
}: PreviewQuestionProps) {
  return (
    <div style={{ pageBreakInside: 'avoid' }}>
      {/* Question stem */}
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ fontWeight: 700, flexShrink: 0 }}>Câu {index + 1}.</span>
        <span>
          {question.text || <em style={{ color: '#aaa' }}>(Chưa nhập nội dung)</em>}
          {question.type !== 'tu-luan' && (
            <span style={{ color: '#999', fontSize: 12 }}> ({question.points}đ)</span>
          )}
          {showAnswerKey && question.type !== 'tu-luan' && (
            <span
              style={{
                marginLeft: 8,
                color: '#50C878',
                fontWeight: 700,
                fontSize: 12,
                background: 'rgba(80,200,120,0.1)',
                border: '1px solid rgba(80,200,120,0.3)',
                borderRadius: 4,
                padding: '0 5px',
              }}
            >
              ĐÁ: {getAnswerKeyText(question)}
            </span>
          )}
        </span>
      </div>

      {/* Options for trac-nghiem */}
      {question.type === 'trac-nghiem' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2px 16px',
            marginTop: 4,
            paddingLeft: 24,
            fontSize: 13,
          }}
        >
          {question.options.map((opt, i) => {
            const isCorrect = showAnswerKey && opt.id === question.correctOption;
            return (
              <div
                key={opt.id}
                style={{
                  fontWeight: isCorrect ? 700 : 400,
                  color: isCorrect ? '#50C878' : 'inherit',
                }}
              >
                <strong>{letters[i]}.</strong>{' '}
                {opt.text || <em style={{ color: '#aaa' }}>(Trống)</em>}
              </div>
            );
          })}
        </div>
      )}

      {/* Dung/Sai options */}
      {question.type === 'dung-sai' && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 4,
            paddingLeft: 24,
            fontSize: 13,
          }}
        >
          {['dung', 'sai'].map((v) => {
            const isCorrect = showAnswerKey && question.correctOption === v;
            return (
              <div
                key={v}
                style={{
                  fontWeight: isCorrect ? 700 : 400,
                  color: isCorrect ? '#50C878' : 'inherit',
                }}
              >
                ☐ {v === 'dung' ? 'Đúng' : 'Sai'}
              </div>
            );
          })}
        </div>
      )}

      {/* Tự luận — blank lines */}
      {question.type === 'tu-luan' && (
        <div style={{ paddingLeft: 24, marginTop: 6 }}>
          {[1, 2, 3, 4].map((line) => (
            <div
              key={line}
              style={{
                borderBottom: '1px solid #ccc',
                marginBottom: 10,
                height: 20,
              }}
            />
          ))}
          <div style={{ fontSize: 12, color: '#999' }}>({question.points} điểm)</div>
        </div>
      )}
    </div>
  );
}
