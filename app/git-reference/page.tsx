'use client';

import GitReferenceTool from '@/modules/git-reference/components/GitReferenceTool';
import PageHeader from '@/components/layout/PageHeader';

export default function GitReferencePage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Git Command Reference"
        description="Quick lookup for all common Git commands. Search, filter by category, and copy any command to clipboard instantly. Bookmark your most-used commands with the favorites system."
        breadcrumbs={[
          { label: 'Git Command Reference' },
        ]}
      />
      <GitReferenceTool />
    </div>
  );
}
