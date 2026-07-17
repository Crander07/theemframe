# Studio Frame Photography — Website

A static, responsive photography portfolio site built with HTML, CSS (Bootstrap 5), and vanilla JavaScript.

## Shared header & footer
The navbar and footer now live in one place — `js/partials.js` — and are injected into every page at load time via `<div id="site-header"></div>` / `<div id="site-footer"></div>` placeholders. Edit the `HEADER_HTML` / `FOOTER_HTML` strings in that file to change the nav links or footer content site-wide instead of editing every page. (Plain JS injection is used instead of fetching an `header.html` partial because `fetch()` of local files is blocked by CORS when the site is opened directly from disk.)

## Pages
- `index.html` — Home
- `portfolio.html` — Filterable photo albums (Couples, Families & Groups, Events, Seniors, Portraits & Branding)
- `services.html` — Pricing packages
- `faq.html` — Frequently asked questions
- `contact.html` — Contact form
- `testimonials.html` — Client testimonials
- `admin.html` — Password-protected page to upload photos into the portfolio albums

## Running it locally
This is a plain static site — no build step. Just open `index.html` in a browser, or better, serve the folder so relative paths behave normally, e.g.:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## 1. Setting up real email sending (contact form)
This site has no backend, so the contact form uses **EmailJS** (a free service that lets a static site send email directly from JavaScript). To make it actually deliver mail to you:

1. Create a free account at https://www.emailjs.com
2. Add an **Email Service** (e.g. connect your Gmail) — note the **Service ID**.
3. Create an **Email Template** with variables: `from_name`, `from_email`, `phone`, `package_interest`, `message` — note the **Template ID**.
4. Find your **Public Key** under Account → General.
5. Open `js/script.js` and replace the three placeholders near the top:

```js
var EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
var EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
var EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
```

Until you do this, the form will show a clear message saying email isn't configured yet, instead of pretending to send.

**Alternative:** if you'd rather not use EmailJS, services like **Formspree** or **Web3Forms** work similarly — just point the form's submit handler at their endpoint instead.

## 2. Setting up your live photo database (Supabase)
This site now uses [Supabase](https://supabase.com) — a free hosted Postgres database + file storage + login — so uploaded photos are real, shared, and visible to every visitor on every device (not just your own browser).

### a) Create the project
1. Sign up free at https://supabase.com and create a new project (any name/region/password — the DB password isn't used by the site).
2. Wait for it to finish provisioning (~2 minutes).

### b) Create the database table
Open **SQL Editor** in the Supabase dashboard, paste this in, and click **Run**:

```sql
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  src text not null,
  alt text,
  meta text,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

-- Anyone (including anonymous visitors) can view photos — needed for the public site
create policy "Public can view photos"
  on public.photos for select
  using (true);

-- Only a logged-in admin can add or remove photos
create policy "Authenticated users can insert photos"
  on public.photos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete photos"
  on public.photos for delete
  to authenticated
  using (true);
```

### c) Create the storage bucket
1. Go to **Storage** → **New bucket**.
2. Name it exactly `portfolio-photos`.
3. Toggle it **Public**, then create it.
4. Open **SQL Editor** again and run:

```sql
create policy "Authenticated can upload portfolio photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-photos');

create policy "Authenticated can delete portfolio photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-photos');
```

### d) Create your admin login
1. Go to **Authentication** → **Users** → **Add user**.
2. Enter the email + password you want to log into `admin.html` with, and confirm the email automatically (there's a checkbox for this — check it, since there's no email server involved).
3. **Do not** enable public sign-ups — you're the only user who should ever exist here.

### e) Connect the site to your project
1. Go to **Project Settings** → **API**.
2. Copy the **Project URL** and the **Publishable key** (starts with sb_publishable_).
3. Open `js/supabase-config.js` and paste them in:

```js
var SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx";
```

That's it — `admin.html` now logs in for real, uploads go to Supabase Storage, and `portfolio.html`/`index.html` pull photos live from the database. The publishable key is meant to be public in client-side code; your Row Level Security policies above are what actually keep it safe (public read-only, admin-only write).

### f) Replacing the placeholder photos
`js/data.js` still has a `DEFAULT_ALBUMS` object of sample picsum.photos images so the site isn't empty on day one. Once you've uploaded your own real photos through `admin.html` for a category, you can delete that category's array from `DEFAULT_ALBUMS` (or leave it — real uploads always show up alongside/after the defaults).

## 3. Deploying to GitHub Pages
1. Create a new **public** repository on GitHub (e.g. `theemframe-site`).
2. Push this folder's contents to it:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/theemframe-site.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)` → **Save**.
6. GitHub will give you a URL like `https://YOUR_USERNAME.github.io/theemframe-site/` within a minute or two.
7. (Optional) Under **Settings → Pages → Custom domain**, add your own domain if you have one.

**Important:** commit `js/supabase-config.js` with your real values — the publishable key is safe to publish (see above), so there's no secret to hide here. Do not, however, ever put your Supabase **Secret key** (sb_secret_...) anywhere in this repo.

## 4. Setting the admin password
Admin login is now handled entirely by Supabase Auth (see step 2d above) — there's no password stored in the code anymore. To change your password later, use **Authentication → Users** in the Supabase dashboard, or add a "forgot password" flow if you want one.

