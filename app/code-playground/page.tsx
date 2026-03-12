'use client';

import CodePlaygroundTool from '@/modules/code-playground/components/CodePlaygroundTool';
import PageHeader from '@/components/layout/PageHeader';

export default function CodePlaygroundPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Code Playground"
        description="Viết HTML, CSS và JavaScript trực tiếp trên trình duyệt. Xem kết quả ngay lập tức với chế độ auto-run."
        breadcrumbs={[{ label: 'Code Playground' }]}
      />
      <CodePlaygroundTool />
    </div>
  );
}
