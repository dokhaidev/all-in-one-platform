'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const TypingRaceTool = dynamic(() => import('@/modules/typing-race/components/TypingRaceTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Typing Race" description="Đua tốc độ gõ phím với text tiếng Việt, tiếng Anh và quotes nổi tiếng. Đo WPM, độ chính xác và kỷ lục cá nhân." breadcrumbs={[{ label: 'Typing Race' }]} />
      <TypingRaceTool />
    </div>
  );
}
