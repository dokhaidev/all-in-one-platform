'use client';
import AttendanceTrackerTool from '@/modules/attendance-tracker/components/AttendanceTrackerTool';
import PageHeader from '@/components/layout/PageHeader';

export default function AttendanceTrackerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Điểm danh"
        description="Quản lý điểm danh học sinh theo ngày. Theo dõi tình trạng có mặt, vắng mặt và đi trễ."
        breadcrumbs={[{ label: 'Điểm danh' }]}
        alert={{ message: 'Dữ liệu được lưu trữ hoàn toàn trên thiết bị của bạn, không gửi lên server.' }}
      />
      <AttendanceTrackerTool />
    </div>
  );
}
