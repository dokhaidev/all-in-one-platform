'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const DiffTool = dynamic(() => import('@/modules/diff-tool/components/DiffTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Text Diff Tool" description="So sánh 2 đoạn text hoặc code, highlight dòng thêm/xóa/sửa. Hỗ trợ chế độ inline và side-by-side." breadcrumbs={[{ label: 'Text Diff Tool' }]} alert={{ message: 'Toàn bộ so sánh được thực hiện tại trình duyệt. Dữ liệu không rời khỏi thiết bị.' }} />
      <DiffTool />
    </div>
  );
}
