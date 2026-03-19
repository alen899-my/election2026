# Kerala 2026 — Election Tracker & Hub

The definitive public election tracking portal for the 2026 Kerala Legislative Assembly Elections. This platform provides real-time data on all 140 constituencies, candidate profiles, party alliances, and live polling results.

---

## 🏗️ Architecture Overview

The project is built as a split-stack architecture to ensure scalability and real-time performance.

- **Frontend (`/client`):** Next.js 14+ with Tailwind CSS v4. Uses Server Components for SEO and Client Components for Socket.io integration.
- **Backend (`/server`):** Express.js API server using Node.js. Hybrid HTTP/WebSocket support for live counting.
- **Database:** PostgreSQL (Neon) with **Drizzle ORM** for type-safe schema management.
- **Media Storage:** Cloudflare R2 (S3 compatible) for candidate photos and party logos.
- **Real-time:** Socket.io for Phase 2 Live Results streaming.
- **Scraper:** Puppeteer-powered background service for fetching constituency and candidate demographics.

---

## 🚀 Quick Setup

### 1. Prerequisite Configuration
Ensure you have Node.js 20+ and a Neon PostgreSQL instance ready.

### 2. Backend Setup (`/server`)
1.  **Install Dependencies:**
    ```bash
    cd server
    npm install
    ```
2.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in your credentials (Neon, Cloudflare R2, JWT Secret).
3.  **Database Migration:**
    ```bash
    # Generate migrations from schema
    npm run db:generate
    # Push changes to Neon
    npm run db:migrate
    ```
4.  **Run Server:**
    ```bash
    npm run dev
    ```
    *Starts at http://localhost:8000*

### 3. Frontend Setup (`/client`)
1.  **Install Dependencies:**
    ```bash
    cd client
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *Starts at http://localhost:3000*

---

## 🛠️ Key Features

- **Government-Style UI:** Strictly adheres to the documentation's Playfair Display & DM Sans typography with Saffron/Green palette.
- **Candidate Profiles:** Comprehensive lists with education, criminal record tracking, and asset declarations.
- **Live Results Dashboard:** WebSocket-powered page (`/live`) that updates in real-time without page refreshes.
- **Dynamic Scraper:** Located in `server/src/services/scraper.service.ts`, allows for bulk data hydration from official sources via Puppeteer.
- **Image Processing:** Automatic resizing and optimization via Sharp before uploading to Cloudflare R2.

---

## 📂 Project Structure

```text
election2026/
├── client/              # Next.js 14 Frontend
│   ├── app/             # App Router (Pages & Layout)
│   ├── components/      # Reusable UI Components
│   └── lib/             # API Bridge & Utilities
├── server/              # Express API Backend
│   ├── src/
│   │   ├── config/      # DB & Env Config
│   │   ├── schema/      # Drizzle Table Definitions
│   │   ├── services/    # Scraper & Upload Logic
│   │   └── index.ts     # Main Server (WS + HTTP)
└── third/fourth.html    # Base Technical Documentation
```

## 🔐 Security
- **JWT Authentication:** Write operations require Admin tokens.
- **Helmet.js:** Strict security headers.
- **Zod Validation:** All incoming API requests are validated for schema consistency.

---
*Created for the Kerala 2026 Observation Project.*
