import { CvData } from '../types';

const uid = () => Math.random().toString(36).slice(2, 9);

export const EMPTY_CV_DATA: CvData = {
  design: {
    template: 'modern',
    primaryColor: '#50C878',
    font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  personal: {
    name: '',
    title: '',
    email: '',
    phone: '',
    website: '',
    summary: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    profiles: [],
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
};

export const SAMPLE_CV_DATA: CvData = {
  design: {
    template: 'modern',
    primaryColor: '#50C878',
    font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  personal: {
    name: 'Nguyễn Văn A',
    title: 'Full Stack Developer',
    email: 'nguyenvana@email.com',
    phone: '+84 912 345 678',
    website: 'https://nguyenvana.dev',
    summary:
      'Lập trình viên Full Stack với 5+ năm kinh nghiệm xây dựng ứng dụng web. Thành thạo React, Node.js và các công nghệ cloud. Tập trung vào chất lượng code, hiệu năng và trải nghiệm người dùng.',
    city: 'Hà Nội',
    state: '',
    zip: '',
    country: 'Việt Nam',
    profiles: [
      { id: uid(), network: 'LinkedIn', url: 'https://linkedin.com/in/nguyenvana' },
      { id: uid(), network: 'GitHub', url: 'https://github.com/nguyenvana' },
    ],
  },
  experience: [
    {
      id: uid(),
      position: 'Senior Full Stack Developer',
      company: 'Tech Solutions Inc.',
      startDate: '2021-01',
      endDate: '',
      currently: true,
      website: 'https://techsolutions.com',
      summary: 'Phát triển và duy trì các ứng dụng web phục vụ 100K+ người dùng.',
      highlights: [
        'Thiết kế microservices giảm 60% thời gian triển khai',
        'Hướng dẫn nhóm 5 lập trình viên junior',
        'Cải thiện hiệu năng ứng dụng tăng 40%',
      ],
    },
    {
      id: uid(),
      position: 'Full Stack Developer',
      company: 'Digital Agency Co.',
      startDate: '2019-06',
      endDate: '2020-12',
      currently: false,
      website: 'https://digitalagency.com',
      summary: 'Phát triển ứng dụng web cho khách hàng trong nhiều lĩnh vực.',
      highlights: [
        'Hoàn thành 15+ dự án từ ý tưởng đến triển khai',
        'Triển khai CI/CD pipeline giảm 50% thời gian phát hành',
      ],
    },
  ],
  education: [
    {
      id: uid(),
      institution: 'Đại học Bách Khoa Hà Nội',
      area: 'Công nghệ thông tin',
      studyType: 'Cử nhân',
      startDate: '2015-09',
      endDate: '2019-05',
      gpa: '3.6',
      website: 'https://hust.edu.vn',
      courses: ['Cấu trúc dữ liệu & Giải thuật', 'Lập trình Web', 'Cơ sở dữ liệu'],
    },
  ],
  skills: [
    { id: uid(), name: 'Frontend', level: 'Expert', keywords: ['React', 'Vue.js', 'TypeScript', 'HTML/CSS'] },
    { id: uid(), name: 'Backend', level: 'Expert', keywords: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB'] },
    { id: uid(), name: 'DevOps & Cloud', level: 'Advanced', keywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'] },
  ],
  languages: [
    { id: uid(), language: 'Tiếng Việt', fluency: 'Bản ngữ' },
    { id: uid(), language: 'Tiếng Anh', fluency: 'Thành thạo' },
  ],
  projects: [
    {
      id: uid(),
      name: 'E-commerce Platform',
      description: 'Nền tảng thương mại điện tử xây dựng với React và Node.js.',
      startDate: '2020-03',
      endDate: '2020-12',
      url: 'https://github.com/nguyenvana/ecommerce',
      highlights: ['1000+ GitHub stars', 'Sử dụng bởi 50+ doanh nghiệp'],
    },
  ],
};
