'use client';

import CodeTypingSpeedTool from '@/modules/code-typing-speed/components/CodeTypingSpeedTool';
import PageHeader from '@/components/layout/PageHeader';

export default function CodeTypingSpeedPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Code Typing Speed"
        description="Test your coding speed across 7 languages. Character-by-character feedback, live WPM & accuracy stats, multiple timer modes, and personal best tracking."
        breadcrumbs={[{ label: 'Code Typing Speed' }]}
      />
      <CodeTypingSpeedTool />
    </div>
  );
}
