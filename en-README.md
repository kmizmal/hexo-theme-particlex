# Hexo-Theme-ParticleX
>***This English version is not necessarily the latest!***

The original `README.md` stated:

> Currently, there are **two** theme styles: Full, Night, and Maiden.

However, only one style remains after updates. If you'd like to change colors, please edit `main.css` directly.

---

# 1. Demo

* [GitHub Pages](https://kmizmal.github.io/)
* [Netlify](https://argvchs.netlify.app)
* [Vercel](https://zmal-blog.vercel.app/)

---

# 2. Installation

```bash
git clone https://github.com/kmizmal/hexo-theme-particlex.git ./themes/particlex
pnpm add hexo-renderer-sass-next
```

Then, set the theme in your root `_config.yml`:

```yaml
theme: particlex
```

## 2.1 Disable Archive by Year/Month

Hexo generates yearly/monthly archives by default, but this theme does not support them.

```yaml
archive_generator:
    enabled: true
    per_page: 0
    yearly: false
    monthly: false
    daily: false
```

After editing, remember to clear cache with `hexo cl`.

---

# 3. Configuration

> Please refer to `_config.yml.example` and rename it to `_config.yml`.

## 3.1 Basic Configuration

The `background` parameter accepts a list; one is chosen at random on each load.

```yaml
avatar: /images/avatar.jpg
background:
    - /images/background.jpg
loading: /images/loading.gif
colors:
    - "#ffa2c4"
    - "#00bcd4"
    - "#03a9f4"
    - "#00a596"
    - "#ff7d73"
```

## 3.2 Content Configuration

### 3.2.1 Navbar

Uses Font Awesome 6 icons:

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

### 3.2.2 Sidebar Card

Markdown is supported in the `description`.
`iconLinks` uses the same format as `menu`.

```yaml
card:
    enable: true
    description: |
        Description
        ...
    iconLinks:
    friendLinks:
        Argvchs: https://argvchs.github.io
```

### 3.2.3 Footer

For users deploying under their own domain in China, you can configure an ICP license display.

```yaml
footer:
    since: 2022
    ICP:
        enable: false
        code:
        link:
    game_card:
        enable: true
        game: gs
        more: false
        background: rand
        id:
    visitors:
        enable: true
```

## 3.3 Features

### 3.3.1 Polyfill

Uses [Polyfill.io](https://polyfill.io), replaced with Alibaba CDN for mainland China compatibility.

```yaml
polyfill:
    enable: true
    features:
        - default
```

### 3.3.2 Code Highlighting

Uses PrismJS.
Themes can be found on [PrismJS examples](https://prismjs.com/examples.html) or
[My blog post](https://blog.zmal.top/2025/0720/example-of-prismjs-styles).

```yaml
prismjs:
    enable: true
    theme: prism-tomorrow
    lineNumbers: true
```

### 3.3.3 Math Rendering

Uses KaTeX for math expressions.

```yaml
math:
    enable: false
```

### 3.3.4 Image Preview

Simple image zoom on click.

```yaml
preview:
    enable: true
```

### 3.3.5 Post Excerpt

Supports `<!-- more -->` in post content.
To define excerpt separately, use `description` in Front-Matter.

```yaml
description: |
    Normal _Italic_ **Strong**
```

### 3.3.6 Sticky Posts

Use `pinned` in Front-Matter. Higher numbers are shown first.

### 3.3.7 Post Encryption

Encrypt articles with AES. Requires [hexo-helper-crypto](https://github.com/theme-particlex/hexo-helper-crypto).

```yaml
crypto:
    enable: false
```

### 3.3.8 Search

A simple title-based search embedded in Archives.

```yaml
search:
    enable: false
```

## 3.4 Comment Systems

### 3.4.1 Giscus

GitHub Discussions-powered comments.

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

Issue-based comment system.
You may need your own [CORS proxy](https://argvchs.github.io/2022/07/04/build-cors-anywhere).

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

A fast, minimalist comment system.

More info: [Using Waline on ParticleX | Yuzi's Blog](https://blog.yuzi.dev/posts/bcb4ff00.html)

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

A lightweight and secure commenting system.

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

This project is licensed under the MIT License.
Contributions are welcome! Feel free to open an issue for questions or ideas, or fork the repo and submit a pull request!
