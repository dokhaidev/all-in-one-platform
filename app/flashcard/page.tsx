'use client';
import FlashcardTool from '@/modules/flashcard/components/FlashcardTool';
import PageHeader from '@/components/layout/PageHeader';

export default function FlashcardPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Flashcard ôn tập"
        description="Tạo và ôn tập flashcard với hiệu ứng lật thẻ. Theo dõi tiến độ học tập của bạn."
        breadcrumbs={[{ label: 'Flashcard ôn tập' }]}
        alert={{ message: 'Dữ liệu được lưu trữ hoàn toàn trên thiết bị của bạn, không gửi lên server.' }}
      />
      <FlashcardTool />
    </div>
  );
}
