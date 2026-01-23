import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import discordRoutes from "./discord/discord.routes";

// 환경 변수 로드
dotenv.config();

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 8080;

// CORS 설정
app.use(cors({
  origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// 미들웨어
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || "change-me",
  resave: false, // false 권장
  saveUninitialized: false, // 로그인 전에는 세션 안 만드는 게 보통이나, 디버깅 위해 true로 해봐도 됨
  cookie: {
    secure: false, // ★ 일단 무조건 false로 설정해서 테스트 (https 아니면 쿠키 저장 안 됨 방지)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax', // ★ lax로 명시 (none은 secure: true일 때만 작동함)
  },
}));

// Discord 봇 라우트
app.use("/api", discordRoutes);

// 정적 파일 서빙 (React 빌드 파일)
app.use(express.static(path.join(__dirname, "build")));

// 모든 요청을 React 앱으로 리다이렉트 (SPA)
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

