'use client';
import LoanCalculatorTool from '@/modules/loan-calculator/components/LoanCalculatorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function LoanCalculatorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Máy tính lãi vay"
        description="Tính toán khoản vay, lãi suất và lịch trả góp hàng tháng. Hỗ trợ lãi suất cố định và giảm dần."
        breadcrumbs={[{ label: 'Máy tính lãi vay' }]}
      />
      <LoanCalculatorTool />
    </div>
  );
}
