// Board dashboard: one per property / team. Same file for every repo; the repo sets window.TREVON_BOARD.
let D = null, PIDX = 0, TVIEW = "open", SRC = "", OPENH = new Set(), PERSON = Q.get("p") || "";
const SRCS = [["", "All"], ["Meeting", "From meetings"], ["Strategy", "Strategy & roles"], ["Added", "Added by us"]];

function page() {
  document.body.innerHTML = `<div class="toast" id="toast"></div>
  <header class="top"><div class="in"><div><div class="eyebrow" id="eb">Trevon Hotels &amp; Resorts</div><h1 id="nm">Loading…</h1><div class="sub" id="sb"></div></div>
  <div class="right"><b id="wk"></b><span id="sy"></span><br><span class="chip" id="who" title="Change your name">👤 <span id="whon">set your name</span></span></div></div></header>
  <main><div class="kpis" id="kpis"></div><div id="extra-top"></div>
    <section class="panel" id="rtp"><div class="ph"><h2>Weekly routines <span class="note">· ongoing duties: tick them every week</span></h2>
      <div class="seg" id="pseg"><button data-i="0" class="on">This week</button><button data-i="1">Last week</button></div></div><div id="rts"></div></section>
    <div id="mon"></div>
    <section class="panel"><div class="ph"><h2>Action items <span class="note">· from meetings, strategy and roles</span></h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" id="tseg"><button data-v="open" class="on">Open</button><button data-v="done">Completed</button></div>
      <div class="seg" id="sseg">${SRCS.map(([v, l]) => `<button data-v="${v}" class="${v === "" ? "on" : ""}">${l}</button>`).join("")}</div></div></div><div id="pfil"></div><div id="tasks"></div></section>
    <div id="extra"></div>
    <section class="panel"><div class="ph"><h2>Activity</h2><span class="note">every update on this dashboard, newest first</span></div><div class="feed" id="feed"></div></section>
    <div id="err"></div></main>
  <button class="fab" id="fab">＋ Add task</button>
  <div class="modal" id="modal"><div class="sheet"><b>New action item</b><textarea id="nT" rows="3" placeholder="What needs to be done?"></textarea>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><select id="nP"><option>Medium</option><option>High</option><option>Low</option></select><input type="date" id="nD"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn g" id="nC">Cancel</button><button class="btn" id="nS">Add</button></div></div></div>`;
  $$("#pseg button").forEach((b) => (b.onclick = () => { PIDX = +b.dataset.i; $$("#pseg button").forEach((x) => x.classList.toggle("on", x === b)); renderRoutines(); }));
  $$("#tseg button").forEach((b) => (b.onclick = () => { TVIEW = b.dataset.v; $$("#tseg button").forEach((x) => x.classList.toggle("on", x === b)); renderTasks(); }));
  $$("#sseg button").forEach((b) => (b.onclick = () => { SRC = b.dataset.v; $$("#sseg button").forEach((x) => x.classList.toggle("on", x === b)); renderTasks(); }));
  $("#who").onclick = () => { askName(true); $("#whon").textContent = me() || "set your name"; };
  $("#fab").onclick = () => { $("#modal").classList.add("on"); $("#nT").focus(); };
  $("#nC").onclick = () => $("#modal").classList.remove("on");
  $("#nS").onclick = addTask;
}

const myRoutines = () => D.routines;
function render() {
  const B = D.me, R = myRoutines(), T = D.tasks;
  document.title = B.name + " · Trevon";
  $("#eb").textContent = "Trevon Hotels & Resorts · " + (B.type === "property" ? "Property dashboard" : "Team dashboard") + (D.hq ? " · director view" : "");
  $("#nm").textContent = B.name;
  $("#sb").textContent = (B.type === "property" ? "General Manager: " : "Team: ") + (B.people.join(", ") || "—");
  $("#wk").textContent = "Week of " + D.periods.weeks[0].label;
  $("#sy").textContent = "synced " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  $("#whon").textContent = me() || "set your name";
  const score = weekScore(D, B.id, R, 0), last = weekScore(D, B.id, R, 1), st = streak(D, B.id, R);
  const open = T.filter((t) => t.status !== "Completed"), stuck = open.filter((t) => t.status === "Stuck").length;
  const doneWk = T.filter((t) => t.status === "Completed" && ageDays(t.completedAt) < 7).length;
  const carried = open.filter((t) => t.carry >= 3).length;
  $("#kpis").innerHTML = [
    score !== null ? `<div class="kpi ring">${ring(score)}<div><div class="l">This week</div><div class="h">routines done<br>last week ${last}%</div></div></div>` : "",
    score === null ? "" : st ? `<div class="kpi"><div class="l">Streak</div><div class="v">🔥 ${st}</div><div class="h">weeks at 80%+</div></div>` : `<div class="kpi"><div class="l">Streak</div><div class="v">0</div><div class="h">weeks at 80%+</div></div>`,
    D.nextMeeting ? `<div class="kpi"><div class="l">Next meeting</div><div class="v" style="font-size:20px">${esc(fmtMeet(D.nextMeeting.start))}</div><div class="h">${esc(D.nextMeeting.title)}</div></div>` : "",
    `<div class="kpi"><div class="l">Open actions</div><div class="v">${open.length}</div><div class="h">${doneWk} completed this week</div></div>`,
    `<div class="kpi"><div class="l">Stuck</div><div class="v" style="color:${stuck ? "var(--stuck)" : "var(--done)"}">${stuck}</div><div class="h">need director help</div></div>`,
    `<div class="kpi"><div class="l">Carried 3×+</div><div class="v" style="color:${carried ? "var(--part)" : "var(--done)"}">${carried}</div><div class="h">raised in 3+ meetings</div></div>`,
  ].join("");
  renderRoutines(); renderMonitor(); renderPeople(); renderTasks(); renderFeed();
  if (typeof window.BOARD_EXTRA === "function") { try { window.BOARD_EXTRA(D); } catch (e) { console.error(e); } }
}
function fmtMeet(s) {
  const d = parseD(s); if (!d) return s; const t = new Date(), tm = new Date(t); tm.setDate(t.getDate() + 1);
  const day = d.toDateString() === t.toDateString() ? "Today" : d.toDateString() === tm.toDateString() ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return day + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
/** Team boards: one chip per person; shared ("Team") items show for everyone. */
const firstName = (n) => String(n || "").trim().split(/\s+/)[0].toLowerCase();
function ownsTask(t, person) {
  if (!person) return true; const o = String(t.owner || "").toLowerCase();
  return !o || /^(team|the group|everyone|all)$/.test(o.trim()) || o.split(/[,&/+]| and /).some((x) => firstName(x) === firstName(person));
}
function renderPeople() {
  const P = D.me.people || [];
  if (D.me.type === "property" || P.length < 2) { $("#pfil").innerHTML = ""; return; }
  const open = (p) => D.tasks.filter((t) => t.status !== "Completed" && ownsTask(t, p)).length;
  $("#pfil").innerHTML = `<div class="people">${["", ...P].map((p) => `<button data-p="${esc(p)}" class="${p === PERSON ? "on" : ""}">${p ? esc(p) : "Everyone"} <b>${open(p)}</b></button>`).join("")}</div>`;
  $$("#pfil button").forEach((b) => (b.onclick = () => { PERSON = b.dataset.p; const u = new URL(location.href); PERSON ? u.searchParams.set("p", PERSON) : u.searchParams.delete("p"); history.replaceState(null, "", u); renderPeople(); renderTasks(); }));
}

function renderRoutines() {
  const R = myRoutines();
  $("#rtp").style.display = R.length ? "" : "none";
  if (!R.length) { $("#rts").innerHTML = `<div class="empty">No routines on this dashboard.</div>`; return; }
  const groups = [["Weekly", R.filter((r) => r.frequency === "Weekly")], ["Monthly", R.filter((r) => r.frequency === "Monthly")]];
  $("#rts").innerHTML = groups.filter((g) => g[1].length).map(([f, list]) => {
    const per = f === "Monthly" ? D.periods.months : D.periods.weeks, P = per[PIDX];
    return `<div class="ph" style="background:#fcfcfd;padding:8px 16px"><span class="note"><b>${f === "Monthly" ? "Monthly" : "Weekly"}</b> · ${esc(P.label)}${PIDX ? " (late entry allowed)" : ""}</span></div>` +
      list.map((r) => {
        const { s, c } = checkStatus(D, r.code, D.me.id, P.key, PIDX === 0);
        const hist = per.slice().reverse().map((p, i, arr) => { const x = checkStatus(D, r.code, D.me.id, p.key, p.key === per[0].key).s; return `<span class="dot ${cls(x)} ${p.key === P.key ? "cur" : ""}" title="${esc(p.label)}: ${x === "Empty" ? "not ticked yet" : x}"></span>`; }).join("");
        return `<div class="rt" data-code="${esc(r.code)}"><div><div class="t">${esc(r.title)}</div>${r.detail ? `<div class="d">${esc(r.detail)}</div>` : ""}
          <div class="meta"><span class="dots">${hist}</span>${r.overseer ? `<span class="tag gold">overseen by ${esc(r.overseer)}</span>` : ""}${c && c.by ? `<span class="tag">✔ ${esc(c.by)} · ${esc(fmtD(c.ts))}</span>` : ""}</div></div>
          <div class="ctl"><div class="pick">${CHECK.map((x) => `<button class="${cls(x)} ${s === x ? "on" : ""}" data-s="${x}">${x === "Done" ? "✓ Done" : x === "Partly" ? "◐ Partly" : "✗ Not done"}</button>`).join("")}</div>
          ${r.metric ? `<input class="num" type="number" inputmode="decimal" placeholder="${esc(r.metric)}" title="${esc(r.metric)}" value="${esc(c ? c.value : "")}">` : ""}
          <button class="ico ${c && c.note ? "has" : ""}" data-n="1" title="${esc(c && c.note ? c.note : "Add a note")}">📝</button></div></div>`;
      }).join("");
  }).join("");
  $$("#rts .rt").forEach((row) => {
    const r = R.find((x) => x.code === row.dataset.code), per = periodsFor(D, r), P = per[PIDX];
    const save = async (patch, ev) => {
      if (!me()) askName();
      const cur = D.checkins.find((x) => x.code === r.code && x.board === D.me.id && x.period === P.key) || { period: P.key, code: r.code, board: D.me.id, status: "", value: "", note: "" };
      const nx = Object.assign({}, cur, patch, { by: me(), ts: new Date().toISOString() });
      D.checkins = D.checkins.filter((x) => x !== cur).concat([nx]);
      renderRoutines(); render();
      if (patch.status === "Done" && ev) burst(ev.clientX, ev.clientY);
      try { await post({ action: "checkin", code: r.code, period: P.key, status: nx.status, value: nx.value, note: nx.note }); toast("Saved · " + r.title.slice(0, 40)); refresh(); }
      catch (e) { toast("Not saved: " + e.message); refresh(); }
    };
    $$(".pick button", row).forEach((b) => (b.onclick = (ev) => save({ status: b.dataset.s }, ev)));
    const n = $(".num", row); if (n) n.onchange = () => save({ value: n.value, status: (D.checkins.find((x) => x.code === r.code && x.board === D.me.id && x.period === P.key) || {}).status || "Done" });
    $("[data-n]", row).onclick = () => { const cur = D.checkins.find((x) => x.code === r.code && x.board === D.me.id && x.period === P.key) || {}; const t = prompt("Note for this week (" + r.title + "):", cur.note || ""); if (t !== null) save({ note: t, status: cur.status || "" }); };
  });
}

function renderMonitor() {
  const M = D.monitor || [];
  if (!M.length) { $("#mon").innerHTML = ""; return; }
  const props = D.boards.filter((b) => b.type === "property"), wk = D.periods.weeks;
  $("#mon").innerHTML = M.map((r) => {
    const per = periodsFor(D, r), P = per[0];
    const rows = props.map((b) => ({ b, s: checkStatus(D, r.code, b.id, P.key, true), hist: per.slice().reverse().map((p) => checkStatus(D, r.code, b.id, p.key, p.key === P.key).s) }));
    const ok = rows.filter((x) => x.s.s === "Done").length, missing = rows.filter((x) => x.s.s !== "Done");
    return `<section class="panel"><div class="ph"><h2>Group responsibility: ${esc(r.title)} <span class="note">· you oversee this across all properties</span></h2>
      <div style="display:flex;gap:8px;align-items:center"><span class="tag ${ok === rows.length ? "green" : ok >= rows.length / 2 ? "amber" : "red"}">${ok}/${rows.length} done ${r.frequency === "Monthly" ? "this month" : "this week"}</span>
</div></div>
      <div class="scroll"><table class="mx"><tr><th>Property</th><th>GM</th><th class="c">${r.frequency === "Monthly" ? "This month" : "This week"}</th><th>History (oldest → newest)</th>${r.metric ? `<th>${esc(r.metric)}</th>` : ""}<th>Note</th></tr>
      ${rows.map((x) => `<tr><td><b>${esc(x.b.name.replace("Trevon ", ""))}</b></td><td>${esc(x.b.people.join(", "))}</td>
        <td class="c"><span class="cell ${cls(x.s.s)}">${x.s.s === "Done" ? "✓" : x.s.s === "Partly" ? "◐" : x.s.s === "Not done" ? "✗" : "·"}</span></td>
        <td><span class="dots">${x.hist.map((h) => `<span class="dot ${cls(h)}"></span>`).join("")}</span></td>${r.metric ? `<td>${esc(x.s.c ? x.s.c.value : "")}</td>` : ""}<td style="color:var(--mute)">${esc(x.s.c ? x.s.c.note : "")}</td></tr>`).join("")}</table></div></section>`;
  }).join("");
}

function srcOf(t) { return t.source === "Meeting" ? "Meeting" : t.source === "Strategy" ? "Strategy" : "Added"; }
function renderTasks() {
  const T = D.tasks.filter((t) => (TVIEW === "done" ? t.status === "Completed" : t.status !== "Completed") && (!SRC || srcOf(t) === SRC) && ownsTask(t, PERSON));
  const ord = { Stuck: 0, Ongoing: 1, Pending: 2, Completed: 3 }, pr = { High: 0, Medium: 1, Low: 2 };
  T.sort((a, b) => TVIEW === "done" ? String(b.completedAt).localeCompare(a.completedAt) : ord[a.status] - ord[b.status] || (isRole(b) - isRole(a)) || pr[a.priority] - pr[b.priority] || b.carry - a.carry);
  $("#tasks").innerHTML = T.length ? `<div class="tasks">${T.map(card).join("")}</div>` : `<div class="empty">${TVIEW === "done" ? "Nothing completed yet." : "🎉 No open action items here."}</div>`;
  $$("#tasks select.st").forEach((sel) => (sel.onchange = async (ev) => {
    const t = D.tasks.find((x) => x.id === sel.dataset.id), old = t.status, s = sel.value; if (!me()) askName();
    let note;
    if (s === "Stuck") note = prompt("What is blocking this? (shown to the directors)", t.notes || "");
    if (s === "Completed") note = prompt("How was it completed? (optional: proof, link, comment)", t.notes || "");
    t.status = s; if (note !== undefined && note !== null) t.notes = note; if (s === "Completed") t.completedAt = new Date().toISOString();
    const r = sel.getBoundingClientRect(); render(); if (s === "Completed") burst(r.left + r.width / 2, r.top);
    try { await post({ action: "update", id: t.id, status: s, note: note === null ? undefined : note }); toast(t.id + " → " + s); refresh(); }
    catch (e) { t.status = old; render(); toast("Not saved: " + e.message); }
  }));
  $$("#tasks [data-note]").forEach((b) => (b.onclick = async () => { const t = D.tasks.find((x) => x.id === b.dataset.note); const n = prompt("Note for " + t.id + ":", t.notes || ""); if (n === null) return; if (!me()) askName(); t.notes = n; renderTasks();
    try { await post({ action: "update", id: t.id, status: t.status, note: n }); toast("Note saved"); } catch (e) { toast("Not saved: " + e.message); } }));
  $$("#tasks [data-h]").forEach((b) => (b.onclick = () => { const id = b.dataset.h; OPENH.has(id) ? OPENH.delete(id) : OPENH.add(id); renderTasks(); }));
}
function card(t) {
  const [tt, td] = splitTitle(t.task), age = ageDays(t.created), od = t.due && t.due < today() && t.status !== "Completed", h = D.log.filter((l) => l.ref === t.id);
  return `<div class="task ${esc(t.priority)} ${esc(t.status)}"><div class="trow"><div><div class="tt">${esc(tt)}</div>${td ? `<div class="td">${esc(td)}</div>` : ""}</div>
    <select class="st ${esc(t.status)}" data-id="${esc(t.id)}">${STATUSES.map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
    <div class="tags"><span class="tag">${esc(t.id)}</span>${isRole(t) ? `<span class="tag gold">⭐ Group role${esc((t.task.match(/^Group role\s*(\([^)]*\))/i) || ["", ""])[1] ? " " + t.task.match(/^Group role\s*(\([^)]*\))/i)[1] : "")}</span>` : ""}${t.priority === "High" ? `<span class="tag red">High</span>` : ""}
    <span class="tag ${t.source === "Meeting" ? "blue" : t.source === "Strategy" ? "gold" : ""}">${t.source === "Meeting" ? "📋 Meeting " + esc(fmtD(t.meetingDate)) : t.source === "Strategy" ? "🎯 Strategy / role" : "✍️ " + esc(t.source)}</span>
    ${t.status === "Completed" ? `<span class="tag green">✔ ${esc(fmtD(t.completedAt))}</span>` : `<span class="tag ${age >= 7 ? "red" : age >= 3 ? "amber" : ""}">⏱ ${age}d open</span>`}
    ${t.carry && t.status !== "Completed" ? `<span class="tag ${t.carry >= 4 ? "red" : t.carry >= 2 ? "amber" : ""}">🔁 ${t.carry}× carried</span>` : ""}
    ${t.due ? `<span class="tag ${od ? "red" : "blue"}">📅 ${od ? "overdue " : ""}${esc(fmtD(t.due))}</span>` : ""}${t.owner ? `<span class="tag">👤 ${esc(t.owner)}</span>` : ""}</div>
    ${t.notes ? `<div class="tnote">${esc(t.notes)}</div>` : ""}
    <div class="tact"><button class="lnk" data-note="${esc(t.id)}">${t.notes ? "Edit note" : "Add note"}</button><button class="lnk" data-h="${esc(t.id)}">History (${h.length})</button>
    ${t.updatedBy ? `<span>last: ${esc(t.updatedBy)} · ${esc(fmtD(t.lastUpdate))}</span>` : ""}</div>
    ${OPENH.has(t.id) ? `<div class="hist">${h.slice().reverse().map((l) => `<div>${esc(l.ts)} · ${esc(l.field)}: ${l.from ? esc(l.from) + " → " : ""}${esc(l.to)} <i>(${esc(l.by)})</i></div>`).join("") || "No history yet."}</div>` : ""}</div>`;
}
function renderFeed() {
  const L = D.log.filter((l) => !(l.field === "Created" && /^(Setup|Meeting)/.test(l.by))).slice().reverse().slice(0, 40);
  $("#feed").innerHTML = L.length ? L.map((l) => `<div><time>${esc(l.ts)}</time><b>${esc(l.ref)}</b> ${esc(l.field)}: ${l.from ? esc(l.from) + " → " : ""}${esc(String(l.to).slice(0, 120))} <i style="color:var(--mute)">· ${esc(l.by)}</i></div>`).join("") : `<div class="empty">No updates yet. Tick a routine or change a task to start.</div>`;
}
async function addTask() {
  const task = $("#nT").value.trim(); if (!task) return; if (!me()) askName(); $("#nS").disabled = true;
  try { await post({ action: "add", task, priority: $("#nP").value, due: $("#nD").value, owner: PERSON || undefined }); $("#modal").classList.remove("on"); $("#nT").value = ""; toast("Added"); await refresh(); }
  catch (e) { toast("Not saved: " + e.message); } finally { $("#nS").disabled = false; }
}
async function refresh() {
  try { D = await load(BOARD); $("#err").innerHTML = ""; render(); }
  catch (e) { $("#err").innerHTML = `<div class="err">${esc(e.message)}</div>`; if (!D) $("#nm").textContent = "Dashboard"; }
}
page();
if (!K) $("#err").innerHTML = `<div class="err">This link is incomplete. Please use the personal link you were sent.</div>`; else refresh();
setInterval(() => { if (!document.hidden && !$("select:focus, input:focus")) refresh(); }, 60000);
