'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Card,
  Slider,
  Select,
  Button,
  Row,
  Col,
  Progress,
  Tag,
  Tooltip,
  Space,
  Divider,
  Typography,
  Empty,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InboxOutlined,
  CompressOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Text, Title } = Typography;
const { Option } = Select;

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  compressedUrl: string | null;
  originalSize: number;
  compressedSize: number | null;
  originalWidth: number;
  originalHeight: number;
  newWidth: number | null;
  newHeight: number | null;
  processing: boolean;
  error: string | null;
}

const MAX_DIMENSION_OPTIONS = [
  { label: 'Gốc', value: 0 },
  { label: '400px', value: 400 },
  { label: '800px', value: 800 },
  { label: '1200px', value: 1200 },
  { label: '1920px', value: 1920 },
];

const FORMAT_OPTIONS = [
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'PNG', value: 'image/png' },
  { label: 'WebP', value: 'image/webp' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function compressionRatio(original: number, compressed: number): number {
  return Math.round((1 - compressed / original) * 100);
}

function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function compressImage(
  file: File,
  quality: number,
  maxDimension: number,
  outputFormat: string
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      if (outputFormat === 'image/png') {
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL(outputFormat, quality / 100);
      const blob = dataURLtoBlob(dataUrl);
      URL.revokeObjectURL(url);
      resolve({ dataUrl, width: w, height: h, size: blob.size });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể tải ảnh'));
    };
    img.src = url;
  });
}

export default function ImageCompressorTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222' : '#fff';
  const borderColor = isDark ? '#2e2e2e' : '#e0e0e0';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const mutedColor = isDark ? '#777' : '#999';

  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(0);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getOriginalDimensions = (file: File): Promise<{ w: number; h: number }> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ w: 0, h: 0 });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!arr.length) return;

      const newItems: ImageItem[] = await Promise.all(
        arr.map(async (file) => {
          const { w, h } = await getOriginalDimensions(file);
          return {
            id: `${Date.now()}_${Math.random()}`,
            file,
            originalUrl: URL.createObjectURL(file),
            compressedUrl: null,
            originalSize: file.size,
            compressedSize: null,
            originalWidth: w,
            originalHeight: h,
            newWidth: null,
            newHeight: null,
            processing: false,
            error: null,
          };
        })
      );
      setImages((prev) => [...prev, ...newItems]);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const processAll = async () => {
    setImages((prev) => prev.map((img) => ({ ...img, processing: true, error: null })));
    const updated = await Promise.all(
      images.map(async (item) => {
        try {
          const result = await compressImage(item.file, quality, maxDimension, outputFormat);
          return {
            ...item,
            compressedUrl: result.dataUrl,
            compressedSize: result.size,
            newWidth: result.width,
            newHeight: result.height,
            processing: false,
            error: null,
          };
        } catch (e: unknown) {
          return {
            ...item,
            processing: false,
            error: e instanceof Error ? e.message : 'Lỗi xử lý',
          };
        }
      })
    );
    setImages(updated);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const downloadOne = (item: ImageItem) => {
    if (!item.compressedUrl) return;
    const ext = outputFormat.split('/')[1];
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    a.download = `compressed_${item.file.name.replace(/\.[^.]+$/, '')}.${ext}`;
    a.click();
  };

  const downloadAll = () => {
    images.filter((i) => i.compressedUrl).forEach((item) => downloadOne(item));
  };

  const clearAll = () => {
    images.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    setImages([]);
  };

  const hasCompressed = images.some((i) => i.compressedUrl);
  const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
  const totalCompressed = images.reduce((s, i) => s + (i.compressedSize ?? 0), 0);

  const settingsCard = (
    <Card
      style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, marginBottom: 20 }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <Title level={5} style={{ color: textColor, margin: '0 0 16px' }}>
        Cài đặt nén
      </Title>
      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} sm={8}>
          <Text style={{ color: mutedColor, fontSize: 13, display: 'block', marginBottom: 8 }}>
            Chất lượng: <span style={{ color: '#50C878', fontWeight: 600 }}>{quality}%</span>
          </Text>
          <Slider
            min={10}
            max={100}
            value={quality}
            onChange={setQuality}
            disabled={outputFormat === 'image/png'}
            tooltip={{ formatter: (v) => `${v}%` }}
            trackStyle={{ background: '#50C878' }}
            handleStyle={{ borderColor: '#50C878' }}
          />
          {outputFormat === 'image/png' && (
            <Text style={{ color: mutedColor, fontSize: 11 }}>PNG không hỗ trợ điều chỉnh chất lượng</Text>
          )}
        </Col>
        <Col xs={24} sm={8}>
          <Text style={{ color: mutedColor, fontSize: 13, display: 'block', marginBottom: 8 }}>
            Kích thước tối đa
          </Text>
          <Select
            value={maxDimension}
            onChange={setMaxDimension}
            style={{ width: '100%' }}
          >
            {MAX_DIMENSION_OPTIONS.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={8}>
          <Text style={{ color: mutedColor, fontSize: 13, display: 'block', marginBottom: 8 }}>
            Định dạng đầu ra
          </Text>
          <Select value={outputFormat} onChange={setOutputFormat} style={{ width: '100%' }}>
            {FORMAT_OPTIONS.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.label}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  );

  const dropZone = (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#50C878' : borderColor}`,
        borderRadius: 12,
        padding: '48px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? 'rgba(80,200,120,0.05)' : cardBg,
        transition: 'all 0.2s',
        marginBottom: 20,
      }}
    >
      <InboxOutlined style={{ fontSize: 48, color: dragging ? '#50C878' : mutedColor, marginBottom: 12 }} />
      <div>
        <Text style={{ color: textColor, fontSize: 16, fontWeight: 600 }}>
          Kéo thả ảnh vào đây
        </Text>
      </div>
      <div>
        <Text style={{ color: mutedColor, fontSize: 13 }}>
          hoặc click để chọn file — hỗ trợ JPG, PNG, WebP, GIF
        </Text>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
    </div>
  );

  return (
    <div style={{ background: bg, minHeight: '60vh' }}>
      {settingsCard}
      {dropZone}

      {images.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              type="primary"
              icon={<CompressOutlined />}
              onClick={processAll}
              loading={images.some((i) => i.processing)}
              style={{ background: '#50C878', borderColor: '#50C878' }}
            >
              Nén {images.length} ảnh
            </Button>
            {hasCompressed && (
              <Button icon={<DownloadOutlined />} onClick={downloadAll} style={{ borderColor: borderColor, color: textColor }}>
                Tải tất cả
              </Button>
            )}
            <Button icon={<DeleteOutlined />} onClick={clearAll} danger>
              Xóa tất cả
            </Button>
            {hasCompressed && totalOriginal > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
                <Text style={{ color: mutedColor, fontSize: 13 }}>
                  Tổng: {formatBytes(totalOriginal)} → {formatBytes(totalCompressed)}
                </Text>
                <Tag color="green">
                  -{compressionRatio(totalOriginal, totalCompressed)}% tổng thể
                </Tag>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {images.map((item) => (
              <Card
                key={item.id}
                style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12 }}
                bodyStyle={{ padding: 20 }}
              >
                <Row gutter={[16, 16]} align="top">
                  {/* Original */}
                  <Col xs={24} sm={10}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="default">Gốc</Tag>
                      </div>
                      <img
                        src={item.originalUrl}
                        alt="original"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 220,
                          objectFit: 'contain',
                          borderRadius: 8,
                          border: `1px solid ${borderColor}`,
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: 600 }}>
                          {formatBytes(item.originalSize)}
                        </Text>
                        <Text style={{ color: mutedColor, fontSize: 12, display: 'block' }}>
                          {item.originalWidth} × {item.originalHeight} px
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Arrow */}
                  <Col xs={24} sm={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, color: mutedColor }}>→</div>
                      {item.compressedSize !== null && item.originalSize > 0 && (
                        <Tag color="green" style={{ marginTop: 4 }}>
                          -{compressionRatio(item.originalSize, item.compressedSize)}%
                        </Tag>
                      )}
                    </div>
                  </Col>

                  {/* Compressed */}
                  <Col xs={24} sm={10}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color={item.compressedUrl ? 'success' : 'default'}>Nén</Tag>
                      </div>
                      {item.processing ? (
                        <div
                          style={{
                            height: 220,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px dashed ${borderColor}`,
                            borderRadius: 8,
                          }}
                        >
                          <Progress type="circle" size={60} strokeColor="#50C878" percent={undefined} status="active" />
                        </div>
                      ) : item.compressedUrl ? (
                        <>
                          <img
                            src={item.compressedUrl}
                            alt="compressed"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 220,
                              objectFit: 'contain',
                              borderRadius: 8,
                              border: `1px solid #50C878`,
                            }}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Text style={{ color: '#50C878', fontSize: 13, fontWeight: 600 }}>
                              {formatBytes(item.compressedSize!)}
                            </Text>
                            <Text style={{ color: mutedColor, fontSize: 12, display: 'block' }}>
                              {item.newWidth} × {item.newHeight} px
                            </Text>
                          </div>
                        </>
                      ) : item.error ? (
                        <div
                          style={{
                            height: 220,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px dashed #ff4d4f`,
                            borderRadius: 8,
                            color: '#ff4d4f',
                            fontSize: 13,
                          }}
                        >
                          {item.error}
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 220,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px dashed ${borderColor}`,
                            borderRadius: 8,
                            color: mutedColor,
                            fontSize: 13,
                          }}
                        >
                          Chưa xử lý
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>

                <Divider style={{ borderColor, margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={{ color: mutedColor, fontSize: 13 }}>{item.file.name}</Text>
                    {item.compressedUrl && (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Hoàn thành
                      </Tag>
                    )}
                  </div>
                  <Space>
                    {item.compressedUrl && (
                      <Tooltip title="Tải ảnh đã nén">
                        <Button
                          icon={<DownloadOutlined />}
                          size="small"
                          onClick={() => downloadOne(item)}
                          style={{ borderColor: '#50C878', color: '#50C878' }}
                        >
                          Tải xuống
                        </Button>
                      </Tooltip>
                    )}
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={() => removeImage(item.id)}
                    >
                      Xóa
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {images.length === 0 && (
        <Empty
          description={<span style={{ color: mutedColor }}>Chưa có ảnh nào. Kéo thả hoặc click để chọn ảnh.</span>}
          style={{ marginTop: 40 }}
        />
      )}
    </div>
  );
}
