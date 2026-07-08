# Hexo-Theme-ParticleX
>***This English version is not necessarily the latest!***

The original `README.md` says:

> There are currently two themes: Full, Night, and Maiden.

However, in this modified version, there's only **one** style left.
If you want to change the colors, please modify `main.scss` directly.

---

# 1. Demo

* [GitHub Pages](https://kmizmal.github.io/)
* [Netlify](https://argvchs.netlify.app)
* [Vercel](https://zmal-blog.vercel.app)

---

# 2. Installation

```bash
git clone https://github.com/kmizmal/hexo-theme-particlex.git ./themes/particlex
pnpm add sass hexo-renderer-sass-next
```

See the [Configuration section](#3-configuration) for how to configure.
Then set the theme in your root `_config.yml`:

```yaml
theme: particlex
```

## 2.1 Disable yearly/monthly archive

Hexo generates yearly/monthly archives by default,
but ParticleX does **not** support this feature.

```yaml
archive_generator:
  enabled: true
  per_page: 0
  yearly: false
  monthly: false
  daily: false
```

After modifying, run `hexo clean` to clear cache.

---

# 3. Configuration

> Please copy or rename `_config.yml.example` to `_config.yml`.

## 3.1 Basic Config

`background` is a list, a random one will be chosen each time.

```yaml
# Avatar
avatar: /images/avatar.jpg

# Homepage background
background:
  - /images/background.jpg

# Loading animation gif
loading: /images/loading.gif

# Tag colors in category/tag pages
colors:
  - "#ffa2c4"
  - "#00bcd4"
  - "#03a9f4"
  - "#00a596"
  - "#ff7d73"
  - "#f5bcd0"
  - "#aee8fe"
  - "#66CCFF"
  - "#39C5BB"
```

## 3.2 Content Settings

### 3.2.1 Navigation Bar

This theme uses [Font Awesome 6](https://fontawesome.com) for icons.

```yaml
menu:
  Home:
    name: house
    theme: solid
    link: /
  About:
    name: id-card
    theme: solid
    link: /about
  Archives:
    name: box-archive
    theme: solid
    link: /archives
  Categories:
    name: bookmark
    theme: solid
    link: /categories
  Tags:
    name: tags
    theme: solid
    link: /tags
```

### 3.2.2 Info Card on Homepage

`description` supports Markdown syntax.
`iconLinks` shares the same format as `menu`.

```yaml
card:
  enable: true
  description: |
    Description text here
  iconLinks:
  friendLinks:
    Argvchs: https://argvchs.github.io
    kmizmal: https://blog.zmal.top
```

### 3.2.3 Footer

ICP registration is mandatory in some regions when using a custom domain.

```yaml
footer:
  since: 2022
  ICP:
    enable: false
    code:
    link:
  visitors:
    enable: true
```

## 3.3 Features

### 3.3.1 Polyfill

Using [Polyfill.io](https://polyfill.io) to automatically provide JS compatibility by UA.
Replaced with Alibaba mirror for better access in China.

```yaml
polyfill:
  enable: true
  features:
    - default
```

### 3.3.2 Code Highlighting

Using PrismJS for syntax highlighting.
Check the [Prism site](https://prismjs.com/examples.html) for themes or see [this demo](https://blog.zmal.top/2025/0720/example-of-prismjs-styles).

```yaml
prismjs:
  enable: true
  theme: prism-tomorrow
  lineNumbers: true
```

### 3.3.3 Math Rendering

Using KaTeX to render math formulas.

```yaml
math:
  enable: false
```

### 3.3.4 Image Preview

~~Simple image zoom preview ~~(currently broken )

```yaml
preview:
  enable: true
```

### 3.3.5 Post Excerpt

Normally `<!-- more -->` is used for excerpt.
You can also manually define it in front-matter:

```yaml
description: |
  Normal _Italic_ **Strong**
```

### 3.3.6 Sticky Posts

Use `pinned` in the front-matter. Higher = more sticky.

### 3.3.7 Post Encryption

Use `secret` in front-matter to encrypt post.
**Requires [hexo-helper-crypto](https://github.com/theme-particlex/hexo-helper-crypto)**

```yaml
crypto:
  enable: false
```

### 3.3.8 Search

A simple post title search (embedded in Archives).
~~Still under repair~~

```yaml
search:
  enable: false
```

---

## 3.4 Comment Systems

### 3.4.1 giscus

Backed by GitHub Discussions.
Configure at [giscus.app](https://giscus.app).

```yaml
giscus:
  enable: false
  src: https://giscus.app/client.js
  repo:
  repoID:
  category:
  categoryID:
  mapping: pathname
  strict: 0
  reactionsEnabled: 1
  emitMetadata: 0
  inputPosition: bottom
  theme: preferred_color_scheme
  lang:
```

### 3.4.2 Gitalk

A GitHub Issues-based comment system.
Consider self-hosting CORS proxy due to Cloudflare slowness.

```yaml
gitalk:
  enable: false
  clientID:
  clientSecret:
  repo:
  owner:
  admin:
  language:
  proxy:
```

### 3.4.3 Waline

A simple and secure commenting system.
[Setup tutorial](https://blog.yuzi.dev/posts/bcb4ff00.html)

```yaml
waline:
  enable: false
  serverURL:
  locale:
  commentCount: true
  pageview: false
  emoji:
    - https://unpkg.com/@waline/emojis@1.2.0/weibo
    - https://unpkg.com/@waline/emojis@1.2.0/alus
    - https://unpkg.com/@waline/emojis@1.2.0/bilibili
    - https://unpkg.com/@waline/emojis@1.2.0/qq
    - https://unpkg.com/@waline/emojis@1.2.0/tieba
    - https://unpkg.com/@waline/emojis@1.2.0/tw-emoji
  meta:
    - nick
    - mail
    - link
  requiredMeta:
    - nick
  lang:
  wordLimit: 0
  login: enable
  pageSize: 10
```

### 3.4.4 Twikoo

A free, simple, and secure comment system for static sites.

```yaml
twikoo:
  enable: false
  envID:
  region:
  path: location.pathname
  lang:
```

---

# 4. Final Notes

This project uses the MIT License. Contributions are welcome.
Feel free to open issues or fork and submit pull requests.

The upstream project has not been updated for a while.
This is a heavily modified version, not affiliated with the original.

If you run into problems or have cool ideas — open an issue!
