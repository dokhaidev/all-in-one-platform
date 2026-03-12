'use client';
import GradeBookTool from '@/modules/grade-book/components/GradeBookTool';
import PageHeader from '@/components/layout/PageHeader';

export default function GradeBookPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Quản lý điểm số"
        description="Nhập và quản lý điểm số học sinh theo lớp. Tính điểm trung bình, xếp loại tự động và xuất báo cáo."
        breadcrumbs={[
          { label: 'Quản lý điểm số' },
        ]}
        alert={{ message: 'Dữ liệu được lưu trữ hoàn toàn trên thiết bị của bạn, không gửi lên server.' }}
      />
      <GradeBookTool />
    </div>
  );
}
