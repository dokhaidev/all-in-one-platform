'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const BudgetTrackerTool = dynamic(() => import('@/modules/budget-tracker/components/BudgetTrackerTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Budget Tracker" description="Theo dõi thu chi cá nhân theo tháng và danh mục. Phân tích biểu đồ chi tiêu và tổng hợp số dư tức thì." breadcrumbs={[{ label: 'Budget Tracker' }]} alert={{ message: 'Dữ liệu tài chính được lưu cục bộ, không gửi lên server.' }} />
      <BudgetTrackerTool />
    </div>
  );
}
