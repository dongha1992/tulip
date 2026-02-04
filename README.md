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
├── client/      # Next.js (Vercel)
├── server/      # FastAPI (레거시, 점진 제거 예정)
├── analysis/    # 감정분석 + 이미지유사도 (Cloud Run)
└── crawler/     # 크롤링 (Cloud Run)
```

## 실행

```bash
# Client
cd client && npm install && npm run dev

# Server (로컬 테스트)
cd server && pip install -r requirements.txt && python app.py
```

## Cloud Run 배포

### analysis (감정분석, 이미지유사도)
```bash
cd analysis && docker build -t gcr.io/PROJECT_ID/tulip-analysis .
gcloud run deploy tulip-analysis --image gcr.io/PROJECT_ID/tulip-analysis --region asia-northeast3 --allow-unauthenticated
```

### crawler (크롤링)
```bash
cd crawler && docker build -t gcr.io/PROJECT_ID/tulip-crawler .
gcloud run deploy tulip-crawler --image gcr.io/PROJECT_ID/tulip-crawler --region asia-northeast3 --memory 2Gi --allow-unauthenticated
```

환경변수: `DATABASE_URL` (Supabase 연결 문자열). `stock_feeds` 테이블에 `stock_id` 컬럼 필요:
```sql
ALTER TABLE stock_feeds ADD COLUMN IF NOT EXISTS stock_id text;
```
