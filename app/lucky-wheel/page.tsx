'use client';

import { Typography } from 'antd';
import { GiftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LuckyWheelPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <GiftOutlined style={{ fontSize: 24, color: '#50C878' }} />
          <Title level={2} style={{ color: '#e0e0e0', margin: 0, fontWeight: 700 }}>
            Vòng quay may mắn
          </Title>
        </div>
        <Text style={{ color: '#777', fontSize: 15 }}>
          Vòng quay may mắn – thêm phần thưởng, quay ngẫu nhiên
        </Text>
      </div>

      <div
        style={{
          background: '#222222',
          border: '1px solid #2e2e2e',
          borderRadius: 10,
          padding: 48,
          textAlign: 'center',
        }}
      >
        <GiftOutlined style={{ fontSize: 48, color: '#333', marginBottom: 16 }} />
        <Title level={4} style={{ color: '#555', margin: 0 }}>
          Coming Soon
        </Title>
        <Text style={{ color: '#444' }}>Module Vòng quay may mắn sẽ sớm ra mắt</Text>
      </div>
    </div>
  );
}
