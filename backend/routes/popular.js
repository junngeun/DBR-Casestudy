const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/**
 * 많이 조회된 케이스 TOP N
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
        COUNT(v.view_log_idx)::int AS view_count
      FROM t_case_view_log v
      JOIN t_case c
        ON c.case_idx = v.case_idx
      WHERE v.created_at >= NOW() - ($1::int * INTERVAL '1 day')
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
        view_count DESC,
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
    console.error("인기 케이스 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "인기 케이스 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

module.exports = router;