from playwright.async_api import async_playwright
from typing import List, Dict
import asyncio
import os

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")


async def get_stock_feeds(stock_id: str, max_scrolls: int = 5) -> List[Dict]:
    url = f"https://tossinvest.com/stocks/{stock_id}/community?feedSortType=RECENT"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)

            stock_feeds = []
            feed_hrefs = set()
            scroll_count = 0

            while scroll_count < max_scrolls:
                await page.keyboard.press("End")
                await asyncio.sleep(2)

                new_feeds = await page.query_selector_all(
                    "div[data-index] article.comment"
                )

                for feed in new_feeds:
                    href_el = await feed.query_selector(
                        'a[data-tossinvest-log="Link"]'
                    )
                    href_value = (
                        await href_el.get_attribute("href") if href_el else ""
                    )

                    if href_value and href_value not in feed_hrefs:
                        text_el = await feed.query_selector("span._60z0ev1")
                        text = await text_el.inner_text() if text_el else ""

                        img_el = await feed.query_selector(
                            'div[data-parent-name="EditorImageElement"] img'
                        )
                        image_src = (
                            await img_el.get_attribute("src") if img_el else None
                        )

                        stock_feeds.append({
                            "href": href_value,
                            "text": text,
                            "imageSrc": image_src,
                        })
                        feed_hrefs.add(href_value)

                scroll_count += 1

                if len(new_feeds) == 0:
                    break

            return stock_feeds

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
