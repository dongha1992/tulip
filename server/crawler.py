from playwright.async_api import async_playwright
from typing import List, Dict
import asyncio
import os
import psycopg2

async def get_stock_feeds(max_scrolls: int = 5) -> List[Dict]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            await page.goto('https://tossinvest.com/stocks/NAS0221213008/community?feedSortType=RECENT', wait_until='domcontentloaded', timeout=60000)

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

DATABASE_URL = os.environ.get("DATABASE_URL")

def save_to_db(feeds: List[Dict]):
    if not DATABASE_URL:
        return
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    for feed in feeds:
        cursor.execute(
            """
            insert into stock_feeds (href, text, image_src)
            values (%s, %s, %s)
            on conflict (href) do nothing
            """,
            (feed["href"], feed["text"], feed["imageSrc"]),
        )
    conn.commit()
    cursor.close()
    conn.close()


async def main():
    feeds = await get_stock_feeds()
    # save_to_db(feeds)

if __name__ == "__main__":
    asyncio.run(main())