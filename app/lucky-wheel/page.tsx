'use client';

import LuckyWheelTool from '@/modules/lucky-wheel/components/LuckyWheelTool';
import PageHeader from '@/components/layout/PageHeader';

export default function LuckyWheelPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Vòng quay may mắn"
        description="Quay vòng để chọn ngẫu nhiên một người thắng cuộc từ danh sách tên. Hoàn hảo cho trò chơi, cuộc thi và lựa chọn ngẫu nhiên."
        breadcrumbs={[
          { label: 'Vòng quay may mắn' },
        ]}
      />
      <LuckyWheelTool />
    </div>
  );
}
