// Loads every src/posts/<section>/<slug>.md file at build time.
const files = import.meta.glob("./posts/*/*.md", { query: "?raw", import: "default", eager: true });

// Reads the small "key: value" block between the --- lines at the top of a post.
function parse(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  m[1].split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  });
  return { meta, body: m[2] };
}

const all = Object.entries(files)
  .map(([path, raw]) => {
    const [, section, slug] = path.match(/\.\/posts\/([^/]+)\/([^/]+)\.md$/);
    const { meta, body } = parse(raw);
    return {
      section,
      slug,
      title: meta.title || slug,
      date: meta.date || "",
      summary: meta.summary || "",
      minutes: Math.max(1, Math.round(body.split(/\s+/).length / 100)),
      body,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date)); // newest first

export const getPosts = (section) => all.filter((p) => p.section === section);
export const getPost = (section, slug) => all.find((p) => p.section === section && p.slug === slug);
