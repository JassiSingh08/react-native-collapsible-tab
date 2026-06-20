export type Post = {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  body: string;
  likes: number;
  reposts: number;
  replies: number;
  accent: string;
};

export type Photo = { id: string; color: string; caption: string };

const ACCENTS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];
const NAMES = [
  ['Ada Lovelace', 'ada'],
  ['Grace Hopper', 'grace'],
  ['Alan Turing', 'alan'],
  ['Katherine Johnson', 'katherine'],
  ['Linus Torvalds', 'linus'],
  ['Margaret Hamilton', 'margaret'],
];
const BODIES = [
  'Shipped the collapsing header today. Per-tab scroll memory just works.',
  'Hot take: a tab view should never lose your scroll position when you switch tabs.',
  'Dragging the header to scroll the list feels so much better than a static header.',
  'Benchmarked 5,000 rows in a tab. Buttery on the new architecture.',
  'The header buttons stay tappable WHILE the header is draggable. Finally.',
  'Migrated off the old library in an afternoon. The API maps almost 1:1.',
];

export function makePosts(count: number, prefix = 'post'): Post[] {
  return Array.from({ length: count }, (_, i) => {
    const [author, handle] = NAMES[i % NAMES.length] as [string, string];
    return {
      id: `${prefix}-${i}`,
      author,
      handle: `@${handle}`,
      avatar: author
        .split(' ')
        .map((w) => w[0])
        .join(''),
      body: BODIES[i % BODIES.length] as string,
      likes: ((i * 37) % 900) + 12,
      reposts: ((i * 13) % 220) + 1,
      replies: ((i * 7) % 90) + 1,
      accent: ACCENTS[i % ACCENTS.length] as string,
    };
  });
}

export function makePhotos(count: number): Photo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${i}`,
    color: ACCENTS[i % ACCENTS.length] as string,
    caption: `Shot ${i + 1}`,
  }));
}

export const PROFILE = {
  name: 'Ada Lovelace',
  handle: '@ada',
  bio: 'Mathematician · writing the first algorithm · testing collapsible tabs in the wild 🧮',
  followers: '12.4k',
  following: '312',
  initials: 'AL',
};
