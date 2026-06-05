const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/**
 * 많이 저장한 케이스 TOP N
 * GET /api/popular/cases?limit=10&days=7
 */
router.get("/cases", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const days = Number(req.query.days) || 7;

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safeDays = Math.min(Math.max(days, 1), 365);

    const result = await pool.query(
      `
      SELECT
        c.case_idx,
        c.chapter_title,
        c.title,
        c.summary,
        c.src_url,
        c.issue_no,
        c.pub_year,
        c.comp_name,
        c.comp_size,
        c.industry,
        c.prob_main,
        c.prob_keyword,
        c.prob_def,
        c.sol_type,
        c.sol_detail,
        c.perf_type,
        c.perf_dir,
        c.x,
        c.y,
        COUNT(b.bookmark_idx)::int AS bookmark_count,
        COUNT(b.bookmark_idx)::int AS view_count
      FROM t_case_bookmark b
      JOIN t_case c
        ON c.case_idx = b.case_idx
      WHERE b.created_at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY
        c.case_idx,
        c.chapter_title,
        c.title,
        c.summary,
        c.src_url,
        c.issue_no,
        c.pub_year,
        c.comp_name,
        c.comp_size,
        c.industry,
        c.prob_main,
        c.prob_keyword,
        c.prob_def,
        c.sol_type,
        c.sol_detail,
        c.perf_type,
        c.perf_dir,
        c.x,
        c.y
      ORDER BY
        bookmark_count DESC,
        c.pub_year DESC,
        c.case_idx DESC
      LIMIT $2;
      `,
      [safeDays, safeLimit]
    );

    return res.json({
      success: true,
      period_days: safeDays,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("많이 저장한 케이스 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "많이 저장한 케이스 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

/**
 * 많이 찾는 고민 TOP N
 * GET /api/popular/queries?limit=10&days=7
 */
router.get("/queries", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const days = Number(req.query.days) || 7;

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safeDays = Math.min(Math.max(days, 1), 365);

    const result = await pool.query(
      `
      SELECT
        keyword_group,
        COUNT(*)::int AS search_count,
        MAX(display_keyword) AS display_keyword,
        MAX(created_at) AS last_searched_at
      FROM t_query
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
        AND keyword_group IS NOT NULL
        AND TRIM(keyword_group) <> ''
        AND LENGTH(TRIM(keyword_group)) BETWEEN 2 AND 30

        -- 비정상/분류 실패성 키워드 제외
        AND keyword_group NOT IN (
          '검색 의도 확인 필요',
          '기타',
          '일반 문의',
          '분류 불가',
          '확인 필요',
          '의도 확인 필요',
          '비즈니스 의도 확인 필요'
        )

        -- 테스트/욕설/감정 표현성 키워드 제외
        AND keyword_group !~* '(test|asdf|qwer|ㅋㅋ|ㅎㅎ|짜증|시발|ㅅㅂ|개빡|몰라|안녕|뭐해)'
      GROUP BY keyword_group
      ORDER BY
        search_count DESC,
        last_searched_at DESC
      LIMIT $2;
      `,
      [safeDays, safeLimit]
    );

    return res.json({
      success: true,
      period_days: safeDays,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("인기 검색어 조회 오류:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return res.status(500).json({
      success: false,
      message: "인기 검색어 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

/**
 * 케이스별 조회수 조회
 * GET /api/popular/case-view-counts?ids=1,2,3&days=365
 */
router.get("/case-view-counts", async (req, res) => {
  try {
    const rawIds = String(req.query.ids || "");
    const days = Number(req.query.days) || 365;

    const safeDays = Math.min(Math.max(days, 1), 3650);

    const caseIds = rawIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (caseIds.length === 0) {
      return res.json({
        success: true,
        period_days: safeDays,
        count: 0,
        data: [],
      });
    }

    const result = await pool.query(
      `
      SELECT
        c.case_idx,
        COALESCE(COUNT(v.view_log_idx), 0)::int AS view_count
      FROM t_case c
      LEFT JOIN t_case_view_log v
        ON c.case_idx = v.case_idx
       AND v.created_at >= NOW() - ($1::int * INTERVAL '1 day')
      WHERE c.case_idx = ANY($2::bigint[])
      GROUP BY c.case_idx
      ORDER BY c.case_idx;
      `,
      [safeDays, caseIds]
    );

    return res.json({
      success: true,
      period_days: safeDays,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("케이스별 조회수 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "케이스별 조회수 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

module.exports = router;