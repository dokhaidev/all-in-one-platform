'use client';

import BigOCheatsheetTool from '@/modules/big-o-cheatsheet/components/BigOCheatsheetTool';
import PageHeader from '@/components/layout/PageHeader';

export default function BigOCheatsheetPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Big-O Cheat Sheet"
        description="Comprehensive algorithm and data structure complexity reference. Filter by name, notation, or use case across all categories."
        breadcrumbs={[
          { label: 'Big-O Cheat Sheet' },
        ]}
      />
      <BigOCheatsheetTool />
    </div>
  );
}
