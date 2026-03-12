'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const BaseConverterTool = dynamic(() => import('@/modules/base-converter/components/BaseConverterTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Number Base Converter" description="Chuyển đổi số giữa Decimal, Binary, Octal, Hexadecimal. Hiển thị biểu diễn bit và bảng số bit trực quan." breadcrumbs={[{ label: 'Number Base Converter' }]} alert={{ message: 'Chuyển đổi tức thì trong trình duyệt, không cần kết nối mạng.' }} />
      <BaseConverterTool />
    </div>
  );
}
