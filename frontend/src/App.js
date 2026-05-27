import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import "./index.css";
import Header from "./components/Header";
import OptimizerPage from "./pages/OptimizerPage";
import HistoryPage from "./pages/HistoryPage";
import ResultsPanel from "./components/ResultsPanel";

export default function App() {
  const [page, setPage] = useState("optimize");
  const [historyResult, setHistoryResult] = useState(null);

  const handleViewFromHistory = (result) => {
    setHistoryResult(result);
    setPage("view");
  };

  return (
    <>
      <Toaster position="top-right" />
      <Header
        page={page === "view" ? "history" : page}
        setPage={(p) => {
          setPage(p);
          setHistoryResult(null);
        }}
      />

      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "40vh",
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,107,43,0.06) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {page === "optimize" && <OptimizerPage />}

        {page === "history" && (
          <HistoryPage onViewResult={handleViewFromHistory} />
        )}

        {page === "view" && historyResult && (
          <div className="fade-in">
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 20 }}
              onClick={() => { setPage("history"); setHistoryResult(null); }}
            >
              ← Back to History
            </button>
            <ResultsPanel result={historyResult} />
          </div>
        )}
      </main>
    </>
  );
}
