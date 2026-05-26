const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// 1. 요청 목록 가져오기
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM t_case_request WHERE is_private = FALSE ORDER BY created_at DESC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "목록 조회 실패" });
  }
});

// 2. 새로운 요청 저장
router.post("/", async (req, res) => {
  try {
    const { topic, industry, content, is_private } = req.body;
    await pool.query(
      "INSERT INTO t_case_request (topic, industry, content, is_private) VALUES ($1, $2, $3, $4)",
      [topic, industry, content, is_private]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "저장 실패" });
  }
});

// 3. 좋아요(공감) 토글 로직
router.post("/:idx/like", async (req, res) => {
  const { member_idx } = req.body; // 프론트에서 보내주는 유저 식별자
  const { idx } = req.params;

  if (!member_idx) {
    return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
  }

  try {
    // 1. 이미 좋아요를 눌렀는지 확인
    const checkResult = await pool.query(
      "SELECT * FROM t_request_likes WHERE request_idx = $1 AND member_idx = $2",
      [idx, member_idx]
    );

    if (checkResult.rows.length > 0) {
      // 이미 눌렀으면 삭제하고(좋아요 취소) count -1
      await pool.query("DELETE FROM t_request_likes WHERE request_idx = $1 AND member_idx = $2", [idx, member_idx]);
      await pool.query("UPDATE t_case_request SET likes = likes - 1 WHERE request_idx = $1", [idx]);
      res.json({ success: true, liked: false });
    } else {
      // 안 눌렀으면 추가하고(좋아요) count +1
      await pool.query("INSERT INTO t_request_likes (request_idx, member_idx) VALUES ($1, $2)", [idx, member_idx]);
      await pool.query("UPDATE t_case_request SET likes = likes + 1 WHERE request_idx = $1", [idx]);
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error("좋아요 처리 오류:", error);
    res.status(500).json({ success: false, message: "좋아요 반영 실패" });
  }
});

module.exports = router;