# Trevon task & routine dashboards: setup

**How it fits together**
- **Google Sheet "Trevon Tracker"** (in gauravaustralia97@gmail.com) is the database: boards, tasks, weekly routines, check-ins, the log of every change.
- **Apps Script** (inside that sheet) saves dashboard clicks, reads the Gemini meeting notes from Gmail every 10 minutes, and sends the emails.
- **13 GitHub repositories**, all at `https://gauravrswankhede.github.io/<repo>/`:
  - `trevon-core`: shared design + `config.js` (the one place the Apps Script URL goes)
  - `trevon-ranchi`, `trevon-haldwani`, `trevon-delhi`, `trevon-gurugram`, `trevon-marchula`, `trevon-goa`, `trevon-dhanbad`, `trevon-chakrata`, `trevon-gwalior`: one per property / GM
  - `trevon-sales`: Anupam, Sandeep, Kostub (OTA + corporate sales)
  - `trevon-marketing`: Pawan, Ashutosh (Gurugram)
  - `trevon-corporate`: directors (Rakesh, Rohit, Gaurav) and Ramavtar (finance)

## Part A: Google Sheet + script (about 10 minutes)
1. Go to **sheets.new** → rename it **Trevon Tracker**.
2. **Extensions → Apps Script**. Rename the project "Trevon Tracker".
3. Replace the contents of `Code.gs` with `apps-script/Code.gs`.
4. Click **+ → Script**, name it `Seed`, and paste in `apps-script/Seed.gs`. (Check the names and emails first; you can also edit them later in the sheet.)
5. 💾 Save → choose **setup** → **Run** → allow access (*Advanced → Go to Trevon Tracker → Allow*; this warning is normal for your own scripts).
6. Run **installTriggers**.
7. **Deploy → New deployment → ⚙ Web app** → Execute as **Me**, Who has access **Anyone** → **Deploy** → copy the **Web app URL**.
8. Optional (smarter reading of notes): free key from aistudio.google.com → Apps Script ⚙ **Project Settings → Script properties** → `GEMINI_API_KEY`.

## Part B: GitHub
1. Create **13 public repositories** with exactly these names (github.com/new, tick *Add a README*):
   `trevon-core`, `trevon-corporate`, `trevon-sales`, `trevon-marketing`, `trevon-ranchi`, `trevon-haldwani`, `trevon-delhi`, `trevon-gurugram`, `trevon-marchula`, `trevon-goa`, `trevon-dhanbad`, `trevon-chakrata`, `trevon-gwalior`
2. For each one, either tell Claude "repos are ready" (Claude uploads the files and turns on Pages), **or** do it yourself:
   - **Add file → Upload files** → drag in everything from that repo's folder → **Commit**.
   - **Settings → Pages → Deploy from a branch → main / (root) → Save**.
3. In `trevon-core`, open `config.js` → ✏️ → paste the Web app URL → **Commit**.

## Part C: go live
- Sheet → **Boards** tab → last column = each dashboard's private link. Send each GM / team only their own.
- **Settings → HQ_LINK** = the directors' corporate dashboard. Directors can open any board from there.
- Load the 31 Oct meeting: Sheet menu **Trevon tasks → Re-read the latest meeting notes**.

## How the weekly routines work
- Every Monday a new week starts; each routine shows **✓ Done / ◐ Partly / ✗ Not done** plus an optional number.
- An unticked week becomes **Missed** automatically. History dots show the last 8 weeks; **streak** = weeks at 80%+.
- The current and previous week can be ticked (late entries allowed for one week).
- People who oversee a routine group-wide (Shravan: content; Santosh: checkout, QR, treats; Saurabh: reviews; Anupam/Sandeep: channel, leads, visits, targets, long-stay; Gaurav: GMB) see a live tracker of all 9 properties on their own dashboard.
- Add or change routines in the **Routines** tab (Applies to = `ALL_PROPERTIES` or a board id; Active = NO to pause).

## Notifications
None. Everything happens on the dashboards: no emails and no WhatsApp messages are sent.
Managers' emails are stored in the Boards tab in case you ever want to switch emails on (Settings: EMAIL_BOARDS_AFTER_MEETING, DAILY_DIGEST, PRE_MEETING_AGENDA, MONDAY_REPORT, OWNER_MEETING_EMAIL; all set to NO).

## Adding a property or team later
Add a row on the **Boards** tab (id, name, type, people, aliases), run **Refresh dashboard links**, create the repo `trevon-<id>`, and copy any property repo's `index.html` into it, changing the board id in the one `TREVON_BOARD` line.

## After changing the script
**Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (the URL stays the same).

## SEO, Web & GMB team board (added Nov 2026, script v3)
- **Page:** `https://gauravrswankhede.github.io/trevon-core/seo/?k=<token>` (link in the Boards tab, row `seo`). People: Gaurav Wankhede, Ankita Dwivedi, Shubhangi Kumud, Developer. Chips at the top of *Action items* filter by person; "Team" items show for everyone. `?p=Ankita%20Dwivedi` opens straight on one person.
- **Meeting feed:** Settings → `MEETING_FEEDS` = `from:gemini-notes@google.com subject:"Daily Evening Meeting" => seo`. Those minutes add tasks **only** to the SEO board; the managers' meeting (`GMAIL_QUERY`) never touches it. Checked every 10 minutes, like the managers' meeting.
- **GMB set-up checklist:** tabs **GMB items** (the 15 tasks; edit wording, add rows, Active = NO to hide) and **GMB** (one row per property × task: Done / In progress / Blocked / N/A). Properties = Settings → `GMB_PROPERTIES` (add `gwalior` when it opens). Shown on the SEO board and the corporate board (`GMB_BOARDS`).
- **trevonhotels.com right now:** read from `seo-dashboards/trevon/status.json`, rescanned every 4 hours by the SEO monitor in the `seo-dashboards` repo. (Become Parents / Bangkok Surrogacy are deliberately not shown: this team works on Trevon only.)
- **Adding tasks:** "＋ Add action item" (top of Action items) or the floating button; team boards get an "Assign to" choice (one person or Everyone).
- **GMB performance:** read from the GMB dashboard's `trevon-gmb-7f3c2a91/data.json` (refreshed daily from the agency workbooks).
- **Next meeting:** next calendar event whose title contains the board's `MEETING_TITLES` entry.
- **Upgrading from v2:** paste the new `Code.gs` → run **upgradeToV3** once (allow Calendar access) → Deploy → Manage deployments → ✏️ → New version → Deploy.
- **Rule-based reader fix (v3):** Gemini's plain-text emails wrap long items over several lines; the reader now joins them and stops at the email footer, so one action item = one task.
