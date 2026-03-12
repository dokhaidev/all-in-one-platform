'use client';

import CodingQuizTool from '@/modules/coding-quiz/components/CodingQuizTool';
import PageHeader from '@/components/layout/PageHeader';

export default function CodingQuizPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Quiz lập trình"
        description="Test your programming knowledge with 85+ questions across JavaScript, TypeScript, Python, React, SQL, Git, Data Structures, Algorithms, and HTML/CSS."
        breadcrumbs={[{ label: 'Quiz lập trình' }]}
      />
      <CodingQuizTool />
    </div>
  );
}
