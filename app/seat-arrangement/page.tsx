'use client';
import SeatArrangementTool from '@/modules/seat-arrangement/components/SeatArrangementTool';
import PageHeader from '@/components/layout/PageHeader';

export default function SeatArrangementPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Sơ đồ chỗ ngồi"
        description="Tạo sơ đồ chỗ ngồi ngẫu nhiên cho lớp học. Chọn số cột, nhập danh sách học sinh và xáo trộn tự động."
        breadcrumbs={[
          { label: 'Sơ đồ chỗ ngồi' },
        ]}
      />
      <SeatArrangementTool />
    </div>
  );
}
