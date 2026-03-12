'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const CubicBezierTool = dynamic(() => import('@/modules/cubic-bezier/components/CubicBezierTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Cubic Bezier Editor" description="Kéo điểm kiểm soát để tạo easing curve tùy chỉnh. Preview animation và copy CSS timing function." breadcrumbs={[{ label: 'Cubic Bezier Editor' }]} />
      <CubicBezierTool />
    </div>
  );
}
