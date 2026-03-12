'use client';
import ImageCompressorTool from '@/modules/image-compressor/components/ImageCompressorTool';
import PageHeader from '@/components/layout/PageHeader';
export default function ImageCompressorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Nén ảnh"
        description="Nén và thay đổi kích thước ảnh ngay trên trình duyệt. Không upload lên server. Hỗ trợ JPG, PNG, WebP."
        breadcrumbs={[{ label: 'Nén ảnh' }]}
        alert={{ message: 'Ảnh được xử lý hoàn toàn trên thiết bị của bạn, không gửi lên server.' }}
      />
      <ImageCompressorTool />
    </div>
  );
}
