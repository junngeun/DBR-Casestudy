// SignupPage 의 스타일 정의 (원래 SignupPage.jsx 안에 있던 것)
export const styles = {
  page: { minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" },
  card: { padding: "2.5rem 2rem", width: 400, boxSizing: "border-box" },
  title: { fontSize: 25, fontWeight: 700, color: "#1a1a1a", marginBottom: 25, textAlign: "center" },
  socialBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", background: "#fff", marginBottom: 10 },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "16px 0", color: "#ccc", fontSize: 13 },
  input: { width: "100%", padding: "11px 14px", fontSize: 14, borderRadius: 12, marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit", outline: "none", background: "#EAF4FB", color: "#1a1a1a" },
  submitBtn: { width: "100%", padding: "12px", fontSize: 15, fontWeight: 500, color: "#fff", background: "#E86F00", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
  errorText: { fontSize: 13, color: "#A32D2D", marginBottom: 10, lineHeight: 1.5 },
  footer: { fontSize: 13, fontWeight: 600, color: "#999", textAlign: "center", marginTop: 20 },
  link: { color: "#E86F00", cursor: "pointer", fontWeight: 600 },
};