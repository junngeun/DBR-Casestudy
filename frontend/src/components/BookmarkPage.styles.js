// BookmarkPage 의 스타일 정의 (원래 BookmarkPage.jsx 안에 있던 것)
export const styles = {
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
    textAlign: "center",
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