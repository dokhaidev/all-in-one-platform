'use client';

import { Button, message, Popconfirm } from 'antd';
import {
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined,
  CopyOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useRef } from 'react';
import { CvData } from '../../types';
import { EMPTY_CV_DATA, SAMPLE_CV_DATA } from '../../constants/defaults';
import { CV_WIDTH } from '../CvPreview';

interface Props {
  cvData: CvData;
  onChange: (data: CvData) => void;
}

export default function StepExport({ cvData, onChange }: Props) {
  const [msg, ctxHolder] = message.useMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPDF = () => {
    const el = document.getElementById('cv-preview-content');
    if (!el) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      msg.error('Vui lòng cho phép popup để tải PDF');
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cvData.personal.name || 'CV'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${cvData.design.font}; }
    @page { margin: 0; size: A4 portrait; }
    @media print {
      html, body { width: ${CV_WIDTH}px; }
    }
  </style>
</head>
<body>
${el.outerHTML}
</body>
</html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 600);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(cvData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvData.personal.name || 'cv'}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
    msg.success('Đã xuất file JSON');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as CvData;
        onChange(data);
        msg.success('Đã nhập dữ liệu thành công');
      } catch {
        msg.error('File không hợp lệ');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(cvData, null, 2));
    msg.success('Đã sao chép JSON vào clipboard');
  };

  const handleLoadSample = () => {
    onChange(SAMPLE_CV_DATA);
    msg.success('Đã tải dữ liệu mẫu');
  };

  const handleClearAll = () => {
    onChange(EMPTY_CV_DATA);
    msg.success('Đã xóa tất cả dữ liệu');
  };

  return (
    <div>
      {ctxHolder}
      <div
        style={{
          textAlign: 'center',
          padding: '20px 0 28px',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: 'rgba(80,200,120,0.12)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <DownloadOutlined style={{ fontSize: 32, color: '#50C878' }} />
        </div>
        <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          Xuất file
        </div>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
          Tải CV của bạn về dưới nhiều định dạng khác nhau
        </div>

        {/* Primary: PDF */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          size="large"
          block
          onClick={handleExportPDF}
          style={{ marginBottom: 10, height: 44, fontWeight: 600 }}
        >
          Tải PDF
        </Button>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button
            icon={<ExportOutlined />}
            block
            onClick={handleExportJSON}
          >
            Xuất dạng JSON
          </Button>
          <Button
            icon={<ImportOutlined />}
            block
            onClick={() => fileInputRef.current?.click()}
          >
            Nhập JSON
          </Button>
        </div>
        <Button
          icon={<CopyOutlined />}
          block
          onClick={handleCopyJSON}
          style={{ marginBottom: 16 }}
        >
          Sao chép JSON
        </Button>

        <div
          style={{
            borderTop: '1px solid #2a2a2a',
            paddingTop: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          <Button
            icon={<ReloadOutlined />}
            block
            onClick={handleLoadSample}
          >
            Tải dữ liệu mẫu
          </Button>
          <Popconfirm
            title="Xóa tất cả dữ liệu?"
            description="Hành động này không thể hoàn tác."
            onConfirm={handleClearAll}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} block>
              Xóa tất cả
            </Button>
          </Popconfirm>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportJSON}
      />
    </div>
  );
}
