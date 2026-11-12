# City Of Los Santos — Community Website

Black-and-red FiveM roleplay community website.

## Files
- `index.html` — forum layout, account modal, applications, staff dashboard
- `styles.css` — responsive black-and-red styling
- `app.js` — Supabase authentication, forum posts, application submissions, staff review
- `supabase.sql` — database schema and row-level security policies
- `city-of-los-santos-logo.png` — community logo (repository root)
- `los-santos-background.jpg` — page background (repository root)
- `_redirects` — Netlify fallback

## Required setup — Supabase
The website files are updated, but account/forum/application features cannot work until your own Supabase project is connected.

1. Open your Supabase project → **Project Settings → API**.
2. Copy the **Project URL** and the **Publishable key** (or legacy anon public key).
3. In `app.js`, replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with those two values.
4. Open **SQL Editor** in Supabase and run the complete `supabase.sql` file.
5. Register your own account on the deployed site.
6. In Supabase → **Authentication → Users**, copy your user UUID.
7. In SQL Editor, run this after replacing the UUID:
   `update public.profiles set role='admin' where id='YOUR-USER-UUID';`
8. Sign out and back in. The Staff dashboard will then appear for your admin account.

Never use a Supabase secret key or service_role key in browser JavaScript. The SQL file can be rerun safely and does not reset user content.

## Deploy with Netlify
The repository is designed for a static Netlify deploy: publish directory is the repository root (`.`), with no build command. If Netlify is already connected to this GitHub repository, each commit should trigger a deploy automatically. Check the Netlify Deploys page for the actual deploy result.

## Current features
- Member registration, email/password sign-in, and sign-out
- Forum categories and member-created threads
- Civilian, gang/organization, police, EMS, and staff applications
- Staff-only application review and status updates
- Staff-only forum moderation permissions in the database
- Responsive layout and root-level logo/background asset paths

## Important
The visual site and source files do not create a live backend by themselves. Supabase credentials and the SQL setup above are still required. Staff moderation is protected by database roles; promote the first admin manually as described above.
