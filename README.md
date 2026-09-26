# Family Kharcha — Family Expense Tracker

A simple, colorful expense tracker for the whole family. Log every
rupee spent — even ₹1 — keep a shared shopping list, set monthly
budgets, and see totals for the day, week, month and year, for
everyone or just one person. Everyone's entries sync live, it installs
like a real app, and it keeps working without signal.

More than one family can use the same deployment — each with their own
login — and it comes with a dark mode.

No build tools, no frameworks — just plain HTML, CSS and JavaScript,
backed by Supabase.

**Files:**
- `index.html`, `style.css`, `app.js` — the app itself
- `config.js` — where you paste your Supabase project's URL and key
- `supabase-schema.sql` — run once to set up your database
- `manifest.json`, `sw.js`, `icons/` — make the app installable and work offline

## 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com), sign up, and click **New project**.
2. Open **SQL Editor**, paste the full contents of `supabase-schema.sql`, and click **Run**.
3. Open **Edge Functions → Deploy a new function** and create `family-auth` using
   `supabase/functions/family-auth/index.ts`. The included `supabase/config.toml`
   sets this function to accept unauthenticated setup requests.
4. Go to **Settings → API** and copy your **Project URL** and your
   **publishable/anon public** key.

> **Important:** You do **not** need to turn on or off email confirmation for this
> new signup flow. Family creation uses the server-side Auth Admin API with an
> auto-confirmed internal identifier, so the browser never calls Supabase's
> public email-signup endpoint and no confirmation email is sent.

## 2. Connect the app to Supabase
Open `config.js` and paste your values in:
```js
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key'
};
```

## 3. Put it on GitHub
```bash
git init
git add .
git commit -m "Family expense tracker"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 4. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the GitHub repo you just pushed.
3. Leave every setting on its default — no framework, no build command
   needed, this is a plain static site — and click **Deploy**.
4. You'll get a live link in under a minute. Share it with the family.

## 5. Install it like a real app
Open the deployed link on each phone, then:
- **iPhone (Safari):** tap Share → **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu → **Install app** (or **Add to Home screen**).

It'll show up with its own icon, open full-screen with no browser bar,
and keep working (viewing + adding entries) even with no signal —
anything added offline syncs automatically once back online.

## Creating your family / logging in
The first time the app opens, it asks for a **Family Name** and
**Family Password** — tap **Create one** if this is a new family, or
log in if you're joining a family that already exists. Every device
that logs in with the same name and password sees the same shared
data. A second, unrelated family can use this exact same deployed link
and create their own account — their data is completely separate from
yours (see "How family logins work" below).

After logging in, each device sets its own short **PIN**, asked every
time the app is opened from then on, so nobody has to retype the full
family password daily. Forgot the PIN? Tap **Forgot PIN? Log in again**
to sign back in with the family name and password instead.

**Write your family password down somewhere safe.** Since family names
aren't real email addresses, there's no "forgot password" email to
fall back on — losing it means losing access to that family's data.

### How family logins work
Each family is a real Supabase Auth account, and the database enforces —
not just the app's interface — that a family can only ever read or write
its own data. The visible login remains **Family Name + Family Password**.
For Supabase's internal password identity, the Edge Function creates an
auto-confirmed internal identifier such as `sharma-house@familykharcha.app`;
it is not a real mailbox and the app never asks the family to use it.
New family creation happens server-side instead of through `auth.signUp()`,
so the old public email-signup rate limit is no longer used for creating
new families. Existing accounts from the older `.local` build can still
log in.

The daily PIN is a separate, lighter thing: it's stored only on that
one device, and it just saves you from retyping the family password
every time you open the app — more like a phone's lock screen than a
second layer of the real login. Real protection against someone
directly querying the database comes from the family login above.

## Everyday features
- **Add / Edit:** tap any expense to edit it; tap the ➕ tab to add a new one.
- **Undo:** deleting anything shows an "Undo" button for a few seconds before it's gone for good.
- **Filter by person:** the "Show" chips at the top of Home and History let you view one member, several, or everyone.
- **Budgets:** in ⚙️ Settings, set a monthly limit per category — a progress bar appears on Home once you do (this always reflects the whole family, regardless of the person filter).
- **Recurring expenses:** in ⚙️ Settings, add things like rent or subscriptions with a day of the month — they log themselves automatically from then on. Since this is a static site with no server, they log the next time *anyone* opens the app on or after that day each month, not at the exact stroke of midnight.
- **Category auto-learn:** whenever you correct a guessed category, the app remembers that word for next time.
- **CSV export:** in ⚙️ Settings, download all expenses as a spreadsheet-ready file.
- **Dark mode:** toggle it in ⚙️ Settings; it's remembered per device.

## Testing before you set up Supabase
The `family-kharcha-quick-test.html` file (in the folder above this
one) works immediately in any browser with zero setup — the person
filter and dark mode both work there too. It uses a single local PIN
with no family name (there's only ever one "family" in a local file),
and it won't install as an app or sync across devices, since it's a
single local file rather than something hosted online.

## Customizing categories
Open `app.js` and edit the `CATEGORIES` array near the top to add,
rename, recolor, or change the emoji/keywords for any category.
