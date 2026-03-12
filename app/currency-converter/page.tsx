'use client';
import CurrencyConverterTool from '@/modules/currency-converter/components/CurrencyConverterTool';
import PageHeader from '@/components/layout/PageHeader';
export default function CurrencyConverterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Chuyển đổi tiền tệ"
        description="Chuyển đổi giữa các loại tiền tệ sử dụng tỷ giá thời gian thực. Hỗ trợ hơn 150 loại tiền tệ."
        breadcrumbs={[
          { label: 'Chuyển đổi tiền tệ' },
        ]}
      />
      <CurrencyConverterTool />
    </div>
  );
}
