'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const HabitTrackerTool = dynamic(() => import('@/modules/habit-tracker/components/HabitTrackerTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Habit Tracker" description="Xây dựng và theo dõi thói quen tốt hàng ngày. Streak calendar 30 ngày, tỷ lệ hoàn thành và emoji tùy chỉnh." breadcrumbs={[{ label: 'Habit Tracker' }]} alert={{ message: 'Dữ liệu thói quen được lưu tự động vào localStorage.' }} />
      <HabitTrackerTool />
    </div>
  );
}
