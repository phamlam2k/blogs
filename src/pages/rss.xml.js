import rss from '@astrojs/rss';
import { SITE } from '../consts';
import { getPosts } from '../utils/content';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    customData: `<language>${SITE.lang}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.topic, ...post.data.tags],
      link: `/posts/${post.id}/`,
    })),
  });
}
