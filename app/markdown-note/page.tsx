'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const MarkdownNoteTool = dynamic(() => import('@/modules/markdown-note/components/MarkdownNoteTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Markdown Note" description="Soạn thảo Markdown với preview realtime. Quản lý nhiều ghi chú, tìm kiếm nhanh và lưu tự động vào trình duyệt." breadcrumbs={[{ label: 'Markdown Note' }]} alert={{ message: 'Ghi chú được lưu tự động vào localStorage. Không mất dữ liệu khi tắt trình duyệt.' }} />
      <MarkdownNoteTool />
    </div>
  );
}
