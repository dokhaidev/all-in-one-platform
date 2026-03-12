'use client';
import WorldClockTool from '@/modules/world-clock/components/WorldClockTool';
import PageHeader from '@/components/layout/PageHeader';
export default function WorldClockPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Đồng hồ múi giờ"
        description="Xem giờ hiện tại ở nhiều quốc gia cùng lúc. Thêm thành phố, so sánh múi giờ và chuyển đổi thời gian."
        breadcrumbs={[{ label: 'Đồng hồ múi giờ' }]}
      />
      <WorldClockTool />
    </div>
  );
}
