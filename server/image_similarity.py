import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import requests
from io import BytesIO
from PIL import Image

def download_image(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def preprocess_image(img):
    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    return img

def extract_features(img):
    hist = cv2.calcHist([img], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    hist = cv2.normalize(hist, hist).flatten()
    return hist

def find_similar_images(target_image, image_array):
    target_img = download_image(target_image)
    target_features = extract_features(preprocess_image(target_img))

    similar_images = []
    for img_url in image_array:
        try:
            img = download_image(img_url)
            img_features = extract_features(preprocess_image(img))
            similarity = cosine_similarity(target_features.reshape(1, -1), img_features.reshape(1, -1))[0][0]
            if similarity > 0.7:
                similar_images.append({"image": img_url, "similarity": float(similarity)})
        except Exception as e:
            print(f"Error processing {img_url}: {str(e)}")

    return sorted(similar_images, key=lambda x: x["similarity"], reverse=True)

