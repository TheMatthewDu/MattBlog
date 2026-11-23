# Blog template

React + Vite. Two blogs, one homepage, Markdown posts with LaTeX math.

## Run it
    npm install
    npm run dev        # live preview
    npm run build      # production files in dist/

## Write a post
Add one `.md` file to `src/posts/essays/` or `src/posts/notes/`:

    ---
    title: My post
    date: 2026-11-05
    summary: Shown in the post list.
    ---
    Your text. Inline math: $a^2 + b^2 = c^2$. Block math: $$ \int_0^1 x\,dx $$

## Customize
- Site name, tagline, and the two blog names: `src/site.config.js`
  (a blog's `id` must match its folder name in `src/posts/`)
- Colors and fonts: top of `src/styles.css` (and the font link in `index.html`)
