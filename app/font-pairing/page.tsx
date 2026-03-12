'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const FontPairingTool = dynamic(() => import('@/modules/font-pairing/components/FontPairingTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Font Pairing Tool" description="Khám phá 12 cặp font Google Fonts đẹp. Preview heading và body text với nội dung tùy chỉnh, copy CSS." breadcrumbs={[{ label: 'Font Pairing Tool' }]} />
      <FontPairingTool />
    </div>
  );
}
