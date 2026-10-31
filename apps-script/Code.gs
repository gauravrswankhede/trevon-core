/**
 * Trevon Hotels — Task & Routine Tracker (Google Apps Script backend, v2)
 * Files in this project: Code.gs (this) + Seed.gs (people, routines, starting tasks).
 * Run once: setup() → installTriggers() → Deploy as Web app (Execute as: Me · Access: Anyone).
 * Optional script property GEMINI_API_KEY for AI reading of meeting notes.
 */

const STATUSES = ['Pending', 'Ongoing', 'Stuck', 'Completed'];
const CHECK = ['Done', 'Partly', 'Not done'];
const HEAD = {
  Boards: ['ID', 'Name', 'Type', 'People', 'Emails', 'Aliases', 'Oversees (routine codes)', 'Token', 'Dashboard link'],
  Tasks: ['ID', 'Board', 'Task', 'Owner', 'Priority', 'Status', 'Due', 'Created', 'Source', 'Meeting date', 'Carry-overs', 'Last update', 'Updated by', 'Notes', 'Completed at'],
  Routines: ['Code', 'Applies to', 'Title', 'Detail', 'Frequency', 'Number to record', 'Overseen by', 'Active'],
  Checkins: ['Period', 'Code', 'Board', 'Status', 'Value', 'Note', 'By', 'Timestamp'],
  Log: ['Timestamp', 'Ref', 'Board', 'Field', 'From', 'To', 'By'],
  Meetings: ['Message ID', 'Meeting date', 'Subject', 'New tasks', 'Updates', 'Processed at', 'Method', 'Status'],
  Settings: ['Key', 'Value', 'What it does'],
};
const DEFAULT_SETTINGS = [
  ['PAGES_BASE', 'https://gauravrswankhede.github.io/', 'Your GitHub Pages address (ends with /)'],
  ['HQ_TOKEN', '', 'Directors\' secret key (created by setup)'],
  ['HQ_LINK', '', 'Directors\' corporate dashboard link'],
  ['OWNER_EMAIL', '', 'Who gets the after-meeting summary and agenda (blank = script owner)'],
  ['DIRECTOR_EMAILS', '', 'Comma-separated emails for the Monday compliance report'],
  ['GMAIL_QUERY', 'from:gemini-notes@google.com subject:"Daily Managers\' Meeting"', 'Which emails count as meeting notes'],
  ['GEMINI_MODEL', 'gemini-3.5-flash-lite', 'Gemini model used to read the notes'],
  ['EMAIL_BOARDS_AFTER_MEETING', 'NO', 'YES = email each board\'s people their open items after each meeting'],
  ['DAILY_DIGEST', 'NO', 'YES = 9 am email of open items + this week\'s routines to each board'],
  ['PRE_MEETING_AGENDA', 'NO', 'YES = 12:00 balance-agenda email to you '],
  ['MONDAY_REPORT', 'NO', 'YES = Monday 10:00 routine-compliance email to directors'],
  ['OWNER_MEETING_EMAIL', 'NO', 'YES = email you a short summary after each meeting is read'],
];
const TZ = 'Asia/Kolkata';

/* ───────────── setup ───────────── */

function setup() {
  const ss = SpreadsheetApp.getActive(); ss.setSpreadsheetTimeZone(TZ);
  Object.keys(HEAD).forEach(n => sheet_(n));
  const set = sheet_('Settings');
  if (set.getLastRow() === 1) set.getRange(2, 1, DEFAULT_SETTINGS.length, 3).setValues(DEFAULT_SETTINGS);
  if (!getSetting_('HQ_TOKEN')) setSetting_('HQ_TOKEN', token_() + token_());
  const b = sheet_('Boards');
  if (b.getLastRow() === 1) b.getRange(2, 1, SEED_BOARDS.length, 9).setValues(SEED_BOARDS.map(r => r.concat([r[0] === 'corporate' ? getSetting_('HQ_TOKEN') : token_(), ''])));
  const r = sheet_('Routines');
  if (r.getLastRow() === 1) r.getRange(2, 1, SEED_ROUTINES.length, 8).setValues(SEED_ROUTINES.map(x => x.concat(['YES'])));
  seedTasks_();
  const ts = sheet_('Tasks');
  ts.getRange('F2:F').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());
  sheet_('Checkins').getRange('D2:D').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CHECK, true).build());
  refreshLinks_();
  try { const d = ss.getSheetByName('Sheet1'); if (d && d.getLastRow() === 0) ss.deleteSheet(d); } catch (e) {}
  const msg = 'Setup done. Boards tab → last column = each dashboard\'s private link. Settings tab → HQ_LINK = corporate dashboard.';
  Logger.log(msg);
  try { SpreadsheetApp.getActive().toast(msg, 'Trevon Tracker', 15); } catch (e) {}
}

/** Adds the starting tasks in one go (fast). Safe to re-run: replaces only untouched setup tasks. */
function seedTasks_() {
  const ts = sheet_('Tasks'), lg = sheet_('Log');
  const last = ts.getLastRow();
  if (last > 1) {
    const src = ts.getRange(2, 9, last - 1, 1).getValues().map(r => String(r[0]));
    const st = ts.getRange(2, 6, last - 1, 1).getValues().map(r => String(r[0]));
    const untouched = src.every(x => x === 'Strategy') && st.every(x => x === 'Pending' || x === '');
    if (!untouched) return;                       // real work exists: never wipe it
    ts.deleteRows(2, last - 1);
    const ll = lg.getLastRow();
    if (ll > 1) {
      const by = lg.getRange(2, 7, ll - 1, 1).getValues().map(r => String(r[0]));
      if (by.every(x => x === 'Setup')) lg.deleteRows(2, ll - 1);
    }
  }
  const B = boards_(), props = B.filter(x => x.type === 'property'), now = now_(), rows = [], logs = [];
  SEED_TASKS.forEach(t => (t[0] === 'ALL_PROPERTIES' ? props.map(p => p.id) : [t[0]]).forEach(bid => {
    const p = B.find(x => x.id === bid), id = 'T-' + String(rows.length + 1).padStart(4, '0');
    const owner = t[2] === 'GM' ? (p ? p.people[0] : '') : t[2];
    rows.push([id, bid, t[1], owner, t[3], 'Pending', '', now, 'Strategy', '', 0, now, 'Setup', '', '']);
    logs.push([now, id, bid, 'Created', '', t[1], 'Setup']);
  }));
  if (rows.length) {
    ts.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    lg.getRange(lg.getLastRow() + 1, 1, logs.length, logs[0].length).setValues(logs);
  }
}

/** Run this if links are ever missing from the Boards tab. */
function refreshLinks() { refreshLinks_(); }

function sheet_(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEAD[name]);
    sh.getRange(1, 1, 1, HEAD[name].length).setFontWeight('bold').setBackground('#0f1b2d').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function refreshLinks_() {
  const base = String(getSetting_('PAGES_BASE')).replace(/\/?$/, '/');
  const sh = sheet_('Boards'); const v = sh.getDataRange().getValues();
  for (let r = 1; r < v.length; r++) if (v[r][0]) sh.getRange(r + 1, 9).setValue(base + 'trevon-' + v[r][0] + '/?k=' + v[r][7]);
  setSetting_('HQ_LINK', base + 'trevon-corporate/?k=' + getSetting_('HQ_TOKEN'));
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('processMeetingNotes').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('sendDailyDigest').timeBased().atHour(9).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('sendPreMeetingAgenda').timeBased().atHour(12).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('sendMondayReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(10).inTimezone(TZ).create();
  refreshLinks_();
  try { SpreadsheetApp.getActive().toast('Automation on: meeting notes are checked every 10 minutes.', 'Trevon Tracker', 15); } catch (e) {}
}

/* ───────────── helpers ───────────── */

function token_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function now_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'); }
function getSetting_(k) { const sh = SpreadsheetApp.getActive().getSheetByName('Settings'); if (!sh) return ''; const r = sh.getDataRange().getValues().find(x => x[0] === k); return r ? String(r[1]).trim() : ''; }
function setSetting_(k, v) { const sh = sheet_('Settings'); const d = sh.getDataRange().getValues(); for (let r = 0; r < d.length; r++) if (d[r][0] === k) { sh.getRange(r + 1, 2).setValue(v); return; } sh.appendRow([k, v, '']); }
const split_ = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);

function boards_() {
  return sheet_('Boards').getDataRange().getValues().slice(1).filter(r => r[0]).map(r => ({
    id: String(r[0]).trim(), name: r[1], type: String(r[2]).trim(), people: split_(r[3]), emails: split_(r[4]),
    aliases: split_(r[5]), monitors: split_(r[6]), token: String(r[7]).trim() }));
}
function routines_() {
  return sheet_('Routines').getDataRange().getValues().slice(1).filter(r => r[0] && String(r[7]).toUpperCase() !== 'NO').map(r => ({
    code: String(r[0]).trim(), scope: String(r[1]).trim(), title: r[2], detail: r[3], frequency: r[4] === 'Monthly' ? 'Monthly' : 'Weekly', metric: r[5], overseer: r[6] }));
}
function appliesTo_(rt, b) { return rt.scope === b.id || (rt.scope === 'ALL_PROPERTIES' && b.type === 'property'); }

function tasks_() {
  return sheet_('Tasks').getDataRange().getDisplayValues().slice(1).map((r, i) => ({ row: i + 2, id: r[0], board: r[1], task: r[2], owner: r[3],
    priority: r[4] || 'Medium', status: r[5] || 'Pending', due: r[6], created: r[7], source: r[8], meetingDate: r[9], carry: Number(r[10] || 0),
    lastUpdate: r[11], updatedBy: r[12], notes: r[13], completedAt: r[14] })).filter(t => t.id);
}
function checkins_() {
  return sheet_('Checkins').getDataRange().getDisplayValues().slice(1).map((r, i) => ({ row: i + 2, period: r[0], code: r[1], board: r[2],
    status: r[3], value: r[4], note: r[5], by: r[6], ts: r[7] })).filter(c => c.period);
}

/** ISO week key in IST, e.g. 2026-W45, plus Monday–Sunday dates. */
function weekOf_(date) {
  const ist = new Date(Utilities.formatDate(date, TZ, "yyyy-MM-dd'T'00:00:00'Z'"));
  const day = (ist.getUTCDay() + 6) % 7; const mon = new Date(ist); mon.setUTCDate(ist.getUTCDate() - day);
  const thu = new Date(mon); thu.setUTCDate(mon.getUTCDate() + 3);
  const y = thu.getUTCFullYear(), jan4 = new Date(Date.UTC(y, 0, 4));
  const wk = 1 + Math.round(((thu - jan4) / 864e5 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
  const f = d => Utilities.formatDate(d, 'UTC', 'd MMM');
  return { key: y + '-W' + String(wk).padStart(2, '0'), label: f(mon) + ' – ' + f(sun), start: Utilities.formatDate(mon, 'UTC', 'yyyy-MM-dd') };
}
function periods_() {
  const weeks = [], months = [];
  for (let i = 0; i < 8; i++) weeks.push(weekOf_(new Date(Date.now() - i * 7 * 864e5)));
  for (let i = 0; i < 4; i++) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ key: Utilities.formatDate(d, TZ, 'yyyy-MM'), label: Utilities.formatDate(d, TZ, 'MMMM yyyy') }); }
  return { weeks, months };
}

function nextId_() { const n = tasks_().map(t => Number(String(t.id).replace(/\D/g, '')) || 0); return 'T-' + String((n.length ? Math.max.apply(null, n) : 0) + 1).padStart(4, '0'); }
function log_(ref, board, field, from, to, by) { sheet_('Log').appendRow([now_(), ref, board, field, from, to, by]); }

function addTask_(t, by) {
  const id = nextId_();
  sheet_('Tasks').appendRow([id, t.board, t.task, t.owner || '', t.priority || 'Medium', 'Pending', t.due || '', now_(), t.source || 'Manual', t.meetingDate || '', 0, now_(), by, t.notes || '', '']);
  log_(id, t.board, 'Created', '', t.task, by); return id;
}
function setStatus_(t, status, by, note) {
  const sh = sheet_('Tasks');
  if (STATUSES.indexOf(status) < 0) throw new Error('Unknown status');
  if (t.status !== status) { sh.getRange(t.row, 6).setValue(status); sh.getRange(t.row, 15).setValue(status === 'Completed' ? now_() : ''); log_(t.id, t.board, 'Status', t.status, status, by); }
  if (note !== undefined && note !== null && String(note) !== t.notes) { sh.getRange(t.row, 14).setValue(String(note).slice(0, 1000)); log_(t.id, t.board, 'Note', t.notes, String(note).slice(0, 300), by); }
  sh.getRange(t.row, 12, 1, 2).setValues([[now_(), by]]);
}

function auth_(b, k) {
  if (k && k === getSetting_('HQ_TOKEN')) return { hq: true, board: b || 'corporate' };
  const me = boards_().find(x => x.id === b && x.token === k);
  if (!me) throw new Error('Invalid or expired link. Ask the directors for your dashboard link.');
  return { hq: false, board: b, me };
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const strip_ = o => { delete o.row; return o; };

/* ───────────── web API ───────────── */

function doGet(e) {
  try {
    const a = auth_(String(e.parameter.b || '').toLowerCase(), e.parameter.k || '');
    const all = boards_(), me = all.find(x => x.id === a.board) || all.find(x => x.type === 'corporate');
    const per = periods_(), keys = new Set(per.weeks.map(w => w.key).concat(per.months.map(m => m.key)));
    const R = routines_(), C = checkins_().filter(c => keys.has(c.period));
    const corporateView = a.hq && me.type === 'corporate';
    let tasks = tasks_(), routines, checkins, monitor = [];
    if (corporateView) { routines = R; checkins = C; }
    else {
      routines = R.filter(r => appliesTo_(r, me));
      checkins = C.filter(c => c.board === me.id);
      monitor = R.filter(r => me.monitors.indexOf(r.code) >= 0);
      const mc = new Set(monitor.map(r => r.code));
      checkins = checkins.concat(C.filter(c => mc.has(c.code) && c.board !== me.id));
      tasks = tasks.filter(t => t.board === me.id);
    }
    const tids = new Set(tasks.map(t => t.id));
    const log = sheet_('Log').getDataRange().getDisplayValues().slice(1).filter(r => corporateView || r[2] === me.id || tids.has(r[1])).slice(-500)
      .map(r => ({ ts: r[0], ref: r[1], board: r[2], field: r[3], from: r[4], to: r[5], by: r[6] }));
    const meetings = sheet_('Meetings').getDataRange().getDisplayValues().slice(1).slice(-30).map(r => ({ date: r[1], subject: r[2], added: r[3], updates: r[4], method: r[6] }));
    return json_({ ok: true, hq: a.hq, corporate: corporateView, me: { id: me.id, name: me.name, type: me.type, people: me.people, monitors: me.monitors },
      boards: all.map(x => ({ id: x.id, name: x.name, type: x.type, people: x.people })), periods: per,
      routines, monitor, checkins: checkins.map(strip_), tasks: tasks.map(strip_), log, meetings, serverTime: now_() });
  } catch (err) { return json_({ ok: false, error: String(err.message || err) }); }
}

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const q = JSON.parse(e.postData.contents || '{}');
    const a = auth_(String(q.b || '').toLowerCase(), q.k);
    const who = String(q.by || '').slice(0, 40) || (a.hq ? 'Director' : a.me.people[0] || a.board);
    if (q.action === 'update') {
      const t = tasks_().find(x => x.id === q.id); if (!t) throw new Error('Task not found');
      if (!a.hq && t.board !== a.board) throw new Error('Not your board');
      setStatus_(t, q.status || t.status, who, q.note); return json_({ ok: true });
    }
    if (q.action === 'add') {
      const board = a.hq ? (q.board || a.board) : a.board;
      if (!String(q.task || '').trim()) throw new Error('Task text is required');
      return json_({ ok: true, id: addTask_({ board, task: String(q.task).slice(0, 500), owner: q.owner || who, priority: q.priority, due: q.due, source: 'Added by ' + who }, who) });
    }
    if (q.action === 'checkin') {
      const board = a.hq ? (q.board || a.board) : a.board;
      const rt = routines_().find(r => r.code === q.code); if (!rt) throw new Error('Unknown routine');
      const b = boards_().find(x => x.id === board); if (!appliesTo_(rt, b)) throw new Error('This routine is not on this board');
      const per = periods_(); const allowed = rt.frequency === 'Monthly' ? per.months.slice(0, 2) : per.weeks.slice(0, 2);
      if (!a.hq && !allowed.some(p => p.key === q.period)) throw new Error('Only this and the previous ' + (rt.frequency === 'Monthly' ? 'month' : 'week') + ' can be updated');
      if (CHECK.indexOf(q.status) < 0 && q.status !== '') throw new Error('Unknown status');
      const sh = sheet_('Checkins'); const ex = checkins_().find(c => c.period === q.period && c.code === q.code && c.board === board);
      const row = [q.period, q.code, board, q.status, q.value == null ? '' : String(q.value).slice(0, 40), String(q.note || '').slice(0, 500), who, now_()];
      if (ex) sh.getRange(ex.row, 1, 1, 8).setValues([row]); else sh.appendRow(row);
      log_(q.code, board, 'Routine ' + q.period, ex ? ex.status : '', q.status + (q.value ? ' (' + q.value + ')' : ''), who);
      return json_({ ok: true });
    }
    throw new Error('Unknown action');
  } catch (err) { return json_({ ok: false, error: String(err.message || err) }); }
  finally { lock.releaseLock(); }
}

/* ───────────── meeting notes → tasks (every 10 min) ───────────── */

function processMeetingNotes() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    const meet = sheet_('Meetings'); const done = new Set(meet.getDataRange().getValues().slice(1).map(r => String(r[0])));
    const label = GmailApp.getUserLabelByName('Trevon-processed') || GmailApp.createLabel('Trevon-processed');
    GmailApp.search(getSetting_('GMAIL_QUERY') + ' newer_than:7d -label:Trevon-processed', 0, 10).reverse().forEach(th => {
      th.getMessages().forEach(m => {
        if (done.has(m.getId())) return;
        const text = notesText_(m), date = Utilities.formatDate(m.getDate(), TZ, 'yyyy-MM-dd');
        let res, method = 'Gemini';
        try { res = askGemini_(text, date); } catch (err) { res = fallbackParse_(text, boards_()); method = 'Rule-based (' + String(err.message).slice(0, 50) + ')'; }
        const s = applyMeeting_(res, date);
        meet.appendRow([m.getId(), date, m.getSubject(), s.added, s.updated, now_(), method, 'OK']);
        afterMeetingEmails_(s, date);
      });
      th.addLabel(label);
    });
  } finally { lock.releaseLock(); }
}

function notesText_(m) {
  const body = m.getPlainBody() || '', mm = ((m.getBody() || '') + ' ' + body).match(/https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+/);
  if (mm) { try { return stripTranscript_(DocumentApp.openByUrl(mm[0]).getBody().getText()); } catch (e) {} }
  return stripTranscript_(body);
}
function stripTranscript_(t) {
  const i = String(t).search(/(^|\n)\W*Daily Managers.{0,60}?\s\\?[-–—]\s*Transcript|(^|\n)\W*Transcript\W*\n/i);
  return (i > 200 ? String(t).slice(0, i) : String(t)).slice(0, 60000);
}

function askGemini_(notes, date) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); if (!key) throw new Error('No GEMINI_API_KEY');
  const B = boards_(), open = tasks_().filter(t => t.status !== 'Completed').map(t => ({ id: t.id, board: t.board, task: t.task, status: t.status }));
  const prompt = [
    'You turn the minutes of a hotel group\'s daily managers\' meeting into tasks on the right person\'s board.',
    'Boards (use these ids exactly): ' + JSON.stringify(B.map(b => ({ id: b.id, name: b.name, type: b.type, people: b.people, also_called: b.aliases }))),
    'Notes on people: "Punit Kaushik" is Rakesh Chaturvedi (director) → corporate. "Hyde Goa" is the Goa property login → goa. "Sandeep" alone is the sales manager (sales); "Sandeep Rawat" is the Chakrata GM. Gemini often misspells places (Haldoni = Haldwani, Gorgang = Gurugram).',
    'Open tasks: ' + JSON.stringify(open), 'Meeting date: ' + date,
    'Rules: 1) new_tasks = concrete action items agreed in the meeting that are not already open; short imperative wording (max 20 words).',
    '2) Items for "The group" / all general managers → one task for EVERY board with type "property".',
    '3) Named owner → the board listing that person. Directors / unassigned → corporate.',
    '4) updates = open tasks the minutes clearly report as done, started or stuck: id, status (Completed / Ongoing / Stuck), short reason.',
    '5) priority High only if urgent or guest-impacting, else Medium (Low for nice-to-haves). due = YYYY-MM-DD only if stated. Never invent tasks.',
    'Return JSON {"new_tasks":[{"board":"","task":"","owner":"","priority":"","due":""}],"updates":[{"id":"","status":"","reason":""}]}',
    '--- MINUTES ---', notes].join('\n');
  const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + (getSetting_('GEMINI_MODEL') || 'gemini-3.5-flash-lite') + ':generateContent', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': key },
    payload: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }) });
  if (res.getResponseCode() !== 200) throw new Error('Gemini HTTP ' + res.getResponseCode());
  const out = JSON.parse(res.getContentText()); const txt = (((out.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || '').join('');
  return normaliseResult_(JSON.parse(txt.replace(/^```json\s*|```$/g, '')), B);
}

/** No-AI reader for Gemini's "Next steps" checklist: "- [ ] [Owner] Title: description". */
function fallbackParse_(notes, B) {
  const lines = String(notes).split(/\r?\n/).map(s => s.trim()); let on = false; const items = [], seen = new Set();
  for (const l of lines) {
    const p = l.replace(/[#*\\]/g, '').trim();
    if (/^(suggested next steps|next steps|action items|action points)\s*:?$/i.test(p)) { on = true; continue; }
    if (on && /^(summary|details|decisions|want to see more|you should review|tip:)/i.test(p)) { on = false; continue; }
    if (!on || !p) continue;
    const m = p.replace(/^([-•*]\s*)?(\[\s?[xX]?\s?\]|☐|☑|\d+[.)])?\s*/, '');
    if (m.length > 8 && !seen.has(m.toLowerCase())) { seen.add(m.toLowerCase()); items.push(m); }
  }
  const props = B.filter(b => b.type === 'property'), out = [];
  items.forEach(it => {
    let owner = '', text = it; const om = it.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (om) { owner = om[1].trim(); text = om[2].trim(); }
    const group = /^(the group|all|everyone|all (general )?managers|all gms)$/i.test(owner);
    const targets = group ? props : (owner && !/^unassigned$/i.test(owner) ? matchBoards_(owner, B) : []);
    (targets.length ? targets : [B.find(b => b.type === 'corporate') || { id: 'corporate', people: [] }]).forEach(b => out.push({
      board: b.id, task: text.slice(0, 300), owner: group ? (b.people[0] || 'GM') : (/^unassigned$/i.test(owner) ? '' : owner),
      priority: /urgent|immediately|asap|today/i.test(text) ? 'High' : 'Medium', due: '' }));
  });
  return { new_tasks: out, updates: [] };
}

/** Best board(s) for a person's name: exact person > alias > partial name. */
function matchBoards_(name, B) {
  const n = name.toLowerCase().trim(), score = [];
  B.forEach(b => {
    let s = 0;
    b.people.forEach(p => { const pl = p.toLowerCase(); if (pl === n) s = Math.max(s, 3); else if (pl.split(' ')[0] === n || n.split(' ')[0] === pl) s = Math.max(s, 2); else if (pl.indexOf(n) >= 0 || n.indexOf(pl) >= 0) s = Math.max(s, 1); });
    b.aliases.forEach(a => { const al = a.toLowerCase(); if (al === n) s = Math.max(s, 3); else if (new RegExp('\\b' + al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n)) s = Math.max(s, 2); });
    if (s) score.push({ b, s });
  });
  if (!score.length) return [];
  const best = Math.max.apply(null, score.map(x => x.s));
  const top = score.filter(x => x.s === best).map(x => x.b);
  return top.slice(0, 1);
}

function normaliseResult_(r, B) {
  const ids = new Set(B.map(b => b.id)), props = B.filter(b => b.type === 'property');
  const nt = [];
  (r.new_tasks || []).filter(t => t && t.task).forEach(t => {
    const bid = String(t.board || t.property || '').toLowerCase();
    const list = /^(all|all_properties|group)$/.test(bid) ? props.map(p => p.id) : [ids.has(bid) ? bid : 'corporate'];
    list.forEach(id => nt.push({ board: id, task: String(t.task).slice(0, 300), owner: String(t.owner || '').slice(0, 60),
      priority: ['High', 'Medium', 'Low'].indexOf(t.priority) >= 0 ? t.priority : 'Medium', due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '' }));
  });
  const up = (r.updates || []).filter(u => u && u.id && ['Completed', 'Ongoing', 'Stuck'].indexOf(u.status) >= 0).map(u => ({ id: String(u.id), status: u.status, reason: String(u.reason || '').slice(0, 300) }));
  return { new_tasks: nt, updates: up };
}

function applyMeeting_(res, date) {
  const by = 'Meeting ' + date, sh = sheet_('Tasks');
  tasks_().forEach(t => { if (t.status !== 'Completed' && t.created.slice(0, 10) < date) sh.getRange(t.row, 11).setValue(t.carry + 1); });
  let updated = 0;
  res.updates.forEach(u => { const t = tasks_().find(x => x.id === u.id); if (t && t.status !== 'Completed') { setStatus_(t, u.status, by, t.notes ? t.notes + ' | ' + u.reason : u.reason); updated++; } });
  const added = res.new_tasks.map(t => addTask_(Object.assign({}, t, { source: 'Meeting', meetingDate: date }), by));
  return { added: added.length, updated };
}

/* ───────────── emails ───────────── */

function boardLink_(b) { return String(getSetting_('PAGES_BASE')).replace(/\/?$/, '/') + 'trevon-' + b.id + '/?k=' + b.token; }
function tableHtml_(list) {
  if (!list.length) return '<p>No open items. 🎉</p>';
  return '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px"><tr style="background:#0f1b2d;color:#fff"><th align="left">ID</th><th align="left">Task</th><th>Status</th><th>Carried</th><th>Due</th></tr>' +
    list.map(t => '<tr style="border-bottom:1px solid #eee"><td>' + t.id + '</td><td>' + t.task + '</td><td>' + t.status + '</td><td align="center">' + (t.carry ? t.carry + '×' : '') + '</td><td>' + (t.due || '') + '</td></tr>').join('') + '</table>';
}
function routineGaps_(b, period) {
  const C = checkins_().filter(c => c.board === b.id && c.period === period && c.status === 'Done').map(c => c.code);
  return routines_().filter(r => r.frequency === 'Weekly' && appliesTo_(r, b) && C.indexOf(r.code) < 0);
}
function owner_() { return getSetting_('OWNER_EMAIL') || Session.getEffectiveUser().getEmail(); }

function afterMeetingEmails_(s, date) {
  const all = tasks_();
  const lines = boards_().map(b => {
    const open = all.filter(t => t.board === b.id && t.status !== 'Completed');
    if (getSetting_('EMAIL_BOARDS_AFTER_MEETING') === 'YES' && b.emails.length && open.length && b.type !== 'corporate')
      MailApp.sendEmail({ to: b.emails.join(','), subject: b.name + ': your action items after the ' + date + ' meeting',
        htmlBody: '<p>Your open items after today\'s meeting:</p>' + tableHtml_(open) + '<p><a href="' + boardLink_(b) + '">Open your dashboard and update each item</a></p>' });
    return '<li><b>' + b.name + '</b>: ' + open.length + ' open</li>';
  }).join('');
  if (getSetting_('OWNER_MEETING_EMAIL') === 'YES') MailApp.sendEmail({ to: owner_(), subject: 'Meeting ' + date + ' read: ' + s.added + ' new tasks, ' + s.updated + ' updates',
    htmlBody: '<ul>' + lines + '</ul><p><a href="' + getSetting_('HQ_LINK') + '">Corporate dashboard</a></p>' });
}

function sendDailyDigest() {
  if (getSetting_('DAILY_DIGEST') !== 'YES' || new Date().getDay() === 0) return;
  const all = tasks_(), wk = weekOf_(new Date()).key;
  boards_().forEach(b => {
    if (!b.emails.length || b.type === 'corporate') return;
    const open = all.filter(t => t.board === b.id && t.status !== 'Completed'), gaps = routineGaps_(b, wk);
    if (!open.length && !gaps.length) return;
    MailApp.sendEmail({ to: b.emails.join(','), subject: b.name + ': ' + open.length + ' open tasks · ' + gaps.length + ' routines not ticked this week',
      htmlBody: (gaps.length ? '<p><b>This week\'s routines still to tick:</b></p><ul>' + gaps.map(r => '<li>' + r.title + '</li>').join('') + '</ul>' : '') +
        tableHtml_(open) + '<p><a href="' + boardLink_(b) + '">Open your dashboard</a></p>' });
  });
}

function sendPreMeetingAgenda() {
  if (getSetting_('PRE_MEETING_AGENDA') !== 'YES' || new Date().getDay() === 0) return;
  const all = tasks_().filter(t => t.status !== 'Completed');
  const html = boards_().map(b => { const l = all.filter(t => t.board === b.id).sort((x, y) => y.carry - x.carry); return l.length ? '<h3 style="font-family:Arial">' + b.name + ' (' + l.length + ')</h3>' + tableHtml_(l) : ''; }).join('');
  MailApp.sendEmail({ to: owner_(), subject: 'Balance agenda: ' + all.length + ' open items', htmlBody: html + '<p><a href="' + getSetting_('HQ_LINK') + '">Corporate dashboard</a></p>' });
}

function sendMondayReport() {
  if (getSetting_('MONDAY_REPORT') !== 'YES') return;
  const last = weekOf_(new Date(Date.now() - 7 * 864e5));
  const rows = boards_().filter(b => b.type !== 'corporate').map(b => {
    const due = routines_().filter(r => r.frequency === 'Weekly' && appliesTo_(r, b)), gaps = routineGaps_(b, last.key);
    const pct = due.length ? Math.round(100 * (due.length - gaps.length) / due.length) : 100;
    return '<tr><td>' + b.name + '</td><td align="center"><b>' + pct + '%</b></td><td>' + gaps.map(g => g.title).join('<br>') + '</td></tr>';
  }).join('');
  const to = getSetting_('DIRECTOR_EMAILS') || owner_();
  MailApp.sendEmail({ to, subject: 'Weekly routine compliance, ' + last.label,
    htmlBody: '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px"><tr style="background:#0f1b2d;color:#fff"><th align="left">Board</th><th>Done</th><th align="left">Missed</th></tr>' + rows + '</table><p><a href="' + getSetting_('HQ_LINK') + '">Corporate dashboard</a></p>' });
}

/* ───────────── manual tools ───────────── */

function reprocessLatestMeeting() {
  const th = GmailApp.search(getSetting_('GMAIL_QUERY'), 0, 1)[0];
  if (!th) { SpreadsheetApp.getUi().alert('No meeting email found for: ' + getSetting_('GMAIL_QUERY')); return; }
  const lbl = GmailApp.getUserLabelByName('Trevon-processed'); if (lbl) th.removeLabel(lbl);
  const ids = th.getMessages().map(m => m.getId()), meet = sheet_('Meetings'), v = meet.getDataRange().getValues();
  for (let r = v.length - 1; r >= 1; r--) if (ids.indexOf(String(v[r][0])) >= 0) meet.deleteRow(r + 1);
  processMeetingNotes();
}
function resetBoardLink() {
  const ui = SpreadsheetApp.getUi(), id = ui.prompt('Board id to reset (e.g. ranchi):').getResponseText().trim(), sh = sheet_('Boards'), v = sh.getDataRange().getValues();
  for (let r = 1; r < v.length; r++) if (v[r][0] === id) { const t = id === 'corporate' ? token_() + token_() : token_(); sh.getRange(r + 1, 8).setValue(t); if (id === 'corporate') setSetting_('HQ_TOKEN', t); refreshLinks_(); ui.alert('New link is in the Boards tab.'); return; }
  ui.alert('No board ' + id);
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Trevon tasks')
    .addItem('Check for meeting notes now', 'processMeetingNotes')
    .addItem('Re-read the latest meeting notes', 'reprocessLatestMeeting')
    .addItem('Send balance agenda now', 'sendPreMeetingAgenda')
    .addItem('Send Monday compliance report now', 'sendMondayReport')
    .addItem('Reset a dashboard link', 'resetBoardLink')
    .addSeparator().addItem('Refresh dashboard links', 'refreshLinks_').addToUi();
}
