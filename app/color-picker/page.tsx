'use client';

import ColorPickerTool from '@/modules/color-picker/components/ColorPickerTool';
import PageHeader from '@/components/layout/PageHeader';

export default function ColorPickerPage() {
  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Color Picker & Palette"
        description="Pick any color and instantly see HEX, RGB, HSL, HSV, CMYK values. Generate complementary palettes, check WCAG contrast ratios, and export CSS variables."
        breadcrumbs={[{ label: 'Color Picker & Palette' }]}
      />
      <ColorPickerTool />
    </div>
  );
}
