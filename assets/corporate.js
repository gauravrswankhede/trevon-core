// Corporate dashboard for the directors (Rakesh Chaturvedi, Rohit Sangwan, Gaurav Wankhede).
let D = null, WI = 0;
const SHORT = { "R-CONTENT": "Content", "R-GMB": "GMB", "R-CHECKOUT": "Checkout", "R-TREAT": "Treat", "R-REVIEWS": "Reviews", "R-QR": "QR", "R-CHANNEL": "Channel", "R-CRM": "Leads", "R-CATCHMENT": "Visits", "R-TARGETS": "Targets", "R-LONGSTAY": "Long-stay" };
const boardLink = (id) => `../trevon-${encodeURIComponent(id)}/?k=${encodeURIComponent(K)}`;

function page() {
  document.body.innerHTML = `<div class="toast" id="toast"></div>
  <header class="top"><div class="in"><div><div class="eyebrow">Trevon Hotels &amp; Resorts · Directors &amp; Finance only</div><h1>Corporate dashboard</h1>
  <div class="sub" id="ppl"></div></div><div class="right"><b id="wk"></b><span id="sy"></span></div></div></header>
  <main><div class="kpis" id="kpis"></div>
  <section class="panel"><div class="ph"><h2>Routine compliance by property <span class="note">· ✓ done · ◐ partly · ✗ not done · ✗ missed (not ticked)</span></h2>
    <div class="seg" id="wseg"><button data-i="0" class="on">This week</button><button data-i="1">Last week</button><button data-i="2">2 weeks ago</button></div></div><div class="scroll" id="heat"></div></section>
  <div class="grid2"><section class="panel"><div class="ph"><h2>Who oversees what</h2><span class="note">group coverage, selected week</span></div><div id="roles"></div></section>
  <section class="panel"><div class="ph"><h2>Numbers trend</h2><span class="note">last 8 weeks, from routine entries</span></div><div id="trend"></div></section></div>
  <section class="panel"><div class="ph"><h2>All dashboards</h2><span class="note">open any board with director rights</span></div><div class="bcards" id="cards"></div></section>
  <div class="grid2"><section class="panel"><div class="ph"><h2>⛔ Stuck: needs a director</h2></div><div class="feed" id="stuck"></div></section>
  <section class="panel"><div class="ph"><h2>🔁 Raised again and again</h2><span class="note">carried over 2+ meetings</span></div><div class="feed" id="carried"></div></section></div>
  <div class="grid2"><section class="panel"><div class="ph"><h2>⚡ Live activity</h2></div><div class="feed" id="feed"></div></section>
  <section class="panel"><div class="ph"><h2>📋 Meetings read automatically</h2></div><div class="feed" id="meet"></div></section></div>
  <div id="err"></div></main>`;
  $$("#wseg button").forEach((b) => (b.onclick = () => { WI = +b.dataset.i; $$("#wseg button").forEach((x) => x.classList.toggle("on", x === b)); render(); }));
}

function render() {
  const props = D.boards.filter((b) => b.type === "property"), teams = D.boards.filter((b) => b.type !== "property");
  const name = (id) => (D.boards.find((b) => b.id === id) || {}).name || id;
  const W = D.periods.weeks[WI], cur = WI === 0;
  const PR = D.routines.filter((r) => r.scope === "ALL_PROPERTIES" && r.frequency === "Weekly");
  const forBoard = (b) => D.routines.filter((r) => r.scope === b.id || (r.scope === "ALL_PROPERTIES" && b.type === "property"));
  $("#ppl").textContent = (D.me.people || []).join(" · ");
  $("#wk").textContent = "Week of " + W.label; $("#sy").textContent = "synced " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const T = D.tasks, open = T.filter((t) => t.status !== "Completed");
  const grp = (i) => { const s = props.map((b) => weekScore(D, b.id, forBoard(b), i)).filter((x) => x !== null); return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0; };
  $("#kpis").innerHTML = [
    `<div class="kpi ring">${ring(grp(WI))}<div><div class="l">Group routines</div><div class="h">${cur ? "this week" : W.label}<br>prev. ${grp(Math.min(WI + 1, 7))}%</div></div></div>`,
    `<div class="kpi"><div class="l">Open actions</div><div class="v">${open.length}</div><div class="h">${T.filter((t) => t.status === "Completed" && ageDays(t.completedAt) < 7).length} completed in 7 days</div></div>`,
    `<div class="kpi"><div class="l">Stuck</div><div class="v" style="color:${open.some((t) => t.status === "Stuck") ? "var(--stuck)" : "var(--done)"}">${open.filter((t) => t.status === "Stuck").length}</div><div class="h">waiting on a director</div></div>`,
    `<div class="kpi"><div class="l">Overdue</div><div class="v">${open.filter((t) => t.due && t.due < today()).length}</div><div class="h">past due date</div></div>`,
    `<div class="kpi"><div class="l">Meetings read</div><div class="v">${D.meetings.length}</div><div class="h">${D.meetings.length ? "last " + esc(fmtD(D.meetings[D.meetings.length - 1].date)) : "none yet"}</div></div>`,
  ].join("");
  // heatmap
  const sym = (s) => (s === "Done" ? "✓" : s === "Partly" ? "◐" : s === "Not done" || s === "Missed" ? "✗" : "·");
  const rows = props.map((b) => ({ b, cells: PR.map((r) => checkStatus(D, r.code, b.id, W.key, cur)), pct: weekScore(D, b.id, forBoard(b), WI) })).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
  const colPct = PR.map((r, j) => Math.round((100 * rows.filter((x) => x.cells[j].s === "Done").length) / Math.max(1, rows.length)));
  $("#heat").innerHTML = `<table class="mx heat"><tr><th>Property</th><th>GM</th>${PR.map((r) => `<th class="c" title="${esc(r.title)}">${esc(SHORT[r.code] || r.code)}</th>`).join("")}<th>Score</th><th>Open</th></tr>
    ${rows.map((x) => { const o = open.filter((t) => t.board === x.b.id); return `<tr><td><a href="${boardLink(x.b.id)}"><b>${esc(x.b.name.replace("Trevon ", ""))}</b></a></td><td>${esc(x.b.people.join(", "))}</td>
      ${x.cells.map((c, j) => `<td class="c"><span class="cell ${cls(c.s)}" title="${esc(PR[j].title)}${c.c && c.c.value ? " · " + esc(c.c.value) : ""}${c.c && c.c.note ? " · " + esc(c.c.note) : ""}">${sym(c.s)}</span></td>`).join("")}
      <td style="min-width:110px"><div style="display:flex;align-items:center;gap:8px"><div class="bar" style="flex:1"><i style="width:${x.pct || 0}%"></i></div><b>${x.pct ?? "—"}%</b></div></td>
      <td>${o.length}${o.some((t) => t.status === "Stuck") ? ` <span class="tag red">${o.filter((t) => t.status === "Stuck").length} stuck</span>` : ""}</td></tr>`; }).join("")}
    <tr><td colspan="2" style="color:var(--mute)">Coverage</td>${colPct.map((p) => `<td class="c"><b style="color:${p >= 80 ? "var(--done)" : p >= 50 ? "var(--part)" : "var(--miss)"}">${p}%</b></td>`).join("")}<td colspan="2"></td></tr></table>`;
  // roles
  const by = {}; D.routines.filter((r) => r.scope === "ALL_PROPERTIES").forEach((r) => (by[r.overseer || "—"] = by[r.overseer || "—"] || []).push(r));
  $("#roles").innerHTML = `<table class="mx"><tr><th>Person</th><th>Responsibility</th><th class="c">Covered</th></tr>${Object.entries(by).map(([who, list]) => list.map((r, i) => {
    const per = r.frequency === "Monthly" ? D.periods.months : D.periods.weeks, P = per[r.frequency === "Monthly" ? 0 : WI];
    const n = props.filter((b) => checkStatus(D, r.code, b.id, P.key, true).s === "Done").length;
    return `<tr>${i === 0 ? `<td rowspan="${list.length}"><b>${esc(who)}</b></td>` : ""}<td>${esc(r.title)}${r.frequency === "Monthly" ? ' <span class="tag">monthly</span>' : ""}</td><td class="c"><span class="tag ${n === props.length ? "green" : n >= props.length / 2 ? "amber" : "red"}">${n}/${props.length}</span></td></tr>`;
  }).join("")).join("")}</table>`;
  // trends
  const wk = D.periods.weeks.slice().reverse();
  const MR = D.routines.filter((r) => r.metric && r.frequency === "Weekly");
  $("#trend").innerHTML = `<table class="mx"><tr><th>Measure</th><th>Board</th><th>8 weeks</th><th>Latest</th></tr>${MR.map((r) => {
    const group = r.scope === "ALL_PROPERTIES";
    const vals = wk.map((p) => { const cs = D.checkins.filter((c) => c.code === r.code && c.period === p.key && c.value !== "" && !isNaN(+c.value)); if (!cs.length) return null; const s = cs.reduce((a, c) => a + +c.value, 0); return group && /%|average|score|rank/i.test(r.metric) ? +(s / cs.length).toFixed(1) : s; });
    const last = [...vals].reverse().find((v) => v !== null);
    return `<tr><td>${esc(r.metric)}<div style="color:var(--mute);font-size:12px">${esc(r.title.slice(0, 60))}</div></td><td>${group ? "All properties" : esc(name(r.scope))}</td><td>${spark(vals)}</td><td><b>${last ?? "—"}</b></td></tr>`;
  }).join("")}</table>`;
  // cards
  $("#cards").innerHTML = props.concat(teams).map((b) => {
    const o = open.filter((t) => t.board === b.id), sc = weekScore(D, b.id, forBoard(b), WI), st = o.filter((t) => t.status === "Stuck").length;
    const lastUp = D.log.filter((l) => l.board === b.id && !/^(Setup|Meeting)/.test(l.by)).slice(-1)[0];
    return `<a class="bcard" href="${boardLink(b.id)}"><div style="display:flex;justify-content:space-between;gap:8px"><div><h3>${esc(b.name)}</h3><div class="p">${esc(b.people.join(", "))}</div></div>${sc !== null ? ring(sc, 46, sc >= 80 ? "#12b76a" : sc >= 50 ? "#f79009" : "#f04438") : ""}</div>
      <div class="mini"><span><b>${o.length}</b> open</span>${st ? `<span style="color:var(--stuck)"><b>${st}</b> stuck</span>` : ""}<span>${lastUp ? "updated " + esc(fmtD(lastUp.ts)) : `<span style="color:var(--stuck)">no updates yet</span>`}</span></div></a>`;
  }).join("");
  const line = (t) => `<div><a href="${boardLink(t.board)}"><b>${esc(name(t.board).replace("Trevon ", ""))}</b></a> · ${esc(splitTitle(t.task)[0])} ${t.carry ? `<span class="tag ${t.carry >= 4 ? "red" : "amber"}">🔁 ${t.carry}×</span>` : ""}${t.status === "Stuck" && t.notes ? `<div style="color:var(--mute);font-size:12.5px">“${esc(t.notes)}”</div>` : ""}</div>`;
  const st = open.filter((t) => t.status === "Stuck");
  $("#stuck").innerHTML = st.length ? st.map(line).join("") : `<div class="empty">Nobody is stuck.</div>`;
  const car = open.filter((t) => t.carry >= 2).sort((a, b) => b.carry - a.carry).slice(0, 12);
  $("#carried").innerHTML = car.length ? car.map(line).join("") : `<div class="empty">Nothing carried over 2+ meetings yet.</div>`;
  const L = D.log.filter((l) => !/^(Setup|Meeting)/.test(l.by)).slice().reverse().slice(0, 30);
  $("#feed").innerHTML = L.length ? L.map((l) => `<div><time>${esc(l.ts)}</time><b>${esc(name(l.board).replace("Trevon ", ""))}</b> · ${esc(l.ref)} ${esc(l.field)}: ${l.from ? esc(l.from) + " → " : ""}${esc(String(l.to).slice(0, 90))} <i style="color:var(--mute)">${esc(l.by)}</i></div>`).join("") : `<div class="empty">No updates from the teams yet.</div>`;
  const M = D.meetings.slice().reverse();
  $("#meet").innerHTML = M.length ? M.map((m) => `<div><time>${esc(m.date)}</time><b>${esc(m.added)}</b> new · <b>${esc(m.updates)}</b> updated <i style="color:var(--mute)">(${esc(m.method)})</i></div>`).join("") : `<div class="empty">No meeting notes read yet.</div>`;
}
async function refresh() { try { D = await load("corporate"); if (!D.corporate) throw new Error("This page needs the directors' key (Settings tab → HQ_LINK)."); $("#err").innerHTML = ""; render(); } catch (e) { $("#err").innerHTML = `<div class="err">${esc(e.message)}</div>`; } }
page();
if (!K) $("#err").innerHTML = `<div class="err">Open this page with the directors' link (Settings tab → HQ_LINK).</div>`; else refresh();
setInterval(() => { if (!document.hidden) refresh(); }, 60000);
