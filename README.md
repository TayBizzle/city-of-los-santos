# City Of Los Santos — Forum Website

This is the redesigned City Of Los Santos community site, styled after the Windy City forum reference screenshot and using the supplied City Of Los Santos V2 logo.

## Files
- `index.html` — website layout
- `styles.css` — forum styling and responsive layout
- `app.js` — Supabase sign-in, forum topics, and applications
- `supabase.sql` — database tables and security policies
- `assets/city-of-los-santos-logo.png` — supplied community logo
- `_redirects` — Netlify single-page fallback

## Connect Supabase
1. In Supabase, open **Project Settings → API Keys**.
2. Copy the **Project URL** and the **Publishable key**.
3. Open `app.js` and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with those values.
4. In Supabase SQL Editor, run the contents of `supabase.sql` (if you already ran it successfully, do not run it again unless you intentionally want to reset/update the schema).
5. Commit and push the updated files to GitHub; Netlify will redeploy automatically.

Never put a Supabase secret key or service-role key in browser code.

## Deploy
Upload all files and the `assets` folder to the root of your GitHub repository. In Netlify, publish the repository root (`.`) with no build command.

The site includes member registration/login, forum categories and posting, five application types, and community rules. Staff moderation tools are not included yet.
