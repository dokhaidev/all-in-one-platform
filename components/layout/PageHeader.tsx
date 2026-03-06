'use client';

import { Breadcrumb, Alert } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  alert?: {
    message: string;
    description?: string;
  };
}

export default function PageHeader({ title, description, breadcrumbs, alert }: PageHeaderProps) {
  const items = [
    {
      title: (
        <Link href="/" style={{ color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
          <HomeOutlined />
          <span>Trang chủ</span>
        </Link>
      ),
    },
    ...(breadcrumbs ?? []).map((b, i) => ({
      title:
        b.href && i < (breadcrumbs?.length ?? 0) - 1 ? (
          <Link href={b.href} style={{ color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
            {b.icon}
            <span>{b.label}</span>
          </Link>
        ) : (
          <span style={{ color: '#50C878', display: 'flex', alignItems: 'center', gap: 4 }}>
            {b.icon}
            {b.label}
          </span>
        ),
    })),
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={items}
        style={{ marginBottom: 16, fontSize: 13 }}
      />

      {/* Title + Description */}
      <h1
        style={{
          color: '#e0e0e0',
          fontSize: 26,
          fontWeight: 700,
          margin: '0 0 6px',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h1>
      {description && (
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}

      {/* Optional alert */}
      {alert && (
        <Alert
          type="success"
          showIcon
          message={
            <div style={{ lineHeight: 1.4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{alert.message}</span>
              {alert.description && (
                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8, fontWeight: 400 }}>
                  — {alert.description}
                </span>
              )}
            </div>
          }
          style={{
            background: 'rgba(80,200,120,0.08)',
            border: '1px solid rgba(80,200,120,0.25)',
            borderRadius: 8,
            padding: '7px 12px',
          }}
        />
      )}
    </div>
  );
}
