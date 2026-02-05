# Crawler (로컬 실행)

Next.js가 `npm run dev`로 돌아갈 때 **CRAWLER_URL**이 없으면 자동으로 `http://localhost:8080`을 사용합니다.

## 로컬에서 크롤러만 띄우기

macOS(Homebrew Python)는 시스템 전역 pip 설치가 막혀 있으므로 **가상환경**에서 실행합니다.

```bash
cd crawler
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium   # 최초 1회
uvicorn app:app --reload --port 8080
```

이후 실행할 때마다:

```bash
cd crawler
source .venv/bin/activate
uvicorn app:app --reload --port 8080
```

- 헬스체크: http://localhost:8080/health  
- 크롤 API: `POST http://localhost:8080/crawl` (body: `{ "stock_id": "005930", "max_scrolls": 5, "save": true }`)

## DB 연동

로컬에서 `save: true`로 저장하려면 `DATABASE_URL`이 필요합니다. 아래 둘 중 한 곳에 두면 앱이 자동으로 읽습니다.

- `crawler/.env`
- 프로젝트 루트 `tulip/.env`
