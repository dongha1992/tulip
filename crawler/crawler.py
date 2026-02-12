from playwright.async_api import async_playwright
from playwright._impl._errors import TimeoutError as PlaywrightTimeoutError
from typing import List, Dict
import asyncio
import os

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")


async def get_stock_feeds(stock_id: str, max_scrolls: int = 5) -> List[Dict]:
    url = f"https://tossinvest.com/stocks/{stock_id}/community?feedSortType=RECENT"

    async with async_playwright() as p:
        # Cloud Run/Docker: --disable-dev-shm-usage 필수 (작은 /dev/shm)
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--disable-extensions",
                "--no-first-run",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-sync",
                "--mute-audio",
            ],
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

        page = await browser.new_page()
        await page.goto(url, wait_until='domcontentloaded', timeout=60000)

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

                text = ""
                
                text_el = await post.query_selector("span._1xixuox1")
                if text_el:
                    text = (await text_el.inner_text()).strip()

                if not text:
                    raw = (await post.inner_text()).strip()
                    
                    text = raw[:2000]

                img_srcs: List[str] = []
                img_els = await post.query_selector_all('ul[data-list-name="EditorImageList"] img')
                for img in img_els:
                    src = await img.get_attribute("src")
                    if src:
                        img_srcs.append(src)

                stock_feeds.append({
                    "postId": post_id,
                    "text": text,
                    "imageSrcs": img_srcs,
                })
                seen_ids.add(post_id)

            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1.8)

            
            cur_count = len(seen_ids)
            if cur_count == last_count:
                break
            last_count = cur_count

        print(f"Crawling successful: {len(stock_feeds)} posts collected.")
        await context.close()
        await browser.close()
        return stock_feeds



async def get_borrow_fee_second_row_html(symbol: str) -> dict[str, str] | None:
    """
    ChartExchange borrow-fee 페이지에서 table의 두 번째 tr에서
    의미 있는 값만 추출해서 반환.

    - Updated: 첫 번째 td 텍스트
    - Fee2: 두 번째 td 텍스트
    - Available: 세 번째 td 텍스트
    - Rebate3: 네 번째 td 텍스트

    symbol 예: nyse-hims, nasdaq-aapl
    """
    url = f"https://chartexchange.com/symbol/{symbol}/borrow-fee/"

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--disable-extensions",
                "--no-first-run",
            ],
        )
        try:
            page = await browser.new_page()
            # JS 로딩이 필요한 경우를 대비해 networkidle까지 대기
            await page.goto(url, wait_until="networkidle", timeout=45000)

            try:
                # 데이터 테이블이 렌더링될 시간을 넉넉히 준다
                await page.wait_for_selector("table", state="attached", timeout=30000)
            except PlaywrightTimeoutError:
                # 테이블이 안 보이면 데이터 없는 것으로 처리
                return None

            # 첫 번째 table만 사용
            table = await page.query_selector("table")
            if not table:
                return None

            # tbody가 있으면 tbody tr, 없으면 전체 tr
            trs = await table.query_selector_all("tbody tr")
            if not trs:
                trs = await table.query_selector_all("tr")
            if len(trs) < 2:
                return None

            second_tr = trs[1]
            tds = await second_tr.query_selector_all("td")
            if len(tds) < 4:
                return None

            # 각 칸의 텍스트만 추출
            texts: list[str] = []
            for td in tds[:4]:
                raw = await td.inner_text()
                # 공백 정리
                cleaned = " ".join(raw.split())
                texts.append(cleaned)

            updated, fee2, available, rebate3 = texts

            return {
                "updated": updated,
                "fee2": fee2,
                "available": available,
                "rebate3": rebate3,
            }
        except Exception as e:
            # 크롤링 실패 시 서버 에러 대신 None 반환 (클라이언트에서 n/a 처리)
            print(f"[borrow-fee crawler] error for symbol={symbol}: {e}")
            return None
        finally:
            await browser.close()


def save_to_db(stock_id: str, feeds: List[Dict]) -> None:
    if not DATABASE_URL:
        print(
            "[crawler] DATABASE_URL not set — stock feeds not saved to DB. "
            "Set DATABASE_URL in crawler/.env (or env) to persist feeds."
        )
        return

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    try:
        for feed in feeds:
            cursor.execute(
                """
                INSERT INTO stock_feeds (stock_id, href, text, image_src)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (href) DO UPDATE SET
                    text = EXCLUDED.text,
                    image_src = EXCLUDED.image_src
                """,
                (stock_id, feed["href"], feed["text"], feed["imageSrc"]),
            )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
