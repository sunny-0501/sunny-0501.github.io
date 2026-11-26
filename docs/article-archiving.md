# 文章发布与归档

文章以 Markdown 文件保存在 `source/_posts`。每篇文章旁的“归档”链接会打开对应文章在 GitHub 上的源文件编辑页。

## 通过按钮归档

1. 在 GitHub 登录有仓库写入权限的账号，点击文章旁的“归档”。
2. 在对应文章的 YAML front matter 添加：

```yaml
archived: true
```

3. 提交更改。GitHub Actions 会重新构建并部署站点。

归档后，文章详情页会从公开站点移除，也不会出现在归档、分类、标签、站内搜索或 RSS/Atom Feed 中。文章源文件仍保留在仓库；取消归档时删除 `archived: true` 后重新提交即可。

## 权限说明

此站点是静态 GitHub Pages 页面，没有访客登录或写入接口。按钮对所有访客可见，但只会打开 GitHub 编辑页；真正的修改和提交由 GitHub 仓库权限控制。网页端没有存放访问令牌，也不能绕过 GitHub 权限。

如果要确保只有你本人能归档，请在 GitHub 仓库的访问设置中确认只有你的账号拥有写入/维护权限。没有仓库写入权限的访客无法直接提交归档更改。

也可以直接修改文章 Markdown：在 front matter 添加或删除 `archived: true` 后重新构建部署。归档过滤逻辑位于 `scripts/archive-posts.js`。
