import React from "react";

const styles = {
  header: {
    borderBottom: "1px solid #1e1e2e",
    background: "rgba(10, 10, 15, 0.9)",
    backdropFilter: "blur(20px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    padding: "0 24px",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg, #ff6b2b, #ff8c55)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  logoSub: {
    color: "var(--accent)",
  },
  nav: {
    display: "flex",
    gap: 4,
  },
  navBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "var(--text-secondary)",
    transition: "var(--transition)",
  },
};

export default function Header({ page, setPage }) {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚡</div>
          <div style={styles.logoText}>
            Listing<span style={styles.logoSub}>AI</span>
          </div>
        </div>
        <nav style={styles.nav}>
          {[
            { id: "optimize", label: "Optimizer" },
            { id: "history", label: "History" },
          ].map(({ id, label }) => (
            <button
              key={id}
              style={{
                ...styles.navBtn,
                color:
                  page === id
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                background:
                  page === id ? "rgba(255,255,255,0.06)" : "transparent",
              }}
              onClick={() => setPage(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
