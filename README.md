# VIDHI SALES - website + Node.js backend + admin

## Run it (Windows / XAMPP or any MySQL)
1. Install Node.js 18+ (nodejs.org) and start MySQL (XAMPP > MySQL > Start).
2. In this folder run: `npm install`
3. Copy `.env.example` to `.env` and edit it (DB password, JWT_SECRET, ADMIN_USER / ADMIN_PASSWORD).
4. Run: `npm start`
5. Website: http://localhost:3000  |  Admin: http://localhost:3000/admin

The database and all tables are created automatically on first start.
The first admin comes from ADMIN_USER / ADMIN_PASSWORD in `.env`.
Extra admin or password reset: `npm run create-admin -- myname MyStrongPass123`

## What it does
- POST /api/quote    saves one quotation with many items (quotation_requests + quotation_items)
- POST /api/contact  saves contact messages
- /admin             login, stats, search/filter, status updates, delete, CSV export, change password
- The server re-checks name, phone, email (real domain endings), items, duplicates and quantities
  with the same validators as the website (js/validate.js, js/data.js).

## Deploy
Needs a host that runs Node + MySQL (Render, Railway, a VPS, cPanel Node app). Set the variables from
`.env.example` as environment variables, set BEHIND_PROXY=true behind HTTPS, run `npm start`.
Vercel static hosting cannot run this backend: if the site stays there, host this server elsewhere and set
API_BASE in js/config.js to its full URL (for example https://api.yourdomain.com/api/).
