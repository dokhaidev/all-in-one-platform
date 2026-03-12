import {
  AppstoreOutlined,
  FileTextOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  TableOutlined,
  FormOutlined,
  BarChartOutlined,
  TeamOutlined,
  AuditOutlined,
  HourglassOutlined,
  ToolOutlined,
  BookOutlined,
  CheckSquareOutlined,
  FileSearchOutlined,
  UserSwitchOutlined,
  ReadOutlined,
  CalculatorOutlined,
  FunctionOutlined,
  EditOutlined,
  BankOutlined,
  PercentageOutlined,
  CalendarOutlined,
  GlobalOutlined,
  FieldTimeOutlined as CountdownIcon,
  FontSizeOutlined,
  RetweetOutlined,
  LockOutlined,
  QrcodeOutlined,
  CompressOutlined,
  CodeOutlined,
  AlignLeftOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  NodeIndexOutlined,
  RocketOutlined,
  BgColorsOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  ApiOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  SafetyCertificateOutlined,
  FieldBinaryOutlined,
  DiffOutlined,
  ClusterOutlined,
  ScheduleOutlined,
  FormatPainterOutlined,
  ColumnWidthOutlined,
  BorderOutlined,
  FontColorsOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  FileMarkdownOutlined,
  ProfileOutlined,
  SmileOutlined,
  NumberOutlined,
  CrownOutlined,
  FireOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

export type MenuItem = Required<MenuProps>['items'][number];

export const GROUP_TOOLS = 'group-tools';
export const GROUP_TEACHER = 'group-teacher';
export const GROUP_STUDENT = 'group-student';
export const GROUP_CALCULATE = 'group-calculate';
export const GROUP_DEVTOOLS = 'group-devtools';
export const GROUP_CODING = 'group-coding';
export const GROUP_DEVTOOLS_PRO = 'group-devtools-pro';
export const GROUP_CSS = 'group-css';
export const GROUP_PRODUCTIVITY = 'group-productivity';
export const GROUP_GAMES = 'group-games';

export interface RouteConfig {
  key: string;
  path: string;
  label: string;
  groupKey?: string;
}

export const routes: RouteConfig[] = [
  { key: '/', path: '/', label: 'Tổng quan' },
  // Công cụ tiện ích
  { key: '/cv-builder', path: '/cv-builder', label: 'Tạo CV online', groupKey: GROUP_TOOLS },
  { key: '/lucky-wheel', path: '/lucky-wheel', label: 'Vòng quay may mắn', groupKey: GROUP_TOOLS },
  { key: '/sleep-calculator', path: '/sleep-calculator', label: 'Máy tính giấc ngủ', groupKey: GROUP_TOOLS },
  { key: '/currency-converter', path: '/currency-converter', label: 'Chuyển đổi tiền tệ', groupKey: GROUP_TOOLS },
  { key: '/bmi-calculator', path: '/bmi-calculator', label: 'Máy tính BMI', groupKey: GROUP_TOOLS },
  { key: '/pomodoro-timer', path: '/pomodoro-timer', label: 'Pomodoro Timer', groupKey: GROUP_TOOLS },
  { key: '/csv-converter', path: '/csv-converter', label: 'Chuyển đổi CSV', groupKey: GROUP_TOOLS },
  { key: '/whiteboard', path: '/whiteboard', label: 'Bảng vẽ trực tuyến', groupKey: GROUP_TOOLS },
  // Tính toán & Tài chính
  { key: '/loan-calculator', path: '/loan-calculator', label: 'Máy tính lãi vay', groupKey: GROUP_CALCULATE },
  { key: '/percentage-calculator', path: '/percentage-calculator', label: 'Máy tính phần trăm', groupKey: GROUP_CALCULATE },
  { key: '/date-calculator', path: '/date-calculator', label: 'Tính khoảng cách ngày', groupKey: GROUP_CALCULATE },
  { key: '/world-clock', path: '/world-clock', label: 'Đồng hồ múi giờ', groupKey: GROUP_CALCULATE },
  { key: '/event-countdown', path: '/event-countdown', label: 'Đếm ngược sự kiện', groupKey: GROUP_CALCULATE },
  // Văn bản & Tiện ích
  { key: '/word-counter', path: '/word-counter', label: 'Đếm từ & văn bản', groupKey: GROUP_DEVTOOLS },
  { key: '/text-converter', path: '/text-converter', label: 'Chuyển đổi kiểu chữ', groupKey: GROUP_DEVTOOLS },
  { key: '/password-generator', path: '/password-generator', label: 'Tạo mật khẩu', groupKey: GROUP_DEVTOOLS },
  { key: '/qr-generator', path: '/qr-generator', label: 'Tạo mã QR', groupKey: GROUP_DEVTOOLS },
  { key: '/image-compressor', path: '/image-compressor', label: 'Nén ảnh', groupKey: GROUP_DEVTOOLS },
  { key: '/json-formatter', path: '/json-formatter', label: 'JSON Formatter', groupKey: GROUP_DEVTOOLS },
  { key: '/base64-tool', path: '/base64-tool', label: 'Base64 Encode/Decode', groupKey: GROUP_DEVTOOLS },
  // Công cụ giáo viên
  { key: '/quiz-generator', path: '/quiz-generator', label: 'Tạo đề kiểm tra', groupKey: GROUP_TEACHER },
  { key: '/grade-book', path: '/grade-book', label: 'Quản lý điểm số', groupKey: GROUP_TEACHER },
  { key: '/seat-arrangement', path: '/seat-arrangement', label: 'Sơ đồ chỗ ngồi', groupKey: GROUP_TEACHER },
  { key: '/rubric-builder', path: '/rubric-builder', label: 'Phiếu đánh giá', groupKey: GROUP_TEACHER },
  { key: '/exam-timer', path: '/exam-timer', label: 'Đồng hồ thi cử', groupKey: GROUP_TEACHER },
  { key: '/attendance-tracker', path: '/attendance-tracker', label: 'Điểm danh', groupKey: GROUP_TEACHER },
  { key: '/worksheet-generator', path: '/worksheet-generator', label: 'Phiếu bài tập', groupKey: GROUP_TEACHER },
  { key: '/name-picker', path: '/name-picker', label: 'Bốc thăm học sinh', groupKey: GROUP_TEACHER },
  // Công cụ học sinh
  { key: '/flashcard', path: '/flashcard', label: 'Flashcard ôn tập', groupKey: GROUP_STUDENT },
  { key: '/multiplication-table', path: '/multiplication-table', label: 'Bảng cửu chương', groupKey: GROUP_STUDENT },
  { key: '/equation-solver', path: '/equation-solver', label: 'Giải phương trình', groupKey: GROUP_STUDENT },
  // Học lập trình
  { key: '/code-playground', path: '/code-playground', label: 'Code Playground', groupKey: GROUP_CODING },
  { key: '/regex-tester', path: '/regex-tester', label: 'Regex Tester', groupKey: GROUP_CODING },
  { key: '/json-path-tester', path: '/json-path-tester', label: 'JSON Path Tester', groupKey: GROUP_CODING },
  { key: '/big-o-cheatsheet', path: '/big-o-cheatsheet', label: 'Big-O Cheat Sheet', groupKey: GROUP_CODING },
  { key: '/algorithm-visualizer', path: '/algorithm-visualizer', label: 'Algorithm Visualizer', groupKey: GROUP_CODING },
  { key: '/data-structure-visualizer', path: '/data-structure-visualizer', label: 'Data Structure Visualizer', groupKey: GROUP_CODING },
  { key: '/color-picker', path: '/color-picker', label: 'Color Picker & Palette', groupKey: GROUP_CODING },
  { key: '/code-typing-speed', path: '/code-typing-speed', label: 'Code Typing Speed', groupKey: GROUP_CODING },
  { key: '/coding-quiz', path: '/coding-quiz', label: 'Quiz lập trình', groupKey: GROUP_CODING },
  { key: '/git-reference', path: '/git-reference', label: 'Git Command Reference', groupKey: GROUP_CODING },
  { key: '/http-status-codes', path: '/http-status-codes', label: 'HTTP Status Codes', groupKey: GROUP_CODING },
  // Dev Tools Pro
  { key: '/jwt-decoder', path: '/jwt-decoder', label: 'JWT Decoder', groupKey: GROUP_DEVTOOLS_PRO },
  { key: '/timestamp-converter', path: '/timestamp-converter', label: 'Timestamp Converter', groupKey: GROUP_DEVTOOLS_PRO },
  { key: '/diff-tool', path: '/diff-tool', label: 'Text Diff Tool', groupKey: GROUP_DEVTOOLS_PRO },
  { key: '/base-converter', path: '/base-converter', label: 'Number Base Converter', groupKey: GROUP_DEVTOOLS_PRO },
  { key: '/uuid-generator', path: '/uuid-generator', label: 'UUID Generator', groupKey: GROUP_DEVTOOLS_PRO },
  { key: '/cron-builder', path: '/cron-builder', label: 'Cron Builder', groupKey: GROUP_DEVTOOLS_PRO },
  // CSS & Design
  { key: '/gradient-generator', path: '/gradient-generator', label: 'CSS Gradient Generator', groupKey: GROUP_CSS },
  { key: '/box-shadow-generator', path: '/box-shadow-generator', label: 'Box Shadow Generator', groupKey: GROUP_CSS },
  { key: '/cubic-bezier', path: '/cubic-bezier', label: 'Cubic Bezier Editor', groupKey: GROUP_CSS },
  { key: '/font-pairing', path: '/font-pairing', label: 'Font Pairing Tool', groupKey: GROUP_CSS },
  // Năng suất cá nhân
  { key: '/kanban-board', path: '/kanban-board', label: 'Kanban Board', groupKey: GROUP_PRODUCTIVITY },
  { key: '/habit-tracker', path: '/habit-tracker', label: 'Habit Tracker', groupKey: GROUP_PRODUCTIVITY },
  { key: '/budget-tracker', path: '/budget-tracker', label: 'Budget Tracker', groupKey: GROUP_PRODUCTIVITY },
  { key: '/markdown-note', path: '/markdown-note', label: 'Markdown Note', groupKey: GROUP_PRODUCTIVITY },
  { key: '/invoice-generator', path: '/invoice-generator', label: 'Invoice Generator', groupKey: GROUP_PRODUCTIVITY },
  // Mini Games
  { key: '/wordle', path: '/wordle', label: 'Wordle Tiếng Việt', groupKey: GROUP_GAMES },
  { key: '/game-2048', path: '/game-2048', label: '2048', groupKey: GROUP_GAMES },
  { key: '/memory-card', path: '/memory-card', label: 'Memory Card', groupKey: GROUP_GAMES },
  { key: '/typing-race', path: '/typing-race', label: 'Typing Race', groupKey: GROUP_GAMES },
];

export const menuItems: MenuItem[] = [
  { key: '/', label: 'Tổng quan', icon: <AppstoreOutlined /> },
  {
    key: GROUP_TOOLS,
    label: 'Công cụ tiện ích',
    icon: <ToolOutlined />,
    children: [
      { key: '/cv-builder', label: 'Tạo CV online', icon: <FileTextOutlined /> },
      { key: '/lucky-wheel', label: 'Vòng quay may mắn', icon: <GiftOutlined /> },
      { key: '/sleep-calculator', label: 'Máy tính giấc ngủ', icon: <ClockCircleOutlined /> },
      { key: '/currency-converter', label: 'Chuyển đổi tiền tệ', icon: <SwapOutlined /> },
      { key: '/bmi-calculator', label: 'Máy tính BMI', icon: <DashboardOutlined /> },
      { key: '/pomodoro-timer', label: 'Pomodoro Timer', icon: <FieldTimeOutlined /> },
      { key: '/csv-converter', label: 'Chuyển đổi CSV', icon: <TableOutlined /> },
      { key: '/whiteboard', label: 'Bảng vẽ trực tuyến', icon: <EditOutlined /> },
    ],
  },
  {
    key: GROUP_CALCULATE,
    label: 'Tính toán & Tài chính',
    icon: <BankOutlined />,
    children: [
      { key: '/loan-calculator', label: 'Máy tính lãi vay', icon: <BankOutlined /> },
      { key: '/percentage-calculator', label: 'Máy tính phần trăm', icon: <PercentageOutlined /> },
      { key: '/date-calculator', label: 'Tính khoảng cách ngày', icon: <CalendarOutlined /> },
      { key: '/world-clock', label: 'Đồng hồ múi giờ', icon: <GlobalOutlined /> },
      { key: '/event-countdown', label: 'Đếm ngược sự kiện', icon: <CountdownIcon /> },
    ],
  },
  {
    key: GROUP_DEVTOOLS,
    label: 'Văn bản & Tiện ích',
    icon: <CodeOutlined />,
    children: [
      { key: '/word-counter', label: 'Đếm từ & văn bản', icon: <AlignLeftOutlined /> },
      { key: '/text-converter', label: 'Chuyển đổi kiểu chữ', icon: <FontSizeOutlined /> },
      { key: '/password-generator', label: 'Tạo mật khẩu', icon: <LockOutlined /> },
      { key: '/qr-generator', label: 'Tạo mã QR', icon: <QrcodeOutlined /> },
      { key: '/image-compressor', label: 'Nén ảnh', icon: <CompressOutlined /> },
      { key: '/json-formatter', label: 'JSON Formatter', icon: <CodeOutlined /> },
      { key: '/base64-tool', label: 'Base64 Encode/Decode', icon: <RetweetOutlined /> },
    ],
  },
  {
    key: GROUP_TEACHER,
    label: 'Công cụ giáo viên',
    icon: <ReadOutlined />,
    children: [
      { key: '/quiz-generator', label: 'Tạo đề kiểm tra', icon: <FormOutlined /> },
      { key: '/grade-book', label: 'Quản lý điểm số', icon: <BarChartOutlined /> },
      { key: '/seat-arrangement', label: 'Sơ đồ chỗ ngồi', icon: <TeamOutlined /> },
      { key: '/rubric-builder', label: 'Phiếu đánh giá', icon: <AuditOutlined /> },
      { key: '/exam-timer', label: 'Đồng hồ thi cử', icon: <HourglassOutlined /> },
      { key: '/attendance-tracker', label: 'Điểm danh', icon: <CheckSquareOutlined /> },
      { key: '/worksheet-generator', label: 'Phiếu bài tập', icon: <FileSearchOutlined /> },
      { key: '/name-picker', label: 'Bốc thăm học sinh', icon: <UserSwitchOutlined /> },
    ],
  },
  {
    key: GROUP_STUDENT,
    label: 'Công cụ học sinh',
    icon: <BookOutlined />,
    children: [
      { key: '/flashcard', label: 'Flashcard ôn tập', icon: <ReadOutlined /> },
      { key: '/multiplication-table', label: 'Bảng cửu chương', icon: <CalculatorOutlined /> },
      { key: '/equation-solver', label: 'Giải phương trình', icon: <FunctionOutlined /> },
    ],
  },
  {
    key: GROUP_CODING,
    label: 'Học lập trình',
    icon: <RocketOutlined />,
    children: [
      { key: '/code-playground', label: 'Code Playground', icon: <PlayCircleOutlined /> },
      { key: '/regex-tester', label: 'Regex Tester', icon: <SearchOutlined /> },
      { key: '/json-path-tester', label: 'JSON Path Tester', icon: <NodeIndexOutlined /> },
      { key: '/big-o-cheatsheet', label: 'Big-O Cheat Sheet', icon: <ThunderboltOutlined /> },
      { key: '/algorithm-visualizer', label: 'Algorithm Visualizer', icon: <ApartmentOutlined /> },
      { key: '/data-structure-visualizer', label: 'Data Structure Visualizer', icon: <BranchesOutlined /> },
      { key: '/color-picker', label: 'Color Picker & Palette', icon: <BgColorsOutlined /> },
      { key: '/code-typing-speed', label: 'Code Typing Speed', icon: <TrophyOutlined /> },
      { key: '/coding-quiz', label: 'Quiz lập trình', icon: <ApiOutlined /> },
      { key: '/git-reference', label: 'Git Command Reference', icon: <BranchesOutlined /> },
      { key: '/http-status-codes', label: 'HTTP Status Codes', icon: <GlobalOutlined /> },
    ],
  },
  {
    key: GROUP_DEVTOOLS_PRO,
    label: 'Dev Tools Pro',
    icon: <ClusterOutlined />,
    children: [
      { key: '/jwt-decoder', label: 'JWT Decoder', icon: <SafetyCertificateOutlined /> },
      { key: '/timestamp-converter', label: 'Timestamp Converter', icon: <FieldTimeOutlined /> },
      { key: '/diff-tool', label: 'Text Diff Tool', icon: <DiffOutlined /> },
      { key: '/base-converter', label: 'Number Base Converter', icon: <FieldBinaryOutlined /> },
      { key: '/uuid-generator', label: 'UUID Generator', icon: <NumberOutlined /> },
      { key: '/cron-builder', label: 'Cron Builder', icon: <ScheduleOutlined /> },
    ],
  },
  {
    key: GROUP_CSS,
    label: 'CSS & Design',
    icon: <FormatPainterOutlined />,
    children: [
      { key: '/gradient-generator', label: 'Gradient Generator', icon: <BgColorsOutlined /> },
      { key: '/box-shadow-generator', label: 'Box Shadow Generator', icon: <BorderOutlined /> },
      { key: '/cubic-bezier', label: 'Cubic Bezier Editor', icon: <ColumnWidthOutlined /> },
      { key: '/font-pairing', label: 'Font Pairing Tool', icon: <FontColorsOutlined /> },
    ],
  },
  {
    key: GROUP_PRODUCTIVITY,
    label: 'Năng suất cá nhân',
    icon: <ProjectOutlined />,
    children: [
      { key: '/kanban-board', label: 'Kanban Board', icon: <ProjectOutlined /> },
      { key: '/habit-tracker', label: 'Habit Tracker', icon: <CheckCircleOutlined /> },
      { key: '/budget-tracker', label: 'Budget Tracker', icon: <WalletOutlined /> },
      { key: '/markdown-note', label: 'Markdown Note', icon: <FileMarkdownOutlined /> },
      { key: '/invoice-generator', label: 'Invoice Generator', icon: <ProfileOutlined /> },
    ],
  },
  {
    key: GROUP_GAMES,
    label: 'Mini Games',
    icon: <SmileOutlined />,
    children: [
      { key: '/wordle', label: 'Wordle Tiếng Việt', icon: <FireOutlined /> },
      { key: '/game-2048', label: '2048', icon: <NumberOutlined /> },
      { key: '/memory-card', label: 'Memory Card', icon: <CrownOutlined /> },
      { key: '/typing-race', label: 'Typing Race', icon: <TrophyOutlined /> },
    ],
  },
];
