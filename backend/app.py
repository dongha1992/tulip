from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from image_similarity import find_similar_images
from fastapi.middleware.cors import CORSMiddleware

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
    imageSrc: Optional[str]

class CompareImagesRequest(BaseModel):
    target_image: str
    images: List[ImageData]

@app.post("/compare-images/")
async def compare_images(request: CompareImagesRequest):
    image_urls = [img.imageSrc for img in request.images if img.imageSrc]

    # 이미지 유사도 비교 로직 실행
    similar_images = find_similar_images(request.target_image, image_urls)

    return similar_images

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
