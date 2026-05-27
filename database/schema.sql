-- Amazon Listing Optimizer Database Schema
-- Run this file to initialize your MySQL database

CREATE DATABASE IF NOT EXISTS amazon_optimizer;
USE amazon_optimizer;

-- Main optimizations table
CREATE TABLE IF NOT EXISTS optimizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asin VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Original product data (fetched from Amazon)
  original_title TEXT,
  original_bullets JSON,
  original_description LONGTEXT,
  original_price VARCHAR(50),
  original_rating VARCHAR(20),
  original_reviews_count VARCHAR(50),
  original_category VARCHAR(255),
  product_image_url TEXT,

  -- AI-optimized data
  optimized_title TEXT,
  optimized_bullets JSON,
  optimized_description LONGTEXT,
  suggested_keywords JSON,
  ai_reasoning TEXT,

  -- Meta
  fetch_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
  fetch_error TEXT,

  INDEX idx_asin (asin),
  INDEX idx_created_at (created_at)
);

-- Optional: summary view for quick history lookup
CREATE OR REPLACE VIEW optimization_history AS
SELECT
  id,
  asin,
  created_at,
  LEFT(original_title, 80) AS original_title_preview,
  LEFT(optimized_title, 80) AS optimized_title_preview,
  fetch_status
FROM optimizations
ORDER BY created_at DESC;
