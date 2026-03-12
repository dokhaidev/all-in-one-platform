'use client';
import PasswordGeneratorTool from '@/modules/password-generator/components/PasswordGeneratorTool';
import PageHeader from '@/components/layout/PageHeader';
export default function PasswordGeneratorPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Tạo mật khẩu mạnh" description="Tạo mật khẩu ngẫu nhiên với độ dài và độ phức tạp tùy chỉnh. Kiểm tra độ mạnh và lưu trữ an toàn." breadcrumbs={[{ label: 'Tạo mật khẩu' }]} />
      <PasswordGeneratorTool />
    </div>
  );
}
