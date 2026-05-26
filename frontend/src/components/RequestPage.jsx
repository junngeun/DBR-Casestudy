import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const INDUSTRIES = ["IT·플랫폼", "커머스", "리테일", "식음료", "금융", "물류·운송", "제조", "콘텐츠·미디어", "헬스케어", "부동산·공간", "기타"];

export default function RequestPage({ onBack }) {
  const [topic, setTopic] = useState("");
  const [industry, setIndustry] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState([]);

  // 데이터 목록 불러오기 (로그인 유저의 공감 여부 포함하여 가져옴)
  const fetchRequests = async () => {
    try {
      const member = JSON.parse(localStorage.getItem("member"));
      const url = member 
        ? `${API_BASE_URL}/api/requests?member_idx=${member.member_idx}` 
        : `${API_BASE_URL}/api/requests`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 요청 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !content.trim()) {
      alert("요청하실 주제와 상세 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, industry, content, is_private: isPrivate })
      });

      if (res.ok) {
        alert("케이스 요청이 게시판에 등록되었습니다!");
        setTopic(""); setIndustry(""); setContent(""); setIsPrivate(false);
        fetchRequests();
      }
    } catch (err) {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 좋아요 토글 기능
  const handleLike = async (idx) => {
    const member = JSON.parse(localStorage.getItem("member"));
    if (!member) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/${idx}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_idx: member.member_idx })
      });

      if (res.ok) {
        fetchRequests(); // 반영 후 목록 갱신 (서버에서 받아온 is_liked 상태로 버튼 색상 자동 변경됨)
      }
    } catch (err) {
      console.error("좋아요 처리 실패:", err);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <div style={styles.leftSection}>
          <div style={styles.header}>
            <h2 style={styles.title}>신규 케이스 요청</h2>
            <p style={styles.subtitle}>DBR에서 다뤄주었으면 하는 케이스를 자유롭게 요청해 주세요.</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>요청 주제 (필수)</label>
              <input style={styles.input} type="text" placeholder="예: 토스의 초기 고객 확보 전략" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>관련 산업군 (선택)</label>
              <select style={styles.select} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">산업군을 선택해주세요</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>상세 내용 (필수)</label>
              <textarea style={styles.textarea} placeholder="예: 초기 마케팅 예산이 부족한 상황에서 어떻게 1만 명의 유저를 확보했는지 구체적인 채널 전략이 궁금합니다." value={content} onChange={(e) => setContent(e.target.value)} />
            </div>

            <div style={styles.toggleWrapper} onClick={() => setIsPrivate(!isPrivate)}>
              <div style={{ ...styles.toggleBg, background: isPrivate ? "#ccc" : "#E86F00" }}>
                <div style={{ ...styles.toggleKnob, left: isPrivate ? 22 : 2 }} />
              </div>
              <span style={styles.toggleText}>{isPrivate ? "비공개 (관리자만 보기)" : "공개 (다른 유저와 공유하기)"}</span>
            </div>

            <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "접수 중..." : "케이스 요청하기"}
            </button>
          </form>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.searchWrapper}>
            <input style={styles.searchInput} placeholder="주제나 산업군을 검색해보세요..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div style={styles.feedList}>
            {filteredRequests.sort((a, b) => b.likes - a.likes).map(req => (
              <div key={req.request_idx} style={styles.feedCard}>
                <div style={styles.feedCardTop}>
                  <span style={styles.feedBadge}>{req.industry}</span>
                  <span style={styles.feedDate}>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                <h4 style={styles.feedTopic}>{req.topic}</h4>
                <p style={styles.feedContent}>{req.content}</p>
                <div style={styles.feedCardBottom}>
                  <button 
                    onClick={() => handleLike(req.request_idx)}
                    style={{ 
                      ...styles.likeBtn,
                      // 공감 상태(is_liked)에 따라 색상 자동 변경
                      backgroundColor: req.is_liked ? "#FEF0E9" : "#fff",
                      borderColor: req.is_liked ? "#E86F00" : "#e0e0e0",
                      color: req.is_liked ? "#E86F00" : "#666"
                    }}
                  >
                    공감 {req.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "calc(100vh - 72px)", background: "#f9f9f9", display: "flex", justifyContent: "center", padding: "40px 20px" },
  layout: { display: "flex", gap: 32, width: "100%", maxWidth: 1040, alignItems: "flex-start" },
  leftSection: { flex: "1 1 45%", background: "#fff", border: "1px solid #ede8e2", borderRadius: 12, padding: "40px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", boxSizing: "border-box" },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 },
  subtitle: { fontSize: 14, color: "#666", lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 700, color: "#333" },
  input: { padding: "14px", fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, outline: "none" },
  select: { padding: "14px", fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, outline: "none", background: "#fff", cursor: "pointer" },
  textarea: { padding: "14px", fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, outline: "none", minHeight: 100 },
  toggleWrapper: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  toggleBg: { position: "relative", width: 44, height: 24, borderRadius: 12 },
  toggleKnob: { position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" },
  toggleText: { fontSize: 14, fontWeight: 600, color: "#444" },
  submitBtn: { marginTop: 10, padding: "16px", fontSize: 15, fontWeight: 700, color: "#fff", background: "#E86F00", border: "none", borderRadius: 6, cursor: "pointer" },
  rightSection: { flex: "1 1 55%", display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 150px)" },
  searchWrapper: { position: "relative", width: "100%" },
  searchInput: { width: "100%", padding: "14px 16px", fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 8, outline: "none" },
  feedList: { display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" },
  feedCard: { background: "#fff", border: "1px solid #ede8e2", borderRadius: 12, padding: "24px" },
  feedCardTop: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  feedBadge: { fontSize: 12, fontWeight: 700, color: "#E86F00", background: "#FEF0E9", padding: "4px 10px", borderRadius: 4 },
  feedDate: { fontSize: 12, color: "#999" },
  feedTopic: { fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 },
  feedContent: { fontSize: 14, color: "#555", lineHeight: 1.6 },
  feedCardBottom: { display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f0f0f0", paddingTop: 16 },
  likeBtn: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "0.2s" }
};