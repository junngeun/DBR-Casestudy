const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  const { member_idx } = req.query;
  try {
    const query = member_idx 
      ? `SELECT r.*, EXISTS(SELECT 1 FROM t_request_likes WHERE request_idx = r.request_idx AND member_idx = $1)::boolean as is_liked
         FROM t_case_request r WHERE r.is_private = FALSE ORDER BY r.created_at DESC`
      : `SELECT r.*, false as is_liked FROM t_case_request r WHERE r.is_private = FALSE ORDER BY r.created_at DESC`;
    const result = await pool.query(query, member_idx ? [member_idx] : []);
    res.json({ success: true, data: result.rows });
  } catch (error) { res.status(500).json({ success: false }); }
});

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

router.delete("/:idx", async (req, res) => {
  const { idx } = req.params;
  const { member_idx } = req.body;
  try {
    await pool.query("DELETE FROM t_case_request WHERE request_idx = $1 AND member_idx = $2", [idx, member_idx]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.post("/:idx/like", async (req, res) => {
  const { member_idx } = req.body;
  const { idx } = req.params;
  if (!member_idx) return res.status(401).json({ success: false });
  try {
    const check = await pool.query("SELECT 1 FROM t_request_likes WHERE request_idx = $1 AND member_idx = $2", [idx, member_idx]);
    if (check.rows.length > 0) {
      await pool.query("DELETE FROM t_request_likes WHERE request_idx = $1 AND member_idx = $2", [idx, member_idx]);
      await pool.query("UPDATE t_case_request SET likes = likes - 1 WHERE request_idx = $1", [idx]);
      res.json({ success: true, liked: false });
    } else {
      await pool.query("INSERT INTO t_request_likes (request_idx, member_idx) VALUES ($1, $2)", [idx, member_idx]);
      await pool.query("UPDATE t_case_request SET likes = likes + 1 WHERE request_idx = $1", [idx]);
      res.json({ success: true, liked: true });
    }
  } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = router;