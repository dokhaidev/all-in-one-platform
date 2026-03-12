'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Tag,
  Progress,
  Empty,
  Divider,
  Tooltip,
  Popconfirm,
  Select,
  Badge,
  message,
  Table,
  Form,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SwapOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  BookOutlined,
  UnorderedListOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ImportOutlined,
  SortAscendingOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  front: string;
  back: string;
  createdAt: number;
}

interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: number;
}

type Rating = 'unknown' | 'hard' | 'easy';

interface SessionStats {
  easy: number;
  hard: number;
  unknown: number;
  total: number;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'toolhub_flashcard';

function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDecks(decks: Deck[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // ignore
  }
}

function getDefaultDeck(): Deck {
  return {
    id: crypto.randomUUID(),
    name: 'Từ vựng tiếng Anh',
    createdAt: Date.now(),
    cards: [
      { id: crypto.randomUUID(), front: 'apple', back: 'quả táo', createdAt: Date.now() },
      { id: crypto.randomUUID(), front: 'book', back: 'quyển sách', createdAt: Date.now() },
      { id: crypto.randomUUID(), front: 'cat', back: 'con mèo', createdAt: Date.now() },
      { id: crypto.randomUUID(), front: 'dog', back: 'con chó', createdAt: Date.now() },
      { id: crypto.randomUUID(), front: 'elephant', back: 'con voi', createdAt: Date.now() },
    ],
  };
}

// ─── Flip Card ───────────────────────────────────────────────────────────────

interface FlipCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  isDark: boolean;
}

function FlipCard({ front, back, isFlipped, onFlip, isDark }: FlipCardProps) {
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBgBack = isDark ? '#1a2e20' : '#f0faf4';
  const textColor = isDark ? '#e0e0e0' : '#1a1a1a';
  const mutedColor = isDark ? '#666' : '#999';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';

  return (
    <div
      onClick={onFlip}
      style={{
        perspective: '1000px',
        cursor: 'pointer',
        userSelect: 'none',
        width: '100%',
        minHeight: 280,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 280,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: cardBg,
            border: `2px solid ${borderColor}`,
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ color: mutedColor, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            Câu hỏi / Thuật ngữ
          </div>
          <div
            style={{
              fontSize: front.length > 80 ? 18 : front.length > 40 ? 24 : 32,
              fontWeight: 700,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {front}
          </div>
          <div style={{ position: 'absolute', bottom: 20, color: mutedColor, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SwapOutlined />
            Nhấn để xem đáp án
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: cardBgBack,
            border: '2px solid rgba(80,200,120,0.4)',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
            boxShadow: isDark
              ? '0 8px 32px rgba(80,200,120,0.1)'
              : '0 8px 32px rgba(80,200,120,0.15)',
          }}
        >
          <div style={{ color: '#50C878', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            Đáp án / Định nghĩa
          </div>
          <div
            style={{
              fontSize: back.length > 80 ? 18 : back.length > 40 ? 22 : 28,
              fontWeight: 600,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {back}
          </div>
          <div style={{ position: 'absolute', bottom: 20, color: '#50C878', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RetweetOutlined />
            Nhấn để lật lại
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────

function StatsBar({ stats, isDark }: { stats: SessionStats; isDark: boolean }) {
  const cardBg = isDark ? '#1a1a1a' : '#f8f8f8';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#555';

  const items = [
    { label: 'Dễ', count: stats.easy, color: '#50C878', icon: <CheckCircleOutlined /> },
    { label: 'Khó', count: stats.hard, color: '#fa8c16', icon: <ExclamationCircleOutlined /> },
    { label: 'Chưa thuộc', count: stats.unknown, color: '#f5222d', icon: <CloseCircleOutlined /> },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      {items.map(({ label, count, color, icon }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
          <span style={{ color, fontSize: 14 }}>{icon}</span>
          <span style={{ color, fontWeight: 700, fontSize: 16 }}>{count}</span>
          <span style={{ color: textColor, fontSize: 12 }}>{label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', borderLeft: `1px solid ${borderColor}`, paddingLeft: 12 }}>
        <span style={{ color: textColor, fontSize: 12 }}>Tổng đã đánh giá: </span>
        <span style={{ color: textColor, fontWeight: 700, fontSize: 14 }}>
          {stats.easy + stats.hard + stats.unknown}/{stats.total}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FlashcardTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  // Theme tokens
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#666' : '#999';
  const labelColor = isDark ? '#aaa' : '#555';

  // ── State ──────────────────────────────────────────────────────────────
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [mode, setMode] = useState<'idle' | 'study' | 'manage'>('idle');

  // Study state
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [shuffleMode, setShuffleMode] = useState(false);

  // Manage state
  const [editCardModal, setEditCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [addCardModal, setAddCardModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Deck modals
  const [addDeckModal, setAddDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [editDeckModal, setEditDeckModal] = useState(false);
  const [editDeckName, setEditDeckName] = useState('');
  const [editingDeckId, setEditingDeckId] = useState<string>('');

  const [editCardForm] = Form.useForm();
  const [addCardForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let stored = loadDecks();
    if (stored.length === 0) {
      const def = getDefaultDeck();
      stored = [def];
      saveDecks(stored);
    }
    setDecks(stored);
    setSelectedDeckId(stored[0].id);
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────
  const selectedDeck = decks.find((d) => d.id === selectedDeckId) ?? null;

  const sessionStats: SessionStats = useMemo(() => {
    const easy = Object.values(ratings).filter((r) => r === 'easy').length;
    const hard = Object.values(ratings).filter((r) => r === 'hard').length;
    const unknown = Object.values(ratings).filter((r) => r === 'unknown').length;
    return { easy, hard, unknown, total: studyQueue.length };
  }, [ratings, studyQueue]);

  const currentCard = studyQueue[currentIndex] ?? null;
  const progress = studyQueue.length > 0 ? Math.round(((currentIndex + 1) / studyQueue.length) * 100) : 0;

  // ── Deck CRUD ──────────────────────────────────────────────────────────
  const handleAddDeck = () => {
    const name = newDeckName.trim();
    if (!name) return;
    const nd: Deck = { id: crypto.randomUUID(), name, cards: [], createdAt: Date.now() };
    const updated = [...decks, nd];
    setDecks(updated);
    saveDecks(updated);
    setSelectedDeckId(nd.id);
    setNewDeckName('');
    setAddDeckModal(false);
    messageApi.success(`Đã tạo bộ thẻ "${name}"`);
  };

  const handleDeleteDeck = (id: string) => {
    const updated = decks.filter((d) => d.id !== id);
    setDecks(updated);
    saveDecks(updated);
    if (selectedDeckId === id) {
      setSelectedDeckId(updated[0]?.id ?? '');
      setMode('idle');
    }
    messageApi.success('Đã xóa bộ thẻ');
  };

  const handleSaveDeckName = () => {
    const name = editDeckName.trim();
    if (!name || !editingDeckId) return;
    const updated = decks.map((d) => d.id === editingDeckId ? { ...d, name } : d);
    setDecks(updated);
    saveDecks(updated);
    setEditDeckModal(false);
    messageApi.success('Đã đổi tên bộ thẻ');
  };

  // ── Card CRUD ──────────────────────────────────────────────────────────
  const updateDeckCards = useCallback((deckId: string, updater: (cards: Flashcard[]) => Flashcard[]) => {
    setDecks((prev) => {
      const updated = prev.map((d) => d.id === deckId ? { ...d, cards: updater(d.cards) } : d);
      saveDecks(updated);
      return updated;
    });
  }, []);

  const handleAddCard = (values: { front: string; back: string }) => {
    if (!selectedDeckId) return;
    const card: Flashcard = {
      id: crypto.randomUUID(),
      front: values.front.trim(),
      back: values.back.trim(),
      createdAt: Date.now(),
    };
    updateDeckCards(selectedDeckId, (cards) => [...cards, card]);
    addCardForm.resetFields();
    setAddCardModal(false);
    messageApi.success('Đã thêm thẻ mới');
  };

  const handleEditCard = (values: { front: string; back: string }) => {
    if (!editingCard || !selectedDeckId) return;
    updateDeckCards(selectedDeckId, (cards) =>
      cards.map((c) => c.id === editingCard.id ? { ...c, front: values.front.trim(), back: values.back.trim() } : c)
    );
    setEditCardModal(false);
    setEditingCard(null);
    messageApi.success('Đã cập nhật thẻ');
  };

  const handleDeleteCard = (cardId: string) => {
    if (!selectedDeckId) return;
    updateDeckCards(selectedDeckId, (cards) => cards.filter((c) => c.id !== cardId));
    messageApi.success('Đã xóa thẻ');
  };

  const handleImportCards = () => {
    if (!selectedDeckId) return;
    const lines = importText.split('\n').filter((l) => l.trim());
    const newCards: Flashcard[] = [];
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        newCards.push({ id: crypto.randomUUID(), front: parts[0].trim(), back: parts[1].trim(), createdAt: Date.now() });
      } else {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          newCards.push({ id: crypto.randomUUID(), front: line.slice(0, colonIdx).trim(), back: line.slice(colonIdx + 1).trim(), createdAt: Date.now() });
        }
      }
    }
    if (!newCards.length) { messageApi.warning('Không tìm thấy dữ liệu hợp lệ (dùng Tab hoặc dấu : phân cách mặt trước/sau)'); return; }
    updateDeckCards(selectedDeckId, (cards) => [...cards, ...newCards]);
    messageApi.success(`Đã nhập ${newCards.length} thẻ`);
    setImportText('');
    setImportModal(false);
  };

  // ── Study mode ─────────────────────────────────────────────────────────
  const startStudy = (shuffle: boolean) => {
    if (!selectedDeck || selectedDeck.cards.length === 0) {
      messageApi.warning('Bộ thẻ trống. Hãy thêm thẻ trước khi ôn tập.');
      return;
    }
    const queue = shuffle
      ? [...selectedDeck.cards].sort(() => Math.random() - 0.5)
      : [...selectedDeck.cards];
    setStudyQueue(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
    setShuffleMode(shuffle);
    setMode('study');
  };

  const handleRate = (rating: Rating) => {
    if (!currentCard) return;
    setRatings((prev) => ({ ...prev, [currentCard.id]: rating }));
    // Auto-advance
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  };

  const handleNavigate = (dir: 'prev' | 'next') => {
    setIsFlipped(false);
    setCurrentIndex((i) => dir === 'next' ? Math.min(i + 1, studyQueue.length - 1) : Math.max(i - 1, 0));
  };

  const handleRestartStudy = () => {
    const queue = shuffleMode
      ? [...studyQueue].sort(() => Math.random() - 0.5)
      : [...(selectedDeck?.cards ?? [])];
    setStudyQueue(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
  };

  const isFinished = currentIndex === studyQueue.length - 1 && !!ratings[currentCard?.id ?? ''];

  // ── Table columns ──────────────────────────────────────────────────────
  const columns: ColumnsType<Flashcard> = [
    {
      title: <span style={{ color: labelColor, fontSize: 12 }}>#</span>,
      key: 'index',
      width: 48,
      render: (_: unknown, __: Flashcard, index: number) => (
        <span style={{ color: mutedColor, fontSize: 12 }}>{index + 1}</span>
      ),
    },
    {
      title: <span style={{ color: labelColor, fontSize: 13 }}>Mặt trước</span>,
      dataIndex: 'front',
      key: 'front',
      render: (val: string) => (
        <span style={{ color: textColor, fontWeight: 500, fontSize: 13 }}>{val}</span>
      ),
    },
    {
      title: <span style={{ color: labelColor, fontSize: 13 }}>Mặt sau</span>,
      dataIndex: 'back',
      key: 'back',
      render: (val: string) => (
        <span style={{ color: mutedColor, fontSize: 13 }}>{val}</span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, card: Flashcard) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              style={{ color: mutedColor, padding: '0 4px', height: 24 }}
              onClick={() => {
                setEditingCard(card);
                editCardForm.setFieldsValue({ front: card.front, back: card.back });
                setEditCardModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa thẻ">
            <Popconfirm
              title="Xóa thẻ này?"
              onConfirm={() => handleDeleteCard(card.id)}
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
      ),
    },
  ];

  // ─── Render: Study Mode ─────────────────────────────────────────────────
  if (mode === 'study' && selectedDeck) {
    return (
      <div style={{ background: bg, maxWidth: 760, margin: '0 auto' }}>
        {contextHolder}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ color: textColor, fontWeight: 700, fontSize: 18 }}>{selectedDeck.name}</div>
            <div style={{ color: mutedColor, fontSize: 12 }}>
              {shuffleMode ? 'Chế độ ngẫu nhiên' : 'Chế độ tuần tự'}
            </div>
          </div>
          <Button
            icon={<StopOutlined />}
            onClick={() => { setMode('idle'); }}
            style={{ borderColor, color: mutedColor }}
          >
            Thoát ôn tập
          </Button>
        </div>

        {/* Stats */}
        <StatsBar stats={sessionStats} isDark={isDark} />

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Progress
            percent={progress}
            strokeColor="#50C878"
            trailColor={isDark ? '#2e2e2e' : '#e8e8e8'}
            showInfo={false}
            style={{ flex: 1 }}
          />
          <span style={{ color: labelColor, fontSize: 13, whiteSpace: 'nowrap', minWidth: 60 }}>
            {currentIndex + 1} / {studyQueue.length} thẻ
          </span>
        </div>

        {/* Flip card */}
        {currentCard ? (
          <>
            <FlipCard
              front={currentCard.front}
              back={currentCard.back}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((v) => !v)}
              isDark={isDark}
            />

            {/* Flip hint + rating */}
            <div style={{ textAlign: 'center', marginTop: 20, minHeight: 80 }}>
              {!isFlipped ? (
                <div style={{ color: mutedColor, fontSize: 13 }}>
                  Nhấn vào thẻ để xem đáp án
                </div>
              ) : (
                <div>
                  <div style={{ color: labelColor, fontSize: 12, marginBottom: 10 }}>
                    Bạn thuộc thẻ này không?
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Button
                      size="large"
                      onClick={() => handleRate('unknown')}
                      style={{
                        borderColor: ratings[currentCard.id] === 'unknown' ? '#f5222d' : borderColor,
                        color: ratings[currentCard.id] === 'unknown' ? '#f5222d' : textColor,
                        background: ratings[currentCard.id] === 'unknown' ? 'rgba(245,34,45,0.1)' : cardBg,
                        fontWeight: 600,
                        minWidth: 130,
                      }}
                      icon={<CloseCircleOutlined />}
                    >
                      Chưa thuộc
                    </Button>
                    <Button
                      size="large"
                      onClick={() => handleRate('hard')}
                      style={{
                        borderColor: ratings[currentCard.id] === 'hard' ? '#fa8c16' : borderColor,
                        color: ratings[currentCard.id] === 'hard' ? '#fa8c16' : textColor,
                        background: ratings[currentCard.id] === 'hard' ? 'rgba(250,140,22,0.1)' : cardBg,
                        fontWeight: 600,
                        minWidth: 100,
                      }}
                      icon={<ExclamationCircleOutlined />}
                    >
                      Khó
                    </Button>
                    <Button
                      size="large"
                      onClick={() => handleRate('easy')}
                      style={{
                        borderColor: ratings[currentCard.id] === 'easy' ? '#50C878' : borderColor,
                        color: ratings[currentCard.id] === 'easy' ? '#50C878' : textColor,
                        background: ratings[currentCard.id] === 'easy' ? 'rgba(80,200,120,0.1)' : cardBg,
                        fontWeight: 600,
                        minWidth: 100,
                      }}
                      icon={<CheckCircleOutlined />}
                    >
                      Dễ
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => handleNavigate('prev')}
                disabled={currentIndex === 0}
                style={{ borderColor, color: currentIndex === 0 ? mutedColor : textColor }}
              >
                Trước
              </Button>

              <Tooltip title="Học lại từ đầu">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRestartStudy}
                  style={{ borderColor, color: mutedColor }}
                >
                  Học lại
                </Button>
              </Tooltip>

              <Button
                onClick={() => handleNavigate('next')}
                disabled={currentIndex === studyQueue.length - 1}
                style={{ borderColor, color: currentIndex === studyQueue.length - 1 ? mutedColor : textColor }}
              >
                Tiếp
                <RightOutlined />
              </Button>
            </div>

            {/* Finished message */}
            {isFinished && (
              <div
                style={{
                  marginTop: 24,
                  padding: '20px 24px',
                  borderRadius: 12,
                  background: 'rgba(80,200,120,0.1)',
                  border: '1px solid rgba(80,200,120,0.3)',
                  textAlign: 'center',
                }}
              >
                <CheckCircleOutlined style={{ color: '#50C878', fontSize: 32, marginBottom: 12, display: 'block' }} />
                <div style={{ color: textColor, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  Hoàn thành bộ thẻ!
                </div>
                <div style={{ color: mutedColor, fontSize: 13, marginBottom: 16 }}>
                  Dễ: {sessionStats.easy} · Khó: {sessionStats.hard} · Chưa thuộc: {sessionStats.unknown}
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleRestartStudy}
                    style={{ background: '#50C878', border: 'none' }}
                  >
                    Học lại
                  </Button>
                  <Button
                    icon={<StopOutlined />}
                    onClick={() => setMode('idle')}
                    style={{ borderColor, color: mutedColor }}
                  >
                    Kết thúc
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Empty description={<span style={{ color: mutedColor }}>Không có thẻ nào</span>} />
        )}
      </div>
    );
  }

  // ─── Render: Manage Mode ────────────────────────────────────────────────
  if (mode === 'manage' && selectedDeck) {
    return (
      <div style={{ background: bg }}>
        {contextHolder}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ color: textColor, fontWeight: 700, fontSize: 18 }}>{selectedDeck.name}</div>
            <div style={{ color: mutedColor, fontSize: 12 }}>{selectedDeck.cards.length} thẻ</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportModal(true)}
              style={{ borderColor, color: mutedColor }}
            >
              Nhập thẻ
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { addCardForm.resetFields(); setAddCardModal(true); }}
              style={{ background: '#50C878', border: 'none' }}
            >
              Thêm thẻ
            </Button>
            <Button
              icon={<StopOutlined />}
              onClick={() => setMode('idle')}
              style={{ borderColor, color: mutedColor }}
            >
              Đóng
            </Button>
          </div>
        </div>

        <Table
          dataSource={selectedDeck.cards}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false, style: { marginTop: 12 } }}
          locale={{ emptyText: <Empty description={<span style={{ color: mutedColor }}>Chưa có thẻ nào. Nhấn "Thêm thẻ" để bắt đầu.</span>} /> }}
          style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}` }}
          className={isDark ? 'dark-table' : ''}
        />

        {/* Add card modal */}
        <Modal
          title={<span style={{ color: textColor }}>Thêm thẻ mới</span>}
          open={addCardModal}
          onOk={() => addCardForm.submit()}
          onCancel={() => { setAddCardModal(false); addCardForm.resetFields(); }}
          okText="Thêm"
          cancelText="Hủy"
          okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
          styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
          width={520}
        >
          <Form form={addCardForm} onFinish={handleAddCard} layout="vertical">
            <Form.Item
              name="front"
              label={<span style={{ color: labelColor }}>Mặt trước (Câu hỏi / Thuật ngữ)</span>}
              rules={[{ required: true, message: 'Nhập nội dung mặt trước' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập câu hỏi hoặc thuật ngữ..."
                style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor, resize: 'none' }}
                autoFocus
              />
            </Form.Item>
            <Form.Item
              name="back"
              label={<span style={{ color: labelColor }}>Mặt sau (Đáp án / Định nghĩa)</span>}
              rules={[{ required: true, message: 'Nhập nội dung mặt sau' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập đáp án hoặc định nghĩa..."
                style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor, resize: 'none' }}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit card modal */}
        <Modal
          title={<span style={{ color: textColor }}>Chỉnh sửa thẻ</span>}
          open={editCardModal}
          onOk={() => editCardForm.submit()}
          onCancel={() => { setEditCardModal(false); setEditingCard(null); }}
          okText="Lưu"
          cancelText="Hủy"
          okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
          styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
          width={520}
        >
          <Form form={editCardForm} onFinish={handleEditCard} layout="vertical">
            <Form.Item
              name="front"
              label={<span style={{ color: labelColor }}>Mặt trước</span>}
              rules={[{ required: true, message: 'Nhập nội dung mặt trước' }]}
            >
              <Input.TextArea
                rows={3}
                style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor, resize: 'none' }}
              />
            </Form.Item>
            <Form.Item
              name="back"
              label={<span style={{ color: labelColor }}>Mặt sau</span>}
              rules={[{ required: true, message: 'Nhập nội dung mặt sau' }]}
            >
              <Input.TextArea
                rows={3}
                style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor, resize: 'none' }}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Import modal */}
        <Modal
          title={<span style={{ color: textColor }}>Nhập thẻ hàng loạt</span>}
          open={importModal}
          onOk={handleImportCards}
          onCancel={() => { setImportModal(false); setImportText(''); }}
          okText="Nhập"
          cancelText="Hủy"
          okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
          styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
          width={560}
        >
          <div style={{ color: mutedColor, fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
            Mỗi dòng là một thẻ. Dùng <Tag style={{ margin: '0 2px' }}>Tab</Tag> hoặc dấu <Tag style={{ margin: '0 2px' }}>:</Tag> để phân cách mặt trước và mặt sau.
          </div>
          <Input.TextArea
            rows={12}
            placeholder={'apple\tquả táo\nbook\tquyển sách\ncat\tcon mèo\n\n--- hoặc ---\n\napple: quả táo\nbook: quyển sách'}
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
              {importText.split('\n').filter((l) => {
                const hasTabs = l.includes('\t');
                const hasColon = l.indexOf(':') > 0;
                return (hasTabs || hasColon) && l.trim();
              }).length} thẻ sẽ được nhập
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ─── Render: Idle Mode ──────────────────────────────────────────────────
  return (
    <div style={{ background: bg }}>
      {contextHolder}

      {/* Top controls */}
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
        {/* Deck selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px' }}>
          <BookOutlined style={{ color: '#50C878', fontSize: 16 }} />
          <span style={{ color: labelColor, fontSize: 13, whiteSpace: 'nowrap' }}>Bộ thẻ:</span>
          <Select
            value={selectedDeckId || undefined}
            onChange={(v) => { setSelectedDeckId(v); setMode('idle'); }}
            style={{ flex: 1, minWidth: 180 }}
            placeholder="Chọn bộ thẻ"
            options={decks.map((d) => ({
              label: `${d.name} (${d.cards.length} thẻ)`,
              value: d.id,
            }))}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setAddDeckModal(true)}
            style={{ borderColor, color: mutedColor }}
          >
            Thêm bộ thẻ
          </Button>
          {selectedDeck && (
            <>
              <Tooltip title="Đổi tên bộ thẻ">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingDeckId(selectedDeckId);
                    setEditDeckName(selectedDeck.name);
                    setEditDeckModal(true);
                  }}
                  style={{ borderColor, color: mutedColor }}
                />
              </Tooltip>
              <Popconfirm
                title="Xóa bộ thẻ này? Tất cả thẻ sẽ bị xóa."
                onConfirm={() => handleDeleteDeck(selectedDeckId)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa bộ thẻ">
                  <Button icon={<DeleteOutlined />} style={{ borderColor, color: '#e05555' }} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      {/* Deck overview + action cards */}
      {selectedDeck ? (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Deck info card */}
          <Card
            style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, flex: '1 1 220px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 48, height: 48,
                  borderRadius: 12,
                  background: 'rgba(80,200,120,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <BookOutlined style={{ color: '#50C878', fontSize: 22 }} />
              </div>
              <div>
                <div style={{ color: textColor, fontWeight: 700, fontSize: 16 }}>{selectedDeck.name}</div>
                <div style={{ color: mutedColor, fontSize: 12 }}>
                  Tạo {new Date(selectedDeck.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ color: '#50C878', fontWeight: 700, fontSize: 28 }}>{selectedDeck.cards.length}</div>
                <div style={{ color: mutedColor, fontSize: 12 }}>Tổng số thẻ</div>
              </div>
            </div>

            {selectedDeck.cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: mutedColor, fontSize: 13 }}>
                Chưa có thẻ nào trong bộ thẻ này
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedDeck.cards.slice(0, 6).map((card) => (
                  <Tag
                    key={card.id}
                    style={{
                      background: isDark ? '#1a1a1a' : '#f5f5f5',
                      borderColor,
                      color: mutedColor,
                      fontSize: 11,
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {card.front}
                  </Tag>
                ))}
                {selectedDeck.cards.length > 6 && (
                  <Tag style={{ background: 'transparent', borderColor, color: mutedColor, fontSize: 11 }}>
                    +{selectedDeck.cards.length - 6} thẻ
                  </Tag>
                )}
              </div>
            )}
          </Card>

          {/* Action cards */}
          <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Start study */}
            <Card
              style={{
                background: 'rgba(80,200,120,0.06)',
                border: '1px solid rgba(80,200,120,0.25)',
                borderRadius: 12,
                cursor: selectedDeck.cards.length > 0 ? 'pointer' : 'not-allowed',
              }}
              bodyStyle={{ padding: '20px 24px' }}
              onClick={() => startStudy(false)}
              hoverable={selectedDeck.cards.length > 0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: 'rgba(80,200,120,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <PlayCircleOutlined style={{ color: '#50C878', fontSize: 22 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: textColor, fontWeight: 700, fontSize: 15 }}>Bắt đầu ôn tập</div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>Học theo thứ tự từ đầu đến cuối</div>
                </div>
                <Button
                  type="primary"
                  style={{ background: '#50C878', border: 'none' }}
                  disabled={selectedDeck.cards.length === 0}
                  onClick={(e) => { e.stopPropagation(); startStudy(false); }}
                >
                  Bắt đầu
                </Button>
              </div>
            </Card>

            {/* Shuffle study */}
            <Card
              style={{
                background: isDark ? '#1e1e1e' : '#fafafa',
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                cursor: selectedDeck.cards.length > 0 ? 'pointer' : 'not-allowed',
              }}
              bodyStyle={{ padding: '20px 24px' }}
              onClick={() => startStudy(true)}
              hoverable={selectedDeck.cards.length > 0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: isDark ? '#2a2a2a' : '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <SortAscendingOutlined style={{ color: '#fa8c16', fontSize: 22 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: textColor, fontWeight: 700, fontSize: 15 }}>Học ngẫu nhiên</div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>Xáo trộn thứ tự thẻ trước khi học</div>
                </div>
                <Button
                  style={{ borderColor, color: mutedColor }}
                  disabled={selectedDeck.cards.length === 0}
                  onClick={(e) => { e.stopPropagation(); startStudy(true); }}
                >
                  Học ngẫu nhiên
                </Button>
              </div>
            </Card>

            {/* Manage cards */}
            <Card
              style={{
                background: isDark ? '#1e1e1e' : '#fafafa',
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                cursor: 'pointer',
              }}
              bodyStyle={{ padding: '20px 24px' }}
              onClick={() => setMode('manage')}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: isDark ? '#2a2a2a' : '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <UnorderedListOutlined style={{ color: '#1890ff', fontSize: 22 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: textColor, fontWeight: 700, fontSize: 15 }}>Quản lý thẻ</div>
                  <div style={{ color: mutedColor, fontSize: 12 }}>Xem, thêm, sửa, xóa thẻ trong bộ thẻ</div>
                </div>
                <Badge count={selectedDeck.cards.length} showZero style={{ background: '#1890ff' }}>
                  <Button style={{ borderColor, color: mutedColor }}>
                    Quản lý
                  </Button>
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card
          style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
          bodyStyle={{ padding: '48px 24px' }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div style={{ color: textColor, fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có bộ thẻ nào</div>
                <div style={{ color: mutedColor, fontSize: 13, marginBottom: 20 }}>Tạo bộ thẻ đầu tiên để bắt đầu ôn tập</div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddDeckModal(true)}
                  style={{ background: '#50C878', border: 'none' }}
                >
                  Tạo bộ thẻ
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Add deck modal */}
      <Modal
        title={<span style={{ color: textColor }}>Tạo bộ thẻ mới</span>}
        open={addDeckModal}
        onOk={handleAddDeck}
        onCancel={() => { setAddDeckModal(false); setNewDeckName(''); }}
        okText="Tạo"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
        styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
      >
        <Input
          placeholder="Tên bộ thẻ (ví dụ: Từ vựng tiếng Anh, Lịch sử...)"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          onPressEnter={handleAddDeck}
          style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor }}
          autoFocus
        />
      </Modal>

      {/* Edit deck name modal */}
      <Modal
        title={<span style={{ color: textColor }}>Đổi tên bộ thẻ</span>}
        open={editDeckModal}
        onOk={handleSaveDeckName}
        onCancel={() => setEditDeckModal(false)}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#50C878', border: 'none' } }}
        styles={{ content: { background: cardBg, borderColor }, header: { background: cardBg, borderColor } }}
      >
        <Input
          placeholder="Tên bộ thẻ mới"
          value={editDeckName}
          onChange={(e) => setEditDeckName(e.target.value)}
          onPressEnter={handleSaveDeckName}
          style={{ background: isDark ? '#1a1a1a' : '#fff', borderColor, color: textColor }}
          autoFocus
        />
      </Modal>
    </div>
  );
}
