'use client';
import ExamTimerTool from '@/modules/exam-timer/components/ExamTimerTool';
import PageHeader from '@/components/layout/PageHeader';

export default function ExamTimerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Đồng hồ thi cử"
        description="Đếm ngược thời gian thi với cảnh báo âm thanh và chế độ toàn màn hình. Phù hợp để chiếu lên màn hình lớp học."
        breadcrumbs={[
          { label: 'Đồng hồ thi cử' },
        ]}
      />
      <ExamTimerTool />
    </div>
  );
}
