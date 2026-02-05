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
    return [analyzer.analyze_text(text) for text in request.texts]


@app.get("/health")
def health():
    return {"status": "ok"}