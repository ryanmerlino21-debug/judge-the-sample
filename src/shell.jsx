import React, { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------- small inline icons for the tabs
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
const ICONS = {
  pop: <><ellipse cx="12" cy="6" rx="7" ry="3" {...P} /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" {...P} /></>,
  explore: <><circle cx="10.5" cy="10.5" r="6" {...P} /><path d="M15 15l5 5" {...P} /></>,
  methods: <><path d="M5 20V10M12 20V4M19 20v-7" {...P} /></>,
  size: <><path d="M4 18c3 0 4-10 8-10s5 10 8 10" {...P} /><path d="M3 20h18" {...P} /></>,
  challenge: <><path d="M4 20l5-5M9 15l-1-4 4-4 4 1 1 4-4 4z" {...P} /><path d="M15 5l4 4" {...P} /></>,
  results: <><rect x="4" y="4" width="16" height="16" rx="2" {...P} /><path d="M4 10h16M10 4v16" {...P} /></>,
  guide: <><path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3z" {...P} /><path d="M9 8h5M9 12h5" {...P} /></>,
  gloss: <><path d="M5 5h14M5 10h14M5 15h9" {...P} /><path d="M17 15l3 4" {...P} /></>,
};
export function TabIcon({ name }) {
  return <svg className="ticon" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">{ICONS[name]}</svg>;
}

// ---------------------------------------------------------------- display & help menu
export function DisplayMenu({ theme, setTheme, big, setBig, patterns, setPatterns, onTour }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && ref.current.open && !ref.current.contains(e.target)) ref.current.open = false; };
    const esc = (e) => { if (e.key === "Escape" && ref.current) ref.current.open = false; };
    document.addEventListener("click", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", esc); };
  }, []);
  const row = (label, hint, on, set) => (
    <button type="button" role="switch" aria-checked={on} className="mrow" onClick={() => set(!on)}>
      <span><b>{label}</b><small>{hint}</small></span><span className={"sw2" + (on ? " on" : "")} aria-hidden="true"><i /></span>
    </button>
  );
  return (
    <details className="menu" ref={ref}>
      <summary><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="3" {...P} /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" {...P} /></svg> Display &amp; help</summary>
      <div className="menupop">
        {row("Dark mode", "Easier on the eyes in low light", theme === "dark", (v) => setTheme(v ? "dark" : "light"))}
        {row("Larger text", "Bigger type throughout", big, setBig)}
        {row("Patterns", "Textures as well as colours", patterns, setPatterns)}
        <button type="button" className="mrow" onClick={() => { onTour(); if (ref.current) ref.current.open = false; }}><span><b>Take a guided tour</b><small>Six short steps</small></span><span aria-hidden="true">›</span></button>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------- "on this page" jump links, built from the page's own headings
export function PageNav({ tab }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  useEffect(() => {
    let timer = 0;
    const scan = () => {
      const hs = [...document.querySelectorAll("main section.block > h2")];
      const list = hs.map((h, i) => {
        if (!h.id) h.id = "sec-" + tab + "-" + i;
        return { id: h.id, label: h.textContent.replace(/\s+/g, " ").trim().replace(/^(Healthcare costs).*/, "$1") };
      }).filter((x) => x.label);
      setItems((old) => (JSON.stringify(old) === JSON.stringify(list) ? old : list));
    };
    const sched = () => { clearTimeout(timer); timer = setTimeout(scan, 120); };
    sched();
    const main = document.getElementById("main");
    const mo = main ? new MutationObserver(sched) : null;
    if (mo) mo.observe(main, { childList: true, subtree: true });
    return () => { clearTimeout(timer); if (mo) mo.disconnect(); };
  }, [tab]);
  useEffect(() => {
    const onScroll = () => {
      let cur = null;
      for (const it of items) { const el = document.getElementById(it.id); if (el && el.getBoundingClientRect().top < 130) cur = it.id; }
      setActive(cur);
    };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);
  if (items.length < 4) return null;
  const jump = (id) => (e) => { e.preventDefault(); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); };
  return (
    <nav className="pagenav" aria-label="On this page">
      <span className="pn-label">On this page</span>
      {items.map((it) => <a key={it.id} href={"#" + it.id} className={active === it.id ? "on" : ""} onClick={jump(it.id)}>{it.label}</a>)}
    </nav>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > 900);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  if (!show) return null;
  return <button type="button" className="totop" aria-label="Back to the top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Top</button>;
}

// ---------------------------------------------------------------- one-line intro at the top of every tab
const INTRO = {
  pop: ["The population", "Everything about the 1,338 people in the file: what a row is, how the charges are spread, and what the data is not."],
  explore: ["Explore a sample", "Draw one sample with a method you choose and see who was picked, what estimate it gives and how far off it is."],
  methods: ["Compare methods", "Experiment A: repeat each method many times at n = 100 and see how the estimates spread around the true mean."],
  size: ["Sample size", "Experiment B: simple random sampling at n = 1, 10 and 100, so n is the only thing that changes."],
  challenge: ["Challenge", "Build a labelled modified copy that changes only the row order, then compare results on the baseline and the copy."],
  results: ["Your results", "Every result you have run in this session, in one table you can copy or download."],
  guide: ["Methods guide", "How each method works, which design applies at each n, common questions, and checks of the sampling code."],
  gloss: ["Glossary", "Plain-language definitions of every term in the app."],
};
export function TabIntro({ tab, icon }) {
  const t = INTRO[tab];
  if (!t) return null;
  return (
    <div className="tabintro">
      <span className="ti-icon">{icon}</span>
      <div><b>{t[0]}</b><span>{t[1]}</span></div>
    </div>
  );
}

export function Toast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t = 0;
    const on = (e) => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(null), 2600); };
    window.addEventListener("jts-toast", on);
    return () => { window.removeEventListener("jts-toast", on); clearTimeout(t); };
  }, []);
  if (!msg) return null;
  return <div className="toast" role="status" aria-live="polite">{msg}</div>;
}
