'use client';
import PercentageCalculatorTool from '@/modules/percentage-calculator/components/PercentageCalculatorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function PercentageCalculatorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Máy tính phần trăm"
        description="Tính phần trăm, tỷ lệ tăng/giảm, và các phép tính % thông dụng."
        breadcrumbs={[{ label: 'Máy tính phần trăm' }]}
      />
      <PercentageCalculatorTool />
    </div>
  );
}
