import React, { useState, useEffect, useCallback } from "react";
import { getHistory, getASINHistory, getASINs, deleteOptimization } from "../utils/api";
import { formatDistanceToNow } from "date-fns";

function HistoryRow({ item, onDelete, onView }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete this optimization record?")) return;
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  };

  const date = new Date(item.created_at);
  const timeAgo = isNaN(date)
    ? "Unknown"
    : formatDistanceToNow(date, { addSuffix: true });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        transition: "var(--transition)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-card-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {/* ASIN */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <code
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          {item.asin}
        </code>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {timeAgo}
        </p>
      </div>

      {/* Title preview */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
            Original:{" "}
          </span>
          {item.original_title || "—"}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 3,
          }}
        >
          <span style={{ color: "var(--accent)", fontSize: 11 }}>
            ⚡ Optimized:{" "}
          </span>
          {item.optimized_title || "—"}
        </p>
      </div>

      {/* Status */}
      <span
        className={`badge ${
          item.fetch_status === "success" ? "badge-teal" : "badge-muted"
        }`}
        style={{ flexShrink: 0 }}
      >
        {item.fetch_status}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); onView(item); }}
        >
          View
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleting}
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage({ onViewResult }) {
  const [history, setHistory] = useState([]);
  const [asins, setASINs] = useState([]);
  const [selectedASIN, setSelectedASIN] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedASIN) {
        const data = await getASINHistory(selectedASIN);
        setHistory(data.history);
        setTotal(data.count);
      } else {
        const data = await getHistory(PAGE_SIZE, page * PAGE_SIZE);
        setHistory(data.history);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedASIN, page]);

  const loadASINs = useCallback(async () => {
    try {
      const data = await getASINs();
      setASINs(data.asins);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadASINs();
  }, [loadASINs]);

  const handleDelete = async (id) => {
    try {
      await deleteOptimization(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      setTotal((t) => t - 1);
      loadASINs();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleView = (item) => {
    // Reconstruct result format for ResultsPanel
    onViewResult({
      asin: item.asin,
      fetchStatus: item.fetch_status,
      fetchError: item.fetch_error,
      original: {
        title: item.original_title,
        bullets: item.original_bullets || [],
        description: item.original_description,
        price: item.original_price,
        rating: item.original_rating,
        reviewsCount: item.original_reviews_count,
        category: item.original_category,
        imageUrl: item.product_image_url,
      },
      optimized: {
        title: item.optimized_title,
        bullets: item.optimized_bullets || [],
        description: item.optimized_description,
        keywords: item.suggested_keywords || [],
        reasoning: item.ai_reasoning,
      },
    });
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Optimization History
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            {total} optimization{total !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* ASIN filter */}
        {asins.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              className={`btn btn-sm ${!selectedASIN ? "btn-primary" : "btn-ghost"}`}
              onClick={() => { setSelectedASIN(null); setPage(0); }}
            >
              All
            </button>
            {asins.map(({ asin, optimization_count }) => (
              <button
                key={asin}
                className={`btn btn-sm ${
                  selectedASIN === asin ? "btn-primary" : "btn-ghost"
                }`}
                style={{ fontFamily: "monospace" }}
                onClick={() => { setSelectedASIN(asin); setPage(0); }}
              >
                {asin}
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 999,
                    padding: "1px 6px",
                    fontSize: 11,
                  }}
                >
                  {optimization_count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden" }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📊</div>
            <h3>No optimizations yet</h3>
            <p>Run your first optimization to see results here.</p>
          </div>
        ) : (
          <>
            {history.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}

            {/* Pagination */}
            {!selectedASIN && total > PAGE_SIZE && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  padding: 16,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    alignSelf: "center",
                  }}
                >
                  Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
