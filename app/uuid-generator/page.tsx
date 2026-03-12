'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const UuidGeneratorTool = dynamic(() => import('@/modules/uuid-generator/components/UuidGeneratorTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="UUID / ID Generator" description="Tạo UUID v4/v1, NanoID, ULID ngay trên trình duyệt. Tạo hàng loạt, tuỳ chỉnh định dạng và lưu lịch sử." breadcrumbs={[{ label: 'UUID Generator' }]} alert={{ message: 'Tất cả ID được tạo bằng Web Crypto API tại trình duyệt. Hoàn toàn riêng tư.' }} />
      <UuidGeneratorTool />
    </div>
  );
}
