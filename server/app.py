from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from image_similarity import find_similar_images
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from crawler import get_stock_feeds
from sentiment_analysis import SentimentAnalyzer

import asyncio
import requests

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageData(BaseModel):
    href: str
    text: str
    imageSrc: Optional[str] = None

class CompareImagesRequest(BaseModel):
    target_image: str
    images: List[str]

@app.post("/compare-images")
async def compare_images(request: CompareImagesRequest):
    try:
        # 이미지 유사도 비교 로직 실행
        similar_images = find_similar_images(request.target_image, request.images)
        return {"status": "success", "data": similar_images}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/scrape")
async def scrape():
    try:
        stock_feeds = await get_stock_feeds()
        similar_images = find_similar_images(
            target_image="https://tulip-img.s3.ap-northeast-2.amazonaws.com/target.webp",
            image_array=[feed["imageSrc"] for feed in stock_feeds if feed["imageSrc"]]
            )
        return {
            "status": "success",
            "data": similar_images,
            "feeds": stock_feeds
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SentimentRequest(BaseModel):
    texts: List[str]

analyzer = SentimentAnalyzer()

@app.post("/analyze")
async def analyze_sentiment(request: SentimentRequest):
    return [analyzer.analyze_text(text) for text in request.texts]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)