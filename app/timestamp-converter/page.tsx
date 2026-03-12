'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const TimestampConverterTool = dynamic(() => import('@/modules/timestamp-converter/components/TimestampConverterTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Timestamp Converter" description="Chuyển đổi Unix timestamp ↔ datetime. Hỗ trợ milliseconds, nhiều múi giờ và nhiều định dạng ngày giờ." breadcrumbs={[{ label: 'Timestamp Converter' }]} alert={{ message: 'Xử lý tại trình duyệt. Đồng hồ realtime và chuyển đổi tức thì.' }} />
      <TimestampConverterTool />
    </div>
  );
}
