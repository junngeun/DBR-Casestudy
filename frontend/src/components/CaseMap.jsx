import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

/**
 * DBR Case Atlas — CaseMap
 *
 * 1) 기존 산점도: DB에 저장된 x, y 좌표 사용
 * 2) 검색 결과 맵: 추천 API가 내려준 dynamic_x, dynamic_y 좌표 사용
 *
 * 핵심 원칙:
 * - 기존 x/y는 건드리지 않는다.
 * - 검색 결과 맵은 고정 X/Y축이 아니라 “현재 검색어 기준 유사도 맵”이다.
 * - 두 모드 모두 줌/드래그를 지원한다.
 * - 케이스 클릭 시 기존 상세 패널(onCaseClick)과 연동한다.
 */

const PROBLEM_AXIS = [
  { key: "고객", value: 150 },
  { key: "성장", value: 380 },
  { key: "효율", value: 620 },
  { key: "혁신", value: 850 },
];

const STRATEGY_AXIS = [
  { key: "운영 효율화", short: "운영 효율화", value: 120 },
  { key: "제품·서비스 개선", short: "제품 개선", value: 270 },
  { key: "사용자 유지", short: "사용자 유지", value: 400 },
  { key: "수익화", short: "수익화", value: 530 },
  { key: "마케팅·브랜딩", short: "마케팅·브랜딩", value: 660 },
  { key: "플랫폼 활용", short: "플랫폼 활용", value: 800 },
  { key: "기술 도입", short: "기술 도입", value: 920 },
];

const PROBLEM_COLORS = {
  고객: "#2563EB",
  성장: "#16A34A",
  효율: "#F59E0B",
  혁신: "#9333EA",
  기타: "#9CA3AF",
};

function getProblemColor(probMain) {
  return PROBLEM_COLORS[probMain] || PROBLEM_COLORS.기타;
}

function findNearestLabel(value, axis) {
  if (!Number.isFinite(value)) return "-";

  let nearest = axis[0];

  axis.forEach((item) => {
    if (Math.abs(item.value - value) < Math.abs(nearest.value - value)) {
      nearest = item;
    }
  });

  return nearest?.key ?? "-";
}

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function truncateText(text, maxLength = 18) {
  const value = String(text || "-");
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function normalizeCase(item, index) {
  const id = item.case_idx ?? item.id ?? index + 1;

  const rawX = toFiniteNumber(item.x);
  const rawY = toFiniteNumber(item.y);
  const rawDynamicX = toFiniteNumber(item.dynamic_x ?? item.dynamicX);
  const rawDynamicY = toFiniteNumber(item.dynamic_y ?? item.dynamicY);

  return {
    ...item,
    id,
    case_idx: item.case_idx ?? id,
    title: item.title || "제목 없음",
    company: item.company || item.comp_name || "-",
    industry: item.industry || "-",
    prob_main: item.prob_main || "기타",
    prob_keyword: item.prob_keyword || "",
    prob_def: item.prob_def || "",
    sol_type: item.sol_type || "기타",
    sol_detail: item.sol_detail || "",
    perf_type: item.perf_type || "",
    perf_dir: item.perf_dir || "",
    summary: item.summary || "",
    similarity: item.similarity ?? null,
    rank: item.rank ?? item.ranking ?? null,
    isRecommended: item.isRecommended ?? item.is_recommended ?? false,
    map_group: item.map_group || (item.isRecommended || item.is_recommended ? "recommended" : "candidate"),
    map_distance: item.map_distance ?? null,
    map_rank: item.map_rank ?? item.mapRank ?? null,
    map_angle: item.map_angle ?? item.mapAngle ?? null,

    mapX: rawX ?? 500,
    mapY: rawY ?? 500,
    dynamicX: rawDynamicX,
    dynamicY: rawDynamicY,
  };
}

export default function CaseMap({
  cases = [],
  mapCandidates = [],
  highlightedIds = [],
  focusCaseId = null,
  onCaseClick,
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null);
  const currentTransformRef = useRef({
    scatter: d3.zoomIdentity,
    dynamic: d3.zoomIdentity,
  });
  const onCaseClickRef = useRef(onCaseClick);

  const [viewMode, setViewMode] = useState("scatter");
  const [hoveredCase, setHoveredCase] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentArea, setCurrentArea] = useState({
    problem: "중앙",
    strategy: "중앙",
  });
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    onCaseClickRef.current = onCaseClick;
  }, [onCaseClick]);

  const scatterCases = useMemo(() => {
    return cases.map((item, index) => normalizeCase(item, index));
  }, [cases]);

  const dynamicCases = useMemo(() => {
    const source = mapCandidates.length > 0 ? mapCandidates : [];

    return source
      .map((item, index) => normalizeCase(item, index))
      .filter((item) => Number.isFinite(item.dynamicX) && Number.isFinite(item.dynamicY));
  }, [mapCandidates]);

  const highlightedIdSet = useMemo(() => {
    return new Set(highlightedIds.map(String));
  }, [highlightedIds]);

  const isRecommended = useCallback(
    (item) => {
      return (
        item.isRecommended === true ||
        item.is_recommended === true ||
        item.map_group === "recommended" ||
        highlightedIdSet.has(String(item.id)) ||
        highlightedIdSet.has(String(item.case_idx)) ||
        (item.similarity !== null && item.similarity !== undefined)
      );
    },
    [highlightedIdSet]
  );

  const getTopRank = useCallback(
    (item) => {
      const ownRank = Number(item.rank ?? item.ranking);

      if (Number.isFinite(ownRank) && ownRank >= 1 && ownRank <= 5) {
        return ownRank;
      }

      const id = String(item.id);
      const caseIdx = String(item.case_idx);

      const indexById = highlightedIds.map(String).findIndex(
        (target) => target === id || target === caseIdx
      );

      if (indexById >= 0 && indexById < 5) {
        return indexById + 1;
      }

      return null;
    },
    [highlightedIds]
  );

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;

      setDimensions({
        width,
        height: 700,
      });
    });

    if (containerRef.current) obs.observe(containerRef.current);

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    if (viewMode === "dynamic") {
      renderDynamicMap();
    } else {
      renderScatterMap();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, scatterCases, dynamicCases, highlightedIds, dimensions]);

  useEffect(() => {
    if (!focusCaseId || !svgRef.current || !zoomRef.current) return;

    const sourceCases = viewMode === "dynamic" ? dynamicCases : scatterCases;

    const targetCase = sourceCases.find((item) => {
      const itemId = String(item.id);
      const caseIdx = String(item.case_idx);

      return itemId === String(focusCaseId) || caseIdx === String(focusCaseId);
    });

    if (!targetCase) return;

    const { width, height } = dimensions;
    const margin = viewMode === "dynamic"
      ? { top: 40, right: 40, bottom: 54, left: 40 }
      : { top: 28, right: 28, bottom: 58, left: 120 };

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    if (innerW <= 0 || innerH <= 0) return;

    const xScale = d3.scaleLinear().domain([0, 1000]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 1000]).range([innerH, 0]);

    const targetX = viewMode === "dynamic" ? xScale(targetCase.dynamicX) : xScale(targetCase.mapX);
    const targetY = viewMode === "dynamic" ? yScale(targetCase.dynamicY) : yScale(targetCase.mapY);
    const targetScale = viewMode === "dynamic" ? 1.4 : 1.5;

    const nextTransform = d3.zoomIdentity
      .translate(innerW / 2 - targetX * targetScale, innerH / 2 - targetY * targetScale)
      .scale(targetScale);

    currentTransformRef.current[viewMode] = nextTransform;

    d3.select(svgRef.current)
      .transition()
      .duration(650)
      .call(zoomRef.current.transform, nextTransform);
  }, [focusCaseId, scatterCases, dynamicCases, dimensions, viewMode]);

  const setTooltipFromEvent = (event) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    setTooltipPos({
      x: event.clientX - rect.left + 14,
      y: event.clientY - rect.top + 14,
    });
  };

  const renderScatterMap = () => {
    const { width, height } = dimensions;

    const margin = {
      top: 28,
      right: 28,
      bottom: 58,
      left: 120,
    };

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const xScale = d3.scaleLinear().domain([0, 1000]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 1000]).range([innerH, 0]);

    const root = svg.append("g");

    const clipId = `case-map-clip-${Math.random().toString(36).slice(2)}`;

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerW)
      .attr("height", innerH);

    const axisLayer = root
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const viewport = root
      .append("g")
      .attr("clip-path", `url(#${clipId})`);

    const mapLayer = viewport
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    axisLayer
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "#fafafa");

    for (let x = 100; x <= 900; x += 100) {
      axisLayer
        .append("line")
        .attr("x1", xScale(x))
        .attr("y1", 0)
        .attr("x2", xScale(x))
        .attr("y2", innerH)
        .attr("stroke", "#f0f0f0")
        .attr("stroke-width", 0.5);
    }

    for (let y = 100; y <= 900; y += 100) {
      axisLayer
        .append("line")
        .attr("x1", 0)
        .attr("y1", yScale(y))
        .attr("x2", innerW)
        .attr("y2", yScale(y))
        .attr("stroke", "#f0f0f0")
        .attr("stroke-width", 0.5);
    }

    mapLayer
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .style("cursor", "grab");

    axisLayer
      .append("line")
      .attr("x1", 0)
      .attr("y1", innerH)
      .attr("x2", innerW)
      .attr("y2", innerH)
      .attr("stroke", "#d9d9d9")
      .attr("stroke-width", 1);

    axisLayer
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", innerH)
      .attr("stroke", "#d9d9d9")
      .attr("stroke-width", 1);

    PROBLEM_AXIS.forEach((item) => {
      axisLayer
        .append("text")
        .attr("x", xScale(item.value))
        .attr("y", innerH + 24)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("font-weight", 700)
        .attr("fill", getProblemColor(item.key))
        .text(item.key);
    });

    STRATEGY_AXIS.forEach((item) => {
      axisLayer
        .append("line")
        .attr("x1", -5)
        .attr("y1", yScale(item.value))
        .attr("x2", 0)
        .attr("y2", yScale(item.value))
        .attr("stroke", "#cfcfcf")
        .attr("stroke-width", 0.8);

      axisLayer
        .append("text")
        .attr("x", -12)
        .attr("y", yScale(item.value) + 4)
        .attr("text-anchor", "end")
        .attr("font-size", 14)
        .attr("font-weight", 500)
        .attr("fill", "#666")
        .text(item.short);
    });

    axisLayer
      .append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 48)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#aaa")
      .text("X축: 문제 유형");

    axisLayer
      .append("text")
      .attr("transform", `translate(${-62}, ${innerH / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#aaa")
      .text("Y축: 전략 유형");

    const guideLayer = mapLayer.append("g");

    PROBLEM_AXIS.forEach((item) => {
      guideLayer
        .append("line")
        .attr("x1", xScale(item.value))
        .attr("y1", 0)
        .attr("x2", xScale(item.value))
        .attr("y2", innerH)
        .attr("stroke", "#e1e1e1")
        .attr("stroke-width", 0.9)
        .attr("stroke-dasharray", "3,5");
    });

    STRATEGY_AXIS.forEach((item) => {
      guideLayer
        .append("line")
        .attr("x1", 0)
        .attr("y1", yScale(item.value))
        .attr("x2", innerW)
        .attr("y2", yScale(item.value))
        .attr("stroke", "#eaeaea")
        .attr("stroke-width", 0.7)
        .attr("stroke-dasharray", "3,5");
    });

    const nodeLayer = mapLayer.append("g");

    renderCaseNodes({
      nodeLayer,
      data: scatterCases,
      xAccessor: (d) => xScale(d.mapX),
      yAccessor: (d) => yScale(d.mapY),
      mode: "scatter",
    });

    const updateCurrentArea = (transform) => {
      const centerX = xScale.invert((innerW / 2 - transform.x) / transform.k);
      const centerY = yScale.invert((innerH / 2 - transform.y) / transform.k);

      setCurrentArea({
        problem: findNearestLabel(centerX, PROBLEM_AXIS),
        strategy: findNearestLabel(centerY, STRATEGY_AXIS),
      });
    };

    const zoom = d3.zoom()
      .scaleExtent([0.75, 8])
      .translateExtent([
        [-innerW * 0.9, -innerH * 0.9],
        [innerW * 1.9, innerH * 1.9],
      ])
      .on("start", () => {
        mapLayer.select("rect").style("cursor", "grabbing");
      })
      .on("zoom", (event) => {
        currentTransformRef.current.scatter = event.transform;

        mapLayer.attr(
          "transform",
          `translate(${margin.left},${margin.top}) ${event.transform}`
        );

        setZoomLevel(Math.round(event.transform.k * 100));
        updateCurrentArea(event.transform);
      })
      .on("end", () => {
        mapLayer.select("rect").style("cursor", "grab");
      });

    zoomRef.current = zoom;

    svg.call(zoom);
    svg.call(zoom.transform, currentTransformRef.current.scatter);
  };

  const renderDynamicMap = () => {
    const { width, height } = dimensions;

    const margin = {
      top: 42,
      right: 46,
      bottom: 56,
      left: 46,
    };

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const xScale = d3.scaleLinear().domain([0, 1000]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 1000]).range([innerH, 0]);

    const root = svg.append("g");
    const clipId = `dynamic-map-clip-${Math.random().toString(36).slice(2)}`;

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", innerW)
      .attr("height", innerH);

    root
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#fbfbfb");

    const viewport = root
      .append("g")
      .attr("clip-path", `url(#${clipId})`);

    const mapLayer = viewport
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    mapLayer
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .style("cursor", "grab");

    const guideLayer = mapLayer.append("g").attr("class", "dynamic-guide");
    const centerX = xScale(500);
    const centerY = yScale(500);
    const maxRadius = Math.min(innerW, innerH) * 0.42;

    // 은은한 유사도 거리 링. 순위가 높을수록 중심에 가깝게 배치된다.
    [0.25, 0.5, 0.75, 1].forEach((ratio) => {
      guideLayer
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", maxRadius * ratio)
        .attr("fill", "none")
        .attr("stroke", ratio === 1 ? "#dddddd" : "#eeeeee")
        .attr("stroke-width", ratio === 1 ? 1.1 : 0.8)
        .attr("stroke-dasharray", ratio === 1 ? "3,6" : "2,7");
    });

    guideLayer
      .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", 5)
      .attr("fill", "#E86F00")
      .attr("fill-opacity", 0.95);

    guideLayer
      .append("text")
      .attr("x", centerX)
      .attr("y", centerY - 16)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 800)
      .attr("fill", "#E86F00")
      .text("현재 고민 중심");

    guideLayer
      .append("text")
      .attr("x", centerX)
      .attr("y", centerY + maxRadius + 24)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#9ca3af")
      .text("가까울수록 현재 입력한 문제와 유사한 케이스입니다.");

    const nodeLayer = mapLayer.append("g").attr("class", "dynamic-node-layer");

    renderCaseNodes({
      nodeLayer,
      data: dynamicCases,
      xAccessor: (d) => xScale(d.dynamicX),
      yAccessor: (d) => yScale(d.dynamicY),
      mode: "dynamic",
    });

    const zoom = d3.zoom()
      .scaleExtent([0.85, 5.2])
      .translateExtent([
        [-innerW * 0.7, -innerH * 0.7],
        [innerW * 1.7, innerH * 1.7],
      ])
      .on("start", () => {
        mapLayer.select("rect").style("cursor", "grabbing");
      })
      .on("zoom", (event) => {
        currentTransformRef.current.dynamic = event.transform;

        mapLayer.attr(
          "transform",
          `translate(${margin.left},${margin.top}) ${event.transform}`
        );

        setZoomLevel(Math.round(event.transform.k * 100));
        setCurrentArea({
          problem: "현재 고민",
          strategy: "유사도 거리",
        });
      })
      .on("end", () => {
        mapLayer.select("rect").style("cursor", "grab");
      });

    zoomRef.current = zoom;

    svg.call(zoom);
    svg.call(zoom.transform, currentTransformRef.current.dynamic);
  };

  const renderCaseNodes = ({ nodeLayer, data, xAccessor, yAccessor, mode }) => {
    const isDynamicRecommended = (item) => {
      const rank = Number(item.rank ?? item.ranking);
      return item.map_group === "recommended" || item.isRecommended === true || item.is_recommended === true || (Number.isFinite(rank) && rank >= 1 && rank <= 5);
    };

    const isDynamicTop20 = (item) => {
      const mapRank = Number(item.map_rank ?? item.mapRank);
      if (Number.isFinite(mapRank)) return mapRank >= 1 && mapRank <= 20;
      const rank = Number(item.rank ?? item.ranking);
      return Number.isFinite(rank) && rank >= 1 && rank <= 20;
    };

    const isNodeRecommended = (item) => {
      return mode === "dynamic" ? isDynamicRecommended(item) : isRecommended(item);
    };

    const getNodeRank = (item) => {
      if (mode === "dynamic") {
        const rank = Number(item.rank ?? item.ranking);
        return Number.isFinite(rank) && rank >= 1 && rank <= 5 ? rank : null;
      }
      return getTopRank(item);
    };

    const recommendedData = data.filter(isNodeRecommended);

    const resetNodeStyles = () => {
      nodeLayer
        .selectAll(".case-node")
        .attr("r", (d) => {
          if (mode === "dynamic") return isNodeRecommended(d) ? 6.8 : 4.6;
          return isNodeRecommended(d) ? 7.5 : 5.5;
        })
        .attr("fill-opacity", (d) => {
          if (mode === "dynamic") return isNodeRecommended(d) ? 0.96 : 0.58;
          return isNodeRecommended(d) ? 0.96 : 0.62;
        });
    };

    if (mode === "dynamic") {
      // 후보군 점: 예시 이미지처럼 차분한 원형 점으로 표현한다.
      nodeLayer
        .selectAll(".case-node")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "case-node")
        .attr("cx", (d) => xAccessor(d))
        .attr("cy", (d) => yAccessor(d))
        .attr("r", (d) => (isNodeRecommended(d) ? 6.8 : 4.6))
        .attr("fill", (d) => getProblemColor(d.prob_main))
        .attr("fill-opacity", (d) => (isNodeRecommended(d) ? 0.96 : 0.58))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.6)
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          resetNodeStyles();
          setHoveredCase(d);
          setTooltipFromEvent(event);

          d3.select(this)
            .raise()
            .attr("r", isNodeRecommended(d) ? 9.2 : 6.8)
            .attr("fill-opacity", 1);
        })
        .on("mousemove", function (event, d) {
          setHoveredCase(d);
          setTooltipFromEvent(event);
        })
        .on("mouseleave", function () {
          setHoveredCase(null);
          resetNodeStyles();
        })
        .on("click", function (event, d) {
          event.stopPropagation();
          onCaseClickRef.current?.(d);
        });

      // TOP5는 점만 조금 더 선명하게, 과한 검은 링은 제거한다.
      const topNodes = nodeLayer
        .selectAll(".dynamic-top-marker")
        .data(recommendedData.filter((d) => getNodeRank(d) !== null))
        .enter()
        .append("g")
        .attr("class", "dynamic-top-marker")
        .attr("transform", (d) => `translate(${xAccessor(d)},${yAccessor(d)})`)
        .style("pointer-events", "none");

      topNodes
        .append("circle")
        .attr("r", 14)
        .attr("fill", "none")
        .attr("stroke", "#E86F00")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.72);

      topNodes
        .append("text")
        .attr("x", -15)
        .attr("y", -14)
        .attr("font-size", 10)
        .attr("font-weight", 900)
        .attr("fill", "#E86F00")
        .text((d) => `TOP ${getNodeRank(d)}`);

      // 유사도 상위 20개까지는 점 아래에 기업명을 표시한다.
      const labelData = data
        .filter(isDynamicTop20)
        .sort((a, b) => Number(a.map_rank ?? 999) - Number(b.map_rank ?? 999));

      const labels = nodeLayer
        .selectAll(".dynamic-company-label")
        .data(labelData)
        .enter()
        .append("g")
        .attr("class", "dynamic-company-label")
        .attr("transform", (d) => `translate(${xAccessor(d)},${yAccessor(d) + 20})`)
        .style("pointer-events", "none");

      labels
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", (d) => (isNodeRecommended(d) ? 12 : 10.5))
        .attr("font-weight", (d) => (isNodeRecommended(d) ? 800 : 600))
        .attr("fill", (d) => (isNodeRecommended(d) ? "#111827" : "#4b5563"))
        .text((d) => truncateText(d.company, isNodeRecommended(d) ? 9 : 8));

      labels
        .filter((d) => isNodeRecommended(d))
        .append("text")
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("font-weight", 700)
        .attr("fill", "#E86F00")
        .text((d) => truncateText(`${d.prob_main} · ${d.sol_type}`, 15));

      return;
    }

    const recommendedNodes = nodeLayer
      .selectAll(".recommend-ring")
      .data(recommendedData)
      .enter()
      .append("g")
      .attr("class", "recommend-ring")
      .attr("transform", (d) => `translate(${xAccessor(d)},${yAccessor(d)})`);

    recommendedNodes
      .append("circle")
      .attr("r", 15)
      .attr("fill", "none")
      .attr("stroke", "#111827")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.88)
      .style("pointer-events", "none");

    recommendedNodes
      .filter((d) => getNodeRank(d) !== null)
      .append("circle")
      .attr("cx", 0)
      .attr("cy", -20)
      .attr("r", 9)
      .attr("fill", "#ffffff")
      .attr("stroke", "#111827")
      .attr("stroke-width", 1.2)
      .style("pointer-events", "none");

    recommendedNodes
      .filter((d) => getNodeRank(d) !== null)
      .append("text")
      .attr("y", -16.5)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", 800)
      .attr("fill", "#111827")
      .text((d) => getNodeRank(d))
      .style("pointer-events", "none");

    nodeLayer
      .selectAll(".case-node")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "case-node")
      .attr("cx", (d) => xAccessor(d))
      .attr("cy", (d) => yAccessor(d))
      .attr("r", (d) => (isNodeRecommended(d) ? 7.5 : 5.5))
      .attr("fill", (d) => getProblemColor(d.prob_main))
      .attr("fill-opacity", (d) => (isNodeRecommended(d) ? 0.96 : 0.62))
      .attr("stroke", (d) => (isNodeRecommended(d) ? "#ffffff" : "none"))
      .attr("stroke-width", (d) => (isNodeRecommended(d) ? 1.5 : 0))
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        resetNodeStyles();
        setHoveredCase(d);
        setTooltipFromEvent(event);

        d3.select(this)
          .raise()
          .attr("r", isNodeRecommended(d) ? 10.5 : 8)
          .attr("fill-opacity", 1);
      })
      .on("mousemove", function (event, d) {
        setHoveredCase(d);
        setTooltipFromEvent(event);
      })
      .on("mouseleave", function () {
        setHoveredCase(null);
        resetNodeStyles();
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        onCaseClickRef.current?.(d);
      });
  };

  const doZoom = useCallback((factor) => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);

    svg
      .transition()
      .duration(220)
      .call(zoomRef.current.scaleBy, factor);
  }, []);

  const doReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    currentTransformRef.current[viewMode] = d3.zoomIdentity;

    const svg = d3.select(svgRef.current);

    svg
      .transition()
      .duration(260)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, [viewMode]);

  const handleViewModeChange = (nextMode) => {
    if (viewMode === nextMode) return;

    setHoveredCase(null);
    setCurrentArea(
      nextMode === "dynamic"
        ? { problem: "검색어 중심", strategy: "유사도 거리" }
        : { problem: "중앙", strategy: "중앙" }
    );
    setZoomLevel(Math.round((currentTransformRef.current[nextMode]?.k || 1) * 100));
    setViewMode(nextMode);
  };

  const hasDynamicMap = dynamicCases.length > 0;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <p style={styles.headerLabel}>DBR Case Atlas</p>
          <div style={styles.titleRow}>
            <h2 style={styles.headerTitle}>케이스 맵</h2>
            <div style={styles.viewToggle}>
              <button
                type="button"
                style={viewMode === "scatter" ? styles.viewToggleBtnActive : styles.viewToggleBtn}
                onClick={() => handleViewModeChange("scatter")}
              >
                전체 산점도
              </button>
              <button
                type="button"
                style={viewMode === "dynamic" ? styles.viewToggleBtnActive : styles.viewToggleBtn}
                onClick={() => handleViewModeChange("dynamic")}
                disabled={!hasDynamicMap}
                title={!hasDynamicMap ? "검색 후 확인할 수 있습니다." : "현재 검색어 기준 동적 좌표 맵"}
              >
                검색 결과 맵
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} style={styles.mapContainer}>
        <svg ref={svgRef} style={{ display: "block", width: "100%" }} />

        {scatterCases.length === 0 && viewMode === "scatter" && (
          <div style={styles.emptyText}>케이스 데이터를 불러오는 중입니다.</div>
        )}

        {viewMode === "dynamic" && !hasDynamicMap && (
          <div style={styles.emptyText}>검색 후 추천 결과 맵을 확인할 수 있습니다.</div>
        )}

        <div style={styles.areaBadge}>
          <span style={styles.areaLabel}>
            {viewMode === "dynamic" ? "현재 맵 기준" : "현재 영역"}
          </span>
          <strong style={styles.areaValue}>
            {currentArea.problem} × {currentArea.strategy}
          </strong>
          {viewMode === "dynamic" && (
            <span style={styles.areaDesc}>순위가 높을수록 중심에 가깝게 배치됩니다.</span>
          )}
        </div>

        {hoveredCase && (
          <div
            style={{
              ...styles.tooltip,
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            {getTopRank(hoveredCase) && (
              <p style={styles.tooltipRank}>추천 TOP {getTopRank(hoveredCase)}</p>
            )}

            <p style={styles.tooltipTitle}>{hoveredCase.title}</p>

            <p style={styles.tooltipSub}>
              {hoveredCase.company} · {hoveredCase.industry}
            </p>

            <p style={styles.tooltipSub}>
              {hoveredCase.prob_main}
              {hoveredCase.prob_keyword ? ` / ${hoveredCase.prob_keyword}` : ""}
            </p>

            <p style={styles.tooltipSub}>{hoveredCase.sol_type}</p>

            {hoveredCase.similarity !== null && hoveredCase.similarity !== undefined && (
              <p style={styles.tooltipSimilarity}>유사도 {hoveredCase.similarity}%</p>
            )}
          </div>
        )}

        <div style={styles.zoomControls}>
          <button style={styles.zoomBtn} onClick={() => doZoom(1.3)}>+</button>
          <span style={styles.zoomLevel}>{zoomLevel}%</span>
          <button style={styles.zoomBtn} onClick={() => doZoom(0.77)}>−</button>
          <div style={{ height: 1, background: "#ececec", width: "100%" }} />
          <button style={{ ...styles.zoomBtn, fontSize: 12 }} onClick={doReset}>↺</button>
        </div>

        <div style={styles.zoomHint}>
          {viewMode === "dynamic"
            ? "드래그로 이동 · 휠로 확대/축소 · 상위 20개 기업명 표시"
            : "드래그로 이동 · 휠로 확대/축소"}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    padding: "0.5rem 0",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  headerLabel: {
    fontSize: 15,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#999",
    marginBottom: 2,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: 0,
  },
  viewToggle: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: 4,
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderRadius: 999,
  },
  viewToggleBtn: {
    border: "none",
    background: "transparent",
    padding: "7px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    color: "#666",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  viewToggleBtnActive: {
    border: "none",
    background: "#111827",
    padding: "7px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 2px 7px rgba(0,0,0,0.14)",
  },
  mapContainer: {
    position: "relative",
    background: "#fafafa",
    border: "0.5px solid #e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: "1rem",
    minHeight: 430,
  },
  emptyText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 14,
    color: "#999",
    zIndex: 10,
    pointerEvents: "none",
  },
  areaBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "rgba(255,255,255,0.94)",
    border: "0.5px solid #e0e0e0",
    borderRadius: 8,
    padding: "7px 10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    zIndex: 20,
    pointerEvents: "none",
    maxWidth: 260,
  },
  areaLabel: {
    display: "block",
    fontSize: 11,
    color: "#aaa",
    marginBottom: 3,
    fontWeight: 700,
  },
  areaValue: {
    display: "block",
    fontSize: 14,
    color: "#333",
    fontWeight: 800,
  },
  areaDesc: {
    display: "block",
    fontSize: 11,
    color: "#999",
    lineHeight: 1.45,
    marginTop: 5,
  },
  tooltip: {
    position: "absolute",
    maxWidth: 320,
    background: "#fff",
    border: "0.5px solid #e0e0e0",
    borderRadius: 8,
    padding: "9px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    pointerEvents: "none",
    zIndex: 30,
  },
  tooltipRank: {
    fontSize: 11,
    fontWeight: 800,
    color: "#E86F00",
    marginBottom: 4,
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1a1a1a",
    lineHeight: 1.4,
    marginBottom: 3,
  },
  tooltipSub: {
    fontSize: 11,
    color: "#888",
    lineHeight: 1.5,
  },
  tooltipSimilarity: {
    fontSize: 11,
    color: "#E86F00",
    fontWeight: 700,
    marginTop: 4,
  },
  zoomControls: {
    position: "absolute",
    right: 14,
    bottom: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    background: "#fff",
    border: "0.5px solid #e0e0e0",
    borderRadius: 8,
    padding: "6px 8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    zIndex: 20,
  },
  zoomBtn: {
    width: 20,
    height: 20,
    border: "none",
    background: "transparent",
    color: "#444",
    fontSize: 15,
    cursor: "pointer",
    borderRadius: 4,
    lineHeight: 1,
  },
  zoomLevel: {
    fontSize: 11,
    color: "#aaa",
  },
  zoomHint: {
    position: "absolute",
    left: 14,
    bottom: 12,
    fontSize: 12,
    color: "#aaa",
    pointerEvents: "none",
  },
};
