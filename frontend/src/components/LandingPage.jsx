import { useState, useEffect } from "react";
import { Search, Map, Bookmark } from "lucide-react";
import { styles, ORANGE, ORANGE_DARK } from "./LandingPage.styles";


const STATS = [
  { num: "120+ 케이스", label: "DBR 케이스 스터디 지금 바로 탐색 가능" },

  { num: "2021–2026", label: "최신 트렌드까지 커버" },
  { num: "3번이면 충분", label: "원하는 케이스까지" },
  { num: "상위 5건", label: "핵심만 추려서" },
];

const FEATURES = [
  {
    icon: <Search size={18} color={ORANGE} />,
    title: "자연어 검색",
    desc: "키워드 없이도 상황을 설명하면 관련 케이스를 찾아드립니다.",
  },
  {
    icon: <Map size={18} color={ORANGE} />,
    title: "클러스터 맵",
    desc: "케이스 간의 관계를 시각적으로 탐색할 수 있습니다.",
  },
  {
    icon: <Bookmark size={18} color={ORANGE} />,
    title: "맞춤 추천",
    desc: "전략, 마케팅, 신사업 등 실무 목적에 맞는 케이스를 추천합니다.",
  },
];

function LogoIcon() {
  return (
    <div style={styles.logoIcon}>
      <svg viewBox="0 0 18 18" fill="none" width={18} height={18}>
        <circle cx="9" cy="9" r="3" fill="white" opacity="0.9" />
        <path
          d="M9 3 L9 1M9 17 L9 15M3 9 L1 9M17 9 L15 9M4.5 4.5 L3 3M15 15 L13.5 13.5M13.5 4.5 L15 3M3 15 L4.5 13.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

export default function LandingPage({ onStart, onAbout }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [primaryHover, setPrimaryHover] = useState(false);
  const [secondaryHover, setSecondaryHover] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={styles.landing}>
      {/* Nav
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <LogoIcon />
          <div>
            <div style={styles.logoText}>DBR Case Atlas</div>
            <div style={styles.logoSub}>Route Finders</div>
          </div>
        </div>
        <div style={styles.navBadge}>Beta v0.1</div>
      </nav> */}

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroEyebrow}>AI 기반 케이스 스터디 탐색 서비스</div>
        <h1 style={styles.heroTitle}>
          원하는 케이스를<br />
          <span style={{ color: ORANGE }}>3번의 클릭</span>으로
        </h1>
        <p style={styles.heroDesc}>
          자연어로 상황을 입력하면 DBR 아카이브에서<br />
          관련 케이스 스터디를 찾아드립니다.
        </p>
        <div style={styles.heroActions}>
          <button
            style={{ ...styles.btnPrimary, opacity: primaryHover ? 0.82 : 1 }}
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            onClick={onStart}
          >
            케이스 탐색 시작
          </button>
          <button
            style={{
              ...styles.btnSecondary,
              background: secondaryHover ? "#faf7f4" : "transparent",
            }}
            onMouseEnter={() => setSecondaryHover(true)}
            onMouseLeave={() => setSecondaryHover(false)}
            onClick={onAbout}
          >
            서비스 소개 보기
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              ...styles.statItem,
              ...(i === STATS.length - 1 ? { borderRight: "none" } : {}),
            }}
          >
            <div style={styles.statNum}>{s.num}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div style={styles.features}>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            style={{
              ...styles.featureCard,
            }}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.featureIcon}>{f.icon}</div>
            <div style={styles.featureTitle}>{f.title}</div>
            <div style={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA bar
      <div style={styles.ctaBar}>
        <div style={styles.ctaText}>
          <strong style={{ color: "#1a1a1a" }}>DBR 아카이브 기반</strong>
          {" — Voice from the Field 포함, 2021–2026 콘텐츠 전체 커버"}
        </div>
        <button
          style={{ ...styles.btnPrimary, background: primaryHover ? ORANGE_DARK : ORANGE }}
          onClick={onStart}
        >
          다음 화면 만들기 ↗
        </button>
      </div> */}
    </div>
  );
}
