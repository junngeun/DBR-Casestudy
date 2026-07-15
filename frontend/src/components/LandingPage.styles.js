// LandingPage 의 스타일 정의 (원래 LandingPage.jsx 안에 있던 것)

// 색상 상수 — styles 와 컴포넌트 양쪽에서 쓰므로 export 한다
export const ORANGE = "#E86F00";
export const ORANGE_LIGHT = "#FEF0E0";
export const ORANGE_BORDER = "#f5b85a";
export const ORANGE_DARK = "#C45E00";
export const ORANGE_TEXT = "#A85200";

export const styles = {
  landing: {
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#ffffff",
    color: "#1a1a1a",
    minHeight: "100vh",
    overflow: "hidden",
    width: 1000,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 36px",
    borderBottom: "0.5px solid #ede8e2",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.3px" },
  logoSub: { fontSize: 11, color: ORANGE, letterSpacing: "1.5px", textTransform: "uppercase" },
  navBadge: {
    fontSize: 11,
    padding: "4px 10px",
    background: ORANGE_LIGHT,
    border: `0.5px solid ${ORANGE_BORDER}`,
    borderRadius: 20,
    color: ORANGE_TEXT,
    letterSpacing: "0.3px",
  },
  hero: { padding: "56px 36px 44px", textAlign: "center" },
  heroEyebrow: {
    fontSize: 15,
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: ORANGE,
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 42,
    fontWeight: 600,
    lineHeight: 1.2,
    color: "#111111",
    marginBottom: 16,
    letterSpacing: "-0.5px",
  },
  heroDesc: {
    fontSize: 16,
    color: "#6b6258",
    lineHeight: 1.75,
    maxWidth: 480,
    margin: "0 auto 32px",
  },
  heroActions: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },

  btnPrimary: {
    padding: "11px 24px",
    background: ORANGE,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "11px 24px",
    background: "transparent",
    color: "#1a1a1a",
    border: "0.5px solid #d0c8bf",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    padding: "0 36px",
    marginBottom: 40,
    borderTop: "0.5px solid #ede8e2",
    borderBottom: "0.5px solid #ede8e2",
  },
  statItem: {
    padding: "18px 28px",
    textAlign: "center",
    borderRight: "0.5px solid #ede8e2",
    flex: 1,
  },
  statNum: { fontSize: 24, fontWeight: 600, color: ORANGE, marginBottom: 4, letterSpacing: "-0.5px" },

  statLabel: { fontSize: 13, color: "#a09488", letterSpacing: "0.5px" },

  features: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    padding: "0 36px 40px",
  },
  featureCard: {
    background: "#f0f0f0",
    border: "none",
    borderRadius: 12,
    padding: 20,
    transition: "border-color 0.2s",
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: ORANGE_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    fontSize: 18,
    color: ORANGE,
  },
  featureTitle: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 8, letterSpacing: "-0.2px" },

  featureDesc: { fontSize: 14, color: "#8a7e74", lineHeight: 1.65 },

  ctaBar: {
    margin: "0 36px 36px",
    padding: "20px 24px",
    background: ORANGE_LIGHT,
    border: `0.5px solid ${ORANGE_BORDER}`,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  ctaText: { fontSize: 13, color: "#7a5a48" },
};
