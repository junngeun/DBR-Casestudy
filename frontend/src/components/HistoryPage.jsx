import { useMemo, useState, useEffect } from "react";
import { styles } from "./HistoryPage.styles";

export default function HistoryPage({ onBack }) {
  const [history, setHistory] = useState([]);
  const [summaryCase, setSummaryCase] = useState(null);
  const [detailCase, setDetailCase] = useState(null);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("caseHistory") || "[]");
    setHistory(saved);
  }, []);

  const getCaseKey = (item) => String(item?.case_idx ?? item?.id ?? item?.title ?? "");

  const getHistoryItemKey = (item) => {
    const caseKey = getCaseKey(item);
    const viewSource = item?.view_source || item?._view_source || "unknown";
    const queryText = item?.query_text || item?._query_text || "";
    const queryIdx = item?.query_idx || item?._query_idx || "";
    const viewedAt = item?.viewed_at || item?.viewedAt || "";

    return [caseKey, viewSource, queryIdx || queryText || "no-query", viewedAt].join("__");
  };

  const getQueryText = (item) => {
    const value =
      item?.query_text ||
      item?._query_text ||
      item?.raw_query_text ||
      item?.search_query ||
      item?._search_query ||
      "";

    return String(value).trim();
  };

  const getSearchDateText = (item) => {
    const raw = item?.searched_at || item?._searched_at || item?.created_at || item?.viewed_at;

    if (raw) {
      const date = new Date(raw);
      if (!Number.isNaN(date.getTime())) {
        return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
    }

    return item?.viewedAt || "";
  };

  const getViewSource = (item) => item?.view_source || item?._view_source || "unknown";

  const isSearchBasedItem = (item) => {
    const source = getViewSource(item);
    const queryText = getQueryText(item);

    // 검색어가 없는 과거 기록은 검색 기반으로 묶지 않는다.
    // 새로 저장되는 추천/케이스맵 기록부터 검색어 기준으로 그룹화된다.
    return ["recommend", "map"].includes(source) && Boolean(queryText);
  };

  const getSourceLabel = (source) => {
    const labelMap = {
      recommend: "추천 결과",
      map: "케이스맵",
      popular: "많이 저장한 케이스",
      archive: "전체 케이스",
      bookmark: "북마크",
      unknown: "일반 탐색",
    };

    return labelMap[source] || "일반 탐색";
  };

  const getSourceStyle = (source) => {
    if (["recommend", "map"].includes(source)) return styles.sourceBadgeSearch;
    if (source === "popular") return styles.sourceBadgePopular;
    return styles.sourceBadgeDefault;
  };

  const searchHistory = useMemo(() => {
    return history.filter(isSearchBasedItem);
  }, [history]);

  const generalHistory = useMemo(() => {
    return history.filter((item) => !isSearchBasedItem(item));
  }, [history]);

  const searchGroups = useMemo(() => {
    const groupMap = new Map();

    searchHistory.forEach((item) => {
      const queryText = getQueryText(item);
      const queryIdx = item.query_idx || item._query_idx || "";
      const groupKey = queryIdx ? `query:${queryIdx}` : `text:${queryText}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          key: groupKey,
          queryText,
          searchDate: getSearchDateText(item),
          items: [],
        });
      }

      groupMap.get(groupKey).items.push(item);
    });

    return Array.from(groupMap.values());
  }, [searchHistory]);

  const displayedHistory = activeTab === "search" ? searchHistory : generalHistory;

  const clearHistory = () => {
    localStorage.removeItem("caseHistory");
    setHistory([]);
    setSummaryCase(null);
    setDetailCase(null);
  };

  const removeItem = (targetItem) => {
    const targetKey = getHistoryItemKey(targetItem);
    const updated = history.filter((item) => getHistoryItemKey(item) !== targetKey);

    localStorage.setItem("caseHistory", JSON.stringify(updated));
    setHistory(updated);

    if (summaryCase && getHistoryItemKey(summaryCase) === targetKey) {
      setSummaryCase(null);
    }

    if (detailCase && getHistoryItemKey(detailCase) === targetKey) {
      setDetailCase(null);
    }
  };

  const openOriginalArticle = (item) => {
    if (!item.src_url) {
      alert("원문 링크가 등록되지 않은 케이스입니다.");
      return;
    }
    window.open(item.src_url, "_blank", "noopener,noreferrer");
  };

  const renderSourceBadge = (item) => {
    const source = getViewSource(item);

    return (
      <span style={{ ...styles.sourceBadge, ...getSourceStyle(source) }}>
        {getSourceLabel(source)}
      </span>
    );
  };

  const renderSearchGroup = (group) => (
    <div key={group.key} style={styles.searchGroupCard}>
      <div style={styles.searchGroupHeader}>
        <div style={{ minWidth: 0 }}>
          <p style={styles.searchGroupLabel}>검색어</p>
          <h3 style={styles.searchGroupTitle}>{group.queryText}</h3>
        </div>
        {group.searchDate && <span style={styles.searchGroupDate}>{group.searchDate}</span>}
      </div>

      <div style={styles.searchCaseList}>
        {group.items.map((item) => (
          <div
            key={getHistoryItemKey(item)}
            style={styles.searchCaseRow}
            onClick={() => setDetailCase(item)}
          >
            <div style={styles.searchCaseMain}>
              <div style={styles.searchCaseTitleLine}>
                {renderSourceBadge(item)}
                <p style={styles.searchCaseTitle}>{item.title}</p>
              </div>
              <p style={styles.searchCaseMeta}>{item.company || item.comp_name || "기업명 미등록"}</p>
            </div>

            <div style={styles.searchCaseRight}>
              <span style={styles.viewedAt}>{item.viewedAt}</span>
              <button
                style={styles.rowSummaryBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSummaryCase(item);
                }}
              >
                요약
              </button>
              <button
                style={styles.rowArticleBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  openOriginalArticle(item);
                }}
              >
                원문
              </button>
              <button
                style={styles.rowRemoveBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item);
                }}
                title="기록 삭제"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGeneralCard = (item) => (
    <div
      key={getHistoryItemKey(item)}
      style={styles.card}
      onClick={() => setDetailCase(item)}
    >
      <div style={styles.cardTop}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 8 }}>{renderSourceBadge(item)}</div>
          <p style={styles.cardTitle}>{item.title}</p>
          <p style={styles.cardMeta}>{item.company || item.comp_name || "기업명 미등록"}</p>
        </div>
        <button
          style={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            removeItem(item);
          }}
          title="기록 삭제"
        >
          ✕
        </button>
      </div>

      <div style={styles.cardInfoRow}>
        <div style={styles.tags}>
          <span style={styles.tag}>케이스스터디</span>
          {item.industry && <span style={styles.tag}>{item.industry}</span>}
          {item.date && <span style={styles.tag}>{item.date}</span>}
        </div>
        <span style={styles.viewedAt}>{item.viewedAt}</span>
      </div>

      <div style={styles.cardBottom}>
        <button
          style={styles.summaryBtn}
          onClick={(e) => {
            e.stopPropagation();
            setSummaryCase(item);
          }}
        >
          요약문 바로보기
        </button>
        <button
          style={styles.articleBtn}
          onClick={(e) => {
            e.stopPropagation();
            openOriginalArticle(item);
          }}
        >
          DBR 원문 바로가기 →
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={styles.pageTitle}>최근 본 케이스</h2>
          <span style={styles.count}>{history.length}개</span>
        </div>
        <button style={styles.backBtn} onClick={onBack}>
          ← 탐색으로 돌아가기
        </button>
      </div>

      {history.length === 0 ? (
        <div style={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p style={styles.emptyText}>최근 본 케이스가 없어요</p>
          <p style={styles.emptySubText}>케이스를 클릭하면 여기에 기록이 남아요</p>
          <button style={styles.goSearchBtn} onClick={onBack}>
            케이스 탐색하러 가기
          </button>
        </div>
      ) : (
        <>
          <div style={styles.historyToolbar}>
            <div style={styles.tabGroup}>
              <button
                style={activeTab === "search" ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab("search")}
              >
                검색 기반 <span style={styles.tabCount}>{searchHistory.length}</span>
              </button>
              <button
                style={activeTab === "general" ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab("general")}
              >
                일반 탐색 <span style={styles.tabCount}>{generalHistory.length}</span>
              </button>
            </div>

            <button onClick={clearHistory} style={styles.clearBtn}>
              전체 삭제
            </button>
          </div>

          {displayedHistory.length === 0 ? (
            <div style={styles.emptySmall}>
              <p style={styles.emptyTextSmall}>
                {activeTab === "search"
                  ? "검색 결과에서 본 케이스가 없어요"
                  : "일반 탐색으로 본 케이스가 없어요"}
              </p>
            </div>
          ) : activeTab === "search" ? (
            <div style={styles.searchGroupList}>
              {searchGroups.map(renderSearchGroup)}
            </div>
          ) : (
            <div style={styles.grid}>
              {generalHistory.map(renderGeneralCard)}
            </div>
          )}
        </>
      )}

      {detailCase && (
        <HistoryDetailPanel
          caseData={detailCase}
          sourceLabel={getSourceLabel(getViewSource(detailCase))}
          queryText={getQueryText(detailCase)}
          searchDate={getSearchDateText(detailCase)}
          onClose={() => setDetailCase(null)}
          onOpenSummary={() => setSummaryCase(detailCase)}
          onOpenOriginal={() => openOriginalArticle(detailCase)}
        />
      )}

      {summaryCase && (
        <SummaryModal
          caseData={summaryCase}
          onClose={() => setSummaryCase(null)}
          onOpenOriginal={() => openOriginalArticle(summaryCase)}
        />
      )}
    </div>
  );
}

function formatSummaryParagraphs(summary) {
  if (!summary) return ["등록된 요약문이 없습니다."];
  const normalized = String(summary).replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?。！？]|다\.|요\.|음\.|됨\.|했다\.|였다\.|한다\.|있다\.|됐다\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return [normalized];
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(" "));
  }
  return paragraphs;
}

function HistoryDetailPanel({
  caseData,
  sourceLabel,
  queryText,
  searchDate,
  onClose,
  onOpenSummary,
  onOpenOriginal,
}) {
  const recommendationReason = caseData.reco_reason || caseData.reason || "";
  const personalStrategy = caseData.personal_strategy || "";

  return (
    <aside style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        <div style={{ minWidth: 0 }}>
          <p style={styles.detailLabel}>최근 본 케이스 상세</p>
          <h3 style={styles.detailTitle}>{caseData.title}</h3>
          <p style={styles.detailMeta}>
            {caseData.company || caseData.comp_name || "기업명 미등록"}
            {caseData.industry ? ` · ${caseData.industry}` : ""}
            {caseData.date ? ` · ${caseData.date}` : ""}
          </p>
        </div>
        <button style={styles.detailCloseBtn} onClick={onClose}>✕</button>
      </div>

      <div style={styles.detailBody}>
        <div style={styles.detailBadgeRow}>
          <span style={styles.detailSourceBadge}>{sourceLabel}</span>
          {caseData.viewedAt && <span style={styles.detailViewedAt}>최근 열람 {caseData.viewedAt}</span>}
        </div>

        {queryText && (
          <section style={styles.detailSectionSoft}>
            <p style={styles.detailSectionLabel}>당시 검색어</p>
            <p style={styles.detailQueryText}>{queryText}</p>
            {searchDate && <p style={styles.detailSearchDate}>{searchDate} 검색</p>}
          </section>
        )}

        <section style={styles.detailSection}>
          <p style={styles.detailSectionTitle}>문제 상황</p>
          <p style={caseData.prob_def ? styles.detailParagraph : styles.detailEmptyText}>
            {caseData.prob_def || "등록된 문제 상황이 없습니다."}
          </p>
        </section>

        <section style={styles.detailSection}>
          <p style={styles.detailSectionTitle}>해결 전략</p>
          <p style={caseData.sol_detail ? styles.detailParagraph : styles.detailEmptyText}>
            {caseData.sol_detail || "등록된 해결 전략이 없습니다."}
          </p>
        </section>

        <section style={styles.detailSection}>
          <p style={styles.detailSectionTitle}>당시 추천 이유</p>
          <p style={recommendationReason ? styles.detailParagraph : styles.detailEmptyText}>
            {recommendationReason || "저장된 추천 이유가 없습니다. 추천 결과나 케이스맵에서 새로 열람한 기록부터 추천 이유가 함께 저장됩니다."}
          </p>
        </section>

        <section style={styles.detailSection}>
          <p style={styles.detailSectionTitle}>당시 맞춤 전략</p>
          <p style={personalStrategy ? styles.detailStrategyText : styles.detailEmptyText}>
            {personalStrategy || "저장된 맞춤 전략이 없습니다. ‘내 상황에 적용하기’로 생성된 추천 케이스를 열람하면 맞춤 전략이 함께 저장됩니다."}
          </p>
        </section>
      </div>

      <div style={styles.detailFooter}>
        <button style={styles.modalSubBtn} onClick={onOpenSummary}>요약문 보기</button>
        <button style={styles.modalMainBtn} onClick={onOpenOriginal}>DBR 원문 바로가기 →</button>
      </div>
    </aside>
  );
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
          <button style={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>
          {formatSummaryParagraphs(caseData.summary).map((paragraph, index) => (
            <p key={index} style={styles.summaryParagraph}>{paragraph}</p>
          ))}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.modalSubBtn} onClick={onClose}>닫기</button>
          <button style={styles.modalMainBtn} onClick={onOpenOriginal}>DBR 원문 바로가기 →</button>
        </div>
      </div>
    </>
  );
}

