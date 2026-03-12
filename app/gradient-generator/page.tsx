'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const GradientGeneratorTool = dynamic(() => import('@/modules/gradient-generator/components/GradientGeneratorTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="CSS Gradient Generator" description="Tạo linear, radial và conic gradient đẹp. Kéo color stop, chọn preset và copy CSS ngay lập tức." breadcrumbs={[{ label: 'Gradient Generator' }]} />
      <GradientGeneratorTool />
    </div>
  );
}
