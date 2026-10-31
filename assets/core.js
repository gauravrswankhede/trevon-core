// Trevon dashboards — shared helpers (loaded by every repo from /trevon-core/).
const Q = new URLSearchParams(location.search);
const K = Q.get("k") || "";
const BOARD = (window.TREVON_BOARD || Q.get("b") || "").toLowerCase();
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STATUSES = ["Pending", "Ongoing", "Stuck", "Completed"];
const CHECK = ["Done", "Partly", "Not done"];
const cls = (s) => String(s || "").replace(/\s+/g, "");

function apiUrl() {
  const u = window.TREVON_API || "";
  if (!u || /PASTE/.test(u)) throw new Error("Not connected yet: paste the Apps Script web-app URL into trevon-core/config.js.");
  return u;
}
async function load(b = BOARD) {
  const r = await fetch(apiUrl() + "?b=" + encodeURIComponent(b) + "&k=" + encodeURIComponent(K) + "&t=" + Date.now());
  const j = await r.json(); if (!j.ok) throw new Error(j.error); return j;
}
async function post(body) {
  const r = await fetch(apiUrl(), { method: "POST", body: JSON.stringify(Object.assign({ k: K, b: BOARD, by: me() }, body)) });
  const j = await r.json(); if (!j.ok) throw new Error(j.error); return j;
}
function me() { try { return localStorage.getItem("trevon_name") || ""; } catch (e) { return ""; } }
function askName(force) {
  let n = me();
  if (!n || force) { n = (prompt("Your name (shown next to your updates):", n) || n || "").trim(); try { localStorage.setItem("trevon_name", n); } catch (e) {} }
  return n;
}
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2300); }
function burst(x, y) { for (let i = 0; i < 12; i++) { const s = document.createElement("div"); s.className = "burst"; s.textContent = ["🎉", "✨", "✅", "⭐"][i % 4];
  s.style.left = x + "px"; s.style.top = y + "px"; s.style.setProperty("--dx", (Math.random() * 220 - 110) + "px"); s.style.setProperty("--dy", (-Math.random() * 180 - 40) + "px");
  document.body.appendChild(s); setTimeout(() => s.remove(), 900); } }
const parseD = (s) => { if (!s) return null; const d = new Date(String(s).replace(" ", "T")); return isNaN(d) ? null : d; };
const ageDays = (s) => { const d = parseD(s); return d ? Math.max(0, Math.floor((Date.now() - d) / 864e5)) : 0; };
const fmtD = (s) => { const d = parseD(s); return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : ""; };
const today = () => new Date().toISOString().slice(0, 10);
function ring(pct, size = 58, color = "#12b76a") {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eaecf0" stroke-width="7"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  <text x="50%" y="55%" text-anchor="middle" font-size="${size / 4.2}" font-weight="750" fill="#101828">${pct}%</text></svg>`;
}
function spark(vals, w = 90, h = 24) {
  const v = vals.map((x) => (x === null || x === "" || isNaN(+x) ? null : +x)); const nums = v.filter((x) => x !== null);
  if (nums.length < 2) return `<span class="tag">${nums.length ? nums[0] : "—"}</span>`;
  const mn = Math.min(...nums), mx = Math.max(...nums), st = w / (v.length - 1);
  let d = "", first = true; v.forEach((x, i) => { if (x === null) return; const y = h - 3 - ((x - mn) / (mx - mn || 1)) * (h - 6); d += (first ? "M" : "L") + (i * st).toFixed(1) + " " + y.toFixed(1); first = false; });
  return `<svg class="spark" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="#0e7c66" stroke-width="2"/></svg>`;
}
function splitTitle(t) { t = String(t).replace(/^Group role(\s*\([^)]*\))?:\s*/i, ""); const m = t.match(/^([^:]{3,70}):\s*(.+)$/); return m ? [m[1], m[2]] : [t, ""]; }
const isRole = (t) => /^Group role/i.test(String(t.task || ""));
/** Status of a routine for a board in a period: Done / Partly / Not done / Missed (past, unticked) / Empty (current, unticked). */
function checkStatus(D, code, board, period, isCurrent) {
  const c = D.checkins.find((x) => x.code === code && x.board === board && x.period === period);
  if (c && c.status) return { s: c.status, c };
  return { s: isCurrent ? "Empty" : "Missed", c };
}
function periodsFor(D, rt) { return rt.frequency === "Monthly" ? D.periods.months : D.periods.weeks; }
function weekScore(D, board, routines, idx = 0) {
  const W = routines.filter((r) => r.frequency === "Weekly"); if (!W.length) return null;
  const p = D.periods.weeks[idx].key;
  const pts = W.reduce((a, r) => { const s = checkStatus(D, r.code, board, p, idx === 0).s; return a + (s === "Done" ? 1 : s === "Partly" ? 0.5 : 0); }, 0);
  return Math.round((100 * pts) / W.length);
}
function streak(D, board, routines) { let n = 0; for (let i = 1; i < D.periods.weeks.length; i++) { const s = weekScore(D, board, routines, i); if (s !== null && s >= 80) n++; else break; } return n; }
function shell(title, sub) {
  document.body.insertAdjacentHTML("afterbegin", `<div class="toast" id="toast"></div>`);
  document.title = title;
}

