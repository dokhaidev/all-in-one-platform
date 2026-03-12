'use client';

import RegexTesterTool from '@/modules/regex-tester/components/RegexTesterTool';
import PageHeader from '@/components/layout/PageHeader';

export default function RegexTesterPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Regex Tester"
        description="Kiểm tra và debug Regular Expressions theo thời gian thực. Highlight matches, xem capture groups và tra cứu cheatsheet."
        breadcrumbs={[{ label: 'Regex Tester' }]}
      />
      <RegexTesterTool />
    </div>
  );
}
