from playwright.async_api import async_playwright
from typing import List, Dict, Optional
import asyncio

COMMUNITY_URL = "https://tossinvest.com/stocks/NAS0221213008/community?feedSortType=RECENT"

async def get_stock_feeds(max_scrolls: int = 10) -> List[Dict]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            # headless 탐지/차단 의심되면 일단 False로 테스트해봐
            # headless=False,
        )

        context = await browser.new_context(
            locale="ko-KR",
            timezone_id="Asia/Seoul",
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
        )

        page = await context.new_page()
        await page.goto(COMMUNITY_URL, wait_until="domcontentloaded", timeout=60000)

        # ✅ 핵심: “게시글 1개라도 뜰 때까지” 기다리기
        post_locator = page.locator('[data-section-name="커뮤니티__게시글"]')
        await post_locator.first.wait_for(state="visible", timeout=30000)

        stock_feeds: List[Dict] = []
        seen_ids = set()

        last_count = 0
        for _ in range(max_scrolls):
            # 현재 화면에 잡히는 포스트들
            posts = await post_locator.element_handles()

            for post in posts:
                post_id = await post.get_attribute("data-post-anchor-id")
                if not post_id or post_id in seen_ids:
                    continue

                # ✅ 본문 텍스트: 너무 특정 스타일 말고, 포스트 내부 텍스트 후보들을 넓게 잡기
                text = ""
                # 1) 지금 HTML에 보이는 _1xixuox1 (본문) 우선
                text_el = await post.query_selector("span._1xixuox1")
                if text_el:
                    text = (await text_el.inner_text()).strip()

                # 2) fallback: 포스트 전체에서 사람이 읽는 텍스트 뽑기 (과하면 줄여서)
                if not text:
                    raw = (await post.inner_text()).strip()
                    # 버튼/라벨 등 잡음이 섞일 수 있어서 너무 길면 잘라둠
                    text = raw[:2000]

                # ✅ 이미지: EditorImageList 기준으로 모두 수집
                img_srcs: List[str] = []
                img_els = await post.query_selector_all('ul[data-list-name="EditorImageList"] img')
                for img in img_els:
                    src = await img.get_attribute("src")
                    if src:
                        img_srcs.append(src)

                # ✅ 링크: 실제 a 링크가 없을 수 있어서 post_id 저장 (너가 서버에서 조합 가능)
                # href를 꼭 원하면: 커뮤니티 페이지에서 anchor/query 형태로 조합해서 쓰는 방식이 안전함
                # (정확한 상세 URL 규칙은 서비스쪽이 바꾸기도 해서 post_id가 제일 안전)
                stock_feeds.append({
                    "postId": post_id,
                    "text": text,
                    "imageSrcs": img_srcs,
                })
                seen_ids.add(post_id)

            # ✅ 스크롤: End 키보다 "실제 스크롤"이 더 안정적
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1.8)

            # 새 포스트가 더 안 늘면 종료
            cur_count = len(seen_ids)
            if cur_count == last_count:
                break
            last_count = cur_count

        print(f"Crawling successful: {len(stock_feeds)} posts collected.")
        await context.close()
        await browser.close()
        return stock_feeds


async def main():
    feeds = await get_stock_feeds(max_scrolls=10)
    for f in feeds[:3]:
        print(f["postId"], f["text"][:60], len(f["imageSrcs"]))

if __name__ == "__main__":
    asyncio.run(main())
