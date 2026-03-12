'use client';
import EquationSolverTool from '@/modules/equation-solver/components/EquationSolverTool';
import PageHeader from '@/components/layout/PageHeader';

export default function EquationSolverPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Giải phương trình"
        description="Giải phương trình bậc 1, bậc 2 và hệ phương trình. Hiển thị từng bước giải chi tiết."
        breadcrumbs={[{ label: 'Giải phương trình' }]}
      />
      <EquationSolverTool />
    </div>
  );
}
