const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dbr_case_atlas_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function createToken(member) {
  return jwt.sign(
    {
      member_idx: member.member_idx,
      email: member.email,
      nickname: member.nickname,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "인증 토큰이 없습니다.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.member = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
}

// 회원가입
router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      nickname,
      job_role_code = null,
    } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({
        success: false,
        message: "이메일, 비밀번호, 이름을 모두 입력해주세요.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "비밀번호는 6자 이상 입력해주세요.",
      });
    }

    const existing = await pool.query(
      `
      SELECT member_idx
      FROM t_member
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "이미 가입된 이메일입니다.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO t_member (
        email,
        password_hash,
        nickname,
        job_role_code,
        signup_type,
        member_status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        member_idx,
        email,
        nickname,
        job_role_code,
        signup_type,
        member_status,
        created_at
      `,
      [
        email,
        passwordHash,
        nickname,
        job_role_code,
        "LOCAL",
        "ACTIVE",
      ]
    );

    const member = result.rows[0];
    const token = createToken(member);

    return res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      token,
      member,
    });
  } catch (error) {
    console.error("회원가입 오류:", error);

    return res.status(500).json({
      success: false,
      message: "회원가입 중 서버 오류가 발생했습니다.",
    });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "이메일과 비밀번호를 입력해주세요.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        member_idx,
        email,
        password_hash,
        nickname,
        job_role_code,
        signup_type,
        member_status,
        created_at
      FROM t_member
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const member = result.rows[0];

    if (member.member_status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "비활성화된 계정입니다.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      member.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    delete member.password_hash;

    const token = createToken(member);

    return res.json({
      success: true,
      message: "로그인 성공",
      token,
      member,
    });
  } catch (error) {
    console.error("로그인 오류:", error);

    return res.status(500).json({
      success: false,
      message: "로그인 중 서버 오류가 발생했습니다.",
    });
  }
});

// 로그인 유지 확인
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        member_idx,
        email,
        nickname,
        job_role_code,
        signup_type,
        member_status,
        created_at
      FROM t_member
      WHERE member_idx = $1
      LIMIT 1
      `,
      [req.member.member_idx]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "회원 정보를 찾을 수 없습니다.",
      });
    }

    return res.json({
      success: true,
      member: result.rows[0],
    });
  } catch (error) {
    console.error("회원 정보 조회 오류:", error);

    return res.status(500).json({
      success: false,
      message: "회원 정보 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

module.exports = {
  router,
  authMiddleware,
};