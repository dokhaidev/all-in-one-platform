'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const BoxShadowGeneratorTool = dynamic(() => import('@/modules/box-shadow-generator/components/BoxShadowGeneratorTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Box Shadow Generator" description="Tạo CSS box-shadow với multi-layer, inset và neon effects. Preview realtime và copy CSS ngay." breadcrumbs={[{ label: 'Box Shadow Generator' }]} />
      <BoxShadowGeneratorTool />
    </div>
  );
}
