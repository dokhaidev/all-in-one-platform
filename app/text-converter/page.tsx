'use client';
import TextConverterTool from '@/modules/text-converter/components/TextConverterTool';
import PageHeader from '@/components/layout/PageHeader';
export default function TextConverterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Chuyển đổi kiểu chữ" description="Chuyển đổi văn bản giữa các định dạng: UPPER CASE, lower case, Title Case, camelCase, snake_case và nhiều hơn nữa." breadcrumbs={[{ label: 'Chuyển đổi kiểu chữ' }]} />
      <TextConverterTool />
    </div>
  );
}
