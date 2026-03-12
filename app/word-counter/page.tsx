'use client';
import WordCounterTool from '@/modules/word-counter/components/WordCounterTool';
import PageHeader from '@/components/layout/PageHeader';
export default function WordCounterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Đếm từ & văn bản"
        description="Phân tích văn bản chi tiết: đếm từ, ký tự, câu, đoạn. Thống kê tần suất từ và thời gian đọc ước tính."
        breadcrumbs={[{ label: 'Đếm từ & văn bản' }]}
      />
      <WordCounterTool />
    </div>
  );
}
