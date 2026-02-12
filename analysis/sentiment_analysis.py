import re
from collections import Counter


# 키워드 추출 시 제외할 조사·대명사·흔한 단어 (의미 있는 키워드만 남기기 위함)
STOPWORDS = {
    # 조사·어미
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "의",
    "에",
    "와",
    "과",
    "도",
    "만",
    "에서",
    "으로",
    "로",
    "한",
    "하다",
    "있다",
    "되다",
    # 대명사·지시어·부사 등 (의미 약한 단어)
    "그",
    "이",
    "저",
    "그것",
    "이것",
    "저것",
    "나",
    "너",
    "우리",
    "우린",
    "너네",
    "너희",
    "나도",
    "너도",
    "너나",
    "자꾸",
    "그냥",
    "진짜",
    "정말",
    "너무",
    "완전",
    "좀",
    "뭐야",
    "뭐지",
    "그럼",
    "이제",
    "다시",
    "항상",
    "맨날",
    # 영어 불용어
    "무엇",
    "어떤",
    "어디",
    "언제",
    "왜",
    "how",
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "to",
    "of",
    "in",
    "on",
    "for",
    "and",
    "or",
    "but",
}


class SentimentAnalyzer:
    def __init__(self):
        # 감정 사전 정의 (가볍고 빠른 룰 기반 분석에 사용)
        self.EMOTION_DICT = {
            'positive': [
                '감사','담는다','업','회복', '불장','매수', '👍🏻', '호재', '와', '쏜다', '쏴라',
                '가즈아', '가보자', '가자', '간다', '떡상', '대박', '로켓', '화성', '고고',
                '한강뷰', '투더문', '다행','굿', '좋다','오'
            ],
            'negative': [
                'ㅠ', 'ㅜ', 'ㅡ', 'ㅗ', '하..', '하...', '흐..', '흑..', '헐..','에휴',
                '허걱', '헉', '흑흑', '하아', '하..', '않다', '없다', '아니다','한강',
                '떨어진다', '폭락', '손실', '손절', '빚', '하락', '하한가', '존버', '존버중',
                '탈출', '리스크', '위험', '불안', '걱정', '답이없', '망했', '털렸', '조정',
                '하락장', '약세장','살려줘', '심란','회의적', '곡소리', '빚투', '손실',
                '살려줘', '손해','잡주','망했다', '폭망', '대폭락', '공포','스트레스',
                '떨어지면','럴', '패닉셀','개무섭네','조진','고점신호','죽쑤고','설거지','음','흠'
            ],
            'very_negative': [
                '으아', '살려', '하..', '하...', '흑..', '헐..', '에휴','한강가자',
                '한강물', '어휴', '상폐', '삭제','ㅡㅡ','숨김','안돼','안돼요','안돼',
            ],
            'swear_words': [
                'ㅅㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㅁㅊ', 'ㅅㄲ','ㅈㄴ', 'ㅗㅗ',
                '개ㅅㄲ', '개ㅂㅅ', '개ㅈㄹ', '개ㅅㅂ','개ㅁㅊ', '련',
                '지ㄹ', '닥ㅊ', 'ㅅㄲ들', 'ㅂㅅ들', 'ㅈㄹ하네',
                '미ㅊ', '빡치', '개새', '십', '시ㅂ', '병ㅅ'
            ]
        }

        self.LABEL_MAPPING = {
            0: "부정",
            1: "다소 부정",
            2: "중립",
            3: "다소 긍정",
            4: "긍정"
        }

    def preprocess_text(self, text):
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_emotion_features(self, text):
        text = self.preprocess_text(text)
        has_positive = any(em in text for em in self.EMOTION_DICT['positive'])
        has_negative = any(em in text for em in self.EMOTION_DICT['negative'])
        has_very_negative = any(em in text for em in self.EMOTION_DICT['very_negative'])
        has_swear = any(em in text for em in self.EMOTION_DICT['swear_words'])
        return has_positive, has_negative, has_very_negative, has_swear

    def _score_with_rules(self, text: str) -> float:
        """
        BERT 대신 가벼운 룰 기반 점수 계산.
        - 기본 50점에서 시작
        - positive / negative / very_negative / swear_words 사전 기반 가중치 부여
        """
        has_positive, has_negative, has_very_negative, has_swear = self.extract_emotion_features(
            text
        )

        score = 50.0

        # 욕설이 있으면 강한 부정
        if has_swear:
            score = 5.0
        else:
            if has_positive:
                score += 20
            if has_negative:
                score -= 20
            if has_very_negative:
                score -= 35

            # 강한 긍정 표현 보정
            if has_positive:
                if "!!" in text or "!!!!" in text:
                    score += 10
                if "👍🏻" in text:
                    score += 5

        # 0~100 범위로 클램프
        return max(0.0, min(100.0, score))

    def _class_probabilities_from_score(self, base_score: float) -> dict:
        """
        단일 점수에서 5개 클래스 확률을 대략적으로 생성.
        중앙(50)을 기준으로 양/음수 쪽으로 기울어지게 분포 생성.
        """
        # 점수를 0~4 구간으로 매핑
        target_idx = base_score / 25.0  # 0~4
        weights = []
        for i in range(5):
            # 거리가 멀수록 가중치 감소 (선형)
            dist = abs(target_idx - i)
            w = max(0.0, 1.5 - dist)  # 0~1.5
            weights.append(w)

        total = sum(weights) or 1.0
        probs = [w / total for w in weights]

        return {
            self.LABEL_MAPPING[i]: round(p * 100, 2)
            for i, p in enumerate(probs)
        }

    def analyze_text(self, text):
        try:
            base_score = self._score_with_rules(text)

            # 감정 분류
            if base_score >= 75:
                sentiment = "긍정"
            elif base_score >= 55:
                sentiment = "다소 긍정"
            elif base_score > 45 and base_score < 55:
                sentiment = "중립"
            elif base_score >= 25:
                sentiment = "다소 부정"
            else:
                sentiment = "부정"

            class_probs = self._class_probabilities_from_score(base_score)

            return {
                'score': base_score,
                'label': sentiment,
                'confidence': "높음" if abs(base_score - 50) > 20 else "중간",
                'class_probabilities': class_probs,
            }

        except Exception as e:
            print(f"Error processing text: {str(e)}")
            return {
                'score': 50.0,
                'label': "중립",
                'confidence': "낮음"
            }

    def extract_top_keywords(self, texts: list[str], top_n: int = 3) -> list[str]:
        """
        피드 텍스트 전체에서 많이 등장한, 의미 있는 키워드 상위 top_n개 반환.
        조사·감정사전·stopword 제외 후 빈도 기준.
        """
        if not texts:
            return []

        # 감정 사전에 있는 단어는 키워드 후보에서 제외 (의미 있는 주제어 위주)
        exclude = set(STOPWORDS)
        for key in ("positive", "negative", "very_negative", "swear_words"):
            exclude.update(self.EMOTION_DICT[key])

        # 한글·영문·숫자 연속만 토큰으로 (2자 이상)
        token_re = re.compile(r"[가-힣a-zA-Z0-9]{2,}")
        counter: Counter[str] = Counter()

        for text in texts:
            if not text or not isinstance(text, str):
                continue
            normalized = self.preprocess_text(text)
            tokens = token_re.findall(normalized)
            for t in tokens:
                t_lower = t.lower()
                if t_lower in exclude or t in exclude:
                    continue
                # 숫자만 있는 토큰 제외
                if t.isdigit():
                    continue
                counter[t_lower] += 1

        # 빈도 내림차순, 동점이면 원문 등장 순서 유지하고 싶으면 그대로 두고 상위 n개
        top = counter.most_common(top_n)
        return [word for word, _ in top]