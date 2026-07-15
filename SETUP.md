# DBR Case Atlas — 실행 가이드

이 프로젝트는 **서버 3개를 동시에 켜야** 동작합니다.

| 폴더 | 역할 | 기술 | 포트 |
|------|------|------|------|
| `frontend/` | 화면 | React + Vite | 5173 |
| `backend/` | API 서버 | Node.js + Express | 3000 |
| `ai-server/` | AI 검색·추천 | Python + FastAPI | 8000 |

프론트는 backend(3000)와 ai-server(8000)를 호출하고, backend·ai-server는 PostgreSQL DB에 접속합니다.

---

## 0. 사전 준비

| 필요한 것 | 확인 명령 | 없으면 |
|-----------|----------|--------|
| **Git** | `git --version` | https://git-scm.com/downloads |
| **Node.js** (18 이상) | `node -v` | https://nodejs.org (LTS 버전) |
| **Anaconda** 또는 Miniconda | `conda --version` | https://www.anaconda.com/download |

---

## 1. 클론

```bash
git clone https://github.com/junngeun/DBR-Casestudy.git
cd DBR-Casestudy
```

## 2. 환경변수 설정 ⚠️ 가장 중요

`.env` 파일들은 비밀정보(DB 비번, API 키)라 **저장소에 없습니다.** `.env.example` 을 복사해서 만들고, **빈 값은 팀장에게 받아서** 채우세요.

**Windows (명령 프롬프트 / PowerShell)**
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
copy ai-server\app\.env.example ai-server\app\.env
```

**Mac / Linux**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-server/app/.env.example ai-server/app/.env
```

그 다음 각 `.env` 를 열어서 빈 값을 채웁니다.

| 파일 | 채워야 할 것 |
|------|-------------|
| `backend/.env` | `DB_*` 5개, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `frontend/.env` | (없음 — 기본값 그대로 사용) |
| `ai-server/app/.env` | `OPENAI_API_KEY`, `DB_*` 5개 |

> 💡 `ai-server` 의 `.env` 위치는 **`ai-server/app/.env`** 입니다. `ai-server/.env` 가 아닙니다.

---

## 3. backend 실행 (터미널 ①)

```bash
cd backend
npm install
npm start
```
→ `Backend server running on port 3000` 이 뜨면 성공

확인: 브라우저에서 http://localhost:3000 → `Backend server is running`

## 4. frontend 실행 (터미널 ②)

```bash
cd frontend
npm install
npm run dev
```
→ http://localhost:5173 접속

## 5. ai-server 실행 (터미널 ③)

**최초 1회만 — 가상환경 만들기** (torch 등을 받아서 5~10분 걸립니다)
```bash
conda create -n dbr-ai python=3.11 -y
conda activate dbr-ai
cd ai-server
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

**실행** (다음부터는 이것만)
```bash
conda activate dbr-ai
cd ai-server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
→ 확인: http://localhost:8000/docs

> ⚠️ **`conda activate` 가 안 되면** (Windows): **Anaconda Prompt** 를 열어서 실행하세요. 일반 명령 프롬프트에서는 conda가 초기화되지 않았을 수 있습니다.

> ⚠️ **의존성 설치는 반드시 `python -m pip` 로** 하세요. 그냥 `pip install` 하면 가상환경이 아니라 base 환경에 설치돼서, 나중에 `No module named uvicorn` 에러가 납니다.

---

## 6. 접속

세 서버가 다 떴으면 👉 **http://localhost:5173**

---

## 자주 겪는 문제

**`npm start` 에서 `bcrypt` 관련 에러 (dlopen / code signature / node-gyp)**
→ node_modules가 다른 PC에서 복사돼 온 경우입니다. 지우고 새로 설치하세요.
```bash
cd backend
rm -rf node_modules        # Windows: rmdir /s /q node_modules
npm install
```

**`npm run dev` 에서 `Cannot find native binding` (rolldown/vite)**
→ 같은 원인입니다.
```bash
cd frontend
rm -rf node_modules        # Windows: rmdir /s /q node_modules
npm install
```

**포트가 이미 사용 중 (`EADDRINUSE`)**
→ 이전에 켜둔 서버가 남아있습니다.
- Windows: `netstat -ano | findstr :3000` 으로 PID 찾고 `taskkill /PID <번호> /F`
- Mac: `lsof -ti tcp:3000 | xargs kill`

**AI 검색이 OpenAI 에러를 냄**
→ `ai-server/app/.env` 의 `OPENAI_API_KEY` 가 비었거나 잘못됐습니다.

**구글 로그인이 안 됨**
→ `backend/.env` 의 `GOOGLE_CALLBACK_URL` 이 구글 클라우드 콘솔의 **승인된 리디렉션 URI** 에 등록돼 있어야 합니다. 로컬 개발용 `http://localhost:3000/api/auth/google/callback` 은 이미 등록돼 있습니다.

---

## 주의사항

- **`.env` 파일은 절대 커밋하지 마세요.** (`.gitignore` 에 등록돼 있습니다)
- **`git add .` 를 쓰지 마세요.** 이 저장소는 줄바꿈(CRLF/LF) 차이로 손대지 않은 파일도 "수정됨"으로 뜰 수 있어, 의도한 파일만 골라서 `git add <파일명>` 하세요.
