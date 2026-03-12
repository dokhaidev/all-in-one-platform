'use client';
import EventCountdownTool from '@/modules/event-countdown/components/EventCountdownTool';
import PageHeader from '@/components/layout/PageHeader';
export default function EventCountdownPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Đếm ngược sự kiện"
        description="Tạo bộ đếm ngược cho các sự kiện quan trọng. Sinh nhật, kỳ nghỉ, deadline, kỷ niệm..."
        breadcrumbs={[{ label: 'Đếm ngược sự kiện' }]}
      />
      <EventCountdownTool />
    </div>
  );
}
