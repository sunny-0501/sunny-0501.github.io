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
| 场景切换、吹风与翻照片 | `themes/linqigu/layout/index.ejs`、`layout/_partial/photo-pile.ejs`、`source/css/playful.css`、`source/js/playful.js` |
| 图集封面与照片互动 | `themes/linqigu/layout/gallery.ejs`、`gallery-album.ejs`、`source/css/gallery-play.css`、`source/js/gallery-play.js` |

表中 CSS、JS 的 `source/` 均位于 `themes/linqigu/` 下。原有 `site.js` 继续负责搜索、首页分类筛选、列表/网格、外观设置和 GitHub 留言跳转；`archive.js` 继续负责归档页的分类与标签切换。

## 更新邻岸站点

统一编辑 `source/_data/friends.yml`，每项包含 `name`、`url`、`avatar`、`description`、`note`、`kind`。`kind: blog` 显示为邻岸个人站点，并进入随机访站候选池；`kind: inspiration` 显示为灵感收藏，不参与随机抽选。推荐站点不代表双方已交换友链。地址请使用 HTTPS；头像加载失败时，个人站点卡片显示名称首字。

「随风漫游」在浏览器内从邻岸列表抽选，以新标签页访问；有多个候选时避免连续两次访问同一站。上一次地址保存在 `sessionStorage` 的 `houseboat-last-voyage`，存储不可用时仍能在当前页面内避免连续重复。没有 JavaScript 时，按钮仍是可访问的普通链接。

「开往 · 更远的世界」使用独立的第三方入口 `https://www.travellings.cn/go.html`，由开往项目决定目的地。本站随机邻岸功能不调用开往 API；开往不可用时，仍可使用「随风漫游」及站点卡片。若邻岸列表为空，漫游链接默认指向开往入口。

## 登船与动效

支持原生 `dialog` 的浏览器会在首次进入无锚点的首页时展示登船画面；文章等内页及带 `#articles` 等锚点的直达链接不会自动弹出。记录键为 `sessionStorage.houseboat-boarding-seen-v1`，同一标签页会话中已展示后不再自动打断。浏览器禁止会话存储时关闭自动展示，仍保留手动入口。

首页与全站页脚的「登船画面」可重新打开；登船、跳过及 Escape 均可关闭。关闭后恢复正文或触发按钮的焦点。无脚本或浏览器不支持 `dialog` 时，正常阅读不受影响。

点击「登上画舫」会播放 620ms 的盖章、打孔和退场动画；跳过或 Escape 立即关闭，系统或站内关闭动效时也立即关闭。退场期间关闭动效或切到其他窗口会清理定时器并结束退场。

帆船、船票、落叶和首页视差遵循系统减少动态效果设置及站内「动效强度」设置；强度为零时停止相应动画。

首页头图有五个手动切换的场景和随机按钮；「吹阵风」按钮播放一次落叶与纸飞机动画。关闭动效时，该按钮改为直接切换场景。侧栏照片堆可逐张翻看，点击正面照片打开新图集。图集页的「打乱顺序」移动原有图片节点，保留筛选、灯箱等监听；「重新显影」为有限动画，关闭动效时禁用。相册首页的底片可选封面，支持方向键与 Home/End。

新增四张官方剧照和压缩说明见 [image-sources.md](image-sources.md)。图集数据仍统一在 `source/_data/gallery.yml`，新增 `/gallery/scenes/` 展示这四张图片。

## 码头信箱与旧地址

留言位于 `/links/#guestbook`，以默认折叠的信箱附属于友链页；通过该锚点进入时自动展开。表单先打开已填写标题和正文的 GitHub 新建 Issue 页面，用户登录并确认后才会公开发布，本站没有新增留言数据库。无 JavaScript 时仍通过表单直接前往 GitHub。

保留 `/guestbook/` 旧地址：脚本使用 `location.replace` 转到 `/links/#guestbook`，无脚本时显示明确的前往链接。友链申请也可使用页面上的邮件入口，本站名片提供复制按钮。

## 构建

在仓库根目录运行 `npm run build`，由 Hexo 生成 `public/`。修改 YAML、模板、CSS 或 JS 后均需重新构建。`public/` 为生成产物，源文件以主题目录和 `source/` 为准。

## 本次验证

2026-11-27：构建通过；生成的 27 个 HTML 页面与 13 个 CSS 文件共检查 1,512 个本地引用、124 个锚点，未发现失效路由、锚点或本地资源。浏览器复核覆盖 320、360、390、768、1440 像素宽度，以及分类和布局切换、随机访站、GitHub 留言草稿、名片复制、登船重播、无脚本、存储受限与减少动态效果场景。

2026-11-28：删去首页重复的欢迎语、主题导航、最新文章横条与底部快捷入口，缩短头图、文章行和区块间距；友链列表放到随机访问前。界面说明改用简短直白的表达，减少口号、英日文副标题与重复旁白。正文文章未修改。构建通过，35 个页面与宽度组合（320–1920px）无横向溢出；筛选、布局切换、搜索、随机访问、复制、留言草稿和入站重播复核通过。

同日增加图片与互动：四张压缩后的官方剧照、五场景头图、吹风纸飞机、侧栏翻照片、友链配图与信封展开、登船盖章退场、图库底片选封面、显影和打乱。30 个页面与尺寸组合（320–1920px）无溢出或本地图片失效；新交互与原筛选、搜索、灯箱、留言和随机访问通过浏览器验证，减少动态效果下活动动画数为零。连续点选与图片加载失败也已验证回退。
