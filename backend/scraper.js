/**
 * Amazon Product Scraper
 *
 * Fetches product details from Amazon product pages using Puppeteer.
 * Falls back to Cheerio + Axios for simpler requests.
 *
 * NOTE: Amazon aggressively blocks scrapers. This implementation:
 *   - Rotates user agents
 *   - Uses realistic browser headers
 *   - Has retry logic with delay
 *   - Returns partial data gracefully if some fields are missing
 */

const puppeteer = require("puppeteer");
const axios = require("axios");
const cheerio = require("cheerio");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Parse the HTML content of an Amazon product page
 */
function parseAmazonHTML(html, asin) {
  const $ = cheerio.load(html);

  // Title
  const title =
    $("#productTitle").text().trim() ||
    $('[data-feature-name="title"]').text().trim() ||
    $("h1.a-size-large").text().trim();

  // Bullet points (feature bullets)
  const bullets = [];
  $("#feature-bullets ul li span.a-list-item").each((i, el) => {
    const text = $(el).text().trim();
    if (text && !text.toLowerCase().includes("make sure this fits")) {
      bullets.push(text);
    }
  });

  // Product description
  const description =
    $("#productDescription p").text().trim() ||
    $("#aplus_feature_div").text().trim() ||
    $("#dpx-aplus-product-description_feature_div").text().trim() ||
    $(".aplus-v2").text().trim();

  // Price
  const price =
    $(".a-price .a-offscreen").first().text().trim() ||
    $("#priceblock_ourprice").text().trim() ||
    $("#priceblock_dealprice").text().trim() ||
    $(".a-price-whole").first().text().trim();

  // Rating
  const rating =
    $('span[data-hook="rating-out-of-text"]').text().trim() ||
    $(".a-icon-alt").first().text().trim();

  // Reviews count
  const reviewsCount =
    $('span[data-hook="total-review-count"]').text().trim() ||
    $("#acrCustomerReviewText").text().trim();

  // Category breadcrumb
  const categories = [];
  $(".a-breadcrumb li span.a-list-item a").each((i, el) => {
    categories.push($(el).text().trim());
  });
  const category = categories.join(" > ") || "";

  // Product image
  const imageUrl =
    $("#landingImage").attr("src") ||
    $("#imgTagWrapperId img").attr("src") ||
    $(".a-dynamic-image").first().attr("src") ||
    "";

  return {
    asin,
    title,
    bullets,
    description,
    price,
    rating,
    reviewsCount,
    category,
    imageUrl,
  };
}

/**
 * Scrape Amazon product page using Puppeteer (headless browser)
 */
async function scrapeWithPuppeteer(asin) {
  const url = `https://www.amazon.com/dp/${asin}`;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1280,800",
      ],
    });

    const page = await browser.newPage();

    // Set realistic browser context
    await page.setUserAgent(randomUA());
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    await page.setViewport({ width: 1280, height: 800 });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!response.ok() && response.status() !== 200) {
      throw new Error(`Amazon returned HTTP ${response.status()}`);
    }

    // Wait a moment for dynamic content
    await delay(2000);

    // Check for CAPTCHA
    const pageText = await page.evaluate(() => document.body.innerText);
    if (
      pageText.includes("Type the characters you see") ||
      pageText.includes("Enter the characters you see") ||
      pageText.includes("Sorry, we just need to make sure you")
    ) {
      throw new Error(
        "Amazon served a CAPTCHA. Please try again later or use a different IP."
      );
    }

    const html = await page.content();
    return parseAmazonHTML(html, asin);
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Fallback: Scrape using Axios + Cheerio (lighter, but more likely blocked)
 */
async function scrapeWithAxios(asin) {
  const url = `https://www.amazon.com/dp/${asin}`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": randomUA(),
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
      Referer: "https://www.amazon.com/",
    },
    timeout: 20000,
    maxRedirects: 5,
  });

  return parseAmazonHTML(response.data, asin);
}

/**
 * Main scraper function — tries Puppeteer first, falls back to Axios
 */
async function scrapeAmazonProduct(asin) {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin.toUpperCase())) {
    throw new Error(
      `Invalid ASIN: "${asin}". ASINs are 10-character alphanumeric strings.`
    );
  }

  const normalizedASIN = asin.toUpperCase();

  console.log(`🔍 Fetching Amazon product: ${normalizedASIN}`);

  // Try Puppeteer first
  try {
    const data = await scrapeWithPuppeteer(normalizedASIN);
    console.log(`✅ Scraped via Puppeteer: "${data.title?.slice(0, 60)}..."`);
    return data;
  } catch (puppeteerError) {
    console.warn(
      `⚠️  Puppeteer failed: ${puppeteerError.message}. Trying Axios...`
    );

    // Wait before retry to avoid rate limiting
    await delay(1500);

    try {
      const data = await scrapeWithAxios(normalizedASIN);
      console.log(`✅ Scraped via Axios: "${data.title?.slice(0, 60)}..."`);
      return data;
    } catch (axiosError) {
      throw new Error(
        `Failed to fetch product data. Puppeteer: ${puppeteerError.message}. Axios: ${axiosError.message}`
      );
    }
  }
}

module.exports = { scrapeAmazonProduct };
