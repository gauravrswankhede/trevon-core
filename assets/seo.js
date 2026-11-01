// SEO, Web & GMB team board: extra panels on top of board.js (loaded only by /trevon-core/seo/).
// Live data: tasks + GMB checklist from the Trevon Tracker sheet (via board.js / core.js),
// website scans from /seo-dashboards/<site>/status.json (every 4 hours, GitHub Actions),
// GMB agency performance from /trevon-gmb-7f3c2a91/data.json (daily).
(function () {
  const SITES = [
    { id: "trevon", name: "Trevon Hotels & Resorts", url: "https://trevonhotels.com/", page: "" },
    { id: "becomeparents", name: "Become Parents", url: "https://becomeparents.com/", page: "/seo-dashboards/becomeparents/" },
    { id: "bangkoksurrogacy", name: "Bangkok Surrogacy", url: "https://bangkoksurrogacy.com/", page: "/seo-dashboards/bangkoksurrogacy/" },
  ];
  const GMB_DATA = "/trevon-gmb-7f3c2a91/data.json", GMB_PAGE = "/trevon-gmb-7f3c2a91/";
  const GMB_OWNERS = "Gaurav & Ankita";
  const NEXT = { "": "In progress", "In progress": "Done", Done: "", Blocked: "In progress", "N/A": "" };
  const ICON = { Done: "✓", "In progress": "…", Blocked: "!", "N/A": "–", "": "" };
  let EXT = { sites: {}, gmb: null, at: 0 }, GOPEN = new Set(), SKOPEN = "";

  const SKILLS = [
    ["Audit & monitoring", [
      ["seo-audit", "Full site audit with a health score (up to 500 pages)", "Before and after the new trevonhotels.com goes live", "Run a full SEO audit of trevonhotels.com"],
      ["seo-technical", "Crawlability, indexing, Core Web Vitals, robots, security", "Launch checklist for the new site shell", "Technical SEO check for trevonhotels.com"],
      ["seo-page", "Deep check of one URL", "Each property page as it is published", "Analyse the Goa property page"],
      ["seo-drift", "Baseline + diff of SEO elements: 'did anything break?'", "Every website release (the Developer's deploys)", "Capture an SEO baseline for trevonhotels.com"],
      ["seo-google", "Search Console, PageSpeed, CrUX, GA4, indexing (needs Google API access)", "Real clicks, impressions, CWV once GSC is verified", "Show Search Console clicks for trevonhotels.com"],
      ["seo-sitemap", "Validate or generate the XML sitemap", "Sitemap for the 8 property pages", "Generate a sitemap for trevonhotels.com"],
    ]],
    ["Local SEO & Google Business Profile", [
      ["seo-local", "GBP optimisation, NAP consistency, citations, multi-location", "The 8 property profiles and the Five Elements duplicates", "Local SEO audit for Trevon Ranchi"],
      ["seo-maps", "Geo-grid rank tracking, GBP audit, review velocity, competitors nearby", "'Hotel in Ranchi' map-pack ranks per property", "Geo-grid rank check for 'hotel in Haldwani'"],
      ["seo-schema", "Schema.org JSON-LD (Hotel, LocalBusiness, FAQ)", "Hotel schema on each property page", "Write Hotel schema for Trevon Goa"],
    ]],
    ["Content & copy", [
      ["seo-plan", "Strategy, site architecture, content calendar", "Overall Trevon SEO roadmap", "SEO plan for a 9-property hotel group"],
      ["seo-content-brief", "Briefs with section word counts and competitor scoring", "Briefs for property and city pages", "Content brief for 'hotel in Candolim Goa'"],
      ["seo-content", "E-E-A-T and content quality review", "Check pages before they go live", "Content quality check of the Haldwani page"],
      ["seo-cluster", "SERP-based topic clusters, hub-and-spoke", "City guides around each property", "Topic cluster for Jim Corbett stays"],
      ["seo-programmatic", "Pages at scale from data (property × city × intent)", "Property-page template with the 'Meet our team' section", "Plan programmatic pages for Trevon properties"],
      ["seo-sxo", "Reads the SERP to find page-type mismatches", "When a page ranks badly despite being optimised", "Why isn't the Ranchi page ranking?"],
      ["blog", "Full blog engine: write, rewrite, audit, schema, repurposing", "Destination blog posts for each city", "Write a blog post: best time to visit Chakrata"],
      ["humanizer / avoid-ai-writing", "Removes AI-sounding writing", "Every page and post before publishing", "Humanize this property description"],
    ]],
    ["Competitors, links & AI search", [
      ["outrank-competitor", "Full 'beat this competitor' blueprint (hospitality vertical)", "Pick one rival hotel per city", "Outrank <competitor> for Trevon Gurugram"],
      ["seo-competitor-pages", "'X vs Y' and alternatives pages", "Only if comparison pages make sense", "Comparison page plan"],
      ["seo-backlinks", "Referring domains, anchors, toxic links, link gap", "Link building for the new domain", "Backlink profile of trevonhotels.com"],
      ["seo-geo", "AI Overviews / ChatGPT / Perplexity visibility", "Being cited when people ask AI for hotels", "GEO check for trevonhotels.com"],
      ["seo-dataforseo", "Live SERP, keyword volume, backlinks (needs DataForSEO extension)", "Keyword volumes per city", "Keyword volume for hotels in Dhanbad"],
    ]],
    ["Images & media", [
      ["seo-images", "Alt text, sizes, WebP/AVIF, lazy loading", "Property photo galleries", "Image SEO check of the Goa page"],
      ["seo-image-gen", "OG / hero images (needs the image extension)", "Social preview images", "Make an OG image for the Ranchi page"],
    ]],
    ["Frameworks", [
      ["seo", "The umbrella skill: picks the right check for you", "When unsure where to start", "SEO check of trevonhotels.com"],
      ["seo-flow", "FLOW (Find → Leverage → Optimize → Win) prompts", "Weekly evidence-led planning", "FLOW prompts for the Find stage"],
      ["seo-hreflang", "International / language tags", "Only if Hindi pages are added", "Hreflang check"],
    ]],
  ];

  function css() {
    if (document.getElementById("seo-css")) return;
    const s = document.createElement("style"); s.id = "seo-css";
    s.textContent = `
.cards3{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;padding:14px 16px}
.wcard{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:#fff}
.wcard h3{margin:0;font-size:15px}.wcard .u{color:var(--mute);font-size:12px}
.wcard .big{font-size:26px;font-weight:750;margin:6px 0 2px}.wcard ul{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink2)}
.wcard li{margin:2px 0}.wcard .foot{margin-top:8px;font-size:12px}
.gm td.p{font-weight:650;white-space:nowrap}.gm .light{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
.light.green{background:var(--done)}.light.amber{background:var(--part)}.light.red{background:var(--miss)}.light.none{background:var(--none)}
.gx{border-collapse:collapse;width:100%}.gx th,.gx td{border-bottom:1px solid var(--line);padding:6px 6px;font-size:12.5px;text-align:center}
.gx th{background:#fcfcfd;color:var(--mute);font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:600;position:sticky;top:0}
.gx td.i{text-align:left;min-width:240px}.gx td.i b{font-weight:650}.gx td.i .d{color:var(--mute);font-size:11.5px}
.gx th.i{text-align:left}.gx td.i{position:sticky;left:0;background:#fff;z-index:1}
.gc{width:30px;height:30px;border-radius:8px;border:1.5px solid var(--line);background:#fff;font-weight:800;font-size:14px;color:#fff;padding:0;position:relative}
.gc.Done{background:var(--done);border-color:var(--done)}.gc.Inprogress{background:var(--ong);border-color:var(--ong)}
.gc.Blocked{background:var(--miss);border-color:var(--miss)}.gc.NA{background:#f2f4f7;color:#98a2b3}
.gc.n::after{content:"";position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:var(--gold)}
.gx tr.tot td{font-weight:700;background:#fcfcfd}.gx .pc{font-size:11.5px}
.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mute);padding:10px 16px;border-top:1px solid var(--line)}
.legend span{display:inline-flex;align-items:center;gap:5px}.legend .gc{width:18px;height:18px;font-size:10px;border-radius:5px;cursor:default}
.gsheet .row{display:flex;gap:6px;flex-wrap:wrap}.gsheet .row button{flex:1;min-width:90px}
.sk{border-top:1px solid var(--line)}.sk h3{margin:0;padding:10px 16px;font-size:13px;background:#fcfcfd;color:var(--ink2);cursor:pointer;display:flex;justify-content:space-between}
.skl{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0}
.skl div{padding:9px 16px;border-bottom:1px solid var(--line);font-size:12.5px}.skl code{background:#f2f4f7;border-radius:6px;padding:1px 6px;font-size:12px;color:var(--navy);font-weight:650}
.skl .w{color:var(--ink2)}.skl .t{color:var(--teal)}.skl .s{color:var(--mute);font-style:italic}
.mlist div{padding:8px 16px;border-bottom:1px solid var(--line);font-size:13px}`;
    document.head.appendChild(s);
  }

  async function getJSON(u) { const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Date.now()); if (!r.ok) throw new Error(r.status); return r.json(); }
  async function getText(u) { const r = await fetch(u + "?t=" + Date.now()); if (!r.ok) throw new Error(r.status); return r.text(); }
  async function loadExternal() {
    if (Date.now() - EXT.at < 9 * 60000) return; EXT.at = Date.now();
    await Promise.all(SITES.map(async (s) => {
      const o = {};
      try { o.status = await getJSON("/seo-dashboards/" + s.id + "/status.json"); } catch (e) {}
      if (s.page) {
        try { o.site = await getJSON("/seo-dashboards/" + s.id + "/site.json"); } catch (e) {}
        try { const csv = (await getText("/seo-dashboards/" + s.id + "/tasks.csv")).trim().split(/\n/).slice(1);
          o.open = csv.filter((l) => !/,Done,/i.test(l)).length; o.crit = csv.filter((l) => /,Critical,/.test(l) && !/,Done,/i.test(l)).length; } catch (e) {}
      }
      EXT.sites[s.id] = o;
    }));
    try { EXT.gmb = await getJSON(GMB_DATA); } catch (e) { EXT.gmb = null; }
    if (D) window.BOARD_EXTRA(D);
  }

  const ago = (iso) => { const d = new Date(iso); if (isNaN(d)) return ""; const h = Math.round((Date.now() - d) / 36e5); return h < 1 ? "just now" : h < 48 ? h + " h ago" : Math.round(h / 24) + " days ago"; };

  function siteCard(s) {
    const o = EXT.sites[s.id] || {}, st = o.status;
    let score = "";
    if (o.site && o.site.scores) { const h = Math.round(o.site.scores.reduce((a, x) => a + x.score * x.weight, 0) / o.site.scores.reduce((a, x) => a + x.weight, 0));
      score = `<div class="big" style="color:${h >= 75 ? "var(--done)" : h >= 50 ? "var(--part)" : "var(--miss)"}">${h}<span style="font-size:14px;color:var(--mute)">/100 health</span></div>`; }
    let body;
    if (!st) body = `<div class="big" style="font-size:16px;color:var(--mute)">First scan pending</div><div class="u">The website monitor checks this site every 4 hours.</div>`;
    else if (!st.ok) body = `<div class="big" style="font-size:16px;color:var(--miss)">Site unreachable</div><div class="u">${esc(st.message || "")} · scanned ${esc(ago(st.lastRunUtc))}</div>`;
    else {
      const issues = (st.checks || []).filter((c) => c.pages > 0 && !c.positive).sort((a, b) => (a.generic ? 1 : 0) - (b.generic ? 1 : 0) || b.pages - a.pages).slice(0, 5);
      const good = (st.checks || []).filter((c) => c.positive);
      body = `${score || `<div class="big">${st.pagesLive}<span style="font-size:14px;color:var(--mute)"> pages live</span></div>`}
        <div class="u">${score ? st.pagesLive + " pages live · " : ""}scanned ${esc(ago(st.lastRunUtc))}${st.changesThisRun ? " · " + st.changesThisRun + " changes in last scan" : ""}</div>
        ${o.open !== undefined ? `<div style="margin-top:6px"><span class="tag">${o.open} open SEO tasks</span> ${o.crit ? `<span class="tag red">${o.crit} critical</span>` : ""}</div>` : ""}
        ${good.map((c) => `<div style="margin-top:6px"><span class="tag ${c.pages ? "green" : "amber"}">${esc(c.label)}: ${c.pages}</span></div>`).join("")}
        <ul>${issues.map((c) => `<li>${esc(c.label)}: <b>${c.pages}</b> page${c.pages === 1 ? "" : "s"}</li>`).join("") || "<li>No issues found by the monitor.</li>"}</ul>`;
    }
    return `<div class="wcard"><h3>${esc(s.name)}</h3><div class="u"><a href="${s.url}" target="_blank" rel="noopener">${esc(s.url.replace(/^https:\/\//, ""))}</a></div>${body}
      <div class="foot">${s.page ? `<a href="${s.page}" target="_blank">Full SEO dashboard →</a>` : `<span class="u">Change log: /seo-dashboards/${s.id}/changes.csv</span>`}</div></div>`;
  }

  function gmbPerf() {
    const G = EXT.gmb, props = (D.gmb && D.gmb.properties) || [];
    const by = {}; (G && G.properties || []).forEach((p) => (by[p.key] = p));
    const sig = (p, k) => (p.signals || []).find((s) => s.key === k) || {};
    const rows = props.map((pr) => {
      const p = by[pr.id];
      if (!p) return `<tr><td class="p"><span class="light none"></span>${esc(pr.name.replace("Trevon ", ""))}</td><td colspan="6" style="color:var(--mute)">No agency report for this property yet</td></tr>`;
      const v = sig(p, "views"), r = sig(p, "rating"), rk = sig(p, "rank"), it = sig(p, "interactions"), po = sig(p, "posts");
      const ch = v.change != null ? ` <span style="color:${v.change >= 0 ? "var(--done)" : "var(--miss)"}">${v.change >= 0 ? "▲" : "▼"}${Math.abs(Math.round(v.change))}%</span>` : "";
      return `<tr><td class="p"><span class="light ${esc(p.overall || "none")}"></span>${esc(pr.name.replace("Trevon ", ""))}</td><td><b>${p.score ?? "—"}</b></td>
        <td>${v.value != null ? Math.round(v.value).toLocaleString() : "—"}${ch}</td><td>${it.value != null ? Math.round(it.value) : "—"}</td>
        <td><span class="light ${esc(r.status || "none")}"></span>${r.value ?? "—"}</td><td><span class="light ${esc(rk.status || "none")}"></span>${rk.value != null ? Math.round(rk.value) : "—"}</td><td>${po.value ?? "—"}</td></tr>`;
    }).join("");
    return `<div class="scroll"><table class="mx gm"><tr><th>Property</th><th>Score</th><th>Profile views (week)</th><th>Interactions</th><th>Rating</th><th>Avg keyword rank</th><th>Posts</th></tr>${rows}</table></div>
      <div class="legend">${G ? `Agency report of ${esc(G.generated_at || "")}` : "GMB agency data not loaded"} · <a href="${GMB_PAGE}" target="_blank">Open the GMB performance dashboard →</a></div>`;
  }

  function gmbMatrix() {
    const G = D.gmb; if (!G) return "";
    const cell = (p, i) => G.cells.find((c) => c.property === p && c.item === i) || { status: "", note: "" };
    const active = (p) => G.items.filter((i) => cell(p.id, i.code).status !== "N/A");
    const pct = (p) => { const a = active(p); return a.length ? Math.round((100 * a.filter((i) => cell(p.id, i.code).status === "Done").length) / a.length) : 0; };
    const allA = G.properties.reduce((n, p) => n + active(p).length, 0), allD = G.properties.reduce((n, p) => n + active(p).filter((i) => cell(p.id, i.code).status === "Done").length, 0);
    const total = allA ? Math.round((100 * allD) / allA) : 0;
    const setup = G.items[0] ? G.properties.filter((p) => cell(p.id, G.items[0].code).status === "Done").length : 0;
    const blocked = G.cells.filter((c) => c.status === "Blocked").length;
    const head = G.properties.map((p) => `<th title="${esc(p.name)}">${esc(p.name.replace("Trevon ", "").replace(/\s*\(.*\)/, ""))}</th>`).join("");
    const rows = G.items.map((i) => `<tr><td class="i"><b>${esc(i.code)} · ${esc(i.item)}</b>${i.detail ? `<div class="d">${esc(i.detail)}</div>` : ""}</td>${G.properties.map((p) => {
      const c = cell(p.id, i.code); return `<td><button class="gc ${cls(c.status).replace("/", "")} ${c.note ? "n" : ""}" data-p="${esc(p.id)}" data-i="${esc(i.code)}" title="${esc(p.name)} · ${esc(c.status || "Not started")}${c.note ? " · " + esc(c.note) : ""}${c.by ? " (" + esc(c.by) + ")" : ""}">${ICON[c.status] || ""}</button></td>`; }).join("")}</tr>`).join("");
    const tot = `<tr class="tot"><td class="i">Profile complete</td>${G.properties.map((p) => `<td class="pc" style="color:${pct(p) >= 80 ? "var(--done)" : pct(p) >= 40 ? "var(--part)" : "var(--miss)"}">${pct(p)}%</td>`).join("")}</tr>`;
    return `<section class="panel" id="gmbx"><div class="ph"><h2>GMB set-up checklist <span class="note">· ${G.items.length} tasks × ${G.properties.length} properties · owners: ${GMB_OWNERS}</span></h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag ${total >= 80 ? "green" : total >= 40 ? "amber" : "red"}">${total}% complete</span><span class="tag blue">${setup}/${G.properties.length} accounts set up</span>${blocked ? `<span class="tag red">${blocked} blocked</span>` : ""}</div></div>
      <div class="scroll"><table class="gx"><tr><th class="i">Task</th>${head}</tr>${tot}${rows}</table></div>
      <div class="legend"><span><button class="gc"></button>Not started</span><span><button class="gc Inprogress">…</button>In progress</span><span><button class="gc Done">✓</button>Done</span><span><button class="gc Blocked">!</button>Blocked</span><span><button class="gc NA">–</button>Not applicable</span><span>· tap a box to update · gold dot = has a note</span></div></section>`;
  }

  function skillsPanel() {
    return `<section class="panel"><div class="ph"><h2>SEO skills in Claude <span class="note">· what to ask Claude for, and when · type the skill name or just describe the job</span></h2><span class="tag">${SKILLS.reduce((n, g) => n + g[1].length, 0)} skills</span></div>
      ${SKILLS.map(([g, list]) => `<div class="sk"><h3 data-g="${esc(g)}"><span>${esc(g)} <span class="note">(${list.length})</span></span><span>${SKOPEN === g ? "▾" : "▸"}</span></h3>
      ${SKOPEN === g ? `<div class="skl">${list.map(([n, w, t, s]) => `<div><code>/${esc(n.split(" ")[0])}</code> <span class="w">${esc(w)}</span><div class="t">Trevon: ${esc(t)}</div><div class="s">Say: "${esc(s)}"</div></div>`).join("")}</div>` : ""}</div>`).join("")}</section>`;
  }

  function meetingsPanel() {
    const M = (D.meetings || []).slice().reverse().slice(0, 8);
    return `<section class="panel"><div class="ph"><h2>Meetings read <span class="note">· new tasks appear here about 10 minutes after Gemini emails the minutes</span></h2></div>
      <div class="mlist">${M.length ? M.map((m) => `<div><b>${esc(fmtD(m.date))}</b> · ${esc(m.subject.replace(/^Notes:\s*/, ""))} <span class="tag blue">+${esc(m.added)} tasks</span> ${+m.updates ? `<span class="tag green">${esc(m.updates)} updated</span>` : ""}</div>`).join("") : `<div class="empty">No evening meeting read yet.</div>`}</div></section>`;
  }

  function openGmb(prop, item) {
    const G = D.gmb, p = G.properties.find((x) => x.id === prop), it = G.items.find((x) => x.code === item);
    const c = G.cells.find((x) => x.property === prop && x.item === item) || { status: "", note: "" };
    let m = document.getElementById("gmodal");
    if (!m) { m = document.createElement("div"); m.className = "modal"; m.id = "gmodal"; document.body.appendChild(m); }
    m.innerHTML = `<div class="sheet gsheet"><b>${esc(p.name)}</b><div style="color:var(--ink2)">${esc(it.code)} · ${esc(it.item)}</div>${it.detail ? `<div style="color:var(--mute);font-size:12.5px">${esc(it.detail)}</div>` : ""}
      <div class="row">${["", "In progress", "Done", "Blocked", "N/A"].map((s) => `<button class="btn ${s === c.status ? "" : "g"}" data-s="${s}">${s ? ICON[s] + " " + s : "Not started"}</button>`).join("")}</div>
      <textarea id="gN" rows="2" placeholder="Note (optional): what was done, what is blocking, a link">${esc(c.note || "")}</textarea>
      ${c.by ? `<div style="color:var(--mute);font-size:12px">Last update: ${esc(c.by)} · ${esc(c.ts)}</div>` : ""}
      <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn g" id="gC">Close</button><button class="btn" id="gS">Save note</button></div></div>`;
    m.classList.add("on");
    const save = async (status, ev) => {
      if (!me()) askName();
      const note = $("#gN", m).value, nx = { property: prop, item, status, note, by: me(), ts: new Date().toISOString().slice(0, 16).replace("T", " ") };
      G.cells = G.cells.filter((x) => !(x.property === prop && x.item === item)).concat([nx]);
      m.classList.remove("on"); window.BOARD_EXTRA(D); if (status === "Done" && ev) burst(ev.clientX, ev.clientY);
      try { await post({ action: "gmb", property: prop, item, status, note }); toast(p.name.replace("Trevon ", "") + " · " + item + " → " + (status || "Not started")); refresh(); }
      catch (e) { toast("Not saved: " + e.message); refresh(); }
    };
    $$(".row button", m).forEach((b) => (b.onclick = (ev) => save(b.dataset.s, ev)));
    $("#gS", m).onclick = () => save(c.status || "");
    $("#gC", m).onclick = () => m.classList.remove("on");
  }

  window.BOARD_EXTRA = function (D) {
    css(); loadExternal();
    $("#eb").textContent = "Trevon Hotels & Resorts · SEO, Web & GMB team" + (D.hq ? " · director view" : "");
    $("#extra-top").innerHTML = `<section class="panel"><div class="ph"><h2>Websites right now <span class="note">· live scan every 4 hours</span></h2></div><div class="cards3">${SITES.map(siteCard).join("")}</div></section>
      <section class="panel"><div class="ph"><h2>Google Business Profiles right now <span class="note">· from the agency's weekly reports</span></h2></div>${gmbPerf()}</section>`;
    $("#extra").innerHTML = gmbMatrix() + meetingsPanel() + skillsPanel();
    $$("#gmbx .gx .gc").forEach((b) => (b.onclick = () => openGmb(b.dataset.p, b.dataset.i)));
    $$(".sk h3").forEach((h) => (h.onclick = () => { SKOPEN = SKOPEN === h.dataset.g ? "" : h.dataset.g; window.BOARD_EXTRA(D); }));
  };
})();
