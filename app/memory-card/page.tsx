'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const MemoryCardTool = dynamic(() => import('@/modules/memory-card/components/MemoryCardTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Memory Card" description="Lật thẻ tìm cặp emoji giống nhau. 3 mức độ khó, đếm thời gian và lưu kỷ lục theo từng độ khó." breadcrumbs={[{ label: 'Memory Card' }]} />
      <MemoryCardTool />
    </div>
  );
}
