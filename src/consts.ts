// ============================================================
//  GLOBAL BLOG CONFIG — change it here and it updates everywhere
// ============================================================

export const SITE = {
  title: 'liam.dev',
  // Default SEO description (home page and pages without their own description)
  description:
    'A personal developer blog: notes on frontend, the algorithms hiding behind your tools, and repos/articles worth reading.',
  author: 'Pham Ngoc Mai Lam',
  lang: 'en',
  locale: 'en_US',
  // Default image when shared on Facebook/X/LinkedIn (put the file in /public)
  ogImage: '/og-default.png',
};

export const SOCIALS = {
  github: 'https://github.com/phamlam2k',
  email: 'mailam1309@gmail.com',
  linkedin: '',
};

// Header menu
export const NAV = [
  { href: '/posts/', label: 'posts' },
  { href: '/topics/', label: 'topics' },
  { href: '/labels/', label: 'labels' },
  { href: '/repos/', label: 'repos' },
];

// ============================================================
//  TOPICS — the main categories. Each post/repo/link belongs to exactly 1 topic.
//  To add a topic: add an entry here. The key (lowercase, dash-separated) becomes the URL (/topics/<key>/)
// ============================================================
export const TOPICS = {
  frontend: {
    name: 'Frontend',
    description: 'HTML, CSS, JavaScript, React, frameworks and everything that runs in the browser.',
  },
  algorithms: {
    name: 'Algorithms',
    description: 'Data structures and algorithms seen through a front-end lens.',
  },
} as const;

export type TopicKey = keyof typeof TOPICS;
export const TOPIC_KEYS = Object.keys(TOPICS) as [TopicKey, ...TopicKey[]];
