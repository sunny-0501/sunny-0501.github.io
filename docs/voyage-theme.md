# 画舫主题维护说明

这次改造包含四部分：全站手记布局、随机访站、以友链为主的码头信箱，以及首次进入首页的登船画面。配图复用主题已有图片，不需要额外的图片生成或远程图片服务。

## 文件分工

| 功能 | 主要文件 |
| --- | --- |
| 首页与全站视觉 | `themes/linqigu/layout/index.ejs`、`layout/_partial/article-row.ejs`、`source/css/journal.css`、`source/js/journal.js` |
| 公共导航、页脚与资源加载 | `themes/linqigu/layout/_partial/header.ejs`、`footer.ejs`、`document-start.ejs`、`document-end.ejs` |
| 随风漫游 | `themes/linqigu/layout/_partial/voyage.ejs`、`source/css/voyage.css`、`source/js/voyage.js` |
| 友链与附属留言 | `themes/linqigu/layout/links.ejs`、`layout/_partial/guestbook-note.ejs`、`source/css/friends.css`、`source/js/friends.js` |
| 登船画面 | `themes/linqigu/layout/_partial/boarding.ejs`、`source/css/boarding.css`、`source/js/boarding.js` |

表中 CSS、JS 的 `source/` 均位于 `themes/linqigu/` 下。原有 `site.js` 继续负责搜索、首页分类筛选、列表/网格、外观设置和 GitHub 留言跳转；`archive.js` 继续负责归档页的分类与标签切换。

## 更新邻岸站点

统一编辑 `source/_data/friends.yml`，每项包含 `name`、`url`、`avatar`、`description`、`note`、`kind`。`kind: blog` 显示为邻岸个人站点，并进入随机访站候选池；`kind: inspiration` 显示为灵感收藏，不参与随机抽选。推荐站点不代表双方已交换友链。地址请使用 HTTPS；头像加载失败时，个人站点卡片显示名称首字。

「随风漫游」在浏览器内从邻岸列表抽选，以新标签页访问；有多个候选时避免连续两次访问同一站。上一次地址保存在 `sessionStorage` 的 `houseboat-last-voyage`，存储不可用时仍能在当前页面内避免连续重复。没有 JavaScript 时，按钮仍是可访问的普通链接。

「开往 · 更远的世界」使用独立的第三方入口 `https://www.travellings.cn/go.html`，由开往项目决定目的地。本站随机邻岸功能不调用开往 API；开往不可用时，仍可使用「随风漫游」及站点卡片。若邻岸列表为空，漫游链接默认指向开往入口。

## 登船与动效

支持原生 `dialog` 的浏览器会在首次进入无锚点的首页时展示登船画面；文章等内页及带 `#articles` 等锚点的直达链接不会自动弹出。记录键为 `sessionStorage.houseboat-boarding-seen-v1`，同一标签页会话中已展示后不再自动打断。浏览器禁止会话存储时关闭自动展示，仍保留手动入口。

首页「领取登船券」与全站页脚「重温启程」可重新打开；登船、跳过及 Escape 均可关闭。关闭后恢复正文或触发按钮的焦点。无脚本或浏览器不支持 `dialog` 时，正常阅读不受影响。

帆船、船票、落叶和首页视差遵循系统减少动态效果设置及站内「动效强度」设置；强度为零时停止相应动画。

## 码头信箱与旧地址

留言位于 `/links/#guestbook`，以默认折叠的信箱附属于友链页；通过该锚点进入时自动展开。表单先打开已填写标题和正文的 GitHub 新建 Issue 页面，用户登录并确认后才会公开发布，本站没有新增留言数据库。无 JavaScript 时仍通过表单直接前往 GitHub。

保留 `/guestbook/` 旧地址：脚本使用 `location.replace` 转到 `/links/#guestbook`，无脚本时显示明确的前往链接。友链申请也可使用页面上的邮件入口，本站名片提供复制按钮。

## 构建

在仓库根目录运行 `npm run build`，由 Hexo 生成 `public/`。修改 YAML、模板、CSS 或 JS 后均需重新构建。`public/` 为生成产物，源文件以主题目录和 `source/` 为准。

## 本次验证

2026-11-27：构建通过；生成的 27 个 HTML 页面与 13 个 CSS 文件共检查 1,512 个本地引用、124 个锚点，未发现失效路由、锚点或本地资源。浏览器复核覆盖 320、360、390、768、1440 像素宽度，以及分类和布局切换、随机访站、GitHub 留言草稿、名片复制、登船重播、无脚本、存储受限与减少动态效果场景。
