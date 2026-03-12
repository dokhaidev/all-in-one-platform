'use client';

import { Col, Row, Typography } from 'antd';
import {
  GithubOutlined,
  GlobalOutlined,
  ToolOutlined,
  ReadOutlined,
  CodeOutlined,
  BankOutlined,
  SmileOutlined,
  ProjectOutlined,
  RocketOutlined,
  BookOutlined,
  FormatPainterOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  LockOutlined,
  AppstoreOutlined,
  StarOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QrcodeOutlined,
  TrophyOutlined,
  FileMarkdownOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;

const P   = '#50C878';
const P10 = 'rgba(80,200,120,0.10)';
const P20 = 'rgba(80,200,120,0.20)';
const P30 = 'rgba(80,200,120,0.30)';
const P40 = 'rgba(80,200,120,0.40)';

const TOOL_GROUPS = [
  { icon: <ToolOutlined />,          label: 'Công cụ tiện ích',      count: 8,  href: '/cv-builder',        desc: 'CV, Pomodoro, QR, BMI...' },
  { icon: <BankOutlined />,          label: 'Tính toán & Tài chính', count: 5,  href: '/loan-calculator',   desc: 'Lãi vay, tỷ giá, ngày tháng...' },
  { icon: <CodeOutlined />,          label: 'Văn bản & Tiện ích',    count: 7,  href: '/word-counter',      desc: 'Đếm từ, JSON, Base64...' },
  { icon: <RocketOutlined />,        label: 'Học lập trình',         count: 11, href: '/code-playground',   desc: 'Playground, Regex, Quiz...' },
  { icon: <GlobalOutlined />,        label: 'Dev Tools Pro',         count: 6,  href: '/jwt-decoder',       desc: 'JWT, Diff, UUID, Cron...' },
  { icon: <FormatPainterOutlined />, label: 'CSS & Design',          count: 4,  href: '/gradient-generator',desc: 'Gradient, Shadow, Bezier...' },
  { icon: <ProjectOutlined />,       label: 'Năng suất cá nhân',     count: 5,  href: '/kanban-board',      desc: 'Kanban, Habit, Budget...' },
  { icon: <ReadOutlined />,          label: 'Công cụ giáo viên',     count: 8,  href: '/quiz-generator',    desc: 'Đề thi, điểm số, điểm danh...' },
  { icon: <BookOutlined />,          label: 'Công cụ học sinh',      count: 3,  href: '/flashcard',         desc: 'Flashcard, cửu chương...' },
  { icon: <SmileOutlined />,         label: 'Mini Games',            count: 4,  href: '/wordle',            desc: 'Wordle, 2048, Typing Race...' },
];

const FEATURED = [
  { icon: <PlayCircleOutlined />,   label: 'Code Playground', href: '/code-playground' },
  { icon: <FileTextOutlined />,     label: 'CV Builder',      href: '/cv-builder' },
  { icon: <QrcodeOutlined />,       label: 'QR Generator',    href: '/qr-generator' },
  { icon: <TrophyOutlined />,       label: 'Typing Race',     href: '/typing-race' },
  { icon: <FileMarkdownOutlined />, label: 'Markdown Note',   href: '/markdown-note' },
  { icon: <ClusterOutlined />,      label: 'JWT Decoder',     href: '/jwt-decoder' },
];

export default function HomePage() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#1a1a1a' : '#ffffff';
  const border  = isDark ? '#272727' : '#e4e4e4';
  const heading = isDark ? '#f0f0f0' : '#111111';
  const body    = isDark ? '#888'    : '#666';
  const muted   = isDark ? '#444'    : '#c0c0c0';
  const divider = isDark ? '#1e1e1e' : '#eeeeee';
  const heroBg  = isDark ? '#141a14' : '#f6fdf7';
  const heroBorder = isDark ? '#1e301e' : '#c8e6cc';

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .card-hover { transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s; }
        .card-hover:hover { transform: translateY(-3px); border-color: ${P30} !important; box-shadow: 0 8px 28px ${P10} !important; }
        .pill-hover { transition: transform 0.15s, border-color 0.15s, background 0.15s; }
        .pill-hover:hover { transform: translateY(-2px); border-color: ${P} !important; background: ${P10} !important; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        background: heroBg,
        border: `1px solid ${heroBorder}`,
        borderRadius: 20,
        padding: '40px 40px 36px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 36,
        flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `3px solid ${P}`,
            overflow: 'hidden',
            boxShadow: `0 0 0 6px ${P10}, 0 8px 32px ${P20}`,
          }}>
            <img
              src="/z7613335881697_e36052a81580642946f9b202d2e2dbff.jpg"
              alt="dokhaidev"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                  `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;color:${P}">K</div>`;
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <Title level={2} style={{ color: heading, margin: '0 0 4px', fontWeight: 800, fontSize: 28, letterSpacing: '-0.5px' }}>
            Huỳnh Phan Đỗ Khải
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{
              display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: P, boxShadow: `0 0 6px ${P}`,
            }} />
            <Text style={{ color: P, fontWeight: 600, fontSize: 13.5 }}>
              Software Engineer · Frontend
            </Text>
            <span style={{
              background: P, color: '#000',
              borderRadius: 6, padding: '2px 10px',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
            }}>@dokhaidev</span>
          </div>
          <Text style={{ color: body, fontSize: 14, lineHeight: 1.8, display: 'block', maxWidth: 520, marginBottom: 20 }}>
            Tôi xây dựng <strong style={{ color: heading }}>ToolHub</strong> — nơi tập hợp những công cụ miễn phí,
            chạy thẳng trên trình duyệt. Dành cho học sinh, giáo viên, lập trình viên
            và tất cả mọi người. Không đăng nhập, không phí ẩn.
          </Text>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/cv-builder"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: P, borderRadius: 10, padding: '10px 22px',
                color: '#000', fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
                boxShadow: `0 4px 18px ${P30}`, transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 28px ${P40}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 18px ${P30}`; }}
            >
              Tạo CV online <ArrowRightOutlined style={{ fontSize: 11 }} />
            </Link>
            <a
              href="https://github.com/dokhaidev"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                border: `1.5px solid ${border}`, borderRadius: 10, padding: '10px 20px',
                color: body, fontSize: 13.5, textDecoration: 'none', fontWeight: 600,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = P; el.style.color = P; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = border; el.style.color = body; }}
            >
              <GithubOutlined style={{ fontSize: 15 }} /> GitHub
            </a>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { value: '61+',  label: 'Công cụ',   sub: 'tools' },
          { value: '10',   label: 'Danh mục',  sub: 'categories' },
          { value: '100%', label: 'Miễn phí',  sub: 'free forever' },
          { value: '0',    label: 'Đăng nhập', sub: 'no login' },
        ].map(s => (
          <div key={s.label} className="card-hover" style={{
            background: cardBg, border: `1px solid ${border}`,
            borderRadius: 14, padding: '20px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: P, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: heading, fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Featured Tools ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: P, borderRadius: 2, flexShrink: 0 }} />
          <Title level={5} style={{ color: heading, margin: 0, fontWeight: 700, fontSize: 14 }}>Công cụ nổi bật</Title>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FEATURED.map(f => (
            <Link key={f.href} href={f.href} style={{ textDecoration: 'none' }}>
              <div className="pill-hover" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: cardBg, border: `1px solid ${border}`,
                borderRadius: 10, padding: '9px 15px', cursor: 'pointer',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: P10, border: `1px solid ${P20}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: P,
                }}>{f.icon}</span>
                <span style={{ color: heading, fontSize: 13, fontWeight: 600 }}>{f.label}</span>
                <ArrowRightOutlined style={{ fontSize: 10, color: muted }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Why ToolHub ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: P, borderRadius: 2, flexShrink: 0 }} />
          <Title level={5} style={{ color: heading, margin: 0, fontWeight: 700, fontSize: 14 }}>Tại sao dùng ToolHub?</Title>
        </div>
        <Row gutter={[10, 10]}>
          {[
            { icon: <ThunderboltOutlined />, title: 'Tức thì',  desc: 'Chạy ngay trên trình duyệt, không cài đặt.' },
            { icon: <LockOutlined />,        title: 'Riêng tư', desc: 'Dữ liệu không rời thiết bị của bạn.' },
            { icon: <AppstoreOutlined />,    title: 'Đa dạng',  desc: '61 công cụ cho học tập và công việc.' },
            { icon: <StarOutlined />,        title: 'Miễn phí', desc: 'Hoàn toàn miễn phí, không cần tài khoản.' },
          ].map(f => (
            <Col xs={24} sm={12} md={6} key={f.title}>
              <div className="card-hover" style={{
                background: cardBg, border: `1px solid ${border}`,
                borderRadius: 12, padding: '18px', height: '100%',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11, marginBottom: 12,
                  background: P10, border: `1px solid ${P20}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: P,
                }}>{f.icon}</div>
                <Text style={{ color: heading, fontWeight: 700, fontSize: 13.5, display: 'block', marginBottom: 5 }}>{f.title}</Text>
                <Text style={{ color: body, fontSize: 12.5, lineHeight: 1.65 }}>{f.desc}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── Tool Categories ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: P, borderRadius: 2, flexShrink: 0 }} />
          <Title level={5} style={{ color: heading, margin: 0, fontWeight: 700, fontSize: 14 }}>Danh mục công cụ</Title>
          <span style={{
            marginLeft: 'auto',
            background: P10, border: `1px solid ${P20}`,
            color: P, borderRadius: 20, padding: '2px 11px', fontSize: 11.5, fontWeight: 700,
          }}>10 nhóm · 61 tools</span>
        </div>
        <Row gutter={[10, 10]}>
          {TOOL_GROUPS.map(g => (
            <Col xs={12} sm={8} md={6} key={g.label}>
              <Link href={g.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div className="card-hover" style={{
                  background: cardBg, border: `1px solid ${border}`,
                  borderRadius: 12, padding: '14px', cursor: 'pointer', height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: P10, border: `1px solid ${P20}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, color: P,
                    }}>{g.icon}</div>
                    <Text style={{ color: heading, fontWeight: 700, fontSize: 12.5, lineHeight: 1.35 }}>
                      {g.label}
                    </Text>
                  </div>
                  <Text style={{ color: body, fontSize: 11.5, display: 'block', marginBottom: 10, lineHeight: 1.5 }}>
                    {g.desc}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ flex: 1, height: 3, background: isDark ? '#232323' : '#eeeeee', borderRadius: 2 }}>
                      <div style={{
                        width: `${Math.round((g.count / 11) * 100)}%`,
                        height: '100%', background: P, borderRadius: 2,
                      }} />
                    </div>
                    <Text style={{ color: P, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{g.count}</Text>
                  </div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: `1px solid ${divider}`, paddingTop: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <Text style={{ color: muted, fontSize: 12 }}>
          Xây dựng bởi <span style={{ color: P, fontWeight: 700 }}>dokhaidev</span> · 100% miễn phí
        </Text>
        <Text style={{ color: muted, fontSize: 12 }}>ToolHub © {new Date().getFullYear()}</Text>
      </div>
    </div>
  );
}
