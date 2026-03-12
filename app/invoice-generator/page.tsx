'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const InvoiceGeneratorTool = dynamic(() => import('@/modules/invoice-generator/components/InvoiceGeneratorTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Invoice Generator" description="Tạo hóa đơn chuyên nghiệp với thông tin người bán/mua, dịch vụ, thuế VAT. In trực tiếp hoặc xuất PDF." breadcrumbs={[{ label: 'Invoice Generator' }]} alert={{ message: 'Toàn bộ tạo hóa đơn được thực hiện tại trình duyệt. Dữ liệu không rời khỏi thiết bị.' }} />
      <InvoiceGeneratorTool />
    </div>
  );
}
