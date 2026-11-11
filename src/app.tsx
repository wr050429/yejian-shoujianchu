import React, { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import content from "./content.json";

type Item = { id: string; image: string; type: string; appearance: string; physical: string; text: string };
type Shift = { n: number; label: string; title: string; items: Item[] };
type Decision = "filed" | "deferred" | null;
type Rec = { read: boolean; note: string; decision: Decision };
type Stage = "open" | "shift" | "handover" | "log";
type State = { stage: Stage; shift: number; open: string | null; recs: Record<string, Rec> };

const C = content as { world: { institute: string; duty: string }; shifts: Shift[] };
const SHIFTS = C.shifts;
const KEY = "yejian-shoujianchu.v1";

const PAPER = "#F2E9D2", PAPER2 = "#ECE1C4", WASH = "#F4DEA6", INK = "#1D2A68", MUTED = "#5A6285", DIM = "#8C7A55", SUN = "#F6C23E", WARN = "#8B3A2A";
const HAIR = "rgba(29,42,104,0.22)";
const SERIF = 'Georgia, "Times New Roman", "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif';
const ROMAN = ["I", "II", "III", "IV"];

const fresh = (): State => ({ stage: "open", shift: 0, open: null, recs: {} });
function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as State;
    if (!s || typeof s.shift !== "number" || !s.recs) return fresh();
    return { ...fresh(), ...s };
  } catch { return fresh(); }
}
const recOf = (s: State, id: string): Rec => s.recs[id] || { read: false, note: "", decision: null };
const findItem = (id: string): { item: Item; shift: number } | null => {
  for (let i = 0; i < SHIFTS.length; i++) { const it = SHIFTS[i].items.find((x) => x.id === id); if (it) return { item: it, shift: i }; }
  return null;
};
const statusText = (r: Rec): string => r.decision === "filed" ? "已归档" : r.decision === "deferred" ? "暂缓结案" : r.read ? "已读 · 未定" : "未拆";

const btn = (primary: boolean): CSSProperties => ({ padding: "10px 16px", minHeight: 44, borderRadius: 0, border: `1px solid ${INK}`, background: primary ? INK : "transparent", color: primary ? PAPER : INK, fontFamily: SERIF, fontSize: 15, letterSpacing: "0.08em", cursor: "pointer" });
const choice = (sel: boolean): CSSProperties => ({ flex: "1 1 140px", padding: "12px 14px", minHeight: 48, borderRadius: 0, border: `1px solid ${sel ? INK : "rgba(29,42,104,0.4)"}`, boxShadow: sel ? `inset 0 -3px 0 ${SUN}` : "none", background: sel ? WASH : "transparent", color: INK, fontFamily: SERIF, fontSize: 16, letterSpacing: "0.1em", cursor: "pointer" });
const quiet: CSSProperties = { background: "transparent", border: "none", padding: "8px 0", minHeight: 40, color: MUTED, fontFamily: SERIF, fontSize: 14.5, fontStyle: "italic", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" };
const tag: CSSProperties = { fontSize: 12, letterSpacing: "0.22em", color: DIM };
const rule2: CSSProperties = { borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, height: 3 };

// Images are stored as base64 text packs (assets/*.json: thumbs, desk, s1-s3) so they can be committed through a text-only API; decoded in the browser.
const packCache: Record<string, Promise<Record<string, string>>> = {};
const packOf = (name: string): string => name.startsWith("t-") ? "thumbs" : name === "desk" ? "desk" : `s${name.charAt(0)}`;
function loadImg(name: string): Promise<string> {
  const pk = packOf(name);
  if (!packCache[pk]) packCache[pk] = fetch(`assets/${pk}.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  return packCache[pk].then((m) => { if (!m[name]) throw new Error("missing"); return `data:image/webp;base64,${m[name]}`; }, (e) => { delete packCache[pk]; throw e; });
}
function Img({ src, alt, thumb }: { src: string; alt: string; thumb?: boolean }) {
  const name = (thumb ? "t-" : "") + src.replace(/^.*\//, "").replace(/\.webp$/, "");
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let live = true; setUrl(null); setFailed(false); loadImg(name).then((u) => { if (live) setUrl(u); }, () => { if (live) setFailed(true); }); return () => { live = false; }; }, [name]);
  return <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", background: PAPER2, border: `1px solid ${thumb ? HAIR : INK}`, overflow: "hidden" }}>
    {url ? <img src={url} alt={alt} decoding="async" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
      : <div role={alt ? "img" : undefined} aria-label={alt || undefined} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, letterSpacing: "0.2em", color: DIM }}>{failed ? "图版没取到" : "取图版中"}</div>}
  </div>;
}

function Head({ no, title, latin }: { no: string; title: string; latin?: string }) {
  return <div style={{ marginTop: 22 }}>
    <div style={rule2} />
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: "2px 16px", padding: "10px 0 4px" }}>
      <span style={tag}>{no}</span>
      {latin ? <span style={{ fontStyle: "italic", fontSize: 13, color: DIM }}>{latin}</span> : null}
    </div>
    <h2 style={{ fontSize: 24, lineHeight: 1.35, fontWeight: 400, margin: 0, letterSpacing: "0.04em" }}>{title}</h2>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ padding: "10px 0", borderBottom: `1px solid ${HAIR}` }}>
    <div style={{ fontSize: 12, letterSpacing: "0.2em", color: DIM }}>{label}</div>
    <div style={{ fontSize: 15.5, lineHeight: 1.7, marginTop: 3, wordBreak: "break-word" }}>{children}</div>
  </div>;
}

export default function App() {
  const [st, setSt] = useState<State>(load);
  const [warnEnd, setWarnEnd] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* storage off: progress lives only in this tab */ } }, [st]);
  useEffect(() => { document.title = "夜间收件处"; }, []);
  const scrollTop = () => { const el = topRef.current; if (el) el.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0); };
  useEffect(() => { scrollTop(); setWarnEnd(false); }, [st.stage, st.shift, st.open]);

  const setRec = (id: string, patch: Partial<Rec>) => setSt((s) => ({ ...s, recs: { ...s.recs, [id]: { ...recOf(s, id), ...patch } } }));
  const openItem = (id: string) => setSt((s) => ({ ...s, open: id, recs: { ...s.recs, [id]: { ...recOf(s, id), read: true } } }));
  const closeItem = () => setSt((s) => ({ ...s, open: null }));
  const endShift = () => setSt((s) => ({ ...s, open: null, stage: s.shift >= SHIFTS.length - 1 ? "log" : "handover" }));
  const nextShift = () => setSt((s) => ({ ...s, stage: "shift", shift: s.shift + 1, open: null }));
  const reset = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setConfirmReset(false); setSt(fresh()); };

  const sh = SHIFTS[st.shift];
  const opened = st.open ? findItem(st.open) : null;
  const past = opened ? opened.shift < st.shift : false;

  const header = <div>
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "4px 12px", alignItems: "baseline" }}>
      <span style={{ fontSize: 12.5, letterSpacing: "0.26em" }}>夜间收件处</span>
      <span style={{ fontSize: 12.5, letterSpacing: "0.18em", color: MUTED }}>{st.stage === "open" ? "22:00 — 06:00" : st.stage === "log" ? "值班日志" : `${sh.label} · ${sh.title}`}</span>
    </div>
    <div style={{ marginTop: 8, height: 1, background: INK }} />
    <div style={{ display: "flex", gap: 3, marginTop: 3 }} aria-hidden="true">
      {SHIFTS.map((_, i) => <div key={i} style={{ flex: 1, height: 2, background: st.stage === "log" || i < st.shift || (i === st.shift && st.stage === "handover") ? SUN : i === st.shift && st.stage !== "open" ? "rgba(246,194,62,0.45)" : "rgba(29,42,104,0.08)" }} />)}
    </div>
  </div>;

  let body: React.ReactNode = null;

  if (st.stage === "open") {
    const started = Object.keys(st.recs).length > 0;
    body = <div>
      <div style={{ marginTop: 22 }}><Img src="assets/desk.webp" alt="夜间收件处的桌面：台灯、登记簿、印章与分格收件盘" /></div>
      <div style={{ ...tag, marginTop: 8, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><span>PL. 0 · 值班桌</span><span style={{ fontStyle: "italic", letterSpacing: "0.04em" }}>mensa vigiliae nocturnae</span></div>
      <h1 style={{ fontSize: "clamp(36px, 9vw, 60px)", lineHeight: 1.1, fontWeight: 400, margin: "26px 0 0", letterSpacing: "0.04em" }}>夜间收件处</h1>
      <div style={{ fontSize: "clamp(16px, 3.6vw, 20px)", color: MUTED, marginTop: 8, letterSpacing: "0.06em" }}>{C.world.institute}</div>
      <p style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${HAIR}`, fontSize: 16, lineHeight: 1.8 }}>{C.world.duty}</p>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: MUTED }}>这是一次短值班：三班，每班三到四件。拆开一件，读完，写一两句批注，再决定「归档」还是「暂缓结案」；决定可以改。一班什么时候结束由你定。</p>
      <p style={{ fontSize: 13.5, lineHeight: 1.7, color: DIM, fontStyle: "italic" }}>批注和归档只存在这个浏览器里，不会上传。没有分数，也没有标准答案。</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22, alignItems: "center" }}>
        <button type="button" style={btn(true)} onClick={() => setSt((s) => ({ ...s, stage: "shift" }))}>{started ? `回到${sh.label}` : "开始值班"}</button>
        {started ? <button type="button" style={quiet} onClick={() => setConfirmReset(true)}>从头值班</button> : null}
      </div>
    </div>;
  } else if (st.stage === "shift" && opened) {
    const { item } = opened; const r = recOf(st, item.id);
    const list = SHIFTS[opened.shift].items; const idx = list.findIndex((x) => x.id === item.id);
    body = <div>
      <div style={{ marginTop: 14 }}><button type="button" style={quiet} onClick={closeItem}>{past ? "← 回到本班托盘" : `← 回到${sh.label}托盘`}</button></div>
      <Head no={`No. ${item.id} · ${SHIFTS[opened.shift].label}`} title={item.type} latin={past ? "卷宗 · 前班已交" : `${idx + 1} / ${list.length}`} />
      <figure style={{ margin: "16px 0 0" }}>
        <Img src={item.image} alt={`${item.id} ${item.type}：${item.appearance}`} />
        <figcaption style={{ fontSize: 13.5, lineHeight: 1.65, color: MUTED, marginTop: 8 }}><span style={{ ...tag, marginRight: 8 }}>{`PL. ${item.id}`}</span>{item.appearance}<span style={{ display: "block", fontStyle: "italic", color: DIM, fontSize: 12.5, marginTop: 2 }}>图版上的字迹不必逐字辨认，以下方「可见文本」为准。</span></figcaption>
      </figure>
      {item.physical ? <Field label="物理细节">{item.physical}</Field> : null}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.2em", color: DIM }}>可见文本</div>
        <div style={{ marginTop: 6, border: `1px solid ${INK}`, padding: 4 }}>
          <div style={{ border: `1px solid rgba(29,42,104,0.35)`, background: PAPER2, padding: "14px clamp(12px, 4vw, 22px)", fontSize: 16, lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item.text}</div>
        </div>
      </div>
      <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${INK}` }}>
        <label htmlFor="note" style={{ fontSize: 12, letterSpacing: "0.2em", color: DIM, display: "block" }}>批注</label>
        {past ? <div style={{ fontSize: 15.5, lineHeight: 1.75, marginTop: 6, whiteSpace: "pre-wrap", color: r.note ? INK : DIM, fontStyle: r.note ? "normal" : "italic" }}>{r.note || "（没有批注）"}</div>
          : <textarea id="note" value={r.note} onChange={(e) => setRec(item.id, { note: e.target.value })} rows={4} placeholder="写一两句你读到的、怀疑的，或想留给下一班的。" style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", border: `1px solid ${INK}`, borderRadius: 0, background: PAPER, color: INK, fontFamily: SERIF, fontSize: 16, lineHeight: 1.7, resize: "vertical" }} />}
        <div style={{ fontSize: 12, letterSpacing: "0.2em", color: DIM, marginTop: 16 }}>处理</div>
        {past ? <div style={{ fontSize: 15.5, marginTop: 4 }}>{statusText(r)}</div> : <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }} role="group" aria-label="处理">
            <button type="button" aria-pressed={r.decision === "filed"} style={choice(r.decision === "filed")} onClick={() => setRec(item.id, { decision: r.decision === "filed" ? null : "filed" })}>归档</button>
            <button type="button" aria-pressed={r.decision === "deferred"} style={choice(r.decision === "deferred")} onClick={() => setRec(item.id, { decision: r.decision === "deferred" ? null : "deferred" })}>暂缓结案</button>
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 8, fontStyle: "italic" }} aria-live="polite">{r.decision ? `现在：${statusText(r)}。本班结束前都可以改，再点一次可撤回。` : "还没决定。可以先放着，回托盘看别的。"}</div>
        </>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginTop: 26, paddingTop: 14, borderTop: `1px solid ${HAIR}` }}>
        <button type="button" style={btn(false)} disabled={idx <= 0} onClick={() => openItem(list[idx - 1].id)} aria-disabled={idx <= 0}>{idx > 0 ? `← ${list[idx - 1].id}` : "—"}</button>
        <button type="button" style={btn(false)} onClick={closeItem}>托盘</button>
        <button type="button" style={btn(false)} disabled={idx >= list.length - 1} onClick={() => openItem(list[idx + 1].id)} aria-disabled={idx >= list.length - 1}>{idx < list.length - 1 ? `${list[idx + 1].id} →` : "—"}</button>
      </div>
    </div>;
  } else if (st.stage === "shift") {
    const unread = sh.items.filter((it) => !recOf(st, it.id).read);
    const undecided = sh.items.filter((it) => recOf(st, it.id).read && !recOf(st, it.id).decision);
    body = <div>
      <Head no={`${sh.label} · ${ROMAN[st.shift]} / ${ROMAN[SHIFTS.length - 1]}`} title={sh.title} latin={`今夜来件 ${sh.items.length}`} />
      <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.7, margin: "8px 0 0" }}>收件盘里是今夜送到的东西。点一件拆开。</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 14 }}>
        {sh.items.map((it) => { const r = recOf(st, it.id); const done = !!r.decision; return <li key={it.id}>
          <button type="button" onClick={() => openItem(it.id)} aria-label={`${it.id} ${it.type}，${statusText(r)}`} style={{ display: "block", width: "100%", textAlign: "left", padding: 6, background: r.read ? "transparent" : PAPER2, border: `1px solid ${INK}`, boxShadow: done ? `inset 0 -3px 0 ${SUN}` : "none", borderRadius: 0, color: INK, fontFamily: SERIF, cursor: "pointer" }}>
            <div style={{ opacity: r.read ? 1 : 0.82 }}><Img src={it.image} alt="" thumb /></div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8, alignItems: "baseline" }}>
              <span style={{ fontStyle: "italic", fontSize: 15 }}>{`No. ${it.id}`}</span>
              <span style={{ fontSize: 12, letterSpacing: "0.14em", color: r.decision === "deferred" ? WARN : r.read ? MUTED : DIM }}>{statusText(r)}</span>
            </div>
            <div style={{ fontSize: 15.5, marginTop: 2, lineHeight: 1.5 }}>{it.type}</div>
          </button>
        </li>; })}
      </ul>
      {st.shift > 0 ? <details style={{ marginTop: 22, borderTop: `1px solid ${HAIR}`, paddingTop: 10 }}>
        <summary style={{ cursor: "pointer", fontSize: 14.5, color: MUTED, minHeight: 36 }}>翻看前几班已交的卷宗</summary>
        {SHIFTS.slice(0, st.shift).map((p) => <div key={p.n} style={{ marginTop: 10 }}>
          <div style={tag}>{`${p.label} · ${p.title}`}</div>
          {p.items.map((it) => <button key={it.id} type="button" style={{ ...quiet, display: "block", textAlign: "left", fontStyle: "normal" }} onClick={() => setSt((s) => ({ ...s, open: it.id }))}>{`No. ${it.id} · ${it.type} — ${statusText(recOf(st, it.id))}`}</button>)}
        </div>)}
      </details> : null}
      <div style={{ marginTop: 26, paddingTop: 14, borderTop: `1px solid ${INK}` }}>
        {warnEnd ? <div style={{ padding: "12px 14px", border: `1px solid ${WARN}`, color: WARN, fontSize: 14.5, lineHeight: 1.7 }}>
          {unread.length ? <div>{`还有 ${unread.length} 件没拆开（${unread.map((x) => x.id).join("、")}）。`}</div> : null}
          {undecided.length ? <div>{`${undecided.map((x) => x.id).join("、")} 读过但没定归档还是暂缓。`}</div> : null}
          <div style={{ color: MUTED }}>交班后这一班就不能再改了。也可以就这样交。</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            <button type="button" style={btn(true)} onClick={endShift}>就这样交班</button>
            <button type="button" style={btn(false)} onClick={() => setWarnEnd(false)}>回去再看看</button>
          </div>
        </div> : <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13.5, color: MUTED }}>{`已拆 ${sh.items.length - unread.length} / ${sh.items.length}`}</span>
          <button type="button" style={btn(true)} onClick={() => (unread.length || undecided.length ? setWarnEnd(true) : endShift())}>结束本班</button>
        </div>}
      </div>
    </div>;
  } else if (st.stage === "handover") {
    const n = SHIFTS[st.shift + 1];
    const c = (d: Decision) => sh.items.filter((it) => recOf(st, it.id).decision === d).length;
    body = <div>
      <Head no={`${sh.label} · 交班`} title={`${sh.title}，值完了`} latin="06:00" />
      <p style={{ fontSize: 15.5, lineHeight: 1.8, marginTop: 14 }}>{`本班 ${sh.items.length} 件：归档 ${c("filed")}，暂缓 ${c("deferred")}，未定 ${sh.items.length - c("filed") - c("deferred")}。`}</p>
      <p style={{ fontSize: 14.5, lineHeight: 1.75, color: MUTED }}>桌上的东西收进柜里。下一班的人会看到你的批注。</p>
      <div style={{ marginTop: 22 }}><button type="button" style={btn(true)} onClick={nextShift}>{`接${n.label}`}</button></div>
    </div>;
  } else {
    body = <div>
      <Head no="值班日志 · LOG" title="三班值完" latin="liber vigiliae" />
      <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.7, marginTop: 8 }}>下面只有你自己写下的批注和处理。</p>
      {SHIFTS.map((p) => <section key={p.n} style={{ marginTop: 18 }}>
        <div style={{ ...tag, paddingBottom: 6, borderBottom: `1px solid ${INK}` }}>{`${p.label} · ${p.title}`}</div>
        {p.items.map((it) => { const r = recOf(st, it.id); return <div key={it.id} style={{ padding: "10px 0", borderBottom: `1px solid ${HAIR}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
            <span><span style={{ fontStyle: "italic", marginRight: 8 }}>{`No. ${it.id}`}</span>{it.type}</span>
            <span style={{ fontSize: 13, letterSpacing: "0.14em", color: r.decision === "deferred" ? WARN : MUTED }}>{statusText(r)}</span>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, marginTop: 4, whiteSpace: "pre-wrap", wordBreak: "break-word", color: r.note ? INK : DIM, fontStyle: r.note ? "normal" : "italic" }}>{r.note || "（没有批注）"}</div>
        </div>; })}
      </section>)}
      <div style={{ width: 96, height: 2, background: SUN, margin: "26px auto 0" }} />
      <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}><button type="button" style={btn(false)} onClick={() => setConfirmReset(true)}>重新值班</button></div>
    </div>;
  }

  return <main style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(10px, 3.5vw, 36px) clamp(6px, 2.5vw, 18px) 64px" }}>
    <div ref={topRef} style={{ background: PAPER, color: INK, fontFamily: SERIF, border: `1px solid ${INK}`, boxShadow: `inset 0 0 0 6px ${PAPER}, inset 0 0 0 7px rgba(29,42,104,0.45)`, padding: "24px clamp(16px, 5vw, 44px) 34px", lineHeight: 1.6 }}>
      {header}
      {body}
      {confirmReset ? <div role="alertdialog" aria-label="确认重新值班" style={{ marginTop: 22, padding: "12px 14px", border: `1px solid ${WARN}`, color: WARN, fontSize: 14.5, lineHeight: 1.7 }}>
        <div>重新值班会清掉这个浏览器里的全部批注和归档记录。</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          <button type="button" style={btn(true)} onClick={reset}>清掉，重新值班</button>
          <button type="button" style={btn(false)} onClick={() => setConfirmReset(false)}>算了</button>
        </div>
      </div> : null}
      <div style={{ marginTop: 30, paddingTop: 10, borderTop: `1px solid ${HAIR}`, fontSize: 12, color: DIM, letterSpacing: "0.12em", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span>雾汀市立文书收件处 · 夜间</span><span>记录只留在本机浏览器</span>
      </div>
    </div>
  </main>;
}
