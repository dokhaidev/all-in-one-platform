'use client';
import NamePickerTool from '@/modules/name-picker/components/NamePickerTool';
import PageHeader from '@/components/layout/PageHeader';

export default function NamePickerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Bốc thăm học sinh"
        description="Chọn ngẫu nhiên học sinh để trả lời câu hỏi. Thêm danh sách, loại trừ học sinh đã được chọn."
        breadcrumbs={[{ label: 'Bốc thăm học sinh' }]}
        alert={{ message: 'Dữ liệu được lưu trữ hoàn toàn trên thiết bị của bạn, không gửi lên server.' }}
      />
      <NamePickerTool />
    </div>
  );
}
