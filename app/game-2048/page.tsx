'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const Game2048Tool = dynamic(() => import('@/modules/game-2048/components/Game2048Tool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="2048" description="Ghép các ô số để đạt tới 2048. Dùng phím mũi tên hoặc vuốt màn hình cảm ứng. Điểm cao nhất được lưu tự động." breadcrumbs={[{ label: '2048' }]} />
      <Game2048Tool />
    </div>
  );
}
