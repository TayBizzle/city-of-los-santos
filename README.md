# City Of Los Santos website starter

A black-and-red FiveM community website with:
- Homepage, forum categories, rules, and application pages
- Email/password registration and sign-in
- Working forum topic creation
- Civilian, gang, police, EMS, and staff application submissions
- Supabase database with Row Level Security (RLS)

## Before you start

You need free accounts at:
1. https://github.com/
2. https://www.netlify.com/
3. https://supabase.com/

Free-plan limits can change. Supabase Free projects may pause after a week of inactivity, and Netlify Free has a monthly usage-credit limit. Check the providers' current pricing pages before launch.

## Step 1 — Create the database

1. Sign in to Supabase and create a new project.
2. Choose a project name such as `city-of-los-santos`.
3. Save your database password somewhere private.
4. Open **SQL Editor** in the Supabase dashboard.
5. Open `supabase.sql` from this folder, copy all of it, paste it into SQL Editor, and click **Run**.

## Step 2 — Connect the website to Supabase

1. In Supabase, open **Project Settings → API** (or **Data API**, depending on dashboard layout).
2. Copy the Project URL.
3. Copy the **publishable/anon** client key. Never use the `service_role` or secret key in browser code.
4. Open `app.js`.
5. Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with your own values.
6. Save the file.

The publishable/anon key is designed for browser use when Row Level Security is enabled. Keep all database tables protected by the policies in `supabase.sql`.

## Step 3 — Test it on your computer

1. Open `index.html` in a browser.
2. Register with an email address and a password of at least 8 characters.
3. If email confirmation is enabled, confirm your email before signing in.
4. Create a test forum topic.
5. Submit a test application.
6. Check the `forum_posts` and `applications` tables in Supabase Table Editor.

## Step 4 — Publish for free with Netlify

1. Create a GitHub repository named `city-of-los-santos`.
2. Upload all files in this folder to the repository (keep the filenames and folder structure).
3. Sign in to Netlify and choose **Add new project → Import an existing project**.
4. Connect GitHub and select `city-of-los-santos`.
5. For this plain HTML project, leave the build command blank and set the publish directory to `.` (the repository root).
6. Deploy. Netlify will give you a public `*.netlify.app` address.
7. Open the address and test registration, forum posting, and applications again.

## Step 5 — Customize before launch

- Replace the sample rules with your actual server rules.
- Replace the sample city banner image in `styles.css` with artwork you have permission to use.
- Add your Discord invite link and server connection information.
- Create a staff review process for applications.
- Add admin/moderator permissions and moderation tools before opening public registration.

## Important security notes

- Never publish your Supabase database password or `service_role` key.
- Do not collect real-world sensitive information in roleplay applications.
- Enable email confirmation and configure your allowed redirect URLs in Supabase Auth.
- The starter lets signed-in members create topics in the four listed categories. It does not yet provide a staff dashboard, topic moderation UI, private messages, or Discord OAuth.
- The first admin role must be assigned manually in Supabase SQL Editor using the commented instruction in `supabase.sql`. Do not build a public role selector.

## Free-plan notes

Supabase Free currently includes a small database and authentication allowance, but free projects can pause after inactivity. Netlify Free has monthly usage credits and sites can pause if limits are reached. A custom domain is optional and usually costs money.
