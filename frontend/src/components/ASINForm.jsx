import React, { useState } from "react";

const EXAMPLE_ASINS = ["B09G9FPHY6", "B08N5WRWNW", "B07FZ8S74R"];

export default function ASINForm({ onSubmit, loading }) {
  const [asin, setAsin] = useState("");
  const [error, setError] = useState("");

  const validate = (val) => {
    const clean = val.trim().toUpperCase();
    if (!clean) return "Please enter an ASIN.";
    if (!/^[A-Z0-9]{10}$/.test(clean))
      return "ASINs are exactly 10 alphanumeric characters (e.g., B09G9FPHY6).";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate(asin);
    if (err) { setError(err); return; }
    setError("");
    onSubmit(asin.trim().toUpperCase());
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "32px",
        marginBottom: 32,
      }}
    >
      {/* Headline */}
      <div style={{ marginBottom: 24 }}>
        <div className="badge badge-orange" style={{ marginBottom: 12 }}>
          ⚡ AI-Powered Optimization
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Optimize Your Amazon Listing
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Enter an ASIN to fetch product data from Amazon and generate
          AI-optimized titles, bullet points, descriptions, and keyword
          suggestions.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <input
              className="input"
              type="text"
              value={asin}
              onChange={(e) => {
                setAsin(e.target.value.toUpperCase());
                if (error) setError("");
              }}
              placeholder="e.g. B09G9FPHY6"
              maxLength={10}
              style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
              disabled={loading}
            />
            {error && (
              <p
                style={{
                  color: "#ff4757",
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !asin}
            style={{ padding: "12px 28px", fontSize: 15 }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Optimizing…
              </>
            ) : (
              <>⚡ Optimize</>
            )}
          </button>
        </div>
      </form>

      {/* Example ASINs */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Try:
        </span>
        {EXAMPLE_ASINS.map((a) => (
          <button
            key={a}
            className="btn btn-ghost btn-sm"
            style={{ fontFamily: "monospace", fontSize: 12 }}
            onClick={() => setAsin(a)}
            disabled={loading}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
