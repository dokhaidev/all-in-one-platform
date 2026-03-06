'use client';

import { Card, Col, Row, Typography } from 'antd';
import {
  FileTextOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

const modules = [
  {
    key: 'cv-builder',
    href: '/cv-builder',
    icon: <FileTextOutlined style={{ fontSize: 32, color: '#50C878' }} />,
    title: 'Tạo CV online',
    description:
      'Tạo và chỉnh sửa CV online chuyên nghiệp, xuất file PDF ngay tức thì.',
    status: 'available',
  },
  {
    key: 'lucky-wheel',
    href: '/lucky-wheel',
    icon: <GiftOutlined style={{ fontSize: 32, color: '#50C878' }} />,
    title: 'Vòng quay may mắn',
    description:
      'Vòng quay may mắn – thêm phần thưởng, quay ngẫu nhiên, vui vẻ mọi lúc.',
    status: 'coming-soon',
  },
  {
    key: 'sleep-calculator',
    href: '/sleep-calculator',
    icon: <ClockCircleOutlined style={{ fontSize: 32, color: '#50C878' }} />,
    title: 'Máy tính giấc ngủ',
    description:
      'Tính toán giờ ngủ phù hợp để bạn thức dậy tự nhiên, không mệt mỏi.',
    status: 'coming-soon',
  },
  {
    key: 'currency-converter',
    href: '/currency-converter',
    icon: <SwapOutlined style={{ fontSize: 32, color: '#50C878' }} />,
    title: 'Chuyển đổi tiền tệ',
    description:
      'Chuyển đổi tiền tệ với tỷ giá cập nhật liên tục, nhanh chóng và chính xác.',
    status: 'coming-soon',
  },
];

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Title
          level={2}
          style={{ color: '#e0e0e0', marginBottom: 8, fontWeight: 700 }}
        >
          ToolHub – bảng điều khiển
        </Title>
        <Text style={{ color: '#777', fontSize: 15 }}>
          Chọn công cụ bạn muốn sử dụng
        </Text>
      </div>

      {/* Module Grid */}
      <Row gutter={[20, 20]}>
        {modules.map((mod) => (
          <Col key={mod.key} xs={24} sm={12} lg={6}>
            <Link href={mod.href} style={{ display: 'block' }}>
              <Card
                hoverable
                style={{
                  background: '#222222',
                  border: '1px solid #2e2e2e',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s',
                  height: '100%',
                }}
                bodyStyle={{ padding: 24 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#50C878';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#2e2e2e';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ marginBottom: 16 }}>{mod.icon}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    strong
                    style={{ color: '#e0e0e0', fontSize: 16 }}
                  >
                    {mod.title}
                  </Text>
                  {mod.status === 'coming-soon' && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#666',
                        background: '#2a2a2a',
                        border: '1px solid #333',
                        borderRadius: 4,
                        padding: '1px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Soon
                    </span>
                  )}
                </div>
                <Text style={{ color: '#888', fontSize: 13, lineHeight: 1.5 }}>
                  {mod.description}
                </Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
