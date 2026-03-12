'use client';

import PomodoroTimer from '@/modules/pomodoro-timer/components/PomodoroTimer';
import PageHeader from '@/components/layout/PageHeader';

export default function PomodoroTimerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Pomodoro Timer"
        description="Tập trung và tăng năng suất với kỹ thuật Pomodoro. Bộ đếm thời gian Pomodoro miễn phí giúp bạn làm việc trong các khoảng thời gian tập trung."
        breadcrumbs={[
          { label: 'Pomodoro Timer' },
        ]}
      />
      <PomodoroTimer />
    </div>
  );
}
