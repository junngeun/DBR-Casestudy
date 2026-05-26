const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 1. 목록 조회 (관리자면 전부, 아니면 공개글+본인 글)
router.get("/", async (req, res) => {
  const { member_idx, isAdmin } = req.query;
  const isAdm = isAdmin === 'true';

  try {
    let query;
    let params = [];

    if (isAdm) {
      query = "SELECT * FROM t_case_request ORDER BY created_at DESC";
    } else {
      query = `SELECT r.*, EXISTS(SELECT 1 FROM t_request_likes WHERE request_idx = r.request_idx AND member_idx = $1)::boolean as is_liked
               FROM t_case_request r 
               WHERE r.is_private = FALSE OR r.member_idx = $1 
               ORDER BY r.created_at DESC`;
      params = [member_idx];
    }
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "조회 실패" });
  }
});

// 2. 등록
router.post("/", async (req, res) => {
  try {
    const { topic, industry, content, is_private, member_idx } = req.body;
    await pool.query(
      "INSERT INTO t_case_request (topic, industry, content, is_private, member_idx) VALUES ($1, $2, $3, $4, $5)",
      [topic, industry, content, is_private, member_idx]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 3. 삭제
router.delete("/:idx", async (req, res) => {
  const { idx } = req.params;
  const { member_idx, isAdmin } = req.body;
  try {
    const query = isAdmin 
      ? "DELETE FROM t_case_request WHERE request_idx = $1"
      : "DELETE FROM t_case_request WHERE request_idx = $1 AND member_idx = $2";
    const params = isAdmin ? [idx] : [idx, member_idx];
    await pool.query(query, params);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 4. 좋아요
router.post("/:idx/like", async (req, res) => {
  const { member_idx } = req.body;
  const { idx } = req.params;
  try {
    const check = await pool.query("SELECT 1 FROM t_request_likes WHERE request_idx = $1 AND member_idx = $2", [idx, member_idx]);
    if (check.rows.length > 0) {
      await pool.query("DELETE FROM t_request_likes WHERE request_idx = $1 AND member_idx = $2", [idx, member_idx]);
      await pool.query("UPDATE t_case_request SET likes = likes - 1 WHERE request_idx = $1", [idx]);
    } else {
      await pool.query("INSERT INTO t_request_likes (request_idx, member_idx) VALUES ($1, $2)", [idx, member_idx]);
      await pool.query("UPDATE t_case_request SET likes = likes + 1 WHERE request_idx = $1", [idx]);
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = router;