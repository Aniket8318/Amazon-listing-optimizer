require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const db = require("./db");
const { scrapeAmazonProduct } = require("./scraper");
const { optimizeListing } = require("./optimizer");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: { error: "Too many requests. Please wait a few minutes." },
});
app.use("/api/", limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/optimize
 * Main endpoint: fetch product from Amazon + optimize with AI + save to DB
 *
 * Body: { asin: string }
 */
app.post("/api/optimize", async (req, res) => {
  const { asin } = req.body;

  if (!asin || typeof asin !== "string") {
    return res.status(400).json({ error: "ASIN is required." });
  }

  const normalizedASIN = asin.trim().toUpperCase();

  if (!/^[A-Z0-9]{10}$/.test(normalizedASIN)) {
    return res.status(400).json({
      error: "Invalid ASIN. Must be exactly 10 alphanumeric characters.",
    });
  }

  try {
    // Step 1: Scrape Amazon product page
    let productData;
    let fetchStatus = "success";
    let fetchError = null;

    try {
      productData = await scrapeAmazonProduct(normalizedASIN);
    } catch (scrapeErr) {
      console.error("Scrape error:", scrapeErr.message);
      // Return a demo product for development if scraping fails
      productData = getDemoProduct(normalizedASIN);
      fetchStatus = "partial";
      fetchError = scrapeErr.message;
    }

    // Step 2: AI optimization
    const optimized = await optimizeListing(productData);

    // Step 3: Save to database
    const [result] = await db.execute(
      `INSERT INTO optimizations (
        asin,
        original_title, original_bullets, original_description,
        original_price, original_rating, original_reviews_count,
        original_category, product_image_url,
        optimized_title, optimized_bullets, optimized_description,
        suggested_keywords, ai_reasoning,
        fetch_status, fetch_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedASIN,
        productData.title || null,
        JSON.stringify(productData.bullets || []),
        productData.description || null,
        productData.price || null,
        productData.rating || null,
        productData.reviewsCount || null,
        productData.category || null,
        productData.imageUrl || null,
        optimized.optimizedTitle,
        JSON.stringify(optimized.optimizedBullets),
        optimized.optimizedDescription,
        JSON.stringify(optimized.suggestedKeywords),
        optimized.reasoning,
        fetchStatus,
        fetchError,
      ]
    );

    return res.json({
      success: true,
      id: result.insertId,
      asin: normalizedASIN,
      fetchStatus,
      fetchError,
      original: {
        title: productData.title,
        bullets: productData.bullets,
        description: productData.description,
        price: productData.price,
        rating: productData.rating,
        reviewsCount: productData.reviewsCount,
        category: productData.category,
        imageUrl: productData.imageUrl,
      },
      optimized: {
        title: optimized.optimizedTitle,
        bullets: optimized.optimizedBullets,
        description: optimized.optimizedDescription,
        keywords: optimized.suggestedKeywords,
        reasoning: optimized.reasoning,
      },
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Optimization error:", err);
    return res.status(500).json({
      error: err.message || "Optimization failed. Please try again.",
    });
  }
});

/**
 * GET /api/history/:asin
 * Get all optimizations for a specific ASIN
 */
app.get("/api/history/:asin", async (req, res) => {
  const asin = req.params.asin.toUpperCase();

  try {
    const [rows] = await db.execute(
      `SELECT * FROM optimizations WHERE asin = ? ORDER BY created_at DESC`,
      [asin]
    );

    const parsed = rows.map(parseDBRow);
    return res.json({ asin, count: parsed.length, history: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/history
 * Get recent optimizations across all ASINs
 */
app.get("/api/history", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const [rows] = await db.execute(
  `SELECT * FROM optimizations ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
);

    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM optimizations`
    );

    return res.json({
      total: countRows[0].total,
      limit,
      offset,
      history: rows.map(parseDBRow),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/history/detail/:id
 * Get a single optimization by ID
 */
app.get("/api/optimization/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM optimizations WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Optimization not found." });
    }

    return res.json(parseDBRow(rows[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/optimization/:id
 * Delete a specific optimization record
 */
app.delete("/api/optimization/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM optimizations WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Optimization not found." });
    }

    return res.json({ success: true, deleted: req.params.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/asins
 * Get list of unique ASINs that have been optimized
 */
app.get("/api/asins", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT asin, COUNT(*) as optimization_count, MAX(created_at) as last_optimized
       FROM optimizations GROUP BY asin ORDER BY last_optimized DESC`
    );
    return res.json({ asins: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDBRow(row) {
  return {
    ...row,
    original_bullets: safeParse(row.original_bullets, []),
    optimized_bullets: safeParse(row.optimized_bullets, []),
    suggested_keywords: safeParse(row.suggested_keywords, []),
  };
}

function safeParse(val, fallback) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

/**
 * Demo product — used when Amazon scraping is blocked in dev
 */
function getDemoProduct(asin) {
  return {
    asin,
    title:
      "Wireless Bluetooth Headphones Over Ear with Microphone, 40H Playtime Foldable Headset",
    bullets: [
      "Long Battery Life: Up to 40 hours of playtime on a single charge",
      "Premium Sound Quality: 40mm drivers deliver rich bass and crystal clear highs",
      "Built-in Microphone: Clear hands-free calling with noise-canceling mic",
      "Foldable Design: Compact and portable for travel and on-the-go use",
      "Universal Compatibility: Works with all Bluetooth devices",
    ],
    description:
      "Experience wireless freedom with our premium Bluetooth headphones. Designed for music lovers and professionals alike, these headphones combine exceptional audio quality with all-day comfort. The ergonomic design and soft ear cushions ensure a comfortable fit even during extended listening sessions.",
    price: "$29.99",
    rating: "4.2 out of 5 stars",
    reviewsCount: "2,847",
    category: "Electronics > Headphones",
    imageUrl: "",
  };
}

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Amazon Listing Optimizer API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/history`);
});

module.exports = app;
