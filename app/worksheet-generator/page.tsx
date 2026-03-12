'use client';
import WorksheetGeneratorTool from '@/modules/worksheet-generator/components/WorksheetGeneratorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function WorksheetGeneratorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Phiếu bài tập"
        description="Tạo phiếu bài tập và đề cương ôn tập. Tùy chỉnh câu hỏi, in trực tiếp hoặc xuất PDF."
        breadcrumbs={[{ label: 'Phiếu bài tập' }]}
      />
      <WorksheetGeneratorTool />
    </div>
  );
}
