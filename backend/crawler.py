from playwright.async_api import async_playwright, Page
from typing import List, Dict
import asyncio

async def get_stock_feeds(max_scrolls: int = 5) -> List[Dict]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            await page.goto('https://tossinvest.com/stocks/NAS0221213008/community?feedSortType=RECENT', wait_until='domcontentloaded', timeout=60000)

            stock_feeds = []
            feed_hrefs = set()
            scroll_count = 0

            while scroll_count < max_scrolls:
                await page.keyboard.press('End')
                await asyncio.sleep(2)

                new_feeds = await page.query_selector_all('div[data-index] article.comment')

                for feed in new_feeds:
                    href = await feed.query_selector('a[data-tossinvest-log="Link"]')
                    href_value = await href.get_attribute('href') if href else ''

                    if href_value not in feed_hrefs:
                        text_element = await feed.query_selector('span._60z0ev1')
                        text = await text_element.inner_text() if text_element else ""

                        image = await feed.query_selector('div[data-parent-name="EditorImageElement"] img')
                        image_src = await image.get_attribute('src') if image else None

                        stock_feeds.append({
                            "href": href_value,
                            "text": text,
                            "imageSrc": image_src
                        })
                        feed_hrefs.add(href_value)

                scroll_count += 1

                if len(new_feeds) == 0:
                    break
            print(f"Crawling successful: {len(stock_feeds)} feeds collected.")
            return stock_feeds

        finally:
            await browser.close()
