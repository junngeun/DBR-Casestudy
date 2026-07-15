import { useState, useEffect } from "react";
import { styles } from "./BookmarkPage.styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function BookmarkPage({ onBack }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [summaryCase, setSummaryCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBookmarks = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setBookmarks([]);
      setError("북마크는 로그인 후 이용할 수 있습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "북마크 목록을 불러오지 못했습니다.");
      }

      const mappedBookmarks = (data.data || []).map((item) => ({
        bookmark_idx: item.bookmark_idx,
        id: item.case_idx,
        case_idx: item.case_idx,
        title: item.title,
        company: item.comp_name,
        comp_name: item.comp_name,
        industry: item.industry,
        date: item.pub_year ? `${item.pub_year}년` : "",
        summary: item.summary,
        src_url: item.src_url,

        chapter_title: item.chapter_title,
        issue_no: item.issue_no,
        pub_year: item.pub_year,
        comp_size: item.comp_size,
        prob_main: item.prob_main,
        prob_keyword: item.prob_keyword,
        prob_def: item.prob_def,
        sol_type: item.sol_type,
        sol_detail: item.sol_detail,
        perf_type: item.perf_type,
        perf_dir: item.perf_dir,
        x: item.x,
        y: item.y,
        bookmarked_at: item.bookmarked_at,
      }));

      setBookmarks(mappedBookmarks);
    } catch (error) {
      console.error("북마크 목록 조회 실패:", error);
      setError(error.message || "북마크 목록 조회 중 오류가 발생했습니다.");
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();

    const handleUpdate = () => {
      loadBookmarks();
    };

    window.addEventListener("bookmarkUpdated", handleUpdate);
    return () => window.removeEventListener("bookmarkUpdated", handleUpdate);
  }, []);

  const getBookmarkKey = (bookmark) => {
    return bookmark.case_idx || bookmark.id || bookmark.bookmark_idx || bookmark.title;
  };

  const removeBookmark = async (targetBookmark) => {
    const token = localStorage.getItem("token");
    const caseIdx = targetBookmark.case_idx || targetBookmark.id;

    if (!token) {
      alert("북마크는 로그인 후 이용할 수 있습니다.");
      return;
    }

    if (!caseIdx) {
      alert("삭제할 케이스 정보를 찾지 못했습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/${caseIdx}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "북마크 삭제에 실패했습니다.");
      }

      const targetKey = getBookmarkKey(targetBookmark);

      setBookmarks((prev) =>
        prev.filter((bookmark) => getBookmarkKey(bookmark) !== targetKey)
      );

      if (summaryCase && getBookmarkKey(summaryCase) === targetKey) {
        setSummaryCase(null);
      }

      window.dispatchEvent(new Event("bookmarkUpdated"));
    } catch (error) {
      console.error("북마크 삭제 실패:", error);
      alert(error.message || "북마크 삭제 중 오류가 발생했습니다.");
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

      {loading ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>북마크를 불러오는 중이에요</p>
          <p style={styles.emptySubText}>잠시만 기다려주세요.</p>
        </div>
      ) : error ? (
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

          <p style={styles.emptyText}>{error}</p>
          <p style={styles.emptySubText}>
            로그인 후 다시 이용해주세요.
          </p>

          <button style={styles.goSearchBtn} onClick={onBack}>
            케이스 탐색으로 돌아가기
          </button>
        </div>
      ) : bookmarks.length === 0 ? (
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

