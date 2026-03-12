'use client';

import SleepCalculatorTool from '@/modules/sleep-calculator/components/SleepCalculatorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function SleepCalculatorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Máy tính giấc ngủ"
        description="Tính toán thời gian ngủ hoặc thức dậy tối ưu dựa trên chu kỳ giấc ngủ 90 phút. Thức dậy sảng khoái bằng cách tính toán chu kỳ giấc ngủ hoàn hảo."
        breadcrumbs={[
          { label: 'Máy tính giấc ngủ' },
        ]}
      />
      <SleepCalculatorTool />
    </div>
  );
}
