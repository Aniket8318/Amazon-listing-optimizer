import React, { useState } from "react";

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {label}
      </h3>
      {children}
    </div>
  );
}

function CompareRow({ original, optimized, type = "text" }) {
  const renderContent = (content, isOptimized) => {
    if (type === "bullets") {
      const items = Array.isArray(content) ? content : [];
      return (
        <div
          className={`content-box ${isOptimized ? "optimized" : ""}`}
          style={{ padding: 0 }}
        >
          {items.length === 0 ? (
            <p
              style={{
                padding: 16,
                color: "var(--text-muted)",
                fontStyle: "italic",
                fontSize: 13,
              }}
            >
              No bullet points found
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: "10px 16px",
                    borderBottom:
                      i < items.length - 1 ? "1px solid var(--border)" : "none",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: isOptimized
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color: isOptimized ? "var(--accent)" : "var(--text-muted)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    •
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return (
      <div className={`content-box ${isOptimized ? "optimized" : ""}`}>
        {content || (
          <span
            style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 13 }}
          >
            Not available
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="comparison-grid">
      <div>
        <div className="comparison-col-header col-original">
          <span>○</span> Original
        </div>
        {renderContent(original, false)}
      </div>
      <div>
        <div className="comparison-col-header col-optimized">
          <span>⚡</span> Optimized
        </div>
        {renderContent(optimized, true)}
      </div>
    </div>
  );
}

export default function ResultsPanel({ result }) {
  const { asin, original, optimized, fetchStatus, fetchError } = result;
  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(
      Array.isArray(text) ? text.join("\n") : text
    );
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="card fade-in" style={{ marginBottom: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              ASIN: {asin}
            </h2>
            <span className={`badge ${fetchStatus === "success" ? "badge-teal" : "badge-muted"}`}>
              {fetchStatus === "success" ? "✓ Fetched" : "⚠ Demo data"}
            </span>
          </div>
          {fetchError && (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Note: {fetchError}
            </p>
          )}
          {original.category && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              {original.category}
              {original.price && (
                <span style={{ marginLeft: 12, color: "var(--teal)" }}>
                  {original.price}
                </span>
              )}
              {original.rating && (
                <span style={{ marginLeft: 12, color: "#f0a500" }}>
                  ★ {original.rating}
                </span>
              )}
            </p>
          )}
        </div>
        <a
          href={`https://www.amazon.com/dp/${asin}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm"
        >
          View on Amazon ↗
        </a>
      </div>

      <div className="divider" style={{ margin: "0 0 24px 0" }} />

      {/* Title */}
      <Section label="📝 Title">
        <CompareRow original={original.title} optimized={optimized.title} />
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8, float: "right" }}
          onClick={() => copy(optimized.title, "title")}
        >
          {copied === "title" ? "✓ Copied!" : "Copy title"}
        </button>
        <div style={{ clear: "both" }} />
      </Section>

      {/* Bullets */}
      <Section label="📋 Bullet Points">
        <CompareRow
          original={original.bullets}
          optimized={optimized.bullets}
          type="bullets"
        />
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8, float: "right" }}
          onClick={() => copy(optimized.bullets, "bullets")}
        >
          {copied === "bullets" ? "✓ Copied!" : "Copy bullets"}
        </button>
        <div style={{ clear: "both" }} />
      </Section>

      {/* Description */}
      <Section label="📄 Description">
        <CompareRow
          original={original.description}
          optimized={optimized.description}
        />
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8, float: "right" }}
          onClick={() => copy(optimized.description, "desc")}
        >
          {copied === "desc" ? "✓ Copied!" : "Copy description"}
        </button>
        <div style={{ clear: "both" }} />
      </Section>

      {/* Keywords */}
      <Section label="🔑 Suggested Keywords">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(optimized.keywords || []).map((kw, i) => (
            <span key={i} className="keyword-tag">
              # {kw}
            </span>
          ))}
        </div>
      </Section>

      {/* AI Reasoning */}
      {optimized.reasoning && (
        <div
          style={{
            background: "rgba(255, 107, 43, 0.05)",
            border: "1px solid rgba(255, 107, 43, 0.15)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginTop: 4,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 8,
            }}
          >
            🤖 AI Reasoning
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {optimized.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
