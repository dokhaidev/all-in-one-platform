'use client';
import QrGeneratorTool from '@/modules/qr-generator/components/QrGeneratorTool';
import PageHeader from '@/components/layout/PageHeader';
export default function QrGeneratorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Tạo mã QR" description="Tạo mã QR từ văn bản, URL, số điện thoại, email và WiFi. Tùy chỉnh màu sắc và tải về PNG." breadcrumbs={[{ label: 'Tạo mã QR' }]} />
      <QrGeneratorTool />
    </div>
  );
}
