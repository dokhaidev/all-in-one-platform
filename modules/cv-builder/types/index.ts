export type TemplateType = 'modern' | 'classic' | 'minimal';

export const COLOR_OPTIONS = [
  { label: 'Emerald', value: '#50C878' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Tím', value: '#7c3aed' },
  { label: 'Xám', value: '#475569' },
  { label: 'Đỏ', value: '#dc2626' },
];

export const FONT_OPTIONS = [
  { label: 'Helvetica (Modern)', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: 'Georgia (Cổ điển)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Arial (Đơn giản)', value: 'Arial, sans-serif' },
];

export const TEMPLATE_OPTIONS = [
  { label: 'Modern', value: 'modern' as TemplateType, desc: 'Hiện đại, màu sắc' },
  { label: 'Classic', value: 'classic' as TemplateType, desc: 'Cổ điển, trang trọng' },
  { label: 'Minimal', value: 'minimal' as TemplateType, desc: 'Tối giản, tinh tế' },
];

export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const FLUENCY_LEVELS = [
  'Sơ cấp',
  'Giao tiếp cơ bản',
  'Giao tiếp tốt',
  'Thành thạo',
  'Bản ngữ',
];

export interface Profile {
  id: string;
  network: string;
  url: string;
}

export interface CvDesign {
  template: TemplateType;
  primaryColor: string;
  font: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  summary: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  profiles: Profile[];
}

export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string;
  currently: boolean;
  website: string;
  summary: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  area: string;
  studyType: string;
  startDate: string;
  endDate: string;
  gpa: string;
  website: string;
  courses: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: string;
  keywords: string[];
}

export interface Language {
  id: string;
  language: string;
  fluency: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  url: string;
  highlights: string[];
}

export interface CvData {
  design: CvDesign;
  personal: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  projects: Project[];
}
