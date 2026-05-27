import React, { useState } from "react";
import ASINForm from "../components/ASINForm";
import ResultsPanel from "../components/ResultsPanel";
import { optimizeASIN } from "../utils/api";
import toast from "react-hot-toast";

const LOADING_STEPS = [
  { icon: "🔍", text: "Fetching product data from Amazon…" },
  { icon: "🤖", text: "Running AI analysis…" },
  { icon: "✍️", text: "Generating optimized copy…" },
  { icon: "💾", text: "Saving to database…" },
];

function LoadingState() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const intervals = LOADING_STEPS.slice(0, -1).map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * 6000)
    );
    return () => intervals.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="card fade-in"
      style={{ textAlign: "center", padding: "48px 24px" }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--accent-dim)",
          border: "2px solid var(--accent-glow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          margin: "0 auto 24px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        {LOADING_STEPS[step].icon}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          marginBottom: 8,
        }}
      >
        {LOADING_STEPS[step].text}
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
        This may take 20–40 seconds
      </p>
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          marginTop: 24,
        }}
      >
        {LOADING_STEPS.map((s, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i <= step ? "var(--accent)" : "var(--border-light)",
              transition: "all 0.4s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function OptimizerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleOptimize = async (asin) => {
    setLoading(true);
    setResult(null);

    try {
      const data = await optimizeASIN(asin);
      setResult(data);

      if (data.fetchStatus === "partial") {
        toast("Amazon scraping was blocked — demo product data was used instead.", {
          icon: "⚠️",
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-light)",
          },
        });
      } else {
        toast.success("Optimization complete!");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Something went wrong.";
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <ASINForm onSubmit={handleOptimize} loading={loading} />
      {loading && <LoadingState />}
      {result && !loading && <ResultsPanel result={result} />}
    </div>
  );
}
