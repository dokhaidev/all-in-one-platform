import {
  AppstoreOutlined,
  FileTextOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';

export interface RouteConfig {
  key: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

export const routes: RouteConfig[] = [
  {
    key: '/',
    path: '/',
    label: 'Tổng quan',
    icon: <AppstoreOutlined />,
  },
  {
    key: '/cv-builder',
    path: '/cv-builder',
    label: 'Tạo CV online',
    icon: <FileTextOutlined />,
  },
  {
    key: '/lucky-wheel',
    path: '/lucky-wheel',
    label: 'Vòng quay may mắn',
    icon: <GiftOutlined />,
  },
  {
    key: '/sleep-calculator',
    path: '/sleep-calculator',
    label: 'Máy tính giấc ngủ',
    icon: <ClockCircleOutlined />,
  },
  {
    key: '/currency-converter',
    path: '/currency-converter',
    label: 'Chuyển đổi tiền tệ',
    icon: <SwapOutlined />,
  },
];

export const menuItems = routes.map(({ key, label, icon }) => ({
  key,
  label,
  icon,
}));
