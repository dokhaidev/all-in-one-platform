'use client';

import CsvConverterTool from '@/modules/csv-converter/components/CsvConverterTool';
import PageHeader from '@/components/layout/PageHeader';

export default function CsvConverterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Chuyển đổi CSV sang JSON/Excel"
        description="Chuyển đổi giữa các định dạng CSV, JSON và Excel với xem trước. Tất cả xử lý được thực hiện client-side để bảo vệ quyền riêng tư."
        breadcrumbs={[
          { label: 'Chuyển đổi CSV' },
        ]}
        alert={{
          message:
            'Tất cả xử lý file được thực hiện hoàn toàn trong trình duyệt của bạn. Dữ liệu của bạn không bao giờ được gửi lên máy chủ và không được lưu trữ.',
        }}
      />
      <CsvConverterTool />
    </div>
  );
}
