from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from sentiment_analysis import SentimentAnalyzer

app = FastAPI()
analyzer = SentimentAnalyzer()


class SentimentRequest(BaseModel):
    texts: List[str]


@app.post("/analysis")
def analyze(request: SentimentRequest):
    texts = request.texts or []
    results = [analyzer.analyze_text(text) for text in texts]
    top_keywords = analyzer.extract_top_keywords(texts, top_n=3)
    return {"results": results, "top_keywords": top_keywords}


@app.get("/health")
def health():
    return {"status": "ok"}