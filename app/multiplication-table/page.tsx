'use client';
import MultiplicationTableTool from '@/modules/multiplication-table/components/MultiplicationTableTool';
import PageHeader from '@/components/layout/PageHeader';

export default function MultiplicationTablePage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Bảng cửu chương"
        description="Học và luyện tập bảng cửu chương tương tác. Chế độ xem bảng đầy đủ và chế độ luyện tập."
        breadcrumbs={[{ label: 'Bảng cửu chương' }]}
      />
      <MultiplicationTableTool />
    </div>
  );
}
