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
        try:
            page = await browser.new_page()
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)

            # stock-contents-root > section > div(contain: size, overflow-anchor) 대기
            container_sel = '#stock-contents-root section div[style*="overflow-anchor: none"][style*="flex: 0 0 auto"]'
            await page.wait_for_selector(container_sel, state='attached', timeout=15000)

            stock_feeds = []
            seen_keys = set()
            scroll_count = 0

            while scroll_count < max_scrolls:
                await page.keyboard.press('End')
                await asyncio.sleep(2)

                container = await page.query_selector(container_sel)
                if not container:
                    break

                # data-section-name="커뮤니티__게시글" 인 피드 아이템들
                feeds = await container.query_selector_all('[data-section-name="커뮤니티__게시글"]')

                for feed in feeds:
                    # 본문 텍스트: span (--fold-after-lines, --tds-wts-font-weight: 500, --tds-wts-font-size: 15px)
                    text_el = await feed.query_selector(
                        'span[style*="--fold-after-lines"][style*="--tds-wts-font-weight: 500"][style*="--tds-wts-font-size: 15px"]'
                    )
                    text = (await text_el.inner_text()).strip() if text_el else ""

                    # 이미지: div[data-contents-code="이미지_미리보기"] img
                    img_el = await feed.query_selector('div[data-contents-code="이미지_미리보기"] img')
                    image_src = await img_el.get_attribute('src') if img_el else None

                    # 피드 상세 링크 (있으면)
                    link_el = await feed.query_selector('a[data-tossinvest-log="Link"][href*="/_ul/"]') or await feed.query_selector('a[data-tossinvest-log="Link"]')
                    href_value = await link_el.get_attribute('href') if link_el else ""

                    key = (text or "")[:80]
                    if key and key not in seen_keys:
                        stock_feeds.append({
                            "href": href_value or "",
                            "text": text,
                            "imageSrc": image_src
                        })
                        seen_keys.add(key)

                scroll_count += 1
                if len(feeds) == 0:
                    break
            print(f"Crawling successful: {len(stock_feeds)} feeds collected.")
            return stock_feeds

        finally:
            await browser.close()


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
