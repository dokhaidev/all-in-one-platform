'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const WordleTool = dynamic(() => import('@/modules/wordle/components/WordleTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Wordle" description="Đoán từ 5 chữ cái trong 6 lần thử. Màu sắc gợi ý vị trí đúng/sai của từng chữ. Game cổ điển và thú vị!" breadcrumbs={[{ label: 'Wordle' }]} />
      <WordleTool />
    </div>
  );
}
