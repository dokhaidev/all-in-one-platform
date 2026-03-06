'use client';

import CvBuilderWizard from '@/modules/cv-builder/components/CvBuilderWizard';
import PageHeader from '@/components/layout/PageHeader';

export default function CvBuilderPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Tạo CV"
        description="Tạo CV chuyên nghiệp, thân thiện với ATS dưới dạng PDF. Điền thông tin của bạn và tải CV trong vài giây."
        breadcrumbs={[
          { label: 'Tạo CV' },
        ]}
        alert={{
          message: 'Dữ liệu của bạn được bảo mật',
          description:
            'Tất cả dữ liệu CV được xử lý hoàn toàn trong trình duyệt của bạn. Thông tin của bạn không bao giờ được gửi đến bất kỳ máy chủ nào.',
        }}
      />
      <CvBuilderWizard />
    </div>
  );
}
