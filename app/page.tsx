'use client';

import React from 'react';
import { Col, Row, Typography } from 'antd';
import {
  FileTextOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  RightOutlined,
  DeploymentUnitOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.2)';

const modules = [
  {
    key: 'cv-builder',
    href: '/cv-builder',
    icon: <FileTextOutlined />,
    title: 'Tạo CV online',
    description: 'Tạo CV chuyên nghiệp, thân thiện với ATS. Xuất file PDF ngay trong trình duyệt, không cần cài ứng dụng.',
    status: 'available',
    tag: 'Hoạt động',
  },
  {
    key: 'lucky-wheel',
    href: '/lucky-wheel',
    icon: <GiftOutlined />,
    title: 'Vòng quay may mắn',
    description: 'Thêm tên vào danh sách, xáo trộn và quay ngẫu nhiên. Phù hợp cho sự kiện, mini game nội bộ.',
    status: 'available',
    tag: 'Hoạt động',
  },
  {
    key: 'sleep-calculator',
    href: '/sleep-calculator',
    icon: <ClockCircleOutlined />,
    title: 'Máy tính giấc ngủ',
    description: 'Tính toán khung giờ ngủ tối ưu dựa trên chu kỳ giấc ngủ 90 phút để bạn thức dậy sảng khoái.',
    status: 'available',
    tag: 'Hoạt động',
  },
  {
    key: 'currency-converter',
    href: '/currency-converter',
    icon: <SwapOutlined />,
    title: 'Chuyển đổi tiền tệ',
    description: 'Tra cứu tỷ giá hối đoái thời gian thực. Chuyển đổi nhanh giữa hơn 150 đơn vị tiền tệ toàn cầu.',
    status: 'available',
    tag: 'Hoạt động',
  },
  {
    key: 'bmi-calculator',
    href: '/bmi-calculator',
    icon: <DashboardOutlined />,
    title: 'Máy tính BMI',
    description: 'Tính chỉ số khối cơ thể bằng hệ mét hoặc imperial. Phân loại và lời khuyên sức khỏe theo từng nhóm.',
    status: 'available',
    tag: 'Hoạt động',
  },
  {
    key: 'pomodoro-timer',
    href: '/pomodoro-timer',
    icon: <FieldTimeOutlined />,
    title: 'Pomodoro Timer',
    description: 'Tăng năng suất với kỹ thuật Pomodoro. Đếm ngược tập trung, nghỉ ngắn, nghỉ dài và thống kê chi tiết.',
    status: 'available',
    tag: 'Hoạt động',
  },
];

const stats = [
  { value: '6', label: 'Công cụ', sub: 'trong hệ thống' },
  { value: '6', label: 'Đang hoạt động', sub: 'sẵn sàng sử dụng' },
  { value: '0', label: 'Sắp ra mắt', sub: 'đang phát triển' },
  { value: '100%', label: 'Miễn phí', sub: 'không giới hạn' },
];

const features = [
  {
    icon: <ThunderboltOutlined />,
    title: 'Xử lý tại trình duyệt',
    desc: 'Không cần server. Mọi dữ liệu được xử lý ngay trên thiết bị của bạn, tốc độ tức thì.',
  },
  {
    icon: <SafetyOutlined />,
    title: 'Bảo mật tuyệt đối',
    desc: 'Dữ liệu cá nhân không bao giờ rời khỏi thiết bị. Không lưu trữ, không theo dõi.',
  },
  {
    icon: <AppstoreOutlined />,
    title: 'Nền tảng mở rộng',
    desc: 'Nhiều công cụ hữu ích đang được phát triển liên tục, tất cả trong một nơi duy nhất.',
  },
];

export default function HomePage() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const cardBorder = isDark ? '#272727' : '#e8e8e8';
  const heading = isDark ? '#e8e8e8' : '#111111';
  const body = isDark ? '#888' : '#777';
  const muted = isDark ? '#555' : '#bbb';
  const divider = isDark ? '#252525' : '#eeeeee';
  const tagInactiveBg = isDark ? '#252525' : '#f5f5f5';
  const tagInactiveColor = isDark ? '#555' : '#aaa';
  const tagInactiveBorder = isDark ? '#333' : '#e8e8e8';
  const sectionLabel = isDark ? '#555' : '#bbb';

  return (
    <div style={{ width: '100%', background: bg }}>

      {/* ── Hero ── */}
      <div
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1c251c 0%, #181e18 60%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #f5fef7 60%, #f5f5f5 100%)',
          border: `1px solid ${isDark ? '#253025' : '#d4f0dc'}`,
          borderRadius: 16,
          padding: '44px 48px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Brand label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <DeploymentUnitOutlined style={{ color: PRIMARY, fontSize: 14 }} />
            <span style={{ color: PRIMARY, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              dokhaidev · ToolHub
            </span>
          </div>

          <Title
            level={1}
            style={{ color: heading, margin: '0 0 12px', fontWeight: 800, fontSize: 34, lineHeight: 1.15 }}
          >
            Xin chào, Admin
          </Title>
          <Text style={{ color: body, fontSize: 15, lineHeight: 1.7, display: 'block', maxWidth: 520 }}>
            Tất cả công cụ bạn cần trong một nền tảng duy nhất.
            Hoạt động hoàn toàn trên trình duyệt — nhanh, bảo mật và miễn phí.
          </Text>

          <div style={{ marginTop: 24 }}>
            <Link href="/cv-builder">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: PRIMARY,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '10px 22px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                Bắt đầu tạo CV <ArrowRightOutlined style={{ fontSize: 12 }} />
              </div>
            </Link>
          </div>
        </div>

        {/* Decorative icon */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: PRIMARY_BG,
              border: `2px solid ${PRIMARY_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DeploymentUnitOutlined style={{ fontSize: 48, color: PRIMARY }} />
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 32 }}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} sm={12} lg={6}>
            <div
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 12,
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color: PRIMARY, lineHeight: 1, marginBottom: 6 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: heading, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: muted }}>{s.sub}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Modules ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <Title level={4} style={{ color: heading, margin: 0, fontWeight: 700 }}>Công cụ</Title>
          <span style={{ fontSize: 12, color: sectionLabel, fontWeight: 500 }}>6 công cụ · 6 đang hoạt động</span>
        </div>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 36 }}>
        {modules.map((mod) => {
          const active = mod.status === 'available';
          return (
            <Col key={mod.key} xs={24} sm={12} xl={6}>
              <Link href={mod.href} style={{ display: 'block', height: '100%' }}>
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${active ? PRIMARY_BORDER : cardBorder}`,
                    borderRadius: 14,
                    padding: '22px 22px 18px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = PRIMARY;
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = `0 6px 24px rgba(80,200,120,0.12)`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = active ? PRIMARY_BORDER : cardBorder;
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Active glow strip */}
                  {active && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${PRIMARY}, transparent)`, borderRadius: '14px 14px 0 0' }} />
                  )}

                  {/* Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: active ? PRIMARY_BG : (isDark ? '#222' : '#f8f8f8'),
                        border: `1px solid ${active ? PRIMARY_BORDER : (isDark ? '#2a2a2a' : '#eeeeee')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        color: active ? PRIMARY : (isDark ? '#555' : '#bbb'),
                      }}
                    >
                      {mod.icon}
                    </div>

                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: active ? PRIMARY : tagInactiveColor,
                      background: active ? PRIMARY_BG : tagInactiveBg,
                      border: `1px solid ${active ? PRIMARY_BORDER : tagInactiveBorder}`,
                      borderRadius: 5,
                      padding: '3px 8px',
                    }}>
                      {mod.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ color: heading, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    {mod.title}
                  </div>

                  {/* Description */}
                  <Text style={{ color: body, fontSize: 12.5, lineHeight: 1.65, flex: 1 }}>
                    {mod.description}
                  </Text>

                  {/* Footer */}
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: active ? PRIMARY : muted, fontWeight: 500 }}>
                      {active ? 'Dùng ngay' : 'Đang phát triển'}
                    </span>
                    <RightOutlined style={{ fontSize: 10, color: active ? PRIMARY : muted }} />
                  </div>
                </div>
              </Link>
            </Col>
          );
        })}
      </Row>

      {/* ── Features ── */}
      <div style={{ marginBottom: 14 }}>
        <Title level={4} style={{ color: heading, margin: 0, fontWeight: 700 }}>Tại sao chọn dokhaidev?</Title>
      </div>
      <Row gutter={[14, 14]}>
        {features.map((f) => (
          <Col key={f.title} xs={24} sm={8}>
            <div
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 12,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: PRIMARY_BG,
                  border: `1px solid ${PRIMARY_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: PRIMARY,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div style={{ color: heading, fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{f.title}</div>
                <div style={{ color: body, fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

    </div>
  );
}
