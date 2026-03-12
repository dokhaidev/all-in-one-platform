'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const CronBuilderTool = dynamic(() => import('@/modules/cron-builder/components/CronBuilderTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Cron Expression Builder" description="Xây dựng và giải thích cron expression bằng tiếng Việt. Xem 5 lần chạy tiếp theo và chọn preset thông dụng." breadcrumbs={[{ label: 'Cron Builder' }]} />
      <CronBuilderTool />
    </div>
  );
}
