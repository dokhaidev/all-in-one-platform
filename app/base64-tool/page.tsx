'use client';
import Base64Tool from '@/modules/base64-tool/components/Base64Tool';
import PageHeader from '@/components/layout/PageHeader';
export default function Base64ToolPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Base64 Encode/Decode"
        description="Mã hóa và giải mã Base64 cho văn bản, URL và file ảnh. Hỗ trợ URL-safe Base64."
        breadcrumbs={[{ label: 'Base64 Encode/Decode' }]}
      />
      <Base64Tool />
    </div>
  );
}
