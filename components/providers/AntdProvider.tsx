'use client';

import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

const { darkAlgorithm, defaultAlgorithm } = theme;

function ThemedConfigProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#50C878',
          colorBgBase: isDark ? '#1a1a1a' : '#ffffff',
          colorTextBase: isDark ? '#c9c9c9' : '#1a1a1a',
          colorBgContainer: isDark ? '#222222' : '#ffffff',
          colorBgLayout: isDark ? '#1a1a1a' : '#f5f5f5',
          colorBgElevated: isDark ? '#2a2a2a' : '#ffffff',
          colorBorder: isDark ? '#333333' : '#e0e0e0',
          colorBorderSecondary: isDark ? '#2a2a2a' : '#ebebeb',
          borderRadius: 6,
        },
        components: {
          Layout: {
            siderBg: isDark ? '#141414' : '#ffffff',
            bodyBg: isDark ? '#1a1a1a' : '#f5f5f5',
            headerBg: isDark ? '#141414' : '#ffffff',
            triggerBg: isDark ? '#1f1f1f' : '#f0f0f0',
            triggerColor: isDark ? '#666666' : '#888888',
          },
          Menu: {
            darkItemBg: '#141414',
            darkSubMenuItemBg: '#0f0f0f',
            darkItemSelectedBg: 'rgba(80,200,120,0.12)',
            darkItemSelectedColor: '#50C878',
            darkItemHoverColor: '#ffffff',
            darkItemColor: '#a0a0a0',
            iconSize: 16,
          },
          Card: {
            colorBgContainer: isDark ? '#222222' : '#ffffff',
            colorBorderSecondary: isDark ? '#333333' : '#e0e0e0',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedConfigProvider>{children}</ThemedConfigProvider>
    </ThemeProvider>
  );
}
