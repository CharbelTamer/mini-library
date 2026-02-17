# Mini Library Management System

A modern, full-stack library management system built with Next.js 15, featuring AI-powered book recommendations, smart search, SSO authentication, and a beautiful responsive UI.

## Features

### Core Features
- **Book Management** -- Full CRUD (Create, Read, Update, Delete) for books with rich metadata (title, author, ISBN, genre, cover image, publisher, year, page count, language, copies)
- **Check-in/Check-out** -- Borrow and return books with due date tracking, overdue alerts, and transaction history
- **Search** -- Full-text search by title, author, ISBN, or genre with filter options (genre dropdown, available-only toggle, grid/list view)

### AI Features (Google Gemini)
- **AI Library Assistant** -- Conversational chatbot that knows the entire library catalog, helps find books, and answers questions
- **Smart Recommendations** -- Personalized book suggestions based on reading history, powered by AI analysis
- **Natural Language Search** -- "Find me a mystery novel from the 90s" -- AI interprets and returns structured results
- **Auto Book Summaries** -- One-click AI-generated descriptions when adding books

### Authentication & Authorization
- **SSO with Google and GitHub** via Auth.js v5 (NextAuth)
- **Three user roles:**
  - **Admin** -- Full access: manage users, assign roles, manage books, view reports, export data
  - **Librarian** -- Manage books (CRUD), process check-in/check-out
  - **Member** -- Browse catalog, check out/return books, reserve, get AI recommendations

### Extra Features
- Dark/light mode with system preference detection
- ISBN auto-lookup from Open Library API (auto-fills title, author, cover, publisher, pages)
- Book cover images auto-fetched from Open Library Covers API
- Book rating and review system (5-star ratings with written reviews)
- Book reservation queue for unavailable books
- Overdue visual indicators with day count
- CSV export of book inventory (Admin)
- Dashboard with statistics (total books, users, active checkouts, overdue count)
- Genre distribution chart
- Recent activity feed
- Responsive mobile design with collapsible sidebar
- Loading skeletons for smooth UX
- Toast notifications for actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide Icons |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 |
| Authentication | Auth.js v5 (Google + GitHub OAuth) |
| AI | Vercel AI SDK + Google Gemini 2.5 Flash |
| Validation | Zod |
| Forms | React Hook Form |
| Charts | Recharts |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+ 
- A PostgreSQL database (recommend [Neon](https://neon.tech) free tier)
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com))
- GitHub OAuth app ([GitHub Settings](https://github.com/settings/developers))
- Google AI API key ([Google AI Studio](https://aistudio.google.com/apikey))

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd mini-library
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
AUTH_SECRET="generate-with: npx auth secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with 27 sample books
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. First Login

1. Sign in with Google or GitHub
2. The first user can be promoted to Admin via direct database update:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```
   Or use Prisma Studio: `npm run db:studio`

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Add all environment variables from `.env.example`
3. Deploy -- Vercel auto-detects Next.js and builds

### 3. Post-Deploy

```bash
# Push schema to production database
npx prisma db push

# Seed production database
npm run db:seed
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── page.tsx          # Dashboard with stats
│   │   ├── catalog/          # Book catalog (search, filter, grid/list)
│   │   ├── books/            # Book detail, add, edit
│   │   ├── my-books/         # User's checkouts & history
│   │   ├── ai-assistant/     # AI chatbot & recommendations
│   │   └── admin/            # Admin panel & user management
│   ├── signin/               # Sign-in page (Google + GitHub)
│   └── api/                  # API routes
│       ├── auth/             # Auth.js endpoints
│       ├── books/            # Book CRUD
│       ├── transactions/     # Check-in/Check-out
│       ├── reservations/     # Book reservations
│       ├── reviews/          # Book reviews
│       ├── users/            # User management (admin)
│       ├── ai/               # AI endpoints (chat, recommend, search, summarize)
│       └── stats/            # Dashboard statistics
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, header, theme toggle
│   ├── books/                # Book card, form components
│   └── providers.tsx         # Session, theme, toast providers
├── lib/
│   ├── auth.ts               # Auth.js configuration
│   ├── auth.config.ts        # Auth config (edge-compatible)
│   ├── auth-helpers.ts       # Role checking utilities
│   ├── prisma.ts             # Prisma client singleton
│   ├── utils.ts              # Utility functions
│   └── validators.ts         # Zod schemas
└── types/
    └── next-auth.d.ts        # Auth type augmentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample books |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## License

MIT
