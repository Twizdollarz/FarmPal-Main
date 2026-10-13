# 🌾 FarmPal - Intelligent Smallholder Farm Record-Keeping & Agri-Fintech Hub

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?style=flat&logo=express)](https://expressjs.com/)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-Gemini-4285f4.svg?style=flat&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**FarmPal** is a full-stack digital agriculture and micro-fintech platform designed for smallholder farmers, agricultural cooperatives, and extension agents. It bridges the gap between field-level farm economics and institutional financial services through simple record-keeping, offline USSD dialers, WhatsApp conversational logging, produce aggregation, agro-weather advisories, and an empirical Agri-Credit scoring model.

---

## 🚀 Key Features

### 1. 📊 Farm Ledger & Financial Records
- Log crop sales, input expenses (fertilizers, seeds, pesticides), labor, logistics, and equipment hires.
- Track customer debts and supplier payables with instant debt status updates.
- Real-time gross margin, operating expenditure (OpEx), and net profit analysis.

### 2. 💬 AI WhatsApp Assistant
- Conversational voice/text logging powered by Google Gemini.
- Enables farmers to record entries via natural language (e.g., *"Sold 4 bags of maize for ₦120,000 at Dawanau market"*).
- Instant agronomic disease detection, crop advice, and weather-synchronized planting tips.

### 3. 📱 Offline USSD Protocol Simulator (`*384*24#`)
- Designed for low-connectivity rural areas with feature phones.
- Interactive dialer for logging sales, recording input purchases, and querying market prices offline.

### 4. 🤝 Cooperative Produce Aggregation & Market Linkages
- Aggregate harvest quantities (Maize, Cassava, Rice, Soybeans, Tomatoes) across member farmers.
- Attract institutional off-takers, food processing companies, and FMCG buyers with collective bargaining power.
- Real-time commodity spot prices across major hubs (Mile 12 Lagos, Dawanau Kano, Bodija Ibadan, etc.).

### 5. 💳 Agri-Credit Scoring & Financial Health Card
- Proprietary algorithmic credit assessment based on:
  - Repayment and debt history (30%)
  - Production yield consistency (25%)
  - Cooperative membership & aggregation participation (20%)
  - Operating cash flow & margin stability (15%)
  - Soil & climate risk mitigation (10%)
- Generates downloadable/exportable credit summaries for microfinance institutions and commercial banks.

### 6. 🌦️ Agro-Weather Advisory & Planting Calendars
- Location-aware weather monitoring (temperature, humidity, precipitation likelihood, wind speed).
- Real-time automated alerts for soil preparation, fertilizer application windows, and harvest drying conditions.

### 7. 🧪 Farmer Pilot Testing & Feedback Hub
- Interactive pilot testing guide with pre-configured field scenarios.
- Integrated feedback submission modal capturing usability ratings, farm location, and device types.
- Centralized feedback analytics dashboard with keyword filtering, rating distribution, and one-click CSV export.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Motion (Framer Motion), Recharts
- **Backend / API**: Express 4, Node.js (via `tsx` in dev, `esbuild` for production bundle)
- **AI & Intelligence**: `@google/genai` (Google Gemini API with graceful curated fallbacks)
- **Build Tool**: Vite 6

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn or bun

### 1. Clone the repository
```bash
git clone https://github.com/nwobodotemple/farmpal.git
cd farmpal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your optional Google Gemini API key if you want live AI interactions:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```
*(Note: FarmPal contains robust fallback engines that function seamlessly even without an external API key!)*

### 4. Run the development server
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

### 5. Build for production
```bash
npm run build
npm start
```

---

## 📁 Project Architecture

```
farmpal/
├── index.html                 # App HTML entry point with metadata
├── package.json               # Node packages and scripts
├── server.ts                  # Express backend & Vite middleware server
├── vite.config.ts             # Vite configuration with Tailwind CSS v4
├── src/
│   ├── main.tsx               # Client React DOM entry point
│   ├── App.tsx                # Main application orchestrator & navigation
│   ├── index.css              # Global styles & Tailwind entry
│   ├── types.ts               # Core TypeScript domain models & schemas
│   ├── components/
│   │   ├── HomeDashboard.tsx              # Executive metrics & summary cards
│   │   ├── RecordsLedger.tsx              # Farm income & expense transactions
│   │   ├── PlanningView.tsx               # Seasonal crop budget & burn rate
│   │   ├── CooperativeView.tsx            # Cooperative aggregation & off-takers
│   │   ├── MarketPriceView.tsx            # Regional commodity spot prices
│   │   ├── WeatherAdvisoryView.tsx        # Agro-weather forecasts & alerts
│   │   ├── AgriCreditView.tsx             # Credit scoring & loan qualification
│   │   ├── InventoryView.tsx              # Seeds, fertilizers & chemicals stock
│   │   ├── DebtorsTracker.tsx             # Outstanding receivables & payables
│   │   ├── WhatsAppSimulator.tsx          # Conversational AI assistant modal
│   │   ├── UssdSimulatorModal.tsx         # Offline USSD *384*24# dialer modal
│   │   ├── TesterGuideDrawer.tsx          # Step-by-step pilot testing scenarios
│   │   ├── FarmerFeedbackModal.tsx        # Farmer rating & feedback submission
│   │   ├── TesterFeedbackView.tsx         # Admin feedback analytics & CSV export
│   │   ├── FarmFinancialHealthCardModal.tsx # Shareable farmer financial report
│   │   └── Navbar.tsx                     # Top navigation & quick actions
│   └── data/                              # Curated seed benchmarks & market prices
```

## 🚀 Production & Cloud Run Beta Deployment Requirements

### Architecture Overview

```text
Cloud Run (max-instances = 1)
       │
       ▼
FarmPal Express (Port: $PORT)
       │
       ├── Firebase Auth (Client & JWT Verification)
       │
       ├── WhatsApp Webhook (Meta HMAC-SHA256 authenticated)
       │
       ├── FarmPal Business Logic
       │
       └── PostgreSQL (Pooled Drizzle / node-postgres)
              │
              ▼
          Cloud SQL
```

### Critical Beta Deployment Constraints

1. **Cloud Run Max Instances = 1**:
   - FarmPal utilizes a high-performance hybrid write-through cache in `server/store.ts`.
   - All mutations persist atomically to Cloud SQL PostgreSQL, while read queries hit in-memory arrays populated on startup.
   - To guarantee complete data consistency across all read queries during the controlled beta, Cloud Run service deployments must be pinned to:
     ```bash
     gcloud run deploy farmpal \
       --max-instances 1 \
       --concurrency 80
     ```
   - This constraint is an intentional temporary beta requirement and prevents stale process-local read states across instances.

2. **WhatsApp Webhook Security**:
   - The Meta WhatsApp Business API webhook (`POST /api/whatsapp/webhook`) requires `WHATSAPP_APP_SECRET` to be configured in Cloud Run environment variables.
   - Every incoming webhook is strictly verified using timing-safe HMAC-SHA256 against `req.rawBody`.
   - In production (`NODE_ENV=production`), missing secrets or invalid signatures return `HTTP 500`/`HTTP 403` respectively.
   - The Twilio webhook route (`POST /api/whatsapp/twilio`) is explicitly disabled in production (`HTTP 501`).

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
