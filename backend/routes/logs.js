const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dbr_case_atlas_secret_key";

/**
 * 로그인 사용자는 member_idx 저장
 * 비로그인 사용자는 member_idx = null 저장
 */
function getMemberFromToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 케이스 조회 로그 저장
 * POST /api/logs/view
 */
router.post("/view", async (req, res) => {
  try {
    const member = getMemberFromToken(req);

    const {
      case_idx,
      query_idx = null,
      view_source = "unknown",
    } = req.body;

    if (!case_idx) {
      return res.status(400).json({
        success: false,
        message: "case_idx가 필요합니다.",
      });
    }

    const allowedSources = ["RECOMMEND", "MAP", "ARCHIVE", "BOOKMARK", "UNKNOWN"];

    const safeViewSource = allowedSources.includes(String(view_source).toUpperCase())
    ? String(view_source).toUpperCase()
    : "UNKNOWN";

    const result = await pool.query(
      `
      INSERT INTO t_case_view_log (
        member_idx,
        case_idx,
        query_idx,
        view_source
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        view_log_idx,
        member_idx,
        case_idx,
        query_idx,
        view_source,
        created_at
      `,
      [
        member?.member_idx || null,
        case_idx,
        query_idx,
        safeViewSource,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "케이스 조회 로그가 저장되었습니다.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("케이스 조회 로그 저장 오류:", error);

    return res.status(500).json({
      success: false,
      message: "케이스 조회 로그 저장 중 서버 오류가 발생했습니다.",
    });
  }
});

module.exports = router;