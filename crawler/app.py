from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 로컬: crawler/.env 또는 프로젝트 루트 .env 로드
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from crawler import get_stock_feeds, get_borrow_fee_second_row_html, save_to_db

app = FastAPI()


class CrawlRequest(BaseModel):
    stock_id: str
    max_scrolls: int = 5
    save: bool = True


class CrawlBorrowFeeRequest(BaseModel):
    """ChartExchange symbol (예: nyse-hims, nasdaq-aapl) — borrow-fee 페이지 크롤링용"""
    symbol: str


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
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/crawl-short-interest")
async def crawl_short_interest(request: CrawlBorrowFeeRequest):
    """
    ChartExchange borrow-fee 페이지에서 table의 두 번째 tr에서
    Updated / Fee2 / Available / Rebate3 값 추출.

    symbol 예: nyse-hims, nasdaq-aapl
    """
    try:
        row = await get_borrow_fee_second_row_html(symbol=request.symbol)
        return {
            "status": "success",
            "symbol": request.symbol,
            "row": row,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
