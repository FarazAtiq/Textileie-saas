# 🧵 TextileIE SaaS v2 — Vercel + Supabase

Full-stack Industrial Engineering SaaS for textile factories.
Built with React + Vite (frontend) and Supabase (auth + PostgreSQL database), deployed on Vercel.

---

## 🗂 Project structure

```
textileie-saas/
├── index.html
├── vercel.json                    # Vercel deployment config
├── vite.config.js
├── package.json
├── .env.example                   # Copy to .env.local and fill in
│
├── supabase/
│   └── schema.sql                 # ← Run this in Supabase SQL Editor
│
└── src/
    ├── main.jsx
    ├── App.jsx                    # All routes
    ├── styles/
    │   └── global.css
    ├── lib/
    │   ├── supabase.js            # Supabase client
    │   └── db.js                  # All DB query functions
    ├── hooks/
    │   ├── useAuth.jsx            # Auth context (Supabase Auth)
    │   └── useToast.js
    ├── utils/
    │   ├── calculations.js        # All 7 IE formulas
    │   └── pdfExport.js           # jsPDF report export
    ├── components/
    │   ├── Layout.jsx             # Sidebar navigation
    │   └── ResultCard.jsx         # Reusable result UI
    └── pages/
        ├── AuthPage.jsx           # Login + Register
        ├── Dashboard.jsx          # KPIs + shortcuts
        ├── CalcPages.jsx          # Efficiency, Capacity, Fabric, Thread, Costing, Yarn
        ├── SMVPage.jsx            # SMV/SAM operation builder
        ├── ReportsPage.jsx        # Saved reports + filter + PDF
        ├── SettingsPage.jsx       # Profile + password
        └── NotFoundPage.jsx
```

---

## 🚀 Deployment steps

### 1. Supabase

1. Go to https://supabase.com → New project
2. Region: Southeast Asia (Singapore) — closest to Pakistan
3. Open **SQL Editor** → New query → paste `supabase/schema.sql` → Run
4. Go to **Authentication → Settings** → disable email confirmations (for dev)
5. Go to **Settings → API** → copy:
   - Project URL
   - anon public key

### 2. GitHub

1. Create repo at https://github.com → New repository → `textileie-saas`
2. Upload all project files

### 3. Vercel

1. Go to https://vercel.com → Add New Project → Import from GitHub
2. Framework: **Vite** (auto-detected)
3. Add Environment Variables:
   ```
   VITE_SUPABASE_URL       = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJ...your-anon-key...
   ```
4. Click **Deploy**

### 4. Local development

```bash
# Copy env file
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# Install and run
npm install
npm run dev
# → http://localhost:5173
```

---

## 🧮 Calculators

| Page | Formula | Key output |
|---|---|---|
| Efficiency | (Earned min ÷ Available min) × 100 | Efficiency %, lost minutes |
| Capacity | (Machines × Shifts × Min × Eff%) ÷ SMV | Daily / weekly / monthly pcs |
| SMV / SAM | Basic time × (1 + Allowance%) | Total SMV, ops needed |
| Fabric (Yds) | (Length cm ÷ 91.44) × (1 + waste%) | Gross yards/unit, total cost |
| Fabric (GSM) | Area × GSM ÷ 1000 × pieces × (1 + waste%) | Kg/unit, total kg |
| Thread | Seam length × SPI × stitch ratio | Net & gross meters |
| Costing | Fabric + CMT + overhead + charges + profit% | FOB price |
| Yarn Count | Ne / Tex / Nm conversion | All three systems |

---

## 🛡 Security

- All tables have **Row Level Security** (RLS) enabled
- Each user can only see their own data (enforced at DB level)
- Auth handled by Supabase Auth (JWT tokens)
- Passwords never stored in your database — handled by Supabase

---

## 📦 Tech stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React 18 + Vite | Free |
| Routing | React Router v6 | Free |
| Auth | Supabase Auth | Free (unlimited users) |
| Database | Supabase PostgreSQL | Free (500MB) |
| Charts | Recharts | Free |
| PDF Export | jsPDF + autotable | Free |
| Hosting | Vercel | Free |

---

## 🔮 Future features to add

- Stripe payments for Pro plan
- Email PDF reports via Resend.com
- Multi-user factory teams
- Mobile app (React Native, same Supabase backend)
- Yarn consumption calculator
- WIP (Work In Progress) tracker
- Production planning board

---

Built for Pakistani 🇵🇰 textile industry · TextileIE v2
