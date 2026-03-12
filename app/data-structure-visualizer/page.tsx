'use client';
import DataStructureVisualizerTool from '@/modules/data-structure-visualizer/components/DataStructureVisualizerTool';
import PageHeader from '@/components/layout/PageHeader';

export default function DataStructureVisualizerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Data Structure Visualizer"
        description="Interactively explore Stack, Queue, Linked List, and Binary Search Tree with step-by-step animations."
        breadcrumbs={[
          { label: 'Học lập trình', href: '/' },
          { label: 'Data Structure Visualizer' },
        ]}
        alert={{ message: 'All operations run entirely in your browser. No data is sent to any server.' }}
      />
      <DataStructureVisualizerTool />
    </div>
  );
}
