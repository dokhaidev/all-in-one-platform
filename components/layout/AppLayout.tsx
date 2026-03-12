'use client';

import React, { useState } from 'react';
import { Layout, Menu, Popover, Avatar } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import {
  DeploymentUnitOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  MoonOutlined,
  SunOutlined,
  UpOutlined,
  DownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { menuItems, routes, GROUP_TOOLS, GROUP_TEACHER, GROUP_STUDENT, GROUP_CALCULATE, GROUP_DEVTOOLS, GROUP_CODING, GROUP_DEVTOOLS_PRO, GROUP_CSS, GROUP_PRODUCTIVITY, GROUP_GAMES } from '@/config/routes';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

function UserMenu() {
  const { themeMode, setThemeMode } = useTheme();
  const [colorModeOpen, setColorModeOpen] = useState(false);
  const isDark = themeMode === 'dark';

  const border   = isDark ? '1px solid #2a2a2a' : '1px solid #e8e8e8';
  const bg       = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#bbb' : '#444';
  const hoverBg  = isDark ? '#2a2a2a' : '#f5f5f5';
  const subBg    = isDark ? '#161616' : '#fafafa';
  const nameColor  = isDark ? '#e0e0e0' : '#1a1a1a';
  const emailColor = isDark ? '#555' : '#999';
  const iconColor  = isDark ? '#666' : '#999';

  const menuRow = (
    icon: React.ReactNode,
    label: string,
    onClick?: () => void,
    right?: React.ReactNode,
  ) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 16px', cursor: 'pointer', color: textColor, fontSize: 13,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, color: iconColor }}>{icon}</span>
        {label}
      </div>
      {right}
    </div>
  );

  return (
    <div style={{ width: 220, padding: '4px 0', background: bg }}>
      {/* Profile info */}
      <div style={{ padding: '12px 16px 14px', borderBottom: border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            src="/z7613335881697_e36052a81580642946f9b202d2e2dbff.jpg"
            size={36}
            style={{ flexShrink: 0, border: '2px solid #50C878' }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: nameColor, fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>dokhaidev</div>
            <div style={{ color: emailColor, fontSize: 11 }}>Software Engineer</div>
          </div>
        </div>
      </div>

      {/* Chế độ màu */}
      {menuRow(
        <BulbOutlined />,
        'Chế độ màu',
        () => setColorModeOpen(v => !v),
        colorModeOpen
          ? <UpOutlined style={{ fontSize: 10, color: iconColor }} />
          : <DownOutlined style={{ fontSize: 10, color: iconColor }} />,
      )}

      {colorModeOpen && (
        <div style={{ background: subBg, borderTop: border, borderBottom: border }}>
          {(['dark', 'light'] as ThemeMode[]).map(mode => {
            const active = themeMode === mode;
            return (
              <div
                key={mode}
                onClick={() => setThemeMode(mode)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 20px', cursor: 'pointer', fontSize: 12,
                  color: active ? '#50C878' : textColor,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {mode === 'dark' ? <MoonOutlined /> : <SunOutlined />}
                  {mode === 'dark' ? 'Tối' : 'Sáng'}
                </div>
                {active && <CheckOutlined style={{ fontSize: 11 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const { Sider, Content } = Layout;

const SIDEBAR_WIDTH = 290;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const GROUP_KEYS = new Set([GROUP_TOOLS, GROUP_TEACHER, GROUP_STUDENT, GROUP_CALCULATE, GROUP_DEVTOOLS, GROUP_CODING, GROUP_DEVTOOLS_PRO, GROUP_CSS, GROUP_PRODUCTIVITY, GROUP_GAMES]);

function getInitialOpenKeys(pathname: string): string[] {
  const route = routes.find(r => r.key === pathname);
  return route?.groupKey ? [route.groupKey] : [];
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>(() => getInitialOpenKeys(pathname));

  const siderBg       = isDark ? '#141414' : '#ffffff';
  const siderBorder   = isDark ? '#242424' : '#e8e8e8';
  const contentBg     = isDark ? '#1a1a1a' : '#f5f5f5';
  const brandColor    = isDark ? '#e0e0e0' : '#1a1a1a';
  const collapseColor = isDark ? '#666' : '#aaa';

  const handleMenuClick = ({ key }: { key: string }) => {
    if (!GROUP_KEYS.has(key)) router.push(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsed={collapsed}
        collapsible
        trigger={null}
        width={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        style={{
          background: siderBg,
          position: 'fixed',
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          zIndex: 100,
          borderRight: `1px solid ${siderBorder}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Brand */}
          <div
            style={{
              height: 56, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: '0 20px',
              borderBottom: `1px solid ${siderBorder}`,
              cursor: 'pointer', userSelect: 'none',
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DeploymentUnitOutlined style={{ color: '#50C878', fontSize: 20 }} />
                <span style={{ color: brandColor, fontSize: 16, fontWeight: 700, letterSpacing: '0.02em' }}>
                  dokhaidev
                </span>
              </div>
            )}
            {collapsed
              ? <MenuUnfoldOutlined style={{ color: collapseColor, fontSize: 16 }} />
              : <MenuFoldOutlined   style={{ color: collapseColor, fontSize: 14 }} />
            }
          </div>

          {/* Navigation */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Menu
              theme={isDark ? 'dark' : 'light'}
              mode="inline"
              selectedKeys={[pathname]}
              openKeys={openKeys}
              onOpenChange={setOpenKeys}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ background: siderBg, border: 'none', marginTop: 8, fontSize: 14 }}
            />
          </div>

          {/* User / Profile */}
          <Popover
            open={profileOpen}
            onOpenChange={setProfileOpen}
            content={<UserMenu />}
            trigger="click"
            placement="top"
            arrow={false}
            overlayInnerStyle={{
              background: isDark ? '#1e1e1e' : '#ffffff',
              border: `1px solid ${siderBorder}`,
              borderRadius: 10, padding: 0, overflow: 'hidden',
            }}
            overlayStyle={{ paddingBottom: 8 }}
          >
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${siderBorder}`,
                padding: collapsed ? '12px 0' : '10px 16px',
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: 10, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#1e1e1e' : '#f5f5f5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar
                  src="/z7613335881697_e36052a81580642946f9b202d2e2dbff.jpg"
                  size={32}
                  style={{ flexShrink: 0, border: '2px solid #50C878' }}
                />
                {!collapsed && (
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: brandColor, fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      dokhaidev
                    </div>
                    <div style={{ color: collapseColor, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Software Engineer
                    </div>
                  </div>
                )}
              </div>
              {!collapsed && (
                profileOpen
                  ? <UpOutlined   style={{ fontSize: 10, color: '#555', flexShrink: 0 }} />
                  : <DownOutlined style={{ fontSize: 10, color: '#555', flexShrink: 0 }} />
              )}
            </div>
          </Popover>
        </div>
      </Sider>

      {/* Main Content */}
      <Layout style={{
        marginInlineStart: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        transition: 'margin-inline-start 0.2s ease',
        background: contentBg,
        minHeight: '100vh',
      }}>
        <Content style={{ padding: '32px 48px', minHeight: '100vh', background: contentBg }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
