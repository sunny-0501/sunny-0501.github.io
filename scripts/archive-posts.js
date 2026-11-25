'use strict';

let originalPostsGetter;

hexo.extend.filter.register('before_generate', function () {
  const posts = this.locals.get('posts');
  originalPostsGetter = this.locals.getters.posts;
  this.locals.set('posts', () => posts.filter((post) => post.archived !== true));
});

hexo.extend.filter.register('after_generate', function () {
  if (originalPostsGetter) this.locals.set('posts', originalPostsGetter);
  originalPostsGetter = null;
});
