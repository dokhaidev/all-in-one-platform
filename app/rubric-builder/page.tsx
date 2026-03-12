'use client';
import RubricBuilderTool from '@/modules/rubric-builder/components/RubricBuilderTool';
import PageHeader from '@/components/layout/PageHeader';

export default function RubricBuilderPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Phiếu đánh giá"
        description="Tạo phiếu đánh giá (rubric) với các tiêu chí tùy chỉnh. Chấm điểm học sinh và xuất báo cáo kết quả."
        breadcrumbs={[
          { label: 'Phiếu đánh giá' },
        ]}
        alert={{ message: 'Dữ liệu được lưu trữ hoàn toàn trên thiết bị của bạn, không gửi lên server.' }}
      />
      <RubricBuilderTool />
    </div>
  );
}
