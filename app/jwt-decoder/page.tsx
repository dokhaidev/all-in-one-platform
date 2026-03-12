'use client';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/layout/PageHeader';
const JwtDecoderTool = dynamic(() => import('@/modules/jwt-decoder/components/JwtDecoderTool'), { ssr: false });
export default function Page() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="JWT Decoder" description="Decode JWT token, xem header/payload/signature, kiểm tra expiry và giải thích claims chuẩn." breadcrumbs={[{ label: 'JWT Decoder' }]} alert={{ message: 'Xử lý hoàn toàn tại trình duyệt. Token không được gửi lên server.' }} />
      <JwtDecoderTool />
    </div>
  );
}
