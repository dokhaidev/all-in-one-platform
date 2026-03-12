'use client';
import BmiCalculatorTool from '@/modules/bmi-calculator/components/BmiCalculatorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function BmiCalculatorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Máy tính BMI"
        description="Tính chỉ số khối cơ thể (BMI) bằng hệ mét hoặc imperial và nhận lời khuyên cơ bản cho từng nhóm."
        breadcrumbs={[
          { label: 'Máy tính BMI' },
        ]}
        alert={{ message: 'Toàn bộ phép tính được xử lý ngay trên trình duyệt của bạn. Chúng tôi không tải lên hay lưu trữ dữ liệu.' }}
      />
      <BmiCalculatorTool />
    </div>
  );
}
