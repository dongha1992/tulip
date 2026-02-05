from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 로컬: crawler/.env 또는 프로젝트 루트 .env 로드
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from crawler import get_stock_feeds, save_to_db

app = FastAPI()


class CrawlRequest(BaseModel):
    stock_id: str
    max_scrolls: int = 5
    save: bool = True


@app.post("/crawl")
async def crawl(request: CrawlRequest):
    try:
        feeds = await get_stock_feeds(
            stock_id=request.stock_id,
            max_scrolls=request.max_scrolls,
        )

        if request.save and feeds:
            save_to_db(stock_id=request.stock_id, feeds=feeds)

        return {
            "status": "success",
            "count": len(feeds),
            "feeds": feeds,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
