import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function SignupPage({ onLogin, onSuccess }) {
  const [focused, setFocused] = useState(null);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!nickname.trim() || !email.trim() || !password.trim() || !passwordCheck.trim()) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    if (password !== passwordCheck) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          email: email.trim(),
          password,
          job_role_code: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("member", JSON.stringify(data.member));

      if (onSuccess) {
        onSuccess(data.member);
      }
    } catch (error) {
      console.error("회원가입 실패:", error);
      setError(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>회원가입</h2>

        <input
          style={{ ...styles.input, border: focused === "name" ? "1.5px solid #1a1a1a" : "1.5px solid transparent" }}
          type="text"
          placeholder="이름"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onFocus={() => setFocused("name")}
          onBlur={() => setFocused(null)}
        />

        <input
          style={{ ...styles.input, border: focused === "email" ? "1.5px solid #1a1a1a" : "1.5px solid transparent" }}
          type="email"
          placeholder="아이디"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />

        <input
          style={{ ...styles.input, border: focused === "pw" ? "1.5px solid #1a1a1a" : "1.5px solid transparent" }}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocused("pw")}
          onBlur={() => setFocused(null)}
        />

        <input
          style={{ ...styles.input, border: focused === "pw2" ? "1.5px solid #1a1a1a" : "1.5px solid transparent" }}
          type="password"
          placeholder="비밀번호 확인"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
          onFocus={() => setFocused("pw2")}
          onBlur={() => setFocused(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSignup();
          }}
        />

        {error && <p style={styles.errorText}>{error}</p>}

        <button
          style={{
            ...styles.submitBtn,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>

        <div style={styles.divider}>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
          <span>또는</span>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
        </div>

        <button style={{ ...styles.socialBtn, background: "#fff", border: "1px solid #e0e0e0", color: "#1a1a1a" }}
                onClick={() => window.location.href = "http://localhost:3000/api/auth/google"}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="google" />
          Google로 가입하기
        </button>
        <button style={{ ...styles.socialBtn, background: "#FEE500", border: "none", color: "#1a1a1a" }}
                onClick={() => alert("카카오 가입은 준비 중입니다.")}
        >
          <span style={{ fontWeight: 700 }}>K</span> 카카오로 가입하기
        </button>
        <button style={{ ...styles.socialBtn, background: "#03C75A", border: "none", color: "#fff" }}
                onClick={() => alert("네이버 가입은 준비 중입니다.")}
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>N</span> 네이버로 가입하기
        </button>

        <p style={styles.footer}>
          이미 계정이 있으신가요?{" "}
          <span style={styles.link} onClick={onLogin}>로그인</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
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