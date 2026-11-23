import { useEffect } from "react";
import { HashRouter, Routes, Route, Link, NavLink, Outlet, useParams, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { site } from "./site.config";
import { getPosts, getPost } from "./posts";

const formatDate = (d, month = "long") =>
  d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month, day: "numeric" }) : "";

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="wrap">
      <header className="nav">
        <Link to="/" className="brand">{site.title}</Link>
        <nav>
          {site.sections.map((s) => (
            <NavLink key={s.id} to={`/${s.id}`}>{s.title}</NavLink>
          ))}
        </nav>
      </header>
      <main><Outlet /></main>
      <footer>© {new Date().getFullYear()} {site.title}</footer>
    </div>
  );
}

// Homepage: pick one of the two blogs.
function Home() {
  return (
    <>
      <section className="hero">
        <h1>{site.title}</h1>
        <p>{site.tagline}</p>
      </section>
      <div className="picks">
        {site.sections.map((s) => {
          const n = getPosts(s.id).length;
          return (
            <Link key={s.id} to={`/${s.id}`} className="pick">
              <h2>{s.title}</h2>
              {s.description[0]}
              <span className="count">{n} {n === 1 ? "post" : "posts"}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// One component powers both blogs, so they always have identical features.
function Section() {
  const { section } = useParams();
  const info = site.sections.find((s) => s.id === section);
  if (!info) return <Missing />;
  const posts = getPosts(section);
  return (
    <>
      <div className="page-head">
        <h1>{info.title}</h1>
        {info.description.map((m) => {return (<><p>{m}</p> <br></br></>)})}
      </div>
      {posts.length === 0 && <p className="empty">No posts yet. Add a .md file to src/posts/{section}/ to publish one.</p>}
      <div className="rows">
        {posts.map((p) => (
          <Link key={p.slug} to={`/${section}/${p.slug}`} className="row">
            <time>{formatDate(p.date, "short")}</time>
            <div>
              <h2>{p.title}</h2>
              {p.summary && <p>{p.summary}</p>}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function Post() {
  const { section, slug } = useParams();
  const info = site.sections.find((s) => s.id === section);
  const post = getPost(section, slug);
  if (!info || !post) return <Missing />;
  return (
    <article>
      <div className="post-head">
        <Link to={`/${section}`} className="back">&larr; Back to {info.title}</Link>
        <h1>{post.title}</h1>
        <div className="meta">
          <time>{formatDate(post.date)}</time>
          <span>{post.minutes} min read</span>
        </div>
      </div>
      <div className="prose">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {post.body}
        </ReactMarkdown>
      </div>
    </article>
  );
}

function Missing() {
  return (
    <div className="page-head">
      <h1>Page not found</h1>
      <p><Link to="/" className="back">Go to the homepage</Link></p>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path=":section" element={<Section />} />
          <Route path=":section/:slug" element={<Post />} />
          <Route path="*" element={<Missing />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
