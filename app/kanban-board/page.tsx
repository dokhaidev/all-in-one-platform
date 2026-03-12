'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const KanbanBoardTool = dynamic(() => import('@/modules/kanban-board/components/KanbanBoardTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Kanban Board" description="Quản lý task kiểu Kanban với 4 cột To-do, In Progress, Review, Done. Kéo thả, ưu tiên, tags và lưu tự động." breadcrumbs={[{ label: 'Kanban Board' }]} alert={{ message: 'Dữ liệu được lưu tự động vào localStorage trên trình duyệt của bạn.' }} />
      <KanbanBoardTool />
    </div>
  );
}
