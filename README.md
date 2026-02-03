# Tulip

> I can calculate the motion of heavenly bodies, but not the madness of men.

매매 기록을 정리하고 공유하는 웹 앱입니다.

## Tech Stack

- **Client**: Next.js 15, React 19, Prisma, Tailwind CSS, shadcn/ui
- **Server**: FastAPI (감정 분석, 이미지 유사도, 크롤러)
- **DB**: PostgreSQL (Supabase)
- **Storage**: AWS S3

## 주요 기능

- 매매 기록
- 감정 분석 API 

## 프로젝트 구조

```
tulip/
├── client/   
└── server/ 
```

## 실행

```bash
# Client
cd client && npm install && npm run dev

# Server (별도 터미널)
cd server && pip install -r requirements.txt && python app.py
```
