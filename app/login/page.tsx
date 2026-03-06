'use client';

import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import {
  MailOutlined,
  LockOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CREDENTIALS = { email: 'admin@gmail.com', password: 'Admin@123' };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onFinish = (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (
        values.email === CREDENTIALS.email &&
        values.password === CREDENTIALS.password
      ) {
        localStorage.setItem('toolhub_auth', '1');
        router.push('/');
      } else {
        setError('Email hoặc mật khẩu không đúng.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 400,
          background: '#202020',
          border: '1px solid #2a2a2a',
          borderRadius: 12,
          padding: '44px 40px 36px',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <DeploymentUnitOutlined style={{ fontSize: 38, color: '#50C878' }} />
          <Title
            level={3}
            style={{ color: '#e0e0e0', margin: '14px 0 6px', fontWeight: 800 }}
          >
            dokhaidev
          </Title>
          <Text style={{ color: '#555', fontSize: 13 }}>
            Đăng nhập để tiếp tục
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 6 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label={<span style={{ color: '#999', fontSize: 13 }}>Email</span>}
            rules={[{ required: true, message: 'Vui lòng nhập email' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#555' }} />}
              placeholder="admin@gmail.com"
              size="large"
              style={{ background: '#2a2a2a', borderColor: '#333', color: '#e0e0e0' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#999', fontSize: 13 }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            style={{ marginBottom: 28 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#555' }} />}
              placeholder="••••••••"
              size="large"
              style={{ background: '#2a2a2a', borderColor: '#333', color: '#e0e0e0' }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            style={{ height: 44, fontWeight: 600, fontSize: 15 }}
          >
            Đăng nhập
          </Button>
        </Form>
      </div>
    </div>
  );
}
