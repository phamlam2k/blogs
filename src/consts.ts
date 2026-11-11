// ============================================================
//  CẤU HÌNH CHUNG CỦA BLOG — sửa ở đây là đổi toàn trang
// ============================================================

export const SITE = {
  title: 'liam.dev',
  // Dòng mô tả mặc định cho SEO (trang chủ, trang không có mô tả riêng)
  description:
    'Blog cá nhân của một lập trình viên: ghi chép về frontend, backend, DevOps, thuật toán và những repo/bài viết đáng đọc.',
  author: 'Phạm Ngọc Mai Lâm',
  lang: 'vi',
  locale: 'vi_VN',
  // Ảnh mặc định khi share lên Facebook/Zalo/X (đặt file vào /public)
  ogImage: '/og-default.png',
};

export const SOCIALS = {
  github: 'https://github.com/phamlam2k',
  email: 'mailam1309@gmail.com',
  linkedin: '',
};

// Menu trên header
export const NAV = [
  { href: '/posts/', label: 'posts' },
  { href: '/topics/', label: 'topics' },
  { href: '/label/', label: 'labels' },
  { href: '/repos/', label: 'repos' },
];

// ============================================================
//  TOPICS — các chủ đề lớn. Mỗi bài viết/repo/link thuộc đúng 1 topic.
//  Muốn thêm topic: thêm 1 mục vào đây, key (không dấu, nối bằng -) sẽ là URL (/topics/<key>/)
// ============================================================
export const TOPICS = {
  frontend: {
    name: 'Frontend',
    description: 'HTML, CSS, JavaScript, React, framework và mọi thứ chạy trên trình duyệt.',
  },
  backend: {
    name: 'Backend',
    description: 'API, database, kiến trúc hệ thống, Node.js, Go, Rust...',
  },
  devops: {
    name: 'DevOps',
    description: 'Docker, Kubernetes, CI/CD, Linux, server và deploy.',
  },
  'thuat-toan': {
    name: 'Thuật toán',
    description: 'Cấu trúc dữ liệu, giải thuật, luyện LeetCode.',
  },
  'cong-cu': {
    name: 'Công cụ',
    description: 'Editor, terminal, CLI, workflow giúp code nhanh hơn.',
  },
  'ghi-chep': {
    name: 'Ghi chép',
    description: 'Ghi chép, suy nghĩ, nghề nghiệp và những thứ không thuộc mục nào.',
  },
} as const;

export type TopicKey = keyof typeof TOPICS;
export const TOPIC_KEYS = Object.keys(TOPICS) as [TopicKey, ...TopicKey[]];
