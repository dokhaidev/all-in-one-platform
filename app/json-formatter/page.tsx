'use client';
import JsonFormatterTool from '@/modules/json-formatter/components/JsonFormatterTool';
import PageHeader from '@/components/layout/PageHeader';
export default function JsonFormatterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="JSON Formatter"
        description="Format, validate, minify và phân tích cấu trúc JSON. Hỗ trợ highlight lỗi và chuyển đổi định dạng."
        breadcrumbs={[{ label: 'JSON Formatter' }]}
      />
      <JsonFormatterTool />
    </div>
  );
}
