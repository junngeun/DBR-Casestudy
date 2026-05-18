import { text } from "d3";
import { useState } from "react";

export default function LoginPage({ onSignup, onSuccess }) {
  const [focused, setFocused] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>DBR</h2>

        <input
          style={{ ...styles.input, border: focused === "email" ? "1.5px solid #E86F00" : "1px solid #e0e0e0" }}
          type="email"
          placeholder="이메일"
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />
        <input
          style={{ ...styles.input, border: focused === "pw" ? "1.5px solid #E86F00" : "1px solid #e0e0e0" }}
          type="password"
          placeholder="비밀번호"
          onFocus={() => setFocused("pw")}
          onBlur={() => setFocused(null)}
        />

        <button style={styles.submitBtn} onClick={onSuccess}>로그인</button>

        <div style={styles.divider}>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
          <span>또는</span>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
        </div>

        <button style={styles.socialBtn}>
          <img src="https://developers.google.com/identity/images/g-logo.png" width={18} height={18} alt="google" />
          Google로 시작하기
        </button>
        <button style={{ ...styles.socialBtn, background: "#FEE500", border: "none", color: "#1a1a1a" }}>
          <span style={{ fontWeight: 700 }}>K</span> 카카오로 시작하기
        </button>
        <button style={{ ...styles.socialBtn, background: "#03C75A", border: "none", color: "#fff" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>N</span> 네이버로 시작하기
        </button>

        <p style={styles.footer}>
          DBR 계정이 없으신가요?{" "}
          <span style={styles.link} onClick={onSignup}>회원가입</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2" },
  card: { padding: "2.5rem 2rem", width: 400, boxSizing: "border-box" },
  title: { fontSize: 40, fontWeight: 700, color: "#1a1a1a", marginBottom: 25, textAlign: "center" },
  sub: { fontSize: 14, color: "#999", marginBottom: 24 },
  socialBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: "#fff", marginBottom: 10 },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "16px 0", color: "#ccc", fontSize: 13 },
  input: { width: "100%", padding: "14px 16px", fontSize: 14, border: "none", borderRadius: 10,outline: "none", WebkitAppearance: "none", marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit", outline: "none", background: "#fff", color: "#1a1a1a" },
  submitBtn: { width: "100%", padding: "12px", fontSize: 15, fontWeight: 500, color: "#fff", background: "#E86F00", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
  footer: { fontSize: 13, fontWeight: 600, color: "#999", textAlign: "center", marginTop: 20 },
  link: { color: "#E86F00", cursor: "pointer", fontWeight: 600 },
};
