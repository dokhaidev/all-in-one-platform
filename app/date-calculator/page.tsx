'use client';
import DateCalculatorTool from '@/modules/date-calculator/components/DateCalculatorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function DateCalculatorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Tính khoảng cách ngày"
        description="Tính số ngày giữa hai mốc thời gian, tính tuổi, đếm ngược deadline và cộng/trừ ngày."
        breadcrumbs={[{ label: 'Tính khoảng cách ngày' }]}
      />
      <DateCalculatorTool />
    </div>
  );
}
