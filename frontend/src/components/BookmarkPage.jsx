import { useState, useEffect } from "react";

export default function BookmarkPage({ onBack }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [summaryCase, setSummaryCase] = useState(null);

  useEffect(() => {
    const loadBookmarks = () => {
      setBookmarks(JSON.parse(localStorage.getItem("bookmarks") || "[]"));
    };

    loadBookmarks();

    window.addEventListener("bookmarkUpdated", loadBookmarks);
    return () => window.removeEventListener("bookmarkUpdated", loadBookmarks);
  }, []);

  const getBookmarkKey = (bookmark) => {
    return bookmark.case_idx || bookmark.id || bookmark.rank || bookmark.title;
  };

  const removeBookmark = (targetBookmark) => {
    const targetKey = getBookmarkKey(targetBookmark);

    const updated = bookmarks.filter((bookmark) => {
      return getBookmarkKey(bookmark) !== targetKey;
    });

    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setBookmarks(updated);
    window.dispatchEvent(new Event("bookmarkUpdated"));

    if (summaryCase && getBookmarkKey(summaryCase) === targetKey) {
      setSummaryCase(null);
    }
  };

  const openSummaryModal = (bookmark) => {
    setSummaryCase(bookmark);
  };

  const closeSummaryModal = () => {
    setSummaryCase(null);
  };

  const openOriginalArticle = (bookmark) => {
    if (!bookmark.src_url) {
      alert("원문 링크가 등록되지 않은 케이스입니다.");
      return;
    }

    window.open(bookmark.src_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={styles.pageTitle}>북마크</h2>
          <span style={styles.count}>{bookmarks.length}개</span>
        </div>

        <button style={styles.backBtn} onClick={onBack}>
          ← 탐색으로 돌아가기
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <div style={styles.empty}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ddd"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>

          <p style={styles.emptyText}>저장된 케이스가 없어요</p>
          <p style={styles.emptySubText}>
            케이스 카드의 북마크 아이콘을 눌러 저장해보세요
          </p>

          <button style={styles.goSearchBtn} onClick={onBack}>
            케이스 탐색하러 가기
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {bookmarks.map((bookmark) => {
            const bookmarkKey = getBookmarkKey(bookmark);

            return (
              <div key={bookmarkKey} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.cardTitle}>{bookmark.title}</p>
                    <p style={styles.cardMeta}>
                      {bookmark.company || bookmark.comp_name || "기업명 미등록"}
                    </p>
                  </div>

                  <button
                    style={styles.bookmarkBtn}
                    onClick={() => removeBookmark(bookmark)}
                    title="북마크 해제"
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="#E86F00"
                      stroke="#E86F00"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>

                <div style={styles.cardInfoRow}>
                  <div style={styles.tags}>
                    <span style={styles.tag}>케이스스터디</span>
                    {bookmark.industry && (
                      <span style={styles.tag}>{bookmark.industry}</span>
                    )}
                    {bookmark.date && (
                      <span style={styles.tag}>{bookmark.date}</span>
                    )}
                  </div>
                </div>

                <div style={styles.cardBottom}>
                  <button
                    style={styles.summaryBtn}
                    onClick={() => openSummaryModal(bookmark)}
                  >
                    요약문 바로보기
                  </button>

                  <button
                    style={styles.articleBtn}
                    onClick={() => openOriginalArticle(bookmark)}
                  >
                    DBR 원문 바로가기 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {summaryCase && (
        <SummaryModal
          caseData={summaryCase}
          onClose={closeSummaryModal}
          onOpenOriginal={() => openOriginalArticle(summaryCase)}
        />
      )}
    </div>
  );
}
function formatSummaryParagraphs(summary) {
  if (!summary) return ["등록된 요약문이 없습니다."];

  const normalized = String(summary)
    .replace(/\s+/g, " ")
    .trim();

  const sentences = normalized
    .split(/(?<=[.!?。！？]|다\.|요\.|음\.|됨\.|했다\.|였다\.|한다\.|있다\.|됐다\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return [normalized];
  }

  const paragraphs = [];

  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(" "));
  }

  return paragraphs;
}


function SummaryModal({ caseData, onClose, onOpenOriginal }) {
  return (
    <>
      <div style={styles.modalOverlay} onClick={onClose} />

      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.modalLabel}>케이스 요약</p>
            <h3 style={styles.modalTitle}>{caseData.title}</h3>
            <p style={styles.modalMeta}>
              {caseData.company || caseData.comp_name || "기업명 미등록"}
              {caseData.industry ? ` · ${caseData.industry}` : ""}
              {caseData.date ? ` · ${caseData.date}` : ""}
            </p>
          </div>

          <button style={styles.modalCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.modalBody}>
          {formatSummaryParagraphs(caseData.summary).map((paragraph, index) => (
            <p key={index} style={styles.summaryParagraph}>
              {paragraph}
            </p>
          ))}
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.modalSubBtn} onClick={onClose}>
            닫기
          </button>
          <button style={styles.modalMainBtn} onClick={onOpenOriginal}>
            DBR 원문 바로가기 →
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "2.5rem 2rem",
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  },

  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
    paddingBottom: "1.25rem",
    borderBottom: "2px solid #E86F00",
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: "#1a1a1a",
    margin: 0,
    letterSpacing: "-0.02em",
  },

  count: {
    fontSize: 14,
    color: "#E86F00",
    fontWeight: 700,
    background: "#FEF0E9",
    padding: "4px 11px",
    borderRadius: 20,
  },

  backBtn: {
    fontSize: 14,
    color: "#777",
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: 20,
    padding: "8px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "6rem 2rem",
    border: "1px dashed #e5e5e5",
    borderRadius: 16,
    background: "#fff",
  },

  emptyText: {
    fontSize: 17,
    fontWeight: 700,
    color: "#777",
    margin: 0,
  },

  emptySubText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 1.6,
    margin: 0,
  },

  goSearchBtn: {
    marginTop: 8,
    padding: "11px 22px",
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    background: "#E86F00",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: 18,
  },

  card: {
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: 14,
    padding: "1.3rem",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 3px 12px rgba(0,0,0,0.03)",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#1a1a1a",
    lineHeight: 1.45,
    margin: "0 0 7px",
    letterSpacing: "-0.02em",
  },

  cardMeta: {
    fontSize: 13,
    color: "#999",
    margin: 0,
  },

  bookmarkBtn: {
    background: "#fff7f0",
    border: "1px solid #ffe1c5",
    borderRadius: "50%",
    cursor: "pointer",
    padding: 7,
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardInfoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 2,
  },

  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    minWidth: 0,
  },

  tag: {
    padding: "5px 10px",
    fontSize: 12,
    color: "#666",
    background: "#f3f3f3",
    borderRadius: 4,
    fontWeight: 600,
  },

  cardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginTop: 4,
  },

  summaryBtn: {
    fontSize: 13,
    fontWeight: 800,
    color: "#333",
    background: "#fff",
    border: "1px solid #d9d9d9",
    borderRadius: 4,
    padding: "8px 13px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  articleBtn: {
    fontSize: 13,
    fontWeight: 800,
    color: "#E86F00",
    background: "#FEF0E9",
    border: "none",
    borderRadius: 4,
    padding: "8px 13px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
  },

  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(620px, calc(100vw - 40px))",
    maxHeight: "78vh",
    background: "#fff",
    borderRadius: 16,
    zIndex: 1100,
    boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: "22px 24px 18px",
    borderBottom: "1px solid #f0f0f0",
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#E86F00",
    margin: "0 0 8px",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1a1a1a",
    lineHeight: 1.45,
    margin: "0 0 8px",
    letterSpacing: "-0.03em",
  },

  modalMeta: {
    fontSize: 13,
    color: "#999",
    margin: 0,
  },

  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "#f7f7f7",
    color: "#999",
    cursor: "pointer",
    fontSize: 16,
    flexShrink: 0,
  },

  modalBody: {
    padding: "22px 24px",
    overflowY: "auto",
  },

  summaryText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 1.85,
    margin: 0,
    whiteSpace: "pre-line",
  },

  summaryParagraph: {
  fontSize: 15,
  color: "#333",
  lineHeight: 1.9,
  margin: "0 0 18px",
  letterSpacing: "-0.01em",
  wordBreak: "keep-all",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    padding: "16px 24px",
    borderTop: "1px solid #f0f0f0",
    background: "#fafafa",
  },

  modalSubBtn: {
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 700,
    color: "#666",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  modalMainBtn: {
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    background: "#E86F00",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};