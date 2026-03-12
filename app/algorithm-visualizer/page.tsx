'use client';
import AlgorithmVisualizerTool from '@/modules/algorithm-visualizer/components/AlgorithmVisualizerTool';
import PageHeader from '@/components/layout/PageHeader';

export default function AlgorithmVisualizerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Algorithm Visualizer"
        description="Step-by-step visualization of sorting algorithms. Watch how Bubble Sort, Merge Sort, Quick Sort and more work under the hood."
        breadcrumbs={[
          { label: 'Học lập trình', href: '/' },
          { label: 'Algorithm Visualizer' },
        ]}
        alert={{ message: 'All computation happens in your browser. No data is sent to any server.' }}
      />
      <AlgorithmVisualizerTool />
    </div>
  );
}
