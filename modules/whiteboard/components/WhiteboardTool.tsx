'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { Excalidraw, exportToBlob, exportToSvg } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Button, Space, Tooltip, message } from 'antd';
import {
  DownloadOutlined,
  FileImageOutlined,
  ClearOutlined,
  SaveOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const STORAGE_KEY = 'toolhub_whiteboard';

export default function WhiteboardTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const excalidrawAPIRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setInitialData(JSON.parse(saved));
      } else {
        setInitialData({ elements: [], appState: { viewBackgroundColor: isDark ? '#1a1a1a' : '#ffffff' } });
      }
    } catch {
      setInitialData({ elements: [], appState: {} });
    }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        elements,
        appState: { viewBackgroundColor: appState.viewBackgroundColor },
      }));
      messageApi.success('Đã lưu bảng vẽ');
    } catch {
      messageApi.error('Không thể lưu');
    }
  };

  const handleLoad = () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        api.updateScene(JSON.parse(saved));
        messageApi.success('Đã tải bảng vẽ');
      } else {
        messageApi.info('Chưa có dữ liệu lưu');
      }
    } catch {
      messageApi.error('Không thể tải');
    }
  };

  const handleClear = () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    api.updateScene({ elements: [] });
    localStorage.removeItem(STORAGE_KEY);
    messageApi.success('Đã xóa bảng vẽ');
  };

  const handleExportPng = async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: api.getAppState(),
        files: api.getFiles(),
        mimeType: 'image/png',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      messageApi.success('Đã xuất PNG');
    } catch {
      messageApi.error('Không thể xuất PNG');
    }
  };

  const handleExportSvg = async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;
    try {
      const svg = await exportToSvg({
        elements: api.getSceneElements(),
        appState: api.getAppState(),
        files: api.getFiles(),
      });
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      messageApi.success('Đã xuất SVG');
    } catch {
      messageApi.error('Không thể xuất SVG');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {contextHolder}

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '10px 16px',
          background: isDark ? '#1e1e1e' : '#ffffff',
          border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
          borderRadius: 10,
        }}
      >
        <span style={{ color: isDark ? '#888' : '#999', fontSize: 13 }}>
          Vẽ tự do · Hình học · Mũi tên · Chú thích · Xuất ảnh
        </span>
        <Space size={6}>
          <Tooltip title="Lưu vào bộ nhớ">
            <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>Lưu</Button>
          </Tooltip>
          <Tooltip title="Tải lại từ bộ nhớ">
            <Button size="small" icon={<FolderOpenOutlined />} onClick={handleLoad}>Tải</Button>
          </Tooltip>
          <Tooltip title="Xuất PNG">
            <Button size="small" icon={<FileImageOutlined />} onClick={handleExportPng}>PNG</Button>
          </Tooltip>
          <Tooltip title="Xuất SVG">
            <Button size="small" icon={<DownloadOutlined />} onClick={handleExportSvg}>SVG</Button>
          </Tooltip>
          <Tooltip title="Xóa toàn bộ">
            <Button size="small" danger icon={<ClearOutlined />} onClick={handleClear}>Xóa</Button>
          </Tooltip>
        </Space>
      </div>

      {/* Excalidraw Canvas */}
      <div
        style={{
          height: 'calc(100vh - 280px)',
          minHeight: 500,
          borderRadius: 12,
          border: `1px solid ${isDark ? '#2e2e2e' : '#e8e8e8'}`,
          position: 'relative',
        }}
      >
        {ready && initialData !== null && (
          <Excalidraw
            excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
            initialData={initialData}
            theme={isDark ? 'dark' : 'light'}
            UIOptions={{
              canvasActions: {
                saveToActiveFile: false,
                loadScene: true,
                export: false,
                toggleTheme: false,
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
