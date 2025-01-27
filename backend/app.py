from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from image_similarity import find_similar_images
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from crawler import get_stock_feeds
# from sentiment_analysis import analyze_korean_sentiment, KoreanSentimentAnalyzer
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

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


# @app.get("/analyze-sentiment")
# async def analyze_sentiment():
#     try:
#         stock_feeds = await get_stock_feeds()
#         texts = [feed.get("text", "") for feed in stock_feeds if feed.get("text")]
#
#         korean_results = [analyze_korean_sentiment(text) for text in texts]
#         vader_results = [analyze_sentiment(text) for text in texts]
#
#         korean_overall = determine_overall_sentiment(korean_results)
#         vader_overall = determine_overall_sentiment(vader_results)
#
#         sentiment_results = [
#             {
#                 "text": text,
#                 "korean_sentiment": korean,
#                 "vader_sentiment": vader
#             }
#             for text, korean, vader in zip(texts, korean_results, vader_results)
#         ]
#
#         return {
#             "status": "success",
#             "data": {
#                 "individual_results": sentiment_results,
#                 "overall_sentiment": {
#                     "korean": korean_overall,
#                     "vader": vader_overall
#                 }
#             }
#         }
#          return {
#
#          }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))