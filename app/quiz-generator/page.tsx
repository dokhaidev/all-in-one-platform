'use client';
import QuizGeneratorTool from '@/modules/quiz-generator/components/QuizGeneratorTool';
import PageHeader from '@/components/layout/PageHeader';

export default function QuizGeneratorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Tạo đề kiểm tra"
        description="Tạo đề kiểm tra trắc nghiệm, đúng/sai và tự luận. Xáo trộn câu hỏi, xem trước và in trực tiếp."
        breadcrumbs={[
          { label: 'Tạo đề kiểm tra' },
        ]}
      />
      <QuizGeneratorTool />
    </div>
  );
}
