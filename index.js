# OSFUSA C-SPAN site — setup guide

## 1. Website
1. Push everything in this folder (except `discord-bot/`, which deploys separately) to your `osfcspan` GitHub repo.
2. Connect the repo to Netlify (you already have the project started).
3. In `src/lib/supabase.ts`, replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with the values from Supabase → Settings → API.
4. In Supabase → SQL Editor, run `supabase_schema.sql`.
5. Create your first admin login:
   - In a browser console (or Node), run:
     ```js
     const enc = new TextEncoder().encode('yourpassword')
     const buf = await crypto.subtle.digest('SHA-256', enc)
     const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
     console.log(hash)
     ```
   - Then in Supabase SQL Editor:
     ```sql
     insert into admin_users (email, password_hash, role)
     values ('admin', '<paste hash here>', 'Owner');
     ```
6. Deploy. Your site will be live with the Home / Newsletters / Breaking News / Foreign-Intl / Live Stream / About tabs, `/apply`, `/applications`, and `/admin`.

## 2. Live stream
In `/admin` → **Live Stream** tab, paste your YouTube embed URL (e.g.
`https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID`) and toggle Live/Offline.

## 3. Discord bot — two-way sync

### Discord → Website
1. `cd discord-bot && npm install`
2. Create a Discord application + bot at https://discord.com/developers/applications, invite it to your C-SPAN server with the `applications.commands` and `bot` scopes (Send Messages permission).
3. Set environment variables (Railway, Replit, a VPS, wherever you host it):
   - `DISCORD_TOKEN` — your bot token
   - `DISCORD_CLIENT_ID` — your application's client ID
   - `DISCORD_GUILD_ID` — your C-SPAN server ID
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → **service_role** key (NOT the anon key — keep this secret, it bypasses RLS)
4. `npm start`. Anyone with permission can now run `/post` in Discord and it appears on the website instantly.

### Website → Discord
1. In your C-SPAN Discord server: channel settings → Integrations → Webhooks → New Webhook → copy the URL.
2. In Netlify: Site settings → Environment variables → add `DISCORD_WEBHOOK_URL` with that value.
3. In Supabase: Database → Webhooks → Create a new webhook:
   - Table: `posts`
   - Events: `INSERT`
   - Type: HTTP Request → `POST`
   - URL: `https://osfcspan.netlify.app/.netlify/functions/discord-relay`
4. Now, any post created from the `/admin` panel automatically gets pushed to Discord as an embed. Posts that originated from Discord are skipped so it doesn't echo back and forth.

## File map
- `src/routes/index.tsx` — public site (all tabs)
- `src/routes/apply.tsx`, `applications.tsx` — application form + status lookup
- `src/routes/admin.tsx` — admin panel (posts, live stream, applications, settings)
- `supabase_schema.sql` — full database schema + RLS policies
- `discord-bot/` — the Discord bot (Discord → Website)
- `netlify/functions/discord-relay.js` — the relay (Website → Discord)
