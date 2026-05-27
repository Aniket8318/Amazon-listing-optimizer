# Amazon Listing Optimizer ⚡

An AI-powered web app that fetches Amazon product listings by ASIN and stores the full optimization history in MySQL for tracking improvements over time.

---

## Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Frontend  | React 18, Axios, react-hot-toast      |
| Backend   | Node.js, Express                      |
| Database  | MySQL 8+                              |
| Scraping  | Puppeteer (headless Chrome), Cheerio  |
| AI        | Groq AI API                           |

---

## Project Structure

```
amazon-listing-optimizer/
├── backend/
│   ├── server.js       # Express API routes
│   ├── scraper.js      # Amazon product scraper (Puppeteer + Cheerio)
│   ├── optimizer.js    # Groq AI API & optimization logic
│   ├── db.js           # MySQL connection pool
│   ├── package.json
│   └── .env            # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.css           # Global design system
│   │   ├── utils/api.js        # Axios API client
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── ASINForm.jsx    # ASIN input form
│   │   │   └── ResultsPanel.jsx # Side-by-side comparison UI
│   │   └── pages/
│   │       ├── OptimizerPage.jsx
│   │       └── HistoryPage.jsx
│   └── package.json
├── database/
│   └── schema.sql      # MySQL schema
└── README.md



## Setup Instructions

### 1. Prerequisites

- Node.js v18+
- MySQL 8+
- An Groq  API key 
- Google Chrome installed (for Puppeteer)

---

### 2. Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Run the schema
source /path/to/amazon-listing-optimizer/database/schema.sql
```

Or from the command line:
```bash
mysql -u root -p < database/schema.sql
```

---

### 3. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env`:
```env
Groq _API_KEY=sk-ant-...
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=amazon_optimizer
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev     # Development (nodemon auto-reload)
# or
npm start       # Production
```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
npm start       # Starts on http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint                  | Description                              |
|--------|---------------------------|------------------------------------------|
| POST   | `/api/optimize`           | Fetch + optimize a product by ASIN       |
| GET    | `/api/history`            | All optimizations (paginated)            |
| GET    | `/api/history/:asin`      | All optimizations for a specific ASIN    |
| GET    | `/api/optimization/:id`   | Single optimization record               |
| DELETE | `/api/optimization/:id`   | Delete a record                          |
| GET    | `/api/asins`              | All unique ASINs with counts             |

### POST /api/optimize

**Request body:**
```json
{ "asin": "B09G9FPHY6" }
```

**Response:**
```json
{
  "success": true,
  "id": 42,
  "asin": "B09G9FPHY6",
  "fetchStatus": "success",
  "original": {
    "title": "...",
    "bullets": ["..."],
    "description": "...",
    "price": "$29.99",
    "rating": "4.2 out of 5 stars"
  },
  "optimized": {
    "title": "...",
    "bullets": ["..."],
    "description": "...",
    "keywords": ["..."],
    "reasoning": "..."
  }
}



### Key Prompt Decisions

| Decision | Reasoning |
|----------|-----------|
| Request JSON-only output | Enables reliable parsing without regex hacks |
| Include category in prompt | Helps Claude pick category-relevant keywords |
| Ask for `reasoning` field | Provides transparency into AI decisions; useful for debugging and trust-building |
| Constrain title to 200 chars | Matches Amazon's actual title length limit |
| Require ALL-CAPS benefit phrase in bullets | Follows Amazon's recommended bullet format for scannability |
| Ask for 3–5 long-tail keywords | Short 1-2 word keywords are too competitive; specific phrases have better conversion |


## Amazon Scraping Notes

Amazon actively blocks scrapers. This app uses a two-tier approach:

1. **Puppeteer (primary)**: Headless Chrome with a realistic user agent, viewport, and HTTP headers. Waits for DOM to load and detects CAPTCHA pages.
2. **Axios + Cheerio (fallback)**: Lightweight HTTP request if Puppeteer fails.

**If both fail**, the app uses a **demo product** and marks the record with `fetch_status = "partial"` so you can still see the AI optimization in action. The frontend shows a warning badge in this case.

> **Note for production**: Consider using a scraping proxy service (ScraperAPI, Bright Data, Oxylabs) or the official Amazon Product Advertising API for reliable, legal data access.

---

## Database Schema

```sql
CREATE TABLE optimizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asin VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Original (scraped from Amazon)
  original_title TEXT,
  original_bullets JSON,
  original_description LONGTEXT,
  original_price VARCHAR(50),
  original_rating VARCHAR(20),
  original_reviews_count VARCHAR(50),
  original_category VARCHAR(255),
  product_image_url TEXT,


  optimized_title TEXT,
  optimized_bullets JSON,
  optimized_description LONGTEXT,
  suggested_keywords JSON,
  ai_reasoning TEXT,

  -- Meta
  fetch_status ENUM('success', 'partial', 'failed'),
  fetch_error TEXT
);
```

Each optimization run creates a new row, preserving the full history. Multiple runs for the same ASIN are all stored, enabling before/after comparisons and tracking changes over time.

---

## Features

- **Side-by-side comparison**: Original and optimized content displayed in parallel columns
- **One-click copy**: Copy optimized title, bullets, or description to clipboard
- **Optimization history**: Full paginated history with ASIN filtering
- **Per-ASIN history**: Track every optimization run for a single product
- **AI reasoning**: Claude explains its optimization choices
- **Graceful degradation**: Demo data when Amazon blocks scraping

---

## Rate Limiting

The backend applies a rate limit of **30 requests per 10 minutes** per IP to prevent abuse and protect against API cost overruns.

---

## Environment Variables

| Variable          | Required | Description                          |
|-------------------|----------|--------------------------------------|
| `Groq_API_KEY` | Yes    | Your Groq  API key               |
| `DB_HOST`         | Yes      | MySQL host (default: localhost)       |
| `DB_PORT`         | No       | MySQL port (default: 3306)            |
| `DB_USER`         | Yes      | MySQL username                       |
| `DB_PASSWORD`     | Yes      | MySQL password                        |
| `DB_NAME`         | Yes      | Database name (default: amazon_optimizer) |
| `PORT`            | No       | Backend port (default: 3001)          |
| `FRONTEND_URL`    | No       | CORS origin (default: http://localhost:3000) |



AVNS_3PAc6wZnwpxre2Pvpn7