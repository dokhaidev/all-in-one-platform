'use client';

import JsonPathTesterTool from '@/modules/json-path-tester/components/JsonPathTesterTool';
import PageHeader from '@/components/layout/PageHeader';

export default function JsonPathTesterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="JSON Path Tester"
        description="Query JSON data bằng dot-notation path. Hỗ trợ array index, wildcard [*] và nested path. Không cần thư viện ngoài."
        breadcrumbs={[{ label: 'JSON Path Tester' }]}
      />
      <JsonPathTesterTool />
    </div>
  );
}
