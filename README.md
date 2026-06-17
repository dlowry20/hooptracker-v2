# HoopTracker

Basketball shooting statistics tracker with per-player accounts, a 10-zone shot chart, and session history.

---

## Stack

| Layer | Tech | Free Host |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend | Node.js + Express | Render |
| Database | PostgreSQL | Supabase |

---

## Local Development

### 1. Database (Supabase)

1. Create a free account at https://supabase.com
2. Create a new project
3. Go to **SQL Editor** and run the contents of `server/db/schema.sql`
4. Go to **Project Settings → Database** and copy the **Connection string (URI)**

### 2. Server

```bash
cd server
npm install
cp .env .env
```

Edit `.env`:
```
DATABASE_URL=<your Supabase connection string>
JWT_SECRET=<any long random string>
CLIENT_URL=http://localhost:5173
PORT=4000
```

```bash
npm run dev
```

Server runs at http://localhost:4000

### 3. Client

```bash
cd client
npm install
cp .env .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:4000
```

```bash
npm run dev
```

Client runs at http://localhost:5173

---

## Deployment

### Deploy Database
Already live on Supabase — nothing extra to do.

### Deploy Server → Render

1. Push your code to GitHub
2. Create a free account at https://render.com
3. New → Web Service → connect your repo
4. Set **Root Directory** to `server`
5. Build command: `npm install`
6. Start command: `node index.js`
7. Add environment variables:
   - `DATABASE_URL` — your Supabase URI
   - `JWT_SECRET` — your secret key
   - `CLIENT_URL` — your Vercel URL (set after deploying frontend)
   - `NODE_ENV` — `production`

### Deploy Frontend → Vercel

1. Create a free account at https://vercel.com
2. Import your GitHub repo
3. Set **Root Directory** to `client`
4. Add environment variable:
   - `VITE_API_URL` — your Render server URL (e.g. `https://hooptracker-api.onrender.com`)
5. Deploy

Then go back to Render and update `CLIENT_URL` to your Vercel URL.

---

## Zone Map

| # | Zone |
|---|---|
| 1 | Left Corner 3 |
| 2 | Left Wing 3 |
| 3 | Center 3 |
| 4 | Right Wing 3 |
| 5 | Right Corner 3 |
| 6 | Left Short Corner |
| 7 | Left Elbow |
| 8 | Right Elbow |
| 9 | Right Short Corner |
| 10 | Free Throw |

---

## Features

- **Register / Login** — JWT auth, 7-day sessions
- **Team Dashboard** — view all players' overall FG% (read-only)
- **Player Stats** — per-player zone breakdown table + shot chart
- **My Stats** — own stats with edit/delete access
- **Log Session** — pick date, enter makes/attempts per zone; zones not used are skipped
- **Edit Session** — update any past session
- **Shot Chart** — SVG half-court showing green (≥50%) / red (<50%) by zone
