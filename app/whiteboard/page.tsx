'use client';

import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';

const WhiteboardTool = dynamic(
  () => import('@/modules/whiteboard/components/WhiteboardTool'),
  { ssr: false, loading: () => <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Đang tải bảng vẽ...</div> }
);

export default function WhiteboardPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Bảng vẽ trực tuyến"
        description="Vẽ sơ đồ, phác thảo ý tưởng với đầy đủ công cụ hình học, tự do vẽ tay, chú thích và xuất ảnh."
        breadcrumbs={[{ label: 'Bảng vẽ trực tuyến' }]}
      />
      <WhiteboardTool />
    </div>
  );
}
