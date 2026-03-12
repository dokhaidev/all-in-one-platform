'use client';

import HttpStatusCodesTool from '@/modules/http-status-codes/components/HttpStatusCodesTool';
import PageHeader from '@/components/layout/PageHeader';

export default function HttpStatusCodesPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="HTTP Status Codes"
        description="Complete reference for all standard HTTP status codes. Search by code number or description, filter by category, and use Quick Lookup to jump directly to any code."
        breadcrumbs={[
          { label: 'HTTP Status Codes' },
        ]}
      />
      <HttpStatusCodesTool />
    </div>
  );
}
