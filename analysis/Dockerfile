FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
AutoTokenizer.from_pretrained('beomi/kcbert-base'); \
AutoModelForSequenceClassification.from_pretrained('beomi/kcbert-base', num_labels=5)"

COPY app.py .
COPY sentiment_analysis.py .

ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]